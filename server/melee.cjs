const { MELEE_RANGE, MELEE_ANGLE_DEG } = require('../shared/melee.json');

const MELEE_ANGLE = (MELEE_ANGLE_DEG * Math.PI) / 180; // convert degrees to radians

function withinMeleeRange(a, b) {
    if (!a || !b) return false;
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    const dz = a.position.z - b.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < MELEE_RANGE;
}

function withinMeleeCone(a, b) {
    if (!withinMeleeRange(a, b)) return false;
    const angleToTarget = Math.atan2(
        b.position.x - a.position.x,
        b.position.z - a.position.z
    );
    let diff = Math.abs(angleToTarget - (a.rotation?.y || 0));
    if (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);
    return diff < MELEE_ANGLE;
}

module.exports = {
    MELEE_RANGE,
    MELEE_ANGLE,
    withinMeleeRange,
    withinMeleeCone,
};
