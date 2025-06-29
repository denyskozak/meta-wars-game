import { SPELL_COST } from '../../consts';

export const meta = { id: 'lifetap', key: 'Q', icon: '/icons/classes/warlock/spell_immolation.jpg' };

export default function castLifeTap({
  playerId,
  castSpellImpl,
  sendToSocket,
  sounds,
}) {
  castSpellImpl(
    playerId,
    SPELL_COST['lifetap'],
    500,
    () => {
      sendToSocket({ type: 'CAST_SPELL', payload: { type: 'lifetap' } });
    },
    sounds.spellCast,
    sounds.spellCast,
    meta.id,
    false
  );
}
