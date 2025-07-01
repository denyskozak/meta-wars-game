import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'berserk',
  key: '2',
  icon: '/icons/classes/warrior/berserk.jpg',
  autoFocus: false,
};

export default function castBerserk({ playerId, globalSkillCooldown, isCasting, mana, sendToSocket, activateGlobalCooldown, startSkillCooldown, igniteHands, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['berserk']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  igniteHands?.(playerId, 1000);
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'berserk' } });
  activateGlobalCooldown();
  startSkillCooldown('berserk');
}
