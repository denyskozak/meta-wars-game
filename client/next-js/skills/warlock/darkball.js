export const meta = { id: 'darkball', key: 'E', icon: '/icons/fireball.png' };

export default function castDarkball({ playerId, castSpellImpl, igniteHands, castSphere, darkballMesh, sounds }) {
  igniteHands(playerId, 1000);
  castSpellImpl(
    playerId,
    30,
    1000,
    (model) => castSphere(model, darkballMesh.clone(), meta.id),
    sounds.fireballCast,
    sounds.fireball,
    meta.id
  );
}
