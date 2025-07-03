import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'adrenaline-rush',
  key: '2',
  icon: assetUrl('/icons/classes/rogue/adrenalinerush.jpg'),
  autoFocus: false,
};

export default function castAdrenalineRush({ globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['adrenaline-rush']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'adrenaline-rush' } });
  activateGlobalCooldown();
  startSkillCooldown('adrenaline-rush');
}
