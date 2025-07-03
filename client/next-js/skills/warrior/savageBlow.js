import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'savage-blow',
  key: 'E',
  icon: assetUrl('/icons/classes/warrior/savageblow.jpg'),
  autoFocus: false,
};

export default function castSavageBlow({ globalSkillCooldown, isCasting, sendToSocket, activateGlobalCooldown, startSkillCooldown, mana, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['savage-blow']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'savage-blow' } });
  activateGlobalCooldown();
  startSkillCooldown('savage-blow');
}
