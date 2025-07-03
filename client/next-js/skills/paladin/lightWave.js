import { assetUrl } from '../../utilities/assets';
export const meta = {
  id: 'lightwave',
  key: 'F',
  icon: assetUrl('/icons/classes/paladin/divinestorm.jpg'),
  autoFocus: false,
};

export default function castLightWave({ playerId, globalSkillCooldown, isCasting, sendToSocket, activateGlobalCooldown, startSkillCooldown }) {
  if (globalSkillCooldown || isCasting) return;
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'lightwave' } });
  activateGlobalCooldown();
  startSkillCooldown('lightwave');
}
