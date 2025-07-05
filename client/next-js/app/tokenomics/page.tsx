"use client";

import {
  Card,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import Image from "next/image";
import React from "react";

import { Navbar } from "@/components/navbar";
import { title, subtitle } from "@/components/primitives";

export default function TokenomicsPage() {
  return (
    <div className="h-full">
      <Navbar />
      <div className="flex justify-center items-start p-4 h-full overflow-y-auto">
        <Card className="w-full max-w-5xl p-6 space-y-6">
          <h1 className={title({ color: "metaWars" })}>
            $MetaWars Tokenomics Overview
          </h1>

          <h2 className={title({ size: "md" })}>Project Summary</h2>
          <p className={subtitle()}>
            Meta Wars is a competitive multiplayer game where 6–10 players enter
            a match, earn loot boxes, and receive rewards such as coins, items,
            rare medals, and the native utility token: $MetaWars. The game
            incorporates Web3 mechanics like item ownership, staking, DAO
            voting, and token-based economy.
          </p>

          <h2 className={title({ size: "md" })}>Token Overview</h2>
          <Table aria-label="Token overview">
            <TableHeader>
              <TableColumn>Property</TableColumn>
              <TableColumn>Value</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Token Name</TableCell>
                <TableCell>MetaWars</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ticker</TableCell>
                <TableCell>$MetaWars</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Utility / Governance / P2E</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Chain</TableCell>
                <TableCell>Sui</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Initial Supply</TableCell>
                <TableCell>1,000,000,000</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Deflationary?</TableCell>
                <TableCell>✅ Yes — burn on all txs</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <h2 className={title({ size: "md" })}>Token Utility</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Buying skins, staffs, mounts, and upgrades</li>
            <li>Unlocking premium loot boxes and forge attempts</li>
            <li>Participating in PvP tournaments</li>
            <li>Voting in the MetaWars DAO</li>
            <li>Staking to support the platform and earn rewards</li>
            <li>Accessing exclusive Battle Passes and legendary cosmetics</li>
          </ul>

          <h2 className={title({ size: "md" })}>Token Flow Diagram</h2>
          <Image
            alt="Token Flow"
            height={280}
            src="/token_flow.png"
            width={200}
          />
          <h2 className={title({ size: "md" })}>
            Deflation Mechanics (Burn Model)
          </h2>
          <p>10% of every transaction is burned.</p>
          <p>
            Includes item purchases, upgrades, forge fees, and marketplace
            trades.
          </p>
          <p>
            This creates long-term scarcity and increases token value as supply
            decreases.
          </p>

          <h2 className={title({ size: "md" })}>Staking Program</h2>
          <p>$MetaWars holders can stake tokens to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Support game infrastructure and liquidity.</li>
            <li>Earn platform fees and rewards.</li>
            <li>Get early access to new features or items.</li>
            <li>
              Vote in governance decisions (staking + medals unlock voting
              power).
            </li>
          </ul>
          <p>Staking pools will include:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Single-asset staking</li>
            <li>LP staking (e.g., SUI/$MetaWars)</li>
            <li>Governance staking (for DAO voting rights)</li>
          </ul>

          <h2 className={title({ size: "md" })}>Loot Box Rewards</h2>
          <p>Loot boxes are earned from PvP matches:</p>
          <Table aria-label="Loot box rewards">
            <TableHeader>
              <TableColumn>Type</TableColumn>
              <TableColumn>Drop Chance</TableColumn>
              <TableColumn>Contents</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Common</TableCell>
                <TableCell>70%</TableCell>
                <TableCell>In-game coins, basic items</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Rare</TableCell>
                <TableCell>25%</TableCell>
                <TableCell>+ $MetaWars (1–5), chance of rare items</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Epic</TableCell>
                <TableCell>5%</TableCell>
                <TableCell>+ $MetaWars (5–15), chance of rare medals</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p>
            Loot box rewards are rate-limited via energy systems to prevent
            farming abuse.
          </p>

          <h2 className={title({ size: "md" })}>
            DAO Governance (via $MetaWars + Medals)
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Vote on game development proposals.</li>
            <li>Help balance in-game economies.</li>
            <li>Control treasury fund usage.</li>
            <li>Influence future token emission and burn parameters.</li>
          </ul>

          <h2 className={title({ size: "md" })}>Token Distribution</h2>
          <Table aria-label="Token distribution">
            <TableHeader>
              <TableColumn>Allocation</TableColumn>
              <TableColumn>%</TableColumn>
              <TableColumn>Vesting Schedule</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Play-to-Earn Rewards</TableCell>
                <TableCell>30%</TableCell>
                <TableCell>Linear over 5–7 years</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>DAO Treasury</TableCell>
                <TableCell>20%</TableCell>
                <TableCell>Controlled via community governance</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Private Sale Investors</TableCell>
                <TableCell>15%</TableCell>
                <TableCell>12-mo cliff, 18-mo linear vesting</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Team & Advisors</TableCell>
                <TableCell>15%</TableCell>
                <TableCell>12-mo cliff, 24-mo linear vesting</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Liquidity Provision</TableCell>
                <TableCell>10%</TableCell>
                <TableCell>Immediate or phased for DEX/CEX</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Marketing & Community</TableCell>
                <TableCell>5%</TableCell>
                <TableCell>Airdrops, partners, creators</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ecosystem Grants</TableCell>
                <TableCell>5%</TableCell>
                <TableCell>Launchpads, collaborations, dev support</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p>Total Supply: 1,000,000,000 $MetaWars (Fixed)</p>

          <h2 className={title({ size: "md" })}>Investor Highlights</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>🔥 Deflationary model with 10% burn per transaction</li>
            <li>
              🎮 Real in-game demand for skins, upgrades, gear, tournaments
            </li>
            <li>📊 DAO & governance participation</li>
            <li>💰 Opportunity for early access at a private round discount</li>
            <li>🔐 Transparent emission model with staking incentives</li>
            <li>🏆 Game-first utility = strong organic demand</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
