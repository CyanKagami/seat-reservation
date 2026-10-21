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
import { docClient, fetchData, updateAllAttributes } from '$lib/scripts/server/dynamo';
import type { User } from '$lib/type/user';
import type { EventSummary, Reservation } from '$lib/type/reservation';
import { isValidSeatId, parseSeatId, type SeatParts } from '$lib/scripts/seat';
import { classifyIdentifier } from '../checkIn';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';

// re-exported so routes can keep importing it from here
export { isValidSeatId };

const TABLE = 'reservations';

// Table layout: partition key = eventId, sort key = seatId.
// seatId is "<zone>-<seat>" (see $lib/seat.ts), so the zone lives in the key itself.
// begins_with(seatId, "<zone>-") narrows a query to one zone, but zones may contain "-"
// ("A" vs "A-B"), so confirm each hit with parseSeatId(seatId).zone === zone.
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
    return json({ error: 'eventId and seatId are required' }, { status: 400 });
  }
  return { eventId, seatId };
}

// Reads { eventId, seatId } from a JSON body, or returns a ready-made 400 Response.
export async function readCheckInRequest(request: Request): Promise<{ eventId: string; identifier: string, identifierType: "StudentId" | "SeatId" } | Response> {
  let payload: { eventId?: unknown; identifier?: unknown };
  try {
    payload = (await request.json()) ?? {};
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { eventId, identifier } = payload;
  const identifierType = classifyIdentifier((typeof identifier === 'string') ? identifier : '');
  if (typeof eventId !== 'string' || !eventId || typeof identifier !== 'string' || !identifier || identifierType.type === 'Other text') {
    return json({ error: 'eventId and identifier are required' }, { status: 400 });
  }
  return { eventId, identifier, identifierType: identifierType.type };
}

// Adds the zone and seat extracted from seatId to anything that carries a seatId.
export function withSeatParts<T extends { seatId: string }>(record: T): T & SeatParts {
  const parts = parseSeatId(record.seatId) ?? { zone: '', seat: record.seatId };
  return { ...record, ...parts };
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
        throw new BookingError('SEAT_TAKEN', 'ที่นั่งที่ท่านเลือกถูกจองไว้แล้ว');
      }
      if (reasons[1]?.Code === 'ConditionalCheckFailed') {
        throw new BookingError('ALREADY_BOOKED', 'ท่านมีที่นั่งอยู่แล้วในกิจกรรมนี้');
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
    throw new BookingError('NOT_FOUND', 'ไม่พบการจอง');
  }
  if (Item.googleId !== requester.googleId && requester.role !== 'admin') {
    throw new BookingError('FORBIDDEN', 'ไม่พบการจอง');
  }
  if (Item.status === 'checked-in') {
    throw new BookingError('CONFLICT', 'ไม่สามารถยกเลิกการจองที่เช็กอินแล้วได้');
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
      throw new BookingError('CONFLICT', 'การจองถูกแก้ไขระหว่างการยกเลิก โปรดลองอีกครั้ง');
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
// add a GSI on googleId if the table ever grows large.
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

// BatchGet that retries unprocessed keys. DynamoDB caps one call at 100 keys.
async function batchGet(
  table: string,
  keys: Record<string, any>[],
  projection: { ProjectionExpression: string; ExpressionAttributeNames: Record<string, string> }
) {
  const items: Record<string, any>[] = [];

  for (let i = 0; i < keys.length; i += 100) {
    let pending: Record<string, any>[] | undefined = keys.slice(i, i + 100);

    for (let attempt = 0; pending && pending.length > 0 && attempt < 3; attempt++) {
      const res: BatchGetCommandOutput = await docClient.send(
        new BatchGetCommand({ RequestItems: { [table]: { Keys: pending, ...projection } } })
      );
      items.push(...(res.Responses?.[table] ?? []));
      pending = res.UnprocessedKeys?.[table]?.Keys;
    }
  }

  return items;
}

export async function checkInWithSeatId(eventId: string, seatId: string): Promise<Reservation> {
  try {
    let edited = await updateAllAttributes('reservations', {eventId: eventId, seatId: seatId}, {status: 'check-in'}) as Reservation;
    return edited;
  } catch (error: any) {
    throw error;
  }
}

export async function checkInWithStudentId(eventId: string, studentId: string): Promise<Reservation> {
  try {
    let userReservation = await fetchData('reservations',  {eventId: eventId, seatId: SLOT_PREFIX + studentId}) as Reservation;
    let edited = await updateAllAttributes('reservations', {eventId: eventId, seatId: userReservation.reservedSeatId}, {status: 'check-in'}) as Reservation;
    return edited;
  } catch (error: any) {
    throw error;
  }
}



// Reservations only store googleId, so admin/organizer views look names up here.
export async function fetchUserSummaries(googleIds: string[]) {
  const unique = [...new Set(googleIds)];
  const items = await batchGet(
    'users',
    unique.map((googleId) => ({ googleId })),
    { ProjectionExpression: 'googleId, #n, email', ExpressionAttributeNames: { '#n': 'name' } }
  );

  return new Map<string, { name: string; email: string }>(
    items.map((u): [string, { name: string; email: string }] => [u.googleId, { name: u.name, email: u.email }])
  );
}



// Reservations only store eventId. "My bookings" looks the event up at read time, so it is
// always current - a copy inside every reservation would go stale whenever an event is edited.
export async function fetchEventSummaries(eventIds: string[]) {
  const unique = [...new Set(eventIds)];
  const items = await batchGet(
    'events',
    unique.map((eventId) => ({ eventId })),
    {
      // name and date are reserved words; #n is reused for place.name
      ProjectionExpression: 'eventId, #n, #d, #pic, #p.placeId, #p.#n',
      ExpressionAttributeNames: { '#n': 'name', '#d': 'date', '#pic': 'picture', '#p': 'place' }
    }
  );

  return new Map<string, EventSummary>(
    items.map((e): [string, EventSummary] => [e.eventId, { name: e.name, date: e.date, picture: e.picture ?? null, place: e.place ?? null }])
  );
}

// "Has this user already registered for this event?" - one consistent read of the user's
// slot item, no query or scan. Returns the seat they hold, or null.
export async function getUserSeat(eventId: string, googleId: string) {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { eventId, seatId: SLOT_PREFIX + googleId },
      ConsistentRead: true // a user who just booked must see true straight away
    })
  );
  if (!Item) return null;
  return withSeatParts({ seatId: Item.reservedSeatId as string });
}
 