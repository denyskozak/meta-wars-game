import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'fireball',
  key: 'E',
  icon: assetUrl('/icons/classes/mage/fireball.png'),
  autoFocus: false,
};

export default function castFireball({ playerId, castSpellImpl, igniteHands, castSphere, fireballMesh, sounds, damage }) {
  igniteHands(playerId, 1000);
  castSpellImpl(
    playerId,
    SPELL_COST['fireball'],
    1000,
    (model) => castSphere(model, fireballMesh.clone(), meta.id, damage),
    sounds.fireballCast,
    sounds.fireball,
    meta.id,
    false
  );
}
