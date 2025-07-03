import { assetUrl } from '../../utilities/assets';
import * as THREE from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'warbringer',
  key: 'R',
  icon: assetUrl('/icons/classes/warrior/warbringer.jpg'),
  autoFocus: false,
};

export default function castWarbringer({
  globalSkillCooldown,
  isCasting,
  mana,
  sendToSocket,
  activateGlobalCooldown,
  startSkillCooldown,
  sounds,
  teleportTo,
  playerCollider,
  worldOctree,
  camera,
  FIREBLAST_RANGE,
  rotationY,
}) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['warbringer']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }

  const CHARGE_DISTANCE = FIREBLAST_RANGE / 4;

  const start = new THREE.Vector3();
  playerCollider.getCenter(start);
  const dir = new THREE.Vector3();
  if (typeof rotationY === 'number') {
    dir.set(Math.sin(rotationY), 0, Math.cos(rotationY));
  } else {
    camera.getWorldDirection(dir);
    dir.y = 0;
  }
  dir.normalize();

  const ray = new THREE.Ray(start, dir);
  const hit = worldOctree.rayIntersect(ray);

  let target = start.clone().addScaledVector(dir, CHARGE_DISTANCE);
  if (hit && hit.distance < CHARGE_DISTANCE) {
    target = ray.at(Math.max(0, hit.distance - 0.1), new THREE.Vector3());
  }

  const intersect = worldOctree.capsuleIntersect(
    new Capsule(target, target.clone().add(new THREE.Vector3(0, 0.75, 0)), 0.35),
  );

  if (!intersect) {
    const startPos = start.clone();
    const delta = new THREE.Vector3().subVectors(target, startPos);
    const startTime = performance.now();
    const duration = 560; // ms - slowed down by ~40%
    const ease = (t) => t * t * (3 - 2 * t); // smoothstep easing
    function step() {
      const t = Math.min(1, (performance.now() - startTime) / duration);
      const pos = startPos.clone().addScaledVector(delta, ease(t));
      teleportTo({ x: pos.x, y: pos.y, z: pos.z });
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'warbringer' } });
  activateGlobalCooldown();
  startSkillCooldown('warbringer');
  if (sounds?.charge) {
    sounds.charge.volume = 0.5;
    sounds.charge.play();
  }
}
