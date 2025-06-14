export const meta = { id: 'darkball', key: 'E', icon: '/icons/spell_shadowbolt.jpg' };

export default function castDarkball({ playerId, castSpellImpl, igniteHands, castSphere, darkballMesh, sounds, damage }) {
  igniteHands(playerId, 1000);
  castSpellImpl(
    playerId,
    30,
    0,
    (model) => castSphere(model, darkballMesh.clone(), meta.id, damage),
    sounds.fireballCast,
    sounds.fireball,
    meta.id,
    true
  );
}
