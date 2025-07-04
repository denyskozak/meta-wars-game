import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'darkball',
  key: 'E',
  icon: assetUrl('/icons/classes/warlock/spell_shadowbolt.jpg'),
  autoFocus: false,
};

export default function castDarkball({ playerId, castSpellImpl, igniteHands, castSphere, darkballMesh, sounds, damage }) {
  igniteHands(playerId, 1000);
  castSpellImpl(
    playerId,
    SPELL_COST['darkball'],
    1000,
    (model) => castSphere(model, darkballMesh.clone(), meta.id, damage),
    sounds.fireballCast,
    sounds.fireball,
    meta.id,
    false
  );
}
