# Meta Wars Game

This repository contains the Meta Wars multiplayer game along with the blockchain smart contracts.

## Melee Attack Constants

The server and client share the same melee attack constants defined in `client/next-js/consts/melee.json`.

```json
{
  "MELEE_RANGE": 1.7,
  "MELEE_ANGLE_DEG": 118.8
}
```

On the client these values are imported and slightly adjusted for UI indication:

```ts
import melee from "./melee.json";

export const MELEE_RANGE_ATTACK = melee.MELEE_RANGE;
// slightly larger circle for UI indicator
export const MELEE_INDICATOR_RANGE = MELEE_RANGE_ATTACK * 1.3;
export const MELEE_ANGLE = (melee.MELEE_ANGLE_DEG * Math.PI) / 180;
```

The server uses the same JSON file for hit detection:

```js
const { MELEE_RANGE, MELEE_ANGLE_DEG } = require('../client/next-js/consts/melee.json');
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
    return angle < MELEE_ANGLE;
}
```

Melee skills on the server use these functions to validate hits, ensuring the gameplay matches the melee indicator shown on the client.
