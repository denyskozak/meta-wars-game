export const meta = {
  id: 'bloodthirst',
  key: '3',
  icon: '/icons/classes/paladin/crusaderstrike.jpg',
  autoFocus: false,
};

export default function castBloodthirst({ globalSkillCooldown, isCasting, sendToSocket, activateGlobalCooldown, startSkillCooldown }) {
  if (globalSkillCooldown || isCasting) return;
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'bloodthirst' } });
  activateGlobalCooldown();
  startSkillCooldown('bloodthirst');
}
