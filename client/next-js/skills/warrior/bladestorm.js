import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'bladestorm',
  key: 'Q',
  icon: assetUrl('/icons/classes/warrior/bladestorm.jpg'),
  autoFocus: false,
};

export default function castBladestorm({ globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['bladestorm']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'bladestorm' } });
  activateGlobalCooldown();
  startSkillCooldown('bladestorm');
}
