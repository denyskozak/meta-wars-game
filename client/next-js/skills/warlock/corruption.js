import { assetUrl } from '../../utilities/assets';
import { SPELL_COST } from '../../consts';

export const meta = { id: 'corruption', key: 'R', icon: assetUrl('/icons/classes/warlock/spell_corruption.jpg') };

export default function castCorruption({ playerId, globalSkillCooldown, isCasting, mana, getTargetPlayer, dispatch, sendToSocket, activateGlobalCooldown, startSkillCooldown, sounds }) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST['corruption']) {
    console.log('Not enough mana for corruption!');
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }
  const targetId = getTargetPlayer();
  if (!targetId) {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: `No target for corruption!` });
    sounds?.noTarget?.play?.();
    return;
  }
  sendToSocket({ type: 'CAST_SPELL', payload: { type: 'corruption', targetId } });
  activateGlobalCooldown();
  startSkillCooldown('corruption');
}
