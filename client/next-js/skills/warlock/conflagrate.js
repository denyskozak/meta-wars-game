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
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for conflagrate!` });
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
