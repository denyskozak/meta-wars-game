import { SPELL_COST } from '../../consts';

export const meta = { id: 'lightwave', key: 'F', icon: '/icons/shield.png' };

export default function castLightWave({ playerId, globalSkillCooldown, isCasting, sendToSocket, activateGlobalCooldown, startSkillCooldown }) {
  if (globalSkillCooldown || isCasting) return;
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'lightwave' } });
  activateGlobalCooldown();
  startSkillCooldown('lightwave');
}
