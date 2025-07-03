import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'lightstrike',
  key: 'E',
  icon: assetUrl('/icons/classes/paladin/crusaderstrike.jpg'),
  autoFocus: false,
};

export default function castLightStrike({
  globalSkillCooldown,
  isCasting,
  mana,
  sendToSocket,
  activateGlobalCooldown,
  startSkillCooldown,
  sounds,
}) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['lightstrike']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'lightstrike' } });
  activateGlobalCooldown();
  startSkillCooldown('lightstrike');
}
