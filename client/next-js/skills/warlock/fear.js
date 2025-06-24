import { SPELL_COST } from '../../consts';

export const meta = { id: 'fear', key: '3', icon: '/icons/classes/warlock/possession.jpg' };

export default function castFear({ playerId, castSpellImpl, mana, getTargetPlayer, dispatch, sendToSocket, sounds }) {
  if (mana < SPELL_COST['fear']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for fear!` });
    sounds?.noTarget?.play?.();
    return;
  }
  castSpellImpl(
    playerId,
    SPELL_COST['fear'],
    2000,
    () => sendToSocket({ type: 'CAST_SPELL', payload: { type: 'fear', targetId } }),
    sounds.spellCast,
    sounds.spellCast,
    meta.id,
    false
  );
}
