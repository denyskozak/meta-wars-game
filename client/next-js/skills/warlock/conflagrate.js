export const meta = { id: 'conflagrate', key: 'F', icon: '/icons/spell_fire_fireball.jpg' };

export default function castConflagrate({
  playerId,
  globalSkillCooldown,
  isCasting,
  mana,
  getTargetPlayer,
  dispatch,
  sendToSocket,
  activateGlobalCooldown,
  startSkillCooldown,
  FIREBLAST_DAMAGE,
  isTargetBurning,
  sounds,
}) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < 20) {
    console.log('Not enough mana for conflagrate!');
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for conflagrate!` });
    sounds?.noTarget?.play?.();
    return;
  }

  console.log("targetId: ", targetId);
  if (typeof isTargetBurning === 'function' && !isTargetBurning(targetId)) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `Target is not affected by Immolate!` });
    return;
  }

  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'conflagrate', targetId, damage: FIREBLAST_DAMAGE } });
  activateGlobalCooldown();
  startSkillCooldown('conflagrate');
}
