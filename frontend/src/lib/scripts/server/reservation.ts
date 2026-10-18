// src/lib/scripts/reservation.ts
import { json } from '@sveltejs/kit';
import {
  BatchGetCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
  type BatchGetCommandOutput,
  type QueryCommandOutput,
  type ScanCommandOutput
} from '@aws-sdk/lib-dynamodb';
// NOTE: add `export` to `const docClient` in $lib/scripts/dynamo.ts
import { docClient } from '$lib/scripts/server/dynamo';
import type { User } from '$lib/type/user';
import type { Reservation } from '$lib/type/reservation';

const TABLE = 'reservations';

// Table layout: partition key = eventId, sort key = seatId.
//
// Seat items are the Reservation records. Next to them every user gets one
// "user slot" item per event (seatId = "USER#<googleId>", no `status` field) that
// records which seat the user has. Seat item and slot are always written in ONE
// transaction, which makes "no double-booked seat" and "one seat per user per
// event" atomic, even when two requests arrive at the same instant.
const SLOT_PREFIX = 'USER#';

// `status` is a DynamoDB reserved word, so expressions use #status.
const STATUS_NAME = { '#status': 'status' };

export type BookingErrorCode = 'SEAT_TAKEN' | 'ALREADY_BOOKED' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT';

export class BookingError extends Error {
  code: BookingErrorCode;
  constructor(code: BookingErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const HTTP_STATUS: Record<BookingErrorCode, number> = {
  SEAT_TAKEN: 409,
  ALREADY_BOOKED: 409,
  CONFLICT: 409,
  NOT_FOUND: 404,
  FORBIDDEN: 403
};

export function bookingErrorResponse(error: unknown) {
  if (error instanceof BookingError) {
    return json({ error: error.message, code: error.code }, { status: HTTP_STATUS[error.code] });
  }
  console.error('Booking error:', error);
  return json({ error: 'Internal server error' }, { status: 500 });
}

// '#' is not allowed, so a client can never pass a seatId that collides with a user slot.
// Widen the character set if your layout's seat ids use other characters.
export function isValidSeatId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
}

// Reads { eventId, seatId } from a JSON body, or returns a ready-made 400 Response.
export async function readSeatRequest(request: Request): Promise<{ eventId: string; seatId: string } | Response> {
  let payload: { eventId?: unknown; seatId?: unknown };
  try {
    payload = (await request.json()) ?? {};
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { eventId, seatId } = payload;
  if (typeof eventId !== 'string' || !eventId || !isValidSeatId(seatId)) {
    return json({ error: 'eventId and a valid seatId are required' }, { status: 400 });
  }
  return { eventId, seatId };
}

export async function reserveSeat(eventId: string, seatId: string, user: Pick<User, 'googleId'>): Promise<Reservation> {
  const seat: Reservation = {
    eventId,
    seatId,
    googleId: user.googleId,
    status: 'reserved',
    reservedAt: new Date().toISOString()
  };
  const slot = {
    eventId,
    seatId: SLOT_PREFIX + user.googleId,
    googleId: user.googleId,
    reservedSeatId: seatId
  };

  try {
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName: TABLE, Item: seat, ConditionExpression: 'attribute_not_exists(seatId)' } },
          { Put: { TableName: TABLE, Item: slot, ConditionExpression: 'attribute_not_exists(seatId)' } }
        ]
      })
    );
  } catch (error: any) {
    if (error.name === 'TransactionCanceledException') {
      const reasons = error.CancellationReasons ?? [];
      if (reasons[0]?.Code === 'ConditionalCheckFailed') {
        throw new BookingError('SEAT_TAKEN', 'This seat is already taken');
      }
      if (reasons[1]?.Code === 'ConditionalCheckFailed') {
        throw new BookingError('ALREADY_BOOKED', 'You already have a seat for this event');
      }
    }
    throw error;
  }

  return seat;
}

// Cancel a reservation: the item is deleted (there is no "cancelled" status).
// Owners can cancel their own seat; admins can cancel anyone's. Checked-in seats stay.
export async function cancelSeat(eventId: string, seatId: string, requester: Pick<User, 'googleId' | 'role'>) {
  const { Item } = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { eventId, seatId }, ConsistentRead: true })
  );

  if (!Item || Item.status === undefined) {
    throw new BookingError('NOT_FOUND', 'Reservation not found');
  }
  if (Item.googleId !== requester.googleId && requester.role !== 'admin') {
    throw new BookingError('FORBIDDEN', 'You can only cancel your own reservation');
  }
  if (Item.status === 'checked-in') {
    throw new BookingError('CONFLICT', 'A checked-in reservation cannot be cancelled');
  }

  try {
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: TABLE,
              Key: { eventId, seatId },
              // guards against the record changing between the read above and this delete
              ConditionExpression: 'googleId = :g AND #status = :reserved',
              ExpressionAttributeNames: STATUS_NAME,
              ExpressionAttributeValues: { ':g': Item.googleId, ':reserved': 'reserved' }
            }
          },
          { Delete: { TableName: TABLE, Key: { eventId, seatId: SLOT_PREFIX + Item.googleId } } }
        ]
      })
    );
  } catch (error: any) {
    if (error.name === 'TransactionCanceledException') {
      throw new BookingError('CONFLICT', 'The reservation changed while cancelling, please retry');
    }
    throw error;
  }
}

// Every reserved seat of one event (user slots excluded).
export async function listReservations(eventId: string): Promise<Reservation[]> {
  const items: Record<string, any>[] = [];
  let startKey: Record<string, any> | undefined;

  do {
    const res: QueryCommandOutput = await docClient.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'eventId = :e',
        ExpressionAttributeValues: { ':e': eventId },
        ExclusiveStartKey: startKey
      })
    );
    items.push(...(res.Items ?? []));
    startKey = res.LastEvaluatedKey;
  } while (startKey);

  // user slots have no `status`
  return items.filter((i) => i.status !== undefined) as Reservation[];
}

// One user's reservations across events. Uses a Scan - fine at campus scale;
export async function listUserReservations(googleId: string): Promise<Reservation[]> {
  const items: Record<string, any>[] = [];
  let startKey: Record<string, any> | undefined;

  do {
    const res: ScanCommandOutput = await docClient.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: 'googleId = :g AND attribute_exists(#status)',
        ExpressionAttributeNames: STATUS_NAME,
        ExpressionAttributeValues: { ':g': googleId },
        ExclusiveStartKey: startKey
      })
    );
    items.push(...(res.Items ?? []));
    startKey = res.LastEvaluatedKey;
  } while (startKey);

  return (items as Reservation[]).sort((a, b) => b.reservedAt.localeCompare(a.reservedAt));
}

// Reservations only store googleId, so admin/organizer views look names up here.
export async function fetchUserSummaries(googleIds: string[]) {
  const unique = [...new Set(googleIds)];
  const result = new Map<string, { name: string; email: string }>();

  for (let i = 0; i < unique.length; i += 100) {
    let keys: Record<string, any>[] | undefined = unique.slice(i, i + 100).map((googleId) => ({ googleId }));

    for (let attempt = 0; keys && keys.length > 0 && attempt < 3; attempt++) {
      const res: BatchGetCommandOutput = await docClient.send(
        new BatchGetCommand({
          RequestItems: {
            users: {
              Keys: keys,
              ProjectionExpression: 'googleId, #n, email',
              ExpressionAttributeNames: { '#n': 'name' }
            }
          }
        })
      );
      for (const u of res.Responses?.users ?? []) {
        result.set(u.googleId, { name: u.name, email: u.email });
      }
      keys = res.UnprocessedKeys?.users?.Keys;
    }
  }

  return result;
}