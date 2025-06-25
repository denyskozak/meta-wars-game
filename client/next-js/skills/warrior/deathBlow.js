import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'death-blow',
  key: 'E',
  icon: '/icons/classes/warrior/savageblow.jpg',
  autoFocus: false,
};

export default function castDeathBlow({ globalSkillCooldown, isCasting, sendToSocket, activateGlobalCooldown, startSkillCooldown }) {
  if (globalSkillCooldown || isCasting) return;
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'death-blow' } });
  activateGlobalCooldown();
  startSkillCooldown('death-blow');
}
