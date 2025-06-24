import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'eviscerate',
  key: 'R',
  icon: '/icons/classes/warrior/savageblow.jpg',
  autoFocus: false,
};

export default function castEviscerate({ playerId, globalSkillCooldown, isCasting, mana, getTargetPlayer, dispatch, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['eviscerate']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for eviscerate!` });
    sounds?.noTarget?.play?.();
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'eviscerate', targetId } });
  activateGlobalCooldown();
  startSkillCooldown('eviscerate');
  return targetId;
}
