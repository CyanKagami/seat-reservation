// layers/shared/reservation.js
// Port of frontend/src/lib/scripts/server/reservation.ts.
// Adapted for Express: readSeatRequest/readCheckInRequest take req.body (already parsed JSON),
// and bookingErrorResponse/checkInErrorResponse return { status, body } for the router to send.
import {
  BatchGetCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { docClient, fetchData, updateAllAttributes } from './dynamo.js';
import { parseSeatId, isValidSeatId } from './seat.js';
import { classifyIdentifier } from './checkIn.js';

export { isValidSeatId };

const TABLE = 'reservations';
export const SLOT_PREFIX = 'USER#';

// `status` is a DynamoDB reserved word.
const STATUS_NAME = { '#status': 'status' };

// ---------- Booking errors ----------

export class BookingError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const BOOKING_HTTP_STATUS = {
  SEAT_TAKEN: 409,
  ALREADY_BOOKED: 409,
  CONFLICT: 409,
  NOT_FOUND: 404,
  FORBIDDEN: 403
};

export function bookingErrorResponse(error) {
  if (error instanceof BookingError) {
    return { status: BOOKING_HTTP_STATUS[error.code], body: { error: error.message, code: error.code } };
  }
  console.error('Booking error:', error);
  return { status: 500, body: { error: 'Internal server error' } };
}

// ---------- Check-in errors ----------

export class CheckInError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const CHECK_IN_HTTP_STATUS = {
  ALREADY_CHECKED_IN: 409,
  FORBIDDEN: 403,
  NOT_FOUND: 404
};

export function checkInErrorResponse(error) {
  if (error instanceof CheckInError) {
    return { status: CHECK_IN_HTTP_STATUS[error.code], body: { error: error.message, code: error.code } };
  }
  console.error('Check-in error:', error);
  return { status: 500, body: { error: 'Internal server error' } };
}

// ---------- Request parsers ----------

// Takes req.body (already parsed JSON) instead of a Web Request.
export function readSeatRequest(body) {
  const { eventId, seatId } = body ?? {};
  if (typeof eventId !== 'string' || !eventId || !isValidSeatId(seatId)) {
    return { error: true, status: 400, body: { error: 'eventId and seatId are required' } };
  }
  return { eventId, seatId };
}

export function readCheckInRequest(body) {
  const { eventId, identifier } = body ?? {};
  const identifierResult = classifyIdentifier(typeof identifier === 'string' ? identifier : '');
  if (
    typeof eventId !== 'string' || !eventId ||
    typeof identifier !== 'string' || !identifier ||
    identifierResult.type === 'Other text'
  ) {
    return { error: true, status: 400, body: { error: 'eventId and identifier are required' } };
  }
  return { eventId, identifier, identifierType: identifierResult.type };
}

// ---------- Helpers ----------

export function withSeatParts(record) {
  const parts = parseSeatId(record.seatId) ?? { zone: '', seat: record.seatId };
  return { ...record, ...parts };
}

// ---------- Core reservation operations ----------

export async function reserveSeat(eventId, seatId, user) {
  const seat = {
    eventId,
    seatId,
    email: user.email,
    googleId: user.googleId,
    status: 'reserved',
    reservedAt: new Date().toISOString()
  };
  const slot = {
    eventId,
    seatId: SLOT_PREFIX + (user.email || user.googleId),
    email: user.email,
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
  } catch (error) {
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

export async function cancelSeat(eventId, seatId, requester) {
  const { Item } = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { eventId, seatId }, ConsistentRead: true })
  );

  if (!Item || Item.status === undefined) {
    throw new BookingError('NOT_FOUND', 'ไม่พบการจอง');
  }
  const isOwner =
    (Item.email && Item.email === requester.email) ||
    (Item.googleId && Item.googleId === requester.googleId);
  if (!isOwner && requester.role !== 'admin') {
    throw new BookingError('FORBIDDEN', 'ไม่พบการจอง');
  }
  if (Item.status === 'checked-in') {
    throw new BookingError('CONFLICT', 'ไม่สามารถยกเลิกการจองที่เช็กอินแล้วได้');
  }

  const slotUser = Item.email || Item.googleId;
  const conditionExpr = Item.email
    ? 'email = :u AND #status = :reserved'
    : 'googleId = :u AND #status = :reserved';

  try {
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: TABLE,
              Key: { eventId, seatId },
              ConditionExpression: conditionExpr,
              ExpressionAttributeNames: STATUS_NAME,
              ExpressionAttributeValues: { ':u': slotUser, ':reserved': 'reserved' }
            }
          },
          { Delete: { TableName: TABLE, Key: { eventId, seatId: SLOT_PREFIX + slotUser } } }
        ]
      })
    );
  } catch (error) {
    if (error.name === 'TransactionCanceledException') {
      throw new BookingError('CONFLICT', 'การจองถูกแก้ไขระหว่างการยกเลิก โปรดลองอีกครั้ง');
    }
    throw error;
  }
}

export async function listReservations(eventId) {
  const items = [];
  let startKey;

  do {
    const res = await docClient.send(
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
  return items.filter((i) => i.status !== undefined);
}

export async function listUserReservations(email, googleId) {
  const items = [];
  let startKey;

  const exprValues = { ':e': email };
  let filterExpr = 'email = :e';
  if (googleId) {
    exprValues[':g'] = googleId;
    filterExpr = '(email = :e OR googleId = :g)';
  }
  filterExpr += ' AND attribute_exists(#status)';

  do {
    const res = await docClient.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: filterExpr,
        ExpressionAttributeNames: STATUS_NAME,
        ExpressionAttributeValues: exprValues,
        ExclusiveStartKey: startKey
      })
    );
    items.push(...(res.Items ?? []));
    startKey = res.LastEvaluatedKey;
  } while (startKey);

  return items.sort((a, b) => b.reservedAt.localeCompare(a.reservedAt));
}

// Internal batchGet helper.
async function batchGetItems(table, keys, projection) {
  const items = [];
  for (let i = 0; i < keys.length; i += 100) {
    let pending = keys.slice(i, i + 100);
    for (let attempt = 0; pending && pending.length > 0 && attempt < 3; attempt++) {
      const res = await docClient.send(
        new BatchGetCommand({ RequestItems: { [table]: { Keys: pending, ...projection } } })
      );
      items.push(...(res.Responses?.[table] ?? []));
      pending = res.UnprocessedKeys?.[table]?.Keys;
    }
  }
  return items;
}

export async function checkInWithSeatId(eventId, seatId) {
  const userReservation = await fetchData('reservations', { eventId, seatId });
  if (!userReservation) throw new CheckInError('NOT_FOUND', 'ไม่พบการจอง');
  if (userReservation.status === 'checked-in') {
    throw new CheckInError('ALREADY_CHECKED_IN', 'ผู้ใช้หรือที่นั่งนี้ทำการ Check in ไปแล้ว');
  }
  return await updateAllAttributes('reservations', { eventId, seatId }, { status: 'checked-in' });
}

export async function checkInWithStudentId(eventId, studentId) {
  const userSlot = await fetchData('reservations', { eventId, seatId: SLOT_PREFIX + studentId + '@kmitl.ac.th' });
  if (!userSlot) throw new CheckInError('NOT_FOUND', 'ไม่พบการจอง');
  const userReservation = await fetchData('reservations', { eventId, seatId: userSlot.reservedSeatId });
  if (!userReservation) throw new CheckInError('NOT_FOUND', 'ไม่พบการจอง');
  if (userReservation.status === 'checked-in') {
    throw new CheckInError('ALREADY_CHECKED_IN', 'ผู้ใช้หรือที่นั่งนี้ทำการ Check in ไปแล้ว');
  }
  return await updateAllAttributes('reservations', { eventId, seatId: userReservation.seatId }, { status: 'checked-in' });
}

export async function fetchUserSummaries(identifiers) {
  const unique = [...new Set(identifiers.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const emailCandidates = unique.filter((id) => id.includes('@'));
  const resultMap = new Map();

  if (emailCandidates.length > 0) {
    const items = await batchGetItems(
      'users',
      emailCandidates.map((email) => ({ email })),
      { ProjectionExpression: 'googleId, #n, email', ExpressionAttributeNames: { '#n': 'name' } }
    );
    for (const u of items) {
      if (u.email) resultMap.set(u.email, { name: u.name, email: u.email });
      if (u.googleId) resultMap.set(u.googleId, { name: u.name, email: u.email });
    }
  }

  const remaining = unique.filter((id) => !resultMap.has(id));
  if (remaining.length > 0) {
    const remSet = new Set(remaining);
    let exclusiveStartKey;
    do {
      const res = await docClient.send(
        new ScanCommand({
          TableName: 'users',
          ProjectionExpression: 'googleId, #n, email',
          ExpressionAttributeNames: { '#n': 'name' },
          ExclusiveStartKey: exclusiveStartKey
        })
      );
      if (res.Items) {
        for (const u of res.Items) {
          if (remSet.has(u.googleId) || remSet.has(u.email)) {
            if (u.email) resultMap.set(u.email, { name: u.name, email: u.email });
            if (u.googleId) resultMap.set(u.googleId, { name: u.name, email: u.email });
          }
        }
      }
      exclusiveStartKey = res.LastEvaluatedKey;
    } while (exclusiveStartKey);
  }

  return resultMap;
}

export async function fetchEventSummaries(eventIds) {
  const unique = [...new Set(eventIds)];
  const items = await batchGetItems(
    'events',
    unique.map((eventId) => ({ eventId })),
    {
      ProjectionExpression: 'eventId, #n, #d, #pic, #p.placeId, #p.#n',
      ExpressionAttributeNames: { '#n': 'name', '#d': 'date', '#pic': 'picture', '#p': 'place' }
    }
  );

  return new Map(
    items.map((e) => [
      e.eventId,
      { name: e.name, date: e.date, picture: e.picture ?? null, place: e.place ?? null }
    ])
  );
}

export async function getUserSeat(eventId, userIdentifier) {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { eventId, seatId: SLOT_PREFIX + userIdentifier },
      ConsistentRead: true
    })
  );
  if (!Item) return null;
  return withSeatParts({ seatId: Item.reservedSeatId });
}
