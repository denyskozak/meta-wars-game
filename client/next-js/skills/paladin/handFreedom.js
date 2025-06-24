import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'hand-of-freedom',
  key: 'C',
  icon: '/icons/classes/paladin/searinglight.jpg',
};

export default function castHandOfFreedom({ playerId, globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['hand-of-freedom']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'hand-of-freedom' } });
  activateGlobalCooldown();
  startSkillCooldown('hand-of-freedom');
}
