"use client";

import {
  Card,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  addToast,
} from "@heroui/react";

import { ButtonWithSound as Button } from "@/components/button-with-sound";
import { Navbar } from "@/components/navbar";
import { title } from "@/components/primitives";
import { useDao } from "@/hooks/useDao";

export default function DaoPage() {
  const { proposals, hasTicket, vote } = useDao();

  const voteHandler = (id: string, value: boolean) => {
    if (hasTicket) {
      addToast({
        title: "For voting join Meta-Wars organization.",
      });

      return;
    }

    return vote(id, value);
  };

  return (
    <div className="h-full">
      <Navbar />
      <div className="w-full h-full flex justify-center items-start p-4 overflow-y-auto">
        <Card className="w-full max-w-3xl p-6 space-y-6">
          <h1 className={title()}>DAO Proposals</h1>
          <Table aria-label="DAO proposals table">
            <TableHeader>
              <TableColumn>Description</TableColumn>
              <TableColumn>Yes</TableColumn>
              <TableColumn>No</TableColumn>
              <TableColumn>Vote</TableColumn>
            </TableHeader>
            <TableBody>
              {proposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.description}</TableCell>
                  <TableCell>{p.yes}</TableCell>
                  <TableCell>{p.no}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onPress={() => voteHandler(p.id, true)}>
                        Yes
                      </Button>
                      <Button
                        size="sm"
                        onPress={() => voteHandler(p.id, false)}
                      >
                        No
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
