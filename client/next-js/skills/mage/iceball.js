import { SPELL_COST } from '../../consts';

export const meta = { id: 'iceball', key: 'R', icon: '/icons/classes/mage/spell_frostbolt.jpg' };

export default function castIceball({ playerId, castSpellImpl, freezeHands, castSphere, iceballMesh, sounds, damage }) {
  freezeHands(playerId, 1000);
  castSpellImpl(
    playerId,
    SPELL_COST['iceball'],
    1000,
    (model) => castSphere(model, iceballMesh.clone(), meta.id, damage),
    sounds.iceballCast,
    sounds.iceball,
    meta.id,
    false
  );
}
