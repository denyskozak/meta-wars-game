"use client";

import Image from "next/image";
import {
  Card,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { Navbar } from "@/components/navbar";
import { ConnectionButton } from "@/components/connection-button";
import { ProfileForm } from "@/components/profile-form";
import { useProfile } from "@/hooks";
import { useRatings } from "@/hooks/useRatings";
import { useRankTable } from "@/hooks/useRankTable";

export default function MatchesPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { profile, refetch } = useProfile();
  const { ratings } = useRatings();
  const { table: rankTable } = useRankTable();

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
              <Card className="w-full max-w-xl mx-32 mt-4 p-4 space-y-2">
                <h4 className="font-bold text-large">Leaderboard</h4>
                <Table aria-label="rankings">
                  <TableHeader>
                    <TableColumn>Rank</TableColumn>
                    <TableColumn>Address</TableColumn>
                    <TableColumn>Points</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {ratings.map((r, idx) => (
                      <TableRow key={r.address}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{r.address}</TableCell>
                        <TableCell>{r.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              <Card className="w-full max-w-xl mx-32 mt-4 p-4 space-y-2">
                <h4 className="font-bold text-large">Rank Points</h4>
                <Table aria-label="rank-points">
                  <TableHeader>
                    <TableColumn>Place</TableColumn>
                    <TableColumn>Points</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {rankTable.map((r) => (
                      <TableRow key={r.position}>
                        <TableCell>{r.position}</TableCell>
                        <TableCell>{r.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
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
