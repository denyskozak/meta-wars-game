"use client";

import {Card, Button} from "@heroui/react";
import Image from "next/image";
import {title} from "@/components/primitives";
import {useCoins} from "@/hooks/useCoins";
import {useLootBoxes} from "@/hooks/useLootBoxes";
import {useSkins} from "@/hooks/useSkins";
import {useState} from "react";
import {Navbar} from "@/components/navbar";
import {Modal} from "@/components/modal";

export default function BagPage() {
    const {coins, refetch: refetchCoins} = useCoins();
    const {lootboxes, refetch: refetchLoot} = useLootBoxes();
    const {skins, refetch: refetchSkins} = useSkins();
    const [opening, setOpening] = useState<string | null>(null);
    const [loot, setLoot] = useState<{type: string, amount: number}[]>([]);
    const [selectedBox, setSelectedBox] = useState<string | null>(null);

    const openBox = (id: string) => {
        setOpening(id);
        // TODO: integrate with on-chain transaction
        setTimeout(() => {
            refetchLoot();
            refetchCoins();
            refetchSkins();
            setLoot([{
                type: '$Meta Wars coins',
                amount: 10
            }])
        }, 5000);
    };

    const confirmOpen = () => {
        if (selectedBox) {
            openBox(selectedBox);
            setLoot([]);
            setSelectedBox(null);
        }
    };

    return (
        <div className="h-full">
            <Navbar/>
            <div className="w-full h-full flex justify-center items-start p-4">
                <Card className="w-full max-w-5xl p-6 space-y-6">
                    <h1 className={title()}>My Loot</h1>
                    <div className="text-lg font-medium">Coins: {coins}</div>

                    <div>
                        <h2 className="text-xl font-semibold mb-2">Loot Boxes</h2>
                        {lootboxes.length === 0 ? (
                            <p className="text-default-500">No loot boxes</p>
                        ) : (
                            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {lootboxes.map((lb: any) => {
                                    const id = lb.data?.objectId || lb.reference?.objectId || lb.id;
                                    return (
                                        <li key={id} className="flex flex-col items-center gap-2">
                                            <Image src="/images/chest.webp" alt="Loot box" width={160} height={160}/>
                                            <Button
                                                color="primary"
                                                isLoading={opening === id}
                                                onPress={() => setSelectedBox(id)}
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
                                            <Image src="/logo_big.png" alt={`Skin ${kind}`} width={80} height={80}/>
                                            <span className="text-sm mt-1">Skin {kind}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </Card>
            </div>
            {selectedBox && (
                <Modal
                    open={!!selectedBox}
                    title="Open loot box"
                    onChange={() => setSelectedBox(null)}
                    actions={[{label: "Open", onPress: confirmOpen}]}
                >
                    {opening
                        ? (
                            <Image src="/images/open-chest.gif" alt="Loot box" width={480} height={480}/>
                        )
                        : (
                            <p>Do you want to open this loot box?</p>
                        )}

                </Modal>
            )}
            <Modal
                open={!!opening}
                title="Open loot box"
                onChange={() => setOpening(null)}
                actions={[]}
            >
                {loot.length
                ? (<span>Your loot: {loot.map(({ amount, type }) => (`${type} ${amount}`))}</span>)
                : (<Image src="/images/open-chest.gif" alt="Loot box" width={480} height={480}/>)}

            </Modal>
        </div>
    );
}
