"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Ticket, Clock, Play, Eye } from "lucide-react";
import { toast } from "sonner";
import { BookingDialog } from "@/components/dashboard/booking-dialog";
import { AllTicketsModal } from "@/components/dashboard/all-tickets-modal";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { useUser } from "@clerk/nextjs";

interface Game {
  _id: string;
  name: string;
  ticketPrice: number; // Legacy support
  ticketXpCost?: number; // New field
  totalTickets: number;
  soldTickets: number;
  status: "WAITING" | "LIVE" | "PAUSED" | "CLOSED";
  createdAt: string;
}

export default function AllGamesPage() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "user",
    redirectTo: "/admin/dashboard",
  });

  const router = useRouter();
  const { user } = useUser();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [allTicketsModalOpen, setAllTicketsModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      fetchGames();
    }
  }, [isAuthorized]);

  const fetchGames = async () => {
    try {
      const res = await axios.get("/api/games");
      setGames(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch games");
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (game: Game) => {
    setSelectedGame(game);
    setBookingDialogOpen(true);
  };

  const handleBookingConfirm = () => {
    setBookingDialogOpen(false);
    setAllTicketsModalOpen(false);
    setSelectedGame(null);
    fetchGames();
  };

  const handleSeeAllTickets = (game: Game) => {
    setSelectedGame(game);
    setAllTicketsModalOpen(true);
  };

  const liveGames = games.filter(g => g.status === "LIVE");
  const upcomingGames = games.filter(g => g.status === "WAITING");
  const playedGames = games.filter(g => g.status === "CLOSED");

  const GameCard = ({ game }: { game: Game }) => {
    const isGameClosed = game.status === "CLOSED";
    const isGamePaused = game.status === "PAUSED";
    const availableTickets = game.totalTickets - game.soldTickets;
    const isSoldOut = availableTickets === 0;

    return (
      <Card className={`hover:shadow-lg transition-shadow ${isGameClosed ? 'opacity-75' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">{game.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(game.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge
              className={
                game.status === "LIVE"
                  ? "bg-green-500 animate-pulse"
                  : game.status === "WAITING"
                    ? "bg-blue-500"
                    : game.status === "PAUSED"
                      ? "bg-yellow-500"
                      : "bg-gray-500"
              }
            >
              {game.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-600" />
                <span className="text-gray-600">
                  {game.soldTickets}/{game.totalTickets} Sold
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-600">
                  {typeof game.ticketXpCost === 'number' ? `${game.ticketXpCost} XP` : `₹${game.ticketPrice}`}
                </span>
                <span className="text-gray-600">per ticket</span>
              </div>
            </div>

            {/* Status messages for unavailable games */}
            {isGameClosed && (
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg text-xs text-gray-600">
                <span>🔒 This game has ended</span>
              </div>
            )}
            {isGamePaused && (
              <div className="flex items-center gap-2 p-2 bg-yellow-100 rounded-lg text-xs text-yellow-700">
                <span>⏸️ Game is paused</span>
              </div>
            )}

            <div className="pt-2 border-t space-y-2">
              {/* See All Tickets Button - Always visible for WAITING games */}
              {game.status === "WAITING" && (
                <Button
                  variant="outline"
                  onClick={() => handleSeeAllTickets(game)}
                  className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  See All Tickets
                </Button>
              )}

              {game.status === "LIVE" ? (
                <Button
                  onClick={() => router.push(`/dashboard/play/${game._id}`)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Join Live Game
                </Button>
              ) : game.status === "WAITING" ? (
                <Button
                  onClick={() => handleBookClick(game)}
                  disabled={isSoldOut}
                  className={`w-full ${isSoldOut ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  {isSoldOut ? "Sold Out" : "Quick Book"}
                </Button>
              ) : game.status === "PAUSED" ? (
                <Button disabled className="w-full bg-yellow-500 cursor-not-allowed" variant="secondary">
                  Game Paused
                </Button>
              ) : (
                <Button disabled className="w-full" variant="outline">
                  Game Closed
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (roleLoading || !isAuthorized || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Games</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">Browse and join available Tambola games</p>
        </div>
        <Button
          onClick={() => router.push("/dashboard")}
          variant="outline"
          className="border-purple-600 text-purple-600 hover:bg-purple-50 w-full sm:w-auto"
        >
          View Stats
        </Button>
      </div>

      {/* Live Games */}
      {liveGames.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Live Games</h2>
            <Badge className="bg-green-500">{liveGames.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {liveGames.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Upcoming Games</h2>
            <Badge className="bg-blue-500">{upcomingGames.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {upcomingGames.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Played Games */}
      {playedGames.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Played Games</h2>
            <Badge variant="outline">{playedGames.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {playedGames.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        </div>
      )}

      {games.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <p className="text-gray-500">No games available at the moment.</p>
        </div>
      )}

      {/* Booking Dialog */}
      {selectedGame && (
        <BookingDialog
          open={bookingDialogOpen}
          onOpenChange={(open) => {
            setBookingDialogOpen(open);
            if (!open) setSelectedGame(null);
          }}
          gameId={selectedGame._id}
          gameName={selectedGame.name}
          ticketPrice={selectedGame.ticketXpCost ?? selectedGame.ticketPrice ?? 0}
          onConfirm={handleBookingConfirm}
        />
      )}

      {/* All Tickets Modal */}
      {selectedGame && (
        <AllTicketsModal
          open={allTicketsModalOpen}
          onOpenChange={(open) => {
            setAllTicketsModalOpen(open);
            if (!open) setSelectedGame(null);
          }}
          gameId={selectedGame._id}
          gameName={selectedGame.name}
          ticketPrice={selectedGame.ticketXpCost ?? selectedGame.ticketPrice ?? 0}
          currentUserId={user?.id}
          onBookingComplete={handleBookingConfirm}
        />
      )}
    </div>
  );
}

