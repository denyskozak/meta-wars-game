import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'battle-frenzy',
  key: '3',
  icon: '/icons/classes/warrior/warbringer.jpg',
  autoFocus: false,
};

export default function castBattleFrenzy({ globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['battle-frenzy']) {
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'battle-frenzy' } });
  activateGlobalCooldown();
  startSkillCooldown('battle-frenzy');
}
