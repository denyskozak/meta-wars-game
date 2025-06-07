"use client";
import React, {useRef, useEffect} from "react";
import gsap from "gsap";
import {useGSAP} from "@gsap/react";
import {Button} from "@heroui/react";
import {Link} from "@heroui/link";
import {useRouter} from "next/navigation";

import {title as getTitle, subtitle} from "@/components/primitives";
import {useAnimation} from "@/hooks/useAnimation";
import {siteConfig} from "@/config/site";
import {DiscordIcon} from "@/components/icons";
import {useCurrentAccount} from "@mysten/dapp-kit";
import {ConnectionButton} from "./connection-button";

// Sui JS SDK

// EXAMPLE: Connect to Sui testnet

// Replace with your actual deployed addresses!
let firstRun = true;
gsap.registerPlugin(useGSAP);

export default function General() {
    const container = useRef(null);
    const router = useRouter();
    const account = useCurrentAccount();
    const address = account?.address;

    useEffect(() => {
        if (address && firstRun) {
            firstRun = false;
            router.push('/matches')
        }
    }, [address]);
    // useLayoutEffect(() => {
    //   if (window.TextPlugin) {
    //     gsap.registerPlugin(TextPlugin);
    //     gsap.defaults({ease: "none"});
    //
    //
    //     if (textRef.current) {
    //       // gsap.to(textRef.current, {
    //       //   duration: 2,
    //       //   text: "New ",
    //       //   ease: "none",
    //       // });
    //
    //       const tl = gsap.timeline({repeat:3, repeatDelay:1, yoyo:true});
    //       tl.to(textRef.current, {duration: 2, text:"Win"})
    //           .to(textRef.current, {duration: 2, text:"Earn"})
    //           .to(textRef.current, {duration: 2, text:"Repeat"})
    //     }
    //   }
    // }, []);

    return (
        <div className="pt-24 flex justify-center flex-col" ref={container}>
            {/* HeroUI-like header */}
            <div style={{textAlign: "center"}}>
                <div className="inline-block max-w-xl text-center justify-center items-center">
                    <div>
            <span
                className={`${getTitle({color: "cyan"})} fade-in-animation`}
            >
              Magic&nbsp;
            </span>

                        <span
                            className={`${getTitle({color: "yellow"})} fade-in-animation`}
                        >
              PVP
            </span>
                        <br/>
                        <span
                            className={`${getTitle({color: "cyan"})} fade-in-animation`}
                        >
              Play&nbsp;
            </span>
                        <span
                            className={`${getTitle({color: "yellow"})} fade-in-animation`}
                        >
              to Earn
            </span>

                        {/*<br />*/}
                        {/*<span className={`${getTitle()} fade-in-animation`}>*/}
                        {/*  with&nbsp;*/}
                        {/*</span>*/}
                    </div>
                    {/*<span className={getTitle()}>Path&nbsp;</span>*/}
                    {/*<br/>*/}
                    {/*<span className={getTitle()}>*/}
                    {/*    with multi-game <span className={getTitle({color: "violet"})}>Championships</span>&nbsp;*/}
                    {/*</span>*/}
                    <div
                        className={subtitle({
                            class: "mt-4 fade-in-animation",
                            color: "foreground",
                        })}
                    >
                        Platform Agnostic MOBA
                    </div>
                    <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
                        <DiscordIcon className="text-[#FFB457]" size={36}/>
                    </Link>
                </div>
            </div>
            <section className="m-auto flex justify-center items-center flex-col gap-2  fade-in-animation">
                {/*<div>*/}
                {/*    <span className={`${getTitle()} fade-in-animation`}>Championships&nbsp;</span>*/}
                {/*</div>*/}

                {
                    address
                        ? (
                            <Button
                                className="border-2 border-black shadow-lg overflow-hidden group "
                                size="lg"
                                onPress={() => router.push("/matches")}
                            >
                                <span
                                    className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 animate-pulse opacity-100 group-hover:opacity-100 blur-md"/>
                                <span className="relative z-10">Find Match</span>
                            </Button>
                        )
                        : (
                            <ConnectionButton className="border-2 border-black" text="Connect to Play"/>
                        )
                }

            </section>
        </div>
    );
}
