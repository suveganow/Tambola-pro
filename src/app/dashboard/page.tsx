"use client";

import { useUser } from "@clerk/nextjs";
import { StatCard } from "@/components/dashboard/stat-card";
import { GameCard } from "@/components/dashboard/game-card";
import { Trophy, Gamepad2, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { BookingDialog } from "@/components/dashboard/booking-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useRoleProtection } from "@/hooks/useRoleProtection";

export default function DashboardPage() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "user",
    redirectTo: "/admin/dashboard",
  });

  const { user } = useUser();
  const router = useRouter();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (isAuthorized) {
      fetchGames();
    }
  }, [isAuthorized]);

  const handleBookTicket = (gameId: string) => {
    const game = games.find((g: any) => g._id === gameId);
    if (game) {
      setSelectedGame(game);
      setBookingDialogOpen(true);
    }
  };

  const handleConfirmBooking = () => {
    // Refresh games to update sold tickets count
    fetchGames();
  };

  if (roleLoading || !isAuthorized) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Available Games Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Available Games</h2>
        <button
          onClick={() => router.push("/dashboard/browse")}
          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
        >
          View All Games →
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game: any) => (
            <GameCard
              key={game._id}
              id={game._id}
              name={game.name}
              status={game.status}
              ticketPrice={game.ticketPrice}
              totalTickets={game.totalTickets}
              soldTickets={game.soldTickets}
              startTime={new Date(game.createdAt).toLocaleDateString()}
              onBook={handleBookTicket}
            />
          ))}
        </div>
      )}

      {selectedGame && (
        <BookingDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          gameId={selectedGame._id}
          gameName={selectedGame.name}
          ticketPrice={selectedGame.ticketPrice}
          onConfirm={handleConfirmBooking}
        />
      )}
    </div>
  );
}
