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
        <div className="h-full">
            <Navbar/>
            {
                account
                    ? (<ConnectionButton />)
                    : (
                        <div className="flex w-full h-[calc(100%-98px)] items-center justify-center">
                            <div className="flex gap-8">
                                <Card isPressable className="w-64" onPress={() => router.push('/play/open-world')}>
                                    <Image src="/background.webp" alt="Open World" width={256} height={160}
                                           className="w-full h-40 object-cover rounded-t-lg"/>
                                    <div className="p-4 text-center">Join Open World</div>
                                </Card>
                                <Card isPressable className="w-64" onPress={() => router.push('/matches')}>
                                    <Image src="/logo_LoL.png" alt="Arena Match" width={256} height={160}
                                           className="w-full h-40 object-cover rounded-t-lg"/>
                                    <div className="p-4 text-center">Join Arena Match</div>
                                </Card>
                            </div>
                        </div>
                    )
            }
        </div>
    );
}
