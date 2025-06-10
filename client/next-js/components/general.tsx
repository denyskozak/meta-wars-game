"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { Link } from "@heroui/link";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { ConnectionButton } from "./connection-button";

import { title as getTitle, subtitle } from "@/components/primitives";
import { siteConfig } from "@/config/site";
import { DiscordIcon } from "@/components/icons";

// Sui JS SDK

export default function General() {
  const container = useRef(null);
  const router = useRouter();
  const account = useCurrentAccount();
  const address = account?.address;
  const slides = [
    {
      titles: ["Magic", "PvP"],
      subtitle:
        "Truly feelings classic RPG with shooter mechanic",
    },
    {
      titles: ["Play to Win", "and Earn"],
      subtitle:
        "Earn $MetaWars, loot, and gear — then trade it freely.",
    },
    {
      titles: ["Built by Players", "Not Publishers"],
      subtitle:
        "Meta Wars is a DAO-native game — shaped by those who play it.",
    },
    {
      titles: ["Top Players", "Rule the Meta"],
      subtitle:
        "The best players influence real game balance and direction.",
    },
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
    <div ref={container} className="pt-24 flex justify-center flex-col">
      {/* HeroUI-like header */}
      <div style={{ textAlign: "center" }}>
        <div className="inline-block max-w-xl text-center justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={slides[index].titles[0]}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5 }}
            >
              <span className={getTitle({ color: "cyan" })}>
                {slides[index].titles[0]}
              </span>
              <span className={getTitle({ color: "yellow" })}>
                &nbsp;-&nbsp;{slides[index].titles[1]}
              </span>

              <div
                className={subtitle({
                  class: "mt-4",
                  color: "foreground",
                })}
              >
                {slides[index].subtitle}
              </div>
            </motion.div>
          </AnimatePresence>
          <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
            <DiscordIcon className="text-[#FFB457]" size={36} />
          </Link>
        </div>
      </div>
      <section className="m-auto flex justify-center items-center flex-col gap-2  fade-in-animation">
        {/*<div>*/}
        {/*    <span className={`${getTitle()} fade-in-animation`}>Championships&nbsp;</span>*/}
        {/*</div>*/}

        {address ? (
          <Button
            className="border-2 border-black shadow-lg overflow-hidden group "
            size="lg"
            onPress={() => router.push("/matches")}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 animate-pulse opacity-100 group-hover:opacity-100 blur-md" />
            <span className="relative z-10">Find Match</span>
          </Button>
        ) : (
          <ConnectionButton
            className="border-2 border-black"
            text="Connect to Play"
          />
        )}
      </section>
    </div>
  );
}
