import { SPELL_COST } from '../../consts';

export const meta = { id: 'darkball', key: 'E', icon: '/icons/classes/warlock/spell_shadowbolt.jpg' };

export default function castDarkball({ playerId, castSpellImpl, igniteHands, castSphere, darkballMesh, sounds, damage }) {
  igniteHands(playerId, 1000);
  castSpellImpl(
    playerId,
    SPELL_COST['darkball'],
    500,
    (model) => castSphere(model, darkballMesh.clone(), meta.id, damage),
    sounds.fireballCast,
    sounds.fireball,
    meta.id,
    true
  );
}
