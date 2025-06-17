import { SPELL_COST } from '../../consts';

export const meta = { id: 'pyroblast', key: 'F', icon: '/icons/pyroblast.jpg' };

export default function castPyroblast({ playerId, castSpellImpl, igniteHands, castSphere, pyroblastMesh, sounds, damage }) {
  igniteHands(playerId, 1000);
  castSpellImpl(
    playerId,
    SPELL_COST['pyroblast'],
    0,
    (model) => castSphere(model, pyroblastMesh.clone(), meta.id, damage),
    sounds.fireballCast,
    sounds.fireball,
    meta.id,
    true
  );
}
