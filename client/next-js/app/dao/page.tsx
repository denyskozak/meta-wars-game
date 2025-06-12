"use client";

import { Card } from "@heroui/react";

import { Navbar } from "@/components/navbar";
import { title, subtitle } from "@/components/primitives";

export default function DaoPage() {
  return (
    <div className="h-full">
      <Navbar />
      <div className="flex justify-center items-start p-4 h-full overflow-y-auto">
        <Card className="w-full max-w-5xl p-6 space-y-6">
          <h1 className={title({ color: "metaWars" })}>MetaWars DAO</h1>
          <p className={subtitle()}>
            MetaWars is governed by a community‑driven DAO. Treasury funds are
            stored in a dedicated wallet and are allocated through community
            votes to support tournaments, creators and ongoing game promotion.
          </p>
          <p>
            Treasury wallet address: <code>0xMETA-WARS-DAO</code>
          </p>
          <p>
            Holders of $MetaWars can submit proposals on how to use the treasury
            and vote on initiatives that help the ecosystem grow.
          </p>
        </Card>
      </div>
    </div>
  );
}
