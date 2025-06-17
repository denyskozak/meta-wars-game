"use client";

import Image from "next/image";
import { Card, CardHeader } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { Navbar } from "@/components/navbar";
import { ConnectionButton } from "@/components/connection-button";
import { ProfileForm } from "@/components/profile-form";
import { useProfile } from "@/hooks";

export default function MatchesPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { profile, refetch } = useProfile();

  return (
    <div className="h-full w-full  items-center justify-center">
      <Navbar />
      <div className="flex w-full h-[calc(100%-98px)] items-center justify-center">
        {account ? (
          profile ? (
            <>
              <div className="flex w-full m-32 gap-8">
                <Card
                  isPressable
                  className="w-2/4 h-[320px]"
                  onPress={() => router.push("/play/open-world")}
                >
                  <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                    <h4 className="font-bold text-large">Join Open World</h4>
                  </CardHeader>
                  <Image
                    alt="Open World"
                    className="w-full h-full object-cover rounded-t-lg"
                    height={1200}
                    src="/images/open-world.jpg"
                    width={2000}
                  />
                </Card>
                <Card
                  isPressable
                  className="w-2/4 h-[320px]"
                  onPress={() => router.push("/matches")}
                >
                  <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                    <h4 className="font-bold text-large">Join Arena Match</h4>
                  </CardHeader>
                  <Image
                    alt="Arena Match"
                    className="w-full h-full object-cover rounded-t-lg"
                    height={1200}
                    src="/images/battle.jpg"
                    width={2000}
                  />
                </Card>
              </div>
            </>
          ) : (
            <ProfileForm onCreated={refetch} />
          )
        ) : (
          <>
            <Image
              alt="Arena Match"
              className="w-full h-full absolute object-cover rounded-t-lg"
              height={1400}
              src="/images/tower_bg.png"
              width={3000}
            />
            <ConnectionButton className="m-auto" text="Connect to Play" />
          </>
        )}
      </div>
    </div>
  );
}
