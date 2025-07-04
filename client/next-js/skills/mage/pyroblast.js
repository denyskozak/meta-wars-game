import { assetUrl } from '../../utilities/assets';
import castProjectile from '../common/castProjectile';

export const meta = {
  id: 'pyroblast',
  key: '2',
  icon: assetUrl('/icons/classes/mage/pyroblast.jpg'),
  autoFocus: false,
};

export default function castPyroblast({ playerId, castSpellImpl, igniteHands, castSphere, pyroblastMesh, sounds, damage }) {
  castProjectile({
    playerId,
    castSpellImpl,
    handsEffect: igniteHands,
    castSphere,
    mesh: pyroblastMesh,
    castSound: sounds.fireballCast,
    travelSound: sounds.fireball,
    damage,
    id: meta.id,
  });
}
