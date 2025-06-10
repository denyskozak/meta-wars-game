export const meta = { id: 'immolate', key: 'Q', icon: '/icons/spell_immolation.jpg' };

export default function castImmolate({ playerId, globalSkillCooldown, isCasting, mana, getTargetPlayer, dispatch, sendToSocket, activateGlobalCooldown, startSkillCooldown }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < 30) {
    console.log('Not enough mana for immolate!');
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for immolate!` });
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'immolate', targetId } });
  activateGlobalCooldown();
  startSkillCooldown('immolate');
}
