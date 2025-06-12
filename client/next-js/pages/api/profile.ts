import type { NextApiRequest, NextApiResponse } from "next";

import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

const PACKAGE_ID = process.env.NEXT_PUBLIC_CHAMPIONSHIPS_PACKAGE_ID as string;
const SECRET_KEY = process.env.SECRET_KEY as string;
const NETWORK = (process.env.NEXT_PUBLIC_NETWORK || "devnet") as
  | "devnet"
  | "testnet"
  | "mainnet";

const NETWORK_URLS: Record<typeof NETWORK, string> = {
  devnet: "https://fullnode.devnet.sui.io",
  testnet: "https://fullnode.testnet.sui.io",
  mainnet: "https://fullnode.mainnet.sui.io",
};

const client = new SuiClient({ url: NETWORK_URLS[NETWORK] });
const keypair = Ed25519Keypair.fromSecretKey(SECRET_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);

    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address, nickname } = req.body as {
    address?: string;
    nickname?: string;
  };

  if (!address || !nickname || !PACKAGE_ID || !SECRET_KEY) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  try {
    const tx = new Transaction();
    const [profile] = tx.moveCall({
      target: `${PACKAGE_ID}::profile::create`,
      arguments: [tx.pure.string(nickname)],
    });

    tx.transferObjects([profile], tx.pure.address(address));
    tx.setGasBudget(10000000);
    tx.setSender(keypair.toSuiAddress());

    const bytes = await tx.build({ client });
    const { signature, bytes: signed } = await keypair.signTransaction(bytes);
    const result = await client.executeTransactionBlock({
      transactionBlock: signed,
      signature,
    });

    return res.status(200).json({ digest: result.digest });
  } catch (error: any) {
    console.error("createProfile error", error);

    return res.status(500).json({ error: "Failed to create profile" });
  }
}
