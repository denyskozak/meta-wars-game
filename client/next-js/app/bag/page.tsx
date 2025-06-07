"use client";

import { Card, Button } from "@heroui/react";
import Image from "next/image";
import { title } from "@/components/primitives";
import { useCoins } from "@/hooks/useCoins";
import { useLootBoxes } from "@/hooks/useLootBoxes";
import { useSkins } from "@/hooks/useSkins";
import { useState } from "react";

export default function BagPage() {
  const { coins, refetch: refetchCoins } = useCoins();
  const { lootboxes, refetch: refetchLoot } = useLootBoxes();
  const { skins, refetch: refetchSkins } = useSkins();
  const [opening, setOpening] = useState<string | null>(null);

  const openBox = (id: string) => {
    setOpening(id);
    // TODO: integrate with on-chain transaction
    setTimeout(() => {
      refetchLoot();
      refetchCoins();
      refetchSkins();
      setOpening(null);
    }, 1000);
  };

  return (
    <div className="w-full h-full flex justify-center items-start p-4">
      <Card className="w-full max-w-5xl p-6 space-y-6">
        <h1 className={title()}>My Loot</h1>
        <div className="text-lg font-medium">Coins: {coins}</div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Loot Boxes</h2>
          {lootboxes.length === 0 ? (
            <p className="text-default-500">No loot boxes</p>
          ) : (
            <ul className="flex flex-wrap gap-4">
              {lootboxes.map((lb: any) => {
                const id = lb.data?.objectId || lb.reference?.objectId || lb.id;
                return (
                  <li key={id} className="flex flex-col items-center gap-2">
                    <Image src="/logo_big.png" alt="Loot box" width={80} height={80} />
                    <Button
                      color="primary"
                      isLoading={opening === id}
                      onPress={() => openBox(id)}
                    >
                      Open
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Skins</h2>
          {skins.length === 0 ? (
            <p className="text-default-500">No skins</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {skins.map((skin: any) => {
                const kind = skin.data?.content?.fields?.kind;
                const id = skin.data?.objectId || skin.reference?.objectId || skin.id;
                return (
                  <li key={id} className="flex flex-col items-center">
                    <Image src="/logo_big.png" alt={`Skin ${kind}`} width={80} height={80} />
                    <span className="text-sm mt-1">Skin {kind}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
