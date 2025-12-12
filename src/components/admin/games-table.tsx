"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Play, Pause, StopCircle, Eye } from "lucide-react";
import Link from "next/link";

interface Game {
  _id: string;
  name: string;
  totalTickets: number;
  soldTickets: number;
  status: "WAITING" | "LIVE" | "PAUSED" | "CLOSED";
  createdBy: string;
}

interface GamesTableProps {
  data: Game[];
}

export function GamesTable({ data }: GamesTableProps) {
  return (
    <div className="rounded-md border bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Game Name</TableHead>
            <TableHead className="min-w-[100px]">Tickets</TableHead>
            <TableHead className="min-w-[80px]">Status</TableHead>
            <TableHead className="hidden md:table-cell min-w-[120px]">Created By</TableHead>
            <TableHead className="text-right min-w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No games found
              </TableCell>
            </TableRow>
          ) : (
            data.map((game) => (
              <TableRow key={game._id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <TableCell className="font-medium">{game.name}</TableCell>
                <TableCell>
                  {game.soldTickets} / {game.totalTickets}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      game.status === "LIVE"
                        ? "default"
                        : game.status === "WAITING"
                          ? "secondary"
                          : "outline"
                    }
                    className={
                      game.status === "LIVE"
                        ? "bg-green-500"
                        : game.status === "WAITING"
                          ? "bg-blue-500 text-white"
                          : game.status === "PAUSED"
                            ? "bg-yellow-500"
                            : ""
                    }
                  >
                    {game.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-gray-500 text-sm truncate max-w-[120px]">
                  {game.createdBy}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/games/${game._id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {game.status === "WAITING" && (
                      <Link href={`/admin/games/${game._id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600">
                          <Play className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {game.status === "LIVE" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600">
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {game.status !== "CLOSED" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                        <StopCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
