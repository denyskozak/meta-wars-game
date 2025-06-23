export const meta = {
  id: 'lightstrike',
  key: 'E',
  icon: '/icons/classes/paladin/crusaderstrike.jpg',
};

export default function castLightStrike({ globalSkillCooldown, isCasting, sendToSocket, activateGlobalCooldown, startSkillCooldown }) {
  if (globalSkillCooldown || isCasting) return;
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'lightstrike' } });
  activateGlobalCooldown();
  startSkillCooldown('lightstrike');
}
