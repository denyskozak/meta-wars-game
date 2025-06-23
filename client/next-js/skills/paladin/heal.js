import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'paladin-heal',
  key: 'Q',
  icon: '/icons/classes/paladin/searinglight.jpg',
};

export default function castPaladinHeal({ playerId, castSpellImpl, mana, getTargetPlayer, dispatch, sendToSocket, sounds }) {
  if (mana < SPELL_COST['paladin-heal']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer() || playerId;
  castSpellImpl(
    playerId,
    SPELL_COST['paladin-heal'],
    2000,
    () => sendToSocket({ type: 'CAST_SPELL', payload: { type: 'paladin-heal', targetId } }),
    sounds.spellCast,
    sounds.heal,
    meta.id,
    false
  );
}
