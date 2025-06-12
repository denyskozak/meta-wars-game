"use client";

import {
  Card,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";

import { Navbar } from "@/components/navbar";
import { title } from "@/components/primitives";
import { useRatings } from "@/hooks/useRatings";

export default function RatingPage() {
  const { ratings } = useRatings();

  return (
    <div className="h-full">
      <Navbar />
      <div className="w-full h-full flex justify-center items-start p-4 overflow-y-auto">
        <Card className="w-full max-w-3xl p-6 space-y-6">
          <h1 className={title()}>Top NFT Ratings</h1>
          <Table aria-label="NFT rating table">
            <TableHeader>
              <TableColumn>Rank</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Points</TableColumn>
            </TableHeader>
            <TableBody>
              {ratings.map((r, idx) => (
                <TableRow key={r.name}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
