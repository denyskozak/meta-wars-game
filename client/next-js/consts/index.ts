export const PACKAGE_ID = process.env.NEXT_PUBLIC_CHAMPIONSHIPS_PACKAGE_ID;
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK as
  | "mainnet"
  | "testnet"
  | "devnet";
export const TREASURY_CAP_ID = process.env.NEXT_PUBLIC_TREASURY_CAP_ID;

// Base health for players. Used for health bar calculations on both client and server
export const MAX_HP = 200;
