import { assetUrl } from '../../utilities/assets';
import castProjectile from '../common/castProjectile';

export const meta = {
  id: 'iceball',
  key: 'R',
  icon: assetUrl('/icons/classes/mage/spell_frostbolt.jpg'),
  autoFocus: false,
};

export default function castIceball({ playerId, castSpellImpl, freezeHands, castSphere, iceballMesh, sounds, damage }) {
  castProjectile({
    playerId,
    castSpellImpl,
    handsEffect: freezeHands,
    castSphere,
    mesh: iceballMesh,
    castSound: sounds.iceballCast,
    travelSound: sounds.iceball,
    damage,
    id: meta.id,
  });
}
