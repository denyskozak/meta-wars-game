import { SPELL_COST } from '../../consts';

export const meta = { id: 'ice-veins', key: 'F', icon: '/icons/spell_veins.jpg' };

export default function castIceVeins({ playerId, activateIceVeins, mana, sounds }) {
  if (mana < SPELL_COST['ice-veins']) {
    console.log('Not enough mana for ice veins!');
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return false;
  }

  activateIceVeins(playerId);
  return true;
}
