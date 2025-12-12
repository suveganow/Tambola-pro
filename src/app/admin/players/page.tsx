"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Ticket, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { SearchInput } from "@/components/admin/search-input";
import { Pagination } from "@/components/admin/pagination";
import { useRoleProtection } from "@/hooks/useRoleProtection";

interface Player {
  _id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  stats: {
    totalTickets: number;
    activeTickets: number;
    gamesPlayed: number;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function PlayersPage() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "admin",
    redirectTo: "/dashboard",
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/players", {
        params: {
          search,
          page: pagination.page,
          limit: pagination.limit,
        },
      });
      setPlayers(res.data.players);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch players");
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page, pagination.limit]);

  useEffect(() => {
    if (isAuthorized) {
      fetchPlayers();
    }
  }, [fetchPlayers, isAuthorized]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  if (roleLoading || !isAuthorized) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Players</h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
          Manage registered players ({pagination.total} total)
        </p>
      </div>

      {/* Search */}
      <SearchInput
        placeholder="Search by name or email..."
        onSearch={handleSearch}
        className="max-w-md"
      />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : players.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {search ? "No players match your search." : "No players registered yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {players.map((player) => (
              <Card key={player._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {player.firstName || player.lastName
                          ? `${player.firstName || ""} ${player.lastName || ""}`.trim()
                          : "Unknown User"}
                      </h3>
                      <p className="text-sm text-gray-500">{player.email}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="text-xs text-gray-400 mb-3">
                    Joined {new Date(player.createdAt).toLocaleDateString()} at {new Date(player.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-center gap-1">
                        <Gamepad2 className="h-3 w-3 text-purple-500" />
                        <span className="font-semibold">{player.stats.gamesPlayed}</span>
                      </div>
                      <div className="text-gray-500 text-xs">Games</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-center gap-1">
                        <Ticket className="h-3 w-3 text-blue-500" />
                        <span className="font-semibold">{player.stats.totalTickets}</span>
                      </div>
                      <div className="text-gray-500 text-xs">Tickets</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-center gap-1">
                        <Ticket className="h-3 w-3 text-green-500" />
                        <span className="font-semibold">{player.stats.activeTickets}</span>
                      </div>
                      <div className="text-gray-500 text-xs">Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden lg:block bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Games Played</TableHead>
                  <TableHead>Total Tickets</TableHead>
                  <TableHead>Active Tickets</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player._id}>
                    <TableCell className="font-medium">
                      {player.firstName || player.lastName
                        ? `${player.firstName || ""} ${player.lastName || ""}`.trim()
                        : "Unknown User"}
                    </TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Gamepad2 className="h-4 w-4 text-purple-500" />
                        {player.stats.gamesPlayed}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Ticket className="h-4 w-4 text-blue-500" />
                        {player.stats.totalTickets}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Ticket className="h-4 w-4 text-green-500" />
                        {player.stats.activeTickets}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{new Date(player.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{new Date(player.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <Pagination
            page={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
