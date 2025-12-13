"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Plus, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/admin/search-input";
import { CreateGameDialog } from "@/components/admin/create-game-dialog";
import Link from "next/link";
import { useRoleProtection } from "@/hooks/useRoleProtection";

interface Game {
  _id: string;
  name: string;
  status: "WAITING" | "LIVE" | "PAUSED" | "CLOSED";
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  createdAt: string;
}

export default function GamesPage() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "admin",
    redirectTo: "/dashboard",
  });

  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/games");
      setGames(res.data);
    } catch (error: any) {
      console.error("Error fetching games:", error);

      let errorMessage = "Failed to fetch games";

      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Please log in to view games";
        } else if (error.response.status === 500) {
          errorMessage = "Server error while fetching games";
        } else if (error.response.data?.error) {
          errorMessage = typeof error.response.data.error === 'string'
            ? error.response.data.error
            : "Error loading games data";
        }
      } else if (error.request) {
        errorMessage = "Unable to connect to server. Please check your connection.";
      }

      toast.error(errorMessage, {
        description: "Please try refreshing the page.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchGames();
    }
  }, [isAuthorized]);

  // Filter games based on search and status
  useEffect(() => {
    let result = games;

    if (search) {
      result = result.filter((game) =>
        game.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((game) => game.status === statusFilter);
    }

    setFilteredGames(result);
  }, [games, search, statusFilter]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-green-500 text-white";
      case "WAITING":
        return "bg-blue-500 text-white";
      case "PAUSED":
        return "bg-yellow-500 text-white";
      case "CLOSED":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-100";
    }
  };

  if (roleLoading || !isAuthorized || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Games</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Manage all Tambola games
          </p>
        </div>
        <CreateGameDialog onGameCreated={fetchGames} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          placeholder="Search games..."
          onSearch={handleSearch}
          className="flex-1 max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="WAITING">Waiting</SelectItem>
            <SelectItem value="LIVE">Live</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Games Grid */}
      {filteredGames.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Gamepad2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {games.length === 0
              ? "No games yet. Create your first game!"
              : "No games match your filters."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredGames.map((game) => (
              <Card key={game._id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{game.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(game.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(game.status)}>
                      {game.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-semibold">{game.soldTickets}</div>
                      <div className="text-gray-500 text-xs">Sold</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-semibold">{game.totalTickets}</div>
                      <div className="text-gray-500 text-xs">Total</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-semibold">{game.ticketPrice} XP</div>
                      <div className="text-gray-500 text-xs">XP Cost</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/admin/games/${game._id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {game.status === "WAITING" && (
                      <Link href={`/admin/games/${game._id}`}>
                        <Button className="bg-green-600 hover:bg-green-700" size="sm">
                          Start
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden lg:block bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Game Name
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Tickets
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    XP Cost
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Created
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredGames.map((game) => (
                  <tr key={game._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{game.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(game.status)}>
                        {game.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {game.soldTickets} / {game.totalTickets}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {game.ticketPrice} XP
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/games/${game._id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        {game.status === "WAITING" && (
                          <Link href={`/admin/games/${game._id}`}>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Start Game
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{games.length}</div>
          <div className="text-sm text-gray-500">Total Games</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {games.filter((g) => g.status === "LIVE").length}
          </div>
          <div className="text-sm text-gray-500">Live</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {games.filter((g) => g.status === "WAITING").length}
          </div>
          <div className="text-sm text-gray-500">Waiting</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {games.filter((g) => g.status === "CLOSED").length}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>
    </div>
  );
}
