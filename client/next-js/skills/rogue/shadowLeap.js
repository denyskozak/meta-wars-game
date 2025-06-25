import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'shadow-leap',
  key: 'Q',
  icon: '/icons/classes/rogue/shadowstep.jpg',
};

export default function castShadowLeap({ playerId, globalSkillCooldown, isCasting, mana, getTargetPlayer, dispatch, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['shadow-leap']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for shadow leap!` });
    sounds?.noTarget?.play?.();
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'shadow-leap', targetId } });
  activateGlobalCooldown();
  startSkillCooldown('shadow-leap');
  return targetId;
}
