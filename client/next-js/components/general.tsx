"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { ButtonWithSound as Button } from "@/components/button-with-sound";
import { title as getTitle, subtitle } from "@/components/primitives";

// Sui JS SDK

export default function General() {
  const container = useRef(null);
  const router = useRouter();

  const slides = [
    {
      titles: ["Win Battles", "Earn Real Rewards"],
      subtitle: "Claim $MetaWars tokens, loot, and rare gear — fully tradable.",
    },
    {
      titles: ["Fantastic Online Game", "Based on Sui Blockchain"],
      subtitle: "Innovative technology which opens new world of opportunities",
    },
    {
      titles: ["Crafted RPG MMO", "by Blizzard and Riot fans"],
      subtitle: "Spell-slinging PvP with the thrill of FPS combat.",
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
    <div ref={container} className=" flex items-center flex-col">
      {/* HeroUI-like header */}
      <div style={{ textAlign: "center" }}>
        <div className="inline-block max-w-xl text-center justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={slides[index].titles[0]}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg"
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
        </div>
      </div>
      <section className="mt-12 flex justify-center items-center flex-col gap-2  fade-in-animation">
        {/*<div>*/}
        {/*    <span className={`${getTitle()} fade-in-animation`}>Championships&nbsp;</span>*/}
        {/*</div>*/}

        <Button
          className="absolute bottom-[10vh] border-2 w-[188] h-[48] border-black shadow-lg overflow-hidden group hover:-translate-y-1 hover:shadow-xl "
          size="lg"
          onPress={() => router.push("/play")}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 animate-pulse opacity-100 group-hover:opacity-100 blur-md " />
          <span className="relative z-10">Launch Game</span>
        </Button>
      </section>
    </div>
  );
}
