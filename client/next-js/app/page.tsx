"use client";

import Image from "next/image";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

import General from "@/components/general";
import { Navbar } from "@/components/navbar";
import MagicCanvas from "@/components/magic-canvas";

export default function Home() {
  const logoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!logoRef.current) return;
    const tl = gsap.timeline({ repeat: -1, yoyo: true });

    tl.to(logoRef.current, { y: -20, duration: 2, ease: "sine.inOut" });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="h-full">
      <Navbar />

      <div className="relative justify-center align-middle items-center flex flex-col w-full h-[calc(100%-98px)]">
        <MagicCanvas />
        <div ref={logoRef} className="flex justify-center">
          <Image
            alt="Big Logo"
            className="mt-[86] object-cover z-[2]"
            height={200}
            src="/big-logo.webp"
            width={400}
          />
        </div>

        <Image
          alt="Turtle Art"
          className="absolute top-0 left-0 w-full h-full object-cover z-[0]"
          height={1000}
          src="/background.webp"
          width={2000}
        />

        <main className="z-[2] flex justify-center w-full h-full overflow-y-auto">
          <General />
        </main>
      </div>

      {/*<Card className="max-w-100">*/}
      {/*    <FAQ/>*/}
      {/*</Card>*/}

      {/*<div className="flex gap-3">*/}
      {/*    <Link*/}
      {/*        isExternal*/}
      {/*        className={buttonStyles({*/}
      {/*            color: "primary",*/}
      {/*            radius: "full",*/}
      {/*            variant: "shadow",*/}
      {/*        })}*/}
      {/*        href={siteConfig.links.docs}*/}
      {/*    >*/}
      {/*        Documentation*/}
      {/*    </Link>*/}
      {/*    <Link*/}
      {/*        isExternal*/}
      {/*        className={buttonStyles({variant: "bordered", radius: "full"})}*/}
      {/*        href={siteConfig.links.github}*/}
      {/*    >*/}
      {/*        <GithubIcon size={20}/>*/}
      {/*        GitHub*/}
      {/*    </Link>*/}
      {/*</div>*/}

      {/*  <div className="mt-8">*/}
      {/*      <Snippet hideCopyButton hideSymbol variant="bordered">*/}
      {/*<span>*/}
      {/*  Get started by editing <Code color="primary">app/page.tsx</Code>*/}
      {/*</span>*/}
      {/*      </Snippet>*/}
      {/*  </div>*/}
      {/*<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[2] flex flex-col items-center">*/}
      {/*  <span className="text-medium">Made on</span>*/}
      {/*  <Image*/}
      {/*    alt="Sui logo"*/}
      {/*    height={200}*/}
      {/*    src="/Sui_Logo_White.svg"*/}
      {/*    width={120}*/}
      {/*  />*/}
      {/*</div>*/}
    </div>
  );
}
