import { SPELL_COST } from '../../consts';

export const meta = { id: 'frostnova', key: 'C', icon: '/icons/frostnova.jpg' };

export default function castFrostNova({ playerId, globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['frostnova']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'frostnova' } });
  activateGlobalCooldown();
  startSkillCooldown('frostnova');
}
