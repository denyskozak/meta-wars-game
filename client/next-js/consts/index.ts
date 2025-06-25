export const PACKAGE_ID = process.env.NEXT_PUBLIC_CHAMPIONSHIPS_PACKAGE_ID || '';
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK as
  | "mainnet"
  | "testnet"
  | "devnet";
export const TREASURY_CAP_ID = process.env.NEXT_PUBLIC_TREASURY_CAP_ID;

// Base health for players. Used for health bar calculations on both client and server
export const MAX_HP = 120;
export const MAX_MANA = 130;
// Amount of experience required for each level
export const XP_PER_LEVEL = 1000;
export { default as SPELL_COST } from './spellCosts.json';
