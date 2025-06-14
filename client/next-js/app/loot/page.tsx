"use client";

import {Card} from "@heroui/react";
import {title} from "@/components/primitives";
import {useCoins} from "@/hooks/useCoins";
import {useItems} from "@/hooks/useItems";
import {Navbar} from "@/components/navbar";

export default function LootPage() {
    const {coins} = useCoins();
    const {items} = useItems();


    return (
        <div className="h-full">
            <Navbar/>
            <div className="w-full h-full flex justify-center items-start p-4">
                <Card className="w-full max-w-5xl p-6 space-y-6">
                    <h1 className={title()}>My Loot</h1>
                    <div className="text-lg font-medium">Coins: {coins}</div>


                    <div>
                        <h2 className="text-xl font-semibold mb-2">Items</h2>
                        {items.length === 0 ? (
                            <p className="text-default-500">No items</p>
                        ) : (
                            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {items.map((item: any) => {
                                    const id = item.data?.objectId || item.reference?.objectId || item.id;
                                    const type = item.data?.content?.fields?.item_type || 'unknown';
                                    return (
                                        <li key={id} className="flex flex-col items-center">
                                            <span className="text-sm">{type}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                </Card>
            </div>
        </div>
    );
}
