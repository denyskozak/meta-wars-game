export const PACKAGE_ID =
  process.env.NEXT_PUBLIC_CHAMPIONSHIPS_PACKAGE_ID || "";
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK as
  | "mainnet"
  | "testnet"
  | "devnet";
export const TREASURY_CAP_ID = process.env.NEXT_PUBLIC_TREASURY_CAP_ID;
export const ASSET_BASE_URL = process.env.NEXT_PUBLIC_ASSET_BASE_URL || "";

// Base health for players. Used for health bar calculations on both client and server
export const MAX_HP = 156;
export const MAX_MANA = 130;
// Amount of experience required for each level
export const XP_PER_LEVEL = 1000;
export { default as SPELL_COST } from "./spellCosts.json";
export { default as CLASS_MODELS } from "./classModels.json";
export { default as CLASS_STATS } from "./classStats.json";
export * from "./melee";
