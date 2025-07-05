import { SPELL_COST } from '../../consts';

export default function castProjectile({
  playerId,
  castSpellImpl,
  handsEffect,
  castSphere,
  mesh,
  castSound,
  travelSound,
  damage,
  id,
}) {
  if (handsEffect) handsEffect(playerId, 1000);
  castSpellImpl(
    playerId,
    SPELL_COST[id],
    1000,
    (model) => castSphere(model, mesh.clone(), id, damage),
    castSound,
    travelSound,
    id,
    false,
  );
}
