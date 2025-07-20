import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'hook',
  key: 'F',
  icon: assetUrl('/icons/classes/warrior/hamstring.jpg'),
  autoFocus: false,
};

export default function castHook({ playerId, globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['hook']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'hook' } });
  activateGlobalCooldown();
  startSkillCooldown('hook');
}
