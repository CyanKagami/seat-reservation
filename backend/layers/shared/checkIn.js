// layers/shared/checkIn.js
// Classifies a scan/check-in identifier as a student ID, seat ID, or unknown.

const pattern = /^(?<eightDigits>\d{8})$|^(?<hyphenated>[^#\-_]+-[^#\-_]+)$|^(?<other>.*)$/;

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
