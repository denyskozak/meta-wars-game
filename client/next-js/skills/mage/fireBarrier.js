import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'fire-barrier',
  key: 'R',
  icon: '/images/skills/dragon.jpg',
  autoFocus: false,
};

export default function castFireBarrier({
  globalSkillCooldown,
  isCasting,
  mana,
  sendToSocket,
  activateGlobalCooldown,
  startSkillCooldown,
  sounds,
}) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['fire-barrier']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'fire-barrier' } });
  activateGlobalCooldown();
  startSkillCooldown('fire-barrier');
}
