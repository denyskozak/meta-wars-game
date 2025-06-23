import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'lightstrike',
  key: 'E',
  icon: '/icons/classes/paladin/crusaderstrike.jpg',
};

export default function castLightStrike({ playerId, castSpellImpl, igniteHands, castSphere, fireballMesh, sounds, damage }) {
  igniteHands(playerId, 500);
  castSpellImpl(
    playerId,
    SPELL_COST['lightstrike'],
    0,
    (model) => castSphere(model, fireballMesh.clone(), meta.id, damage),
    sounds.fireballCast,
    sounds.fireball,
    meta.id,
    true
  );
}
