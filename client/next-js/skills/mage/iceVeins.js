export const meta = { id: 'ice-veins', key: 'F', icon: '/icons/spell_veins.jpg' };

export const ICE_VEINS_MANA_COST = 50;

export default function castIceVeins({ playerId, activateIceVeins, mana, sounds }) {
  if (mana < ICE_VEINS_MANA_COST) {
    console.log('Not enough mana for ice veins!');
    if (sounds?.noMana) {
      sounds.noMana.currentTime = 0;
      sounds.noMana.volume = 0.5;
      sounds.noMana.play();
    }
    return;
  }

  activateIceVeins(playerId);
}
