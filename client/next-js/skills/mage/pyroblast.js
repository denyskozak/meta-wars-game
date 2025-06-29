import { SPELL_COST } from '../../consts';

export const meta = { id: 'pyroblast', key: '2', icon: '/icons/classes/mage/pyroblast.jpg' };

export default function castPyroblast({ playerId, castSpellImpl, igniteHands, castSphere, pyroblastMesh, sounds, damage }) {
  igniteHands(playerId, 1000);
  castSpellImpl(
    playerId,
    SPELL_COST['pyroblast'],
    1000,
    (model) => castSphere(model, pyroblastMesh.clone(), meta.id, damage),
    sounds.fireballCast,
    sounds.fireball,
    meta.id,
    false
  );
}
