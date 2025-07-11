const { MELEE_RANGE, MELEE_ANGLE_DEG } = require('../client/next-js/consts/melee.json');

// convert degrees to radians. This value represents the full cone width used by
// the client indicator.
const MELEE_ANGLE = (MELEE_ANGLE_DEG * Math.PI) / 180;
// Half of the cone angle for easier comparison
const MELEE_HALF_ANGLE = MELEE_ANGLE / 2;

function withinMeleeRange(a, b) {
    if (!a || !b) return false;
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    const dz = a.position.z - b.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < MELEE_RANGE;
}

function withinMeleeCone(a, b) {
    if (!withinMeleeRange(a, b)) return false;
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const dz = b.position.z - a.position.z;
    const forward = {
        x: Math.sin(a.rotation?.y || 0),
        y: 0,
        z: Math.cos(a.rotation?.y || 0),
    };
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (!len) return true;
    const dot = forward.x * dx + forward.y * dy + forward.z * dz;
    const angle = Math.acos(dot / len);
    // Compare against half of the melee angle so that the total cone width
    // matches the indicator shown on the client.
    return angle < MELEE_HALF_ANGLE;
}

function withinCone(a, b, range, angleRad) {
    if (!a || !b) return false;
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const dz = b.position.z - a.position.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (dist > range) return false;
    const forward = {
        x: Math.sin(a.rotation?.y || 0),
        y: 0,
        z: Math.cos(a.rotation?.y || 0),
    };
    const dot = forward.x*dx + forward.y*dy + forward.z*dz;
    const angle = Math.acos(dot / dist);
    return angle < angleRad / 2;
}

module.exports = {
    MELEE_RANGE,
    MELEE_ANGLE,
    withinMeleeRange,
    withinMeleeCone,
    withinCone,
};
