import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'dragon-breath',
  key: 'R',
  icon: assetUrl('/icons/classes/mage/fireball.png'),
  autoFocus: false,
};

export default function castDragonBreath({ globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['dragon-breath']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'dragon-breath' } });
  activateGlobalCooldown();
  startSkillCooldown('dragon-breath');
}
