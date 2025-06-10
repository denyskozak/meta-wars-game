export const meta = { id: 'fireball', key: 'E', icon: '/icons/fireball.png' };

export default function castFireball({ playerId, castSpellImpl, igniteHands, castSphere, fireballMesh, sounds, damage }) {
  igniteHands(playerId, 1000);
  castSpellImpl(
    playerId,
    30,
    1500,
    (model) => castSphere(model, fireballMesh.clone(), meta.id, damage),
    sounds.fireballCast,
    sounds.fireball,
    meta.id
  );
}
