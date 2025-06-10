export const meta = { id: 'iceball', key: 'R', icon: '/icons/spell_frostbolt.jpg' };

export default function castIceball({ playerId, castSpellImpl, freezeHands, castSphere, iceballMesh, sounds }) {
  freezeHands(playerId, 1000);
  castSpellImpl(
    playerId,
    50,
    1200,
    (model) => castSphere(model, iceballMesh.clone(), meta.id),
    sounds.iceballCast,
    sounds.iceball,
    meta.id
  );
}
