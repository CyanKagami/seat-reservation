// layers/shared/checkIn.js
// Classifies a scan/check-in identifier as a student ID, seat ID, or unknown.

const pattern = /^(?<eightDigits>\d{8})$|^(?<hyphenated>[^#\-_]+-[^#\-_]+)$|^(?<other>.*)$/;
const EVENT_TIME_ZONE = 'Asia/Bangkok';

function getCalendarDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const dateParts = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

export function isEventCheckInDay(event, now = new Date()) {
  const start = getCalendarDate(event.date?.start);
  const end = getCalendarDate(event.date?.end);
  const today = getCalendarDate(now);
  return Boolean(start && end && today && start <= end && today >= start && today <= end);
}

export function classifyIdentifier(str) {
  const match = str.match(pattern);
  if (match && match.groups && match.groups.eightDigits) {
    return { type: 'StudentId', value: match.groups.eightDigits };
  } else if (match && match.groups && match.groups.hyphenated) {
    return { type: 'SeatId', value: match.groups.hyphenated };
  } else if (match && match.groups) {
    return { type: 'Other text', value: match.groups.other };
  }
  return { type: 'Other text', value: '' };
}
