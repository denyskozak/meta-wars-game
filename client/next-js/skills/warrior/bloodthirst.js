export const meta = {
  id: 'bloodthirst',
  key: '4',
  icon: '/icons/classes/warrior/savageblow.jpg',
  autoFocus: false,
};

export default function castBloodthirst({ globalSkillCooldown, isCasting, rageStacks, sendToSocket, activateGlobalCooldown, startSkillCooldown }) {
  if (globalSkillCooldown || isCasting) return;
  if (rageStacks < 5) return;
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'bloodthirst' } });
  activateGlobalCooldown();
  startSkillCooldown('bloodthirst');
}
