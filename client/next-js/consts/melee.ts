import melee from "./melee.json";

export const MELEE_RANGE_ATTACK = melee.MELEE_RANGE;
// slightly larger circle for UI indicator
export const MELEE_INDICATOR_RANGE = MELEE_RANGE_ATTACK * 1.3;
export const MELEE_ANGLE = (melee.MELEE_ANGLE_DEG * Math.PI) / 180;
