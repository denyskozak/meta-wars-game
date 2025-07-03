import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'kidney-strike',
  key: 'F',
  icon: assetUrl('/icons/classes/rogue/kidneyshot.jpg'),
  autoFocus: false,
};

export default function castKidneyStrike({ playerId, globalSkillCooldown, isCasting, mana, getTargetPlayer, dispatch, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['kidney-strike']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for kidney strike!` });
    sounds?.noTarget?.play?.();
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'kidney-strike', targetId } });
  activateGlobalCooldown();
  startSkillCooldown('kidney-strike');
  return targetId;
}
