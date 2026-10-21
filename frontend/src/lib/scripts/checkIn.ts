// src/lib/seat.ts
// A seatId is "<zone>-<seat>", e.g. "Front-A5". The seat part never contains "-", the zone may,
// so the split is at the LAST hyphen: "Zone-B-12" -> zone "Zone-B", seat "12".
// Pure functions with no server imports, so the same code runs in the browser and on the server.

// Letters (any script, Thai included), combining marks, digits and "_". '#' is never allowed,
// so a client can't forge a key that collides with the internal "USER#..." items.
// Updated pattern: restricts components from containing hyphens, underscores, or hashes
const pattern = /^(?<eightDigits>\d{8})$|^(?<hyphenated>[^#\-_]+-[^#\-_]+)$|^(?<other>.*)$/;

export function classifyIdentifier(str: string) : {type: 'StudentId' | 'SeatId' | 'Other text', value: string} {
    const match = str.match(pattern);
    
    if (match && match.groups.eightDigits) {
        return { type: 'StudentId', value: match.groups.eightDigits };
    } else if (match && match.groups.hyphenated) {
        return { type: 'SeatId', value: match.groups.hyphenated };
    } else {
        return { type: 'Other text', value: match.groups.other };
    }
}

