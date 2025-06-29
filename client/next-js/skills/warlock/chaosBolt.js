import { SPELL_COST } from '../../consts';

export const meta = { id: 'chaosbolt', key: 'F', icon: '/icons/classes/warlock/chaosbolt.jpg' };

export default function castChaosBolt({ playerId, castSpellImpl, igniteHands, castSphere, chaosBoltMesh, sounds, damage }) {
  igniteHands(playerId, 1000);
  castSpellImpl(
    playerId,
    SPELL_COST['chaosbolt'],
    1000,
    (model) => castSphere(model, chaosBoltMesh.clone(), meta.id, damage),
    sounds.fireballCast,
    sounds.fireball,
    meta.id,
    false
  );
}
