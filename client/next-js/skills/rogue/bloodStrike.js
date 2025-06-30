import { SPELL_COST } from '../../consts';

export const meta = {
  id: 'blood-strike',
  key: 'E',
  icon: '/icons/classes/rogue/sinister_strike.jpg',
  autoFocus: false,
};

export default function castBloodStrike({
  globalSkillCooldown,
  isCasting,
  mana,
  getTargetPlayer,
  dispatch,
  sendToSocket,
  activateGlobalCooldown,
  startSkillCooldown,
  sounds,
}) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['blood-strike']) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer?.();
  if (!targetId) {
    dispatch?.({ type: 'SEND_CHAT_MESSAGE', payload: `No target for blood strike!` });
    sounds?.noTarget?.play?.();
    return;
  }

  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'blood-strike', targetId } });
  activateGlobalCooldown();
  startSkillCooldown('blood-strike');
}
