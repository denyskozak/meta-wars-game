"use client";

import Image from "next/image";
import {Card} from "@heroui/react";
import {useRouter} from "next/navigation";
import {Navbar} from "@/components/navbar";
import {useCurrentAccount} from "@mysten/dapp-kit";
import {ConnectionButton} from "@/components/connection-button";


export default function MatchesPage() {
    const router = useRouter();
    const account = useCurrentAccount();
    return (
        <div className="h-ful w-full  items-center justify-center">
            <Navbar/>
            <div className="flex w-full h-[calc(100%-98px)] items-center justify-center">

                {
                    account
                        ? (
                            <>
                                <div className="flex w-full m-32 gap-8">
                                    <Card isPressable className="w-2/4 h-[320px]"
                                          onPress={() => router.push('/play/open-world')}>
                                        <Image src="/images/open-world.jpg" alt="Open World" width={2000} height={1200}
                                               className="w-full h-full object-cover rounded-t-lg"/>
                                        <div className="p-4 text-center">Join Open World</div>
                                    </Card>
                                    <Card isPressable className="w-2/4 h-[320px]" onPress={() => router.push('/matches')}>
                                        <Image src="/images/battle.jpg" alt="Arena Match" width={2000} height={1200}
                                               className="w-full h-full object-cover rounded-t-lg"/>
                                        <div className="p-4 text-center">Join Arena Match</div>
                                    </Card>
                                </div>
                            </>
                        )
                        : (<ConnectionButton className="m-auto" text="Connect to Play"/>)
                }
            </div>

        </div>
    );
}
