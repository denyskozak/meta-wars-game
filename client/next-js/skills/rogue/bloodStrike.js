import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'blood-strike',
  key: 'E',
  icon: '/icons/classes/paladin/crusaderstrike.jpg',
  autoFocus: false,
};

export default function castBloodStrike({ globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['blood-strike']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'blood-strike' } });
  activateGlobalCooldown();
  startSkillCooldown('blood-strike');
}
