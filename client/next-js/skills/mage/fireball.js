import { SPELL_COST } from '../../consts';

export const meta = { id: 'fireball', key: 'E', icon: '/icons/classes/mage/fireball.png' };

export default function castFireball({ playerId, castSpellImpl, igniteHands, castSphere, fireballMesh, sounds, damage }) {
  igniteHands(playerId, 1000);
  castSpellImpl(
    playerId,
    SPELL_COST['fireball'],
    500,
    (model) => castSphere(model, fireballMesh.clone(), meta.id, damage),
    sounds.fireballCast,
    sounds.fireball,
    meta.id,
    true
  );
}
