export const meta = { id: 'fireblast', key: 'Q', icon: '/icons/spell_fire_fireball.jpg' };

export default function castFireblast({ playerId, globalSkillCooldown, isCasting, mana, getTargetPlayer, dispatch, sendToSocket, activateGlobalCooldown, startSkillCooldown, FIREBLAST_DAMAGE, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < 20) {
    console.log('Not enough mana for fireblast!');
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for  fireblast!` });
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'fireblast', targetId, damage: FIREBLAST_DAMAGE } });
  activateGlobalCooldown();
  startSkillCooldown('fireblast');
}
