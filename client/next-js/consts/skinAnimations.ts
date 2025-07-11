export interface AnimationMap {
  idle: string;
  walk: string;
  run: string;
  jump: string;
  casting: string;
  castEnd: string;
  cast: string;
  dying: string;
  hitReaction: string;
  attack: string;
  attack360: string;
}

function createDefaultMap(prefix: string): AnimationMap {
  return {
    idle: `${prefix}_idle1.anm`,
    walk: `${prefix}_run.anm`,
    run: `${prefix}_run.anm`,
    jump: `${prefix}_spell4.anm`,
    casting: `${prefix}_channel_windup.anm`,
    castEnd: `${prefix}_spell1.anm`,
    cast: 'cast',
    dying: `${prefix}_death.anm`,
    hitReaction: 'hit_reaction',
    attack: 'attack',
    attack360: 'attack_360',
  };
}

export const SKIN_ANIMATIONS: Record<string, AnimationMap> = {
  brand: createDefaultMap('brand'),
  aurelion: createDefaultMap('aurelion'),
  annie: createDefaultMap('annie'),
  fizz: createDefaultMap('fizz'),
  karthus: createDefaultMap('karthus'),
  darius: createDefaultMap('darius'),
  kayn: createDefaultMap('kayn'),
};
