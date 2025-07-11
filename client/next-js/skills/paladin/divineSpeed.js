import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'divine-speed',
  key: 'F',
  icon: assetUrl('/icons/classes/paladin/speedoflight.jpg'),
  autoFocus: false,
};

export default function castDivineSpeed({ playerId, globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['divine-speed']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'divine-speed' } });
  activateGlobalCooldown();
  startSkillCooldown('divine-speed');
}
