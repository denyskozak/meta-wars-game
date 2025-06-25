import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'whirlwind',
  key: '2',
  icon: '/icons/classes/warrior/savageblow.jpg',
  autoFocus: false,
};

export default function castWhirlwind({ globalSkillCooldown, isCasting, sendToSocket, activateGlobalCooldown, startSkillCooldown }) {
  if (globalSkillCooldown || isCasting) return;
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'whirlwind' } });
  activateGlobalCooldown();
  startSkillCooldown('whirlwind');
}
