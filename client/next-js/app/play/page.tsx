"use client";

import Image from "next/image";
import {Card, CardHeader} from "@heroui/react";
import {useRouter} from "next/navigation";
import {Navbar} from "@/components/navbar";
import {useCurrentAccount} from "@mysten/dapp-kit";
import {ConnectionButton} from "@/components/connection-button";


export default function MatchesPage() {
    const router = useRouter();
    const account = useCurrentAccount();
    return (
        <div className="h-full w-full  items-center justify-center">
            <Navbar/>
            <div className="flex w-full h-[calc(100%-98px)] items-center justify-center">

                {
                    account
                        ? (
                            <>
                                <div className="flex w-full m-32 gap-8">
                                    <Card isPressable className="w-2/4 h-[320px]"
                                          onPress={() => router.push('/play/open-world')}>
                                        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                                            <h4 className="font-bold text-large">Join Open World</h4>
                                        </CardHeader>
                                        <Image src="/images/open-world.jpg" alt="Open World" width={2000} height={1200}
                                               className="w-full h-full object-cover rounded-t-lg"/>
                                    </Card>
                                    <Card isPressable className="w-2/4 h-[320px]" onPress={() => router.push('/matches')}>
                                        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                                            <h4 className="font-bold text-large">Join Arena Match</h4>
                                        </CardHeader>
                                        <Image src="/images/battle.jpg" alt="Arena Match" width={2000} height={1200}
                                               className="w-full h-full object-cover rounded-t-lg"/>
                                    </Card>
                                </div>
                            </>
                        )
                        : (<>
                            <Image src="/images/tower_bg.png" alt="Arena Match" width={3000} height={1400}
                                   className="w-full h-full absolute object-cover rounded-t-lg"/>
                            <ConnectionButton className="m-auto" text="Connect to Play"/>
                        </>)
                }
            </div>

        </div>
    );
}
