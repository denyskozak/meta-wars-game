import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'stun',
  key: 'R',
  icon: assetUrl('/icons/classes/paladin/sealofmight.jpg'),
};

export default function castStun({ playerId, globalSkillCooldown, isCasting, mana, getTargetPlayer, dispatch, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['stun']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for stun!` });
    sounds?.noTarget?.play?.();
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'stun', targetId } });
  activateGlobalCooldown();
  startSkillCooldown('stun');
  return targetId;
}
