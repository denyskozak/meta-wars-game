"use client";

import Image from "next/image";
import React from "react";

import General from "@/components/general";
import {Navbar} from "@/components/navbar";

export default function Home() {
  return (
    <div className="h-full">
        <Navbar />
        <div className="relative justify-center flex flex-col w-full h-[calc(100%-98px)]">

            <Image
                className="absolute w-full h-full object-cover z-[0]"
                alt="Turtle Art"
                width={600}
                height={300}
                src="/big-logo.webp"
            />

            <main className="z-[1] flex justify-center w-full h-full overflow-y-auto">
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
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[2] flex flex-col items-center">
        <span className="text-medium">Made on</span>
        <Image
          alt="Sui logo"
          height={200}
          src="/Sui_Logo_White.svg"
          width={120}
        />
      </div>
    </div>
  );
}
