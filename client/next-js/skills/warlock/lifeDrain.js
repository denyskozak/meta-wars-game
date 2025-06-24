import { SPELL_COST } from '../../consts';

export const meta = { id: 'lifedrain', key: '2', icon: '/icons/lifedrain.jpg' };

export default function castLifeDrain({ playerId, castSpellImpl, mana, getTargetPlayer, dispatch, sendToSocket, sounds }) {
  if (mana < SPELL_COST['lifedrain']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for lifedrain!` });
    sounds?.noTarget?.play?.();
    return;
  }
  castSpellImpl(
    playerId,
    SPELL_COST['lifedrain'],
    1000,
    () => sendToSocket({ type: 'CAST_SPELL', payload: { type: 'lifedrain', targetId } }),
    sounds.spellCast,
    sounds.spellCast,
    meta.id,
    false
  );
}
