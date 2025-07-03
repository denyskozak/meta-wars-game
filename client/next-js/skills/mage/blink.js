import { assetUrl } from '../../utilities/assets';
import * as THREE from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'blink',
  key: 'F',
  icon: assetUrl('/icons/classes/mage/blink.jpg'),
  autoFocus: false,
};

export default function castBlink({
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
  if (mana < SPELL_COST['blink']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }

  const BLINK_DISTANCE = FIREBLAST_RANGE / 4;

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

  let target = start.clone().addScaledVector(dir, BLINK_DISTANCE);
  if (hit && hit.distance < BLINK_DISTANCE) {
    target = ray.at(Math.max(0, hit.distance - 0.1), new THREE.Vector3());
  }

  const intersect = worldOctree.capsuleIntersect(
    new Capsule(target, target.clone().add(new THREE.Vector3(0, 0.75, 0)), 0.35),
  );

  if (!intersect) {
    teleportTo(target);
  }

  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'blink' } });
  activateGlobalCooldown();
  startSkillCooldown('blink');
  if (sounds?.blink) {
    sounds.blink.volume = 0.5;
    sounds.blink.play();
  }
}
