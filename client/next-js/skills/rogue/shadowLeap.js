import * as THREE from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'shadow-leap',
  key: 'Q',
  icon: '/icons/classes/rogue/shadowstep.jpg',
};

export default function castShadowLeap({
  playerId,
  globalSkillCooldown,
  isCasting,
  mana,
  getTargetPlayer,
  dispatch,
  sendToSocket,
  activateGlobalCooldown,
  startSkillCooldown,
  sounds,
  players,
  teleportTo,
  playerCollider,
  worldOctree,
  FIREBLAST_RANGE,
}) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['shadow-leap']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for shadow leap!` });
    sounds?.noTarget?.play?.();
    return;
  }

  const target = players?.get(targetId)?.model;
  const caster = players?.get(playerId)?.model;
  if (!target || !caster) return;

  const casterPos = new THREE.Vector3();
  playerCollider.getCenter(casterPos);
  const targetPos = target.position.clone();

  const distance = casterPos.distanceTo(targetPos);
  if (distance > FIREBLAST_RANGE) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `Target too far for shadow leap!` });
    sounds?.noTarget?.play?.();
    return;
  }

  const rotY = target.rotation.y || 0;
  const BEHIND_DISTANCE = 1.5;
  const backOffset = new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY)).multiplyScalar(-BEHIND_DISTANCE);
  const behind = targetPos.clone().add(backOffset);

  const intersect = worldOctree?.capsuleIntersect(
    new Capsule(behind, behind.clone().add(new THREE.Vector3(0, 0.75, 0)), 0.35),
  );

  if (!intersect) {
    teleportTo(behind);
  }

  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'shadow-leap', targetId } });
  activateGlobalCooldown();
  startSkillCooldown('shadow-leap');
  return targetId;
}
