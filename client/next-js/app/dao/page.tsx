"use client";

import { Card, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button } from "@heroui/react";
import { Navbar } from "@/components/navbar";
import { title } from "@/components/primitives";
import { useDao } from "@/hooks/useDao";

export default function DaoPage() {
  const { proposals, hasTicket, vote } = useDao();

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
              {hasTicket && <TableColumn>Vote</TableColumn>}
            </TableHeader>
            <TableBody>
              {proposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.description}</TableCell>
                  <TableCell>{p.yes}</TableCell>
                  <TableCell>{p.no}</TableCell>
                  {hasTicket && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onPress={() => vote(p.id, true)}>Yes</Button>
                        <Button size="sm" onPress={() => vote(p.id, false)}>No</Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
