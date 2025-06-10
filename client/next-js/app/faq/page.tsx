"use client";

import { Card } from "@heroui/react";

import { FAQ } from "@/components/faq";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="h-full">
      <Navbar />
      <div className="w-full h-full flex justify-center items-center p-4 overflow-y-auto">
        <Card className="w-full max-w-5xl">
          <FAQ />
        </Card>
      </div>
    </div>
  );
}
