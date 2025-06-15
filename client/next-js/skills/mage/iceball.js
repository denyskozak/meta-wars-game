export const meta = { id: 'iceball', key: 'R', icon: '/icons/spell_frostbolt.jpg' };

export default function castIceball({ playerId, castSpellImpl, freezeHands, castSphere, iceballMesh, sounds, damage }) {
  freezeHands(playerId, 1000);
  castSpellImpl(
    playerId,
    60,
    0,
    (model) => castSphere(model, iceballMesh.clone(), meta.id, damage),
    sounds.iceballCast,
    sounds.iceball,
    meta.id,
    true
  );
}
