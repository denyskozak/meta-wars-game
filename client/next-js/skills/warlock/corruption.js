export const meta = { id: 'corruption', key: 'R', icon: '/icons/spell_corruption.jpg' };

export default function castCorruption({ playerId, globalSkillCooldown, isCasting, mana, getTargetPlayer, dispatch, sendToSocket, activateGlobalCooldown, startSkillCooldown }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < 30) {
    console.log('Not enough mana for corruption!');
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for corruption!` });
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'corruption', targetId } });
  activateGlobalCooldown();
  startSkillCooldown('corruption');
}
