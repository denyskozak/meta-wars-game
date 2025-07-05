import { assetUrl } from '../../utilities/assets';
import castProjectile from '../common/castProjectile';

export const meta = {
  id: 'shadowbolt',
  key: 'E',
  icon: assetUrl('/icons/classes/warlock/spell_shadowbolt.jpg'),
  autoFocus: false,
};

export default function castShadowbolt({ playerId, castSpellImpl, igniteHands, castSphere, shadowboltMesh, sounds, damage }) {
  castProjectile({
    playerId,
    castSpellImpl,
    handsEffect: igniteHands,
    castSphere,
    mesh: shadowboltMesh,
    castSound: sounds.fireballCast,
    travelSound: sounds.fireball,
    damage,
    id: meta.id,
  });
}
