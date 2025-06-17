import { SPELL_COST } from '../../consts';

export const meta = { id: 'immolate', key: 'Q', icon: '/icons/spell_immolation.jpg' };

export default function castImmolate({
  playerId,
  castSpellImpl,
  igniteHands,
  mana,
  getTargetPlayer,
  dispatch,
  sendToSocket,
  sounds,
}) {
  if (mana < SPELL_COST['immolate']) {
    console.log('Not enough mana for immolate!');
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }

  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for immolate!` });
    sounds?.noTarget?.play?.();
    return;
  }

  igniteHands(playerId, 1500);
  castSpellImpl(
    playerId,
    SPELL_COST['immolate'],
    1500,
    () => {
      sendToSocket({ type: 'CAST_SPELL', payload: { type: 'immolate', targetId } });
    },
    sounds.fireballCast,
    sounds.fireball,
    meta.id,
    false
  );
}
