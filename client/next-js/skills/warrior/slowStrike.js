import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'slow-strike',
  key: 'R',
  icon: '/icons/classes/warrior/warbringer.jpg',
  autoFocus: false,
};

export default function castSlowStrike({ globalSkillCooldown, isCasting, sendToSocket, activateGlobalCooldown, startSkillCooldown }) {
  if (globalSkillCooldown || isCasting) return;
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'slow-strike' } });
  activateGlobalCooldown();
  startSkillCooldown('slow-strike');
}
