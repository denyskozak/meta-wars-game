import { default as SKIN_SKILL_ANIMATIONS } from "./skinSkillMap.json";

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

function createDefaultMap(skin: string): AnimationMap {
  return SKIN_SKILL_ANIMATIONS[skin];
}

export const SKIN_ANIMATIONS: Record<string, AnimationMap> = {
  brand: createDefaultMap("brand"),
  aurelion: createDefaultMap("aurelion"),
  annie: createDefaultMap("annie"),
  fizz: createDefaultMap("fizz"),
  karthus: createDefaultMap("karthus"),
  darius: createDefaultMap("darius"),
  akali: createDefaultMap("akali"),
  kayle: createDefaultMap("kayle"),
  kayn: createDefaultMap("kayn"),
};


