import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'sprint',
  key: '3',
  icon: '/icons/classes/paladin/speedoflight.jpg',
  autoFocus: false,
};

export default function castSprint({ globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['sprint']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'sprint' } });
  activateGlobalCooldown();
  startSkillCooldown('sprint');
}
