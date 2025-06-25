import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'hamstring',
  key: 'F',
  icon: '/icons/classes/warrior/hamstring.jpg',
  autoFocus: false,
};

export default function castHamstring({ playerId, globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['hamstring']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'hamstring' } });
  activateGlobalCooldown();
  startSkillCooldown('hamstring');
}
