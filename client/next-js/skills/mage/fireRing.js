import { SPELL_COST } from "../../consts";
import { assetUrl } from "../../utilities/assets";

export const meta = {
  id: "firering",
  key: "Q",
  icon: '/images/skills/fireaoe.jpg',
  autoFocus: false,
};

export default function castFireRing({
  playerId,
  globalSkillCooldown,
  isCasting,
  mana,
  sendToSocket,
  activateGlobalCooldown,
  startSkillCooldown,
  sounds,
}) {
  if (globalSkillCooldown || isCasting) return;
  if (mana < SPELL_COST["firering"]) {
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }

    return;
  }
  sendToSocket({ type: "CAST_SPELL", payload: { type: "firering" } });
  activateGlobalCooldown();
  startSkillCooldown("firering");
}
