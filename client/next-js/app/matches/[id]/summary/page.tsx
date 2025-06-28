"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@heroui/react";
import { useParams, useRouter } from "next/navigation";

import { useWS } from "@/hooks/useWS";
import { Navbar } from "@/components/navbar";

interface PlayerSummary {
  id: number;
  kills: number;
  deaths: number;
  reward: string;
  coins: number;
  item?: { class: string; skin: string } | null;
  rankDelta: number;
}

export default function MatchSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const { socket, sendToSocket } = useWS(params?.id);
  const [summary, setSummary] = useState<PlayerSummary[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "MATCH_SUMMARY":
          setSummary(message.summary);
          break;
      }
    };

    socket.addEventListener("message", handleMessage);

    sendToSocket({ type: "GET_MATCH_SUMMARY", matchId: params?.id });

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, []);

  const back = () => router.push("/matches");

  return (
    <div className="h-full">
      <Navbar />
      <div className="flex justify-center items-center">
        <div className="max-w-[640px] min-w-[480px] flex gap-8 flex-col">
          <Table aria-label="Match summary">
            <TableHeader>
              <TableColumn>Player</TableColumn>
              <TableColumn>Kills</TableColumn>
              <TableColumn>Deaths</TableColumn>
              <TableColumn>Reward</TableColumn>
              <TableColumn>Coins</TableColumn>
              <TableColumn>Item</TableColumn>
              <TableColumn>Rank +/-</TableColumn>
            </TableHeader>
            <TableBody>
              {summary.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{`Player ${p.id}`}</TableCell>
                  <TableCell>{p.kills}</TableCell>
                  <TableCell>{p.deaths}</TableCell>
                  <TableCell>{p.reward}</TableCell>
                  <TableCell>{p.coins}</TableCell>
                  <TableCell>
                    {p.item ? `${p.item.skin} ${p.item.class}` : "-"}
                  </TableCell>
                  <TableCell>{p.rankDelta}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button color="primary" onPress={back}>
            Back to matches
          </Button>
        </div>
      </div>
    </div>
  );
}
