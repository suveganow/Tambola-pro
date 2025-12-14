"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TicketGrid } from "@/components/ticket/ticket-grid";
import { Clock, CheckCircle, XCircle, Loader2, ArrowLeft, Lock, Pause, Play, Trophy, History } from "lucide-react";
import { toast } from "sonner";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { GameRulesDisplay } from "@/components/game/game-rules-display";

interface Game {
  _id: string;
  name: string;
  status: "WAITING" | "LIVE" | "PAUSED" | "CLOSED";
  drawnNumbers: number[];
  prizes?: Array<{
    name: string;
    amount: number;
    status: string;
    winner?: string;
    winnerTicketId?: string;
    ruleType?: string;
    position?: number;
  }>;
  winningRules?: Array<{
    type: string;
    maxWinners: number;
    currentWinners?: number;
    isCompleted?: boolean;
    prizes?: Array<{
      name: string;
      amount: number;
      position?: number;
      status?: string;
    }>;
  }>;
}

interface Ticket {
  _id: string;
  gameId: string;
  userId: string;
  ticketNumber?: number;
  numbers: (number | null)[][];
  status: "PENDING" | "ACTIVE" | "REJECTED";
  createdAt: string;
  game?: Game;
}

export default function HistoryPage() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "user",
    redirectTo: "/admin/dashboard",
  });

  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Fetch tickets with game data included
        const res = await axios.get("/api/tickets?includeGameData=true");
        // Filter to only show tickets from closed games (history)
        const allTickets: Ticket[] = res.data;
        const historyTickets = allTickets.filter(
          (ticket) => ticket.game?.status === "CLOSED"
        );
        setTickets(historyTickets);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthorized) {
      fetchHistory();
    }
  }, [isAuthorized]);

  // Check if this ticket won any prize
  const getWinningInfo = (ticket: Ticket) => {
    if (!ticket.game?.prizes) return null;

    const wonPrize = ticket.game.prizes.find(
      (prize) => prize.status === "WON" && prize.winnerTicketId === ticket._id
    );

    if (wonPrize) {
      return {
        pattern: wonPrize.ruleType || wonPrize.name,
        prizeAmount: wonPrize.amount,
        position: wonPrize.position
      };
    }
    return null;
  };

  if (roleLoading || !isAuthorized) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Calculate stats
  const totalGamesPlayed = new Set(tickets.map(t => t.gameId)).size;
  const totalWins = tickets.filter(t => getWinningInfo(t) !== null).length;
  const totalPrizeWon = tickets.reduce((sum, t) => {
    const info = getWinningInfo(t);
    return sum + (info?.prizeAmount || 0);
  }, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-7 h-7 text-purple-600" />
            Game History
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">Your past games and tickets.</p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/browse")}
          variant="outline"
          className="border-purple-600 text-purple-600 hover:bg-purple-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Browse Games
        </Button>
      </div>

      {/* Stats Summary */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
            <div className="text-2xl sm:text-3xl font-bold text-purple-700">{totalGamesPlayed}</div>
            <div className="text-xs sm:text-sm text-purple-600">Games Played</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-100">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-700">{totalWins}</div>
            <div className="text-xs sm:text-sm text-yellow-600">Wins</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700">₹{totalPrizeWon.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-emerald-600">Prize Won</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No game history found.</p>
          <p className="text-sm text-gray-400">Your completed games will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {tickets.map((ticket) => {
            const winningInfo = getWinningInfo(ticket);
            const drawnNumbers = ticket.game?.drawnNumbers || [];

            return (
              <Card key={ticket._id} className={`overflow-hidden ${winningInfo ? 'ring-2 ring-yellow-400 shadow-lg' : ''}`}>
                <CardHeader className={`border-b pb-3 ${winningInfo ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-purple-900 flex items-center gap-2">
                        {ticket.game?.name || `Game ID: ${ticket.gameId.slice(-6)}`}
                        {winningInfo && <Trophy className="w-5 h-5 text-yellow-500" />}
                      </CardTitle>
                      <div className="text-sm text-gray-500 mt-1">
                        Ticket #{ticket.ticketNumber || ticket._id.slice(-6)} • {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge className={ticket.status === "ACTIVE" ? "bg-green-500" : ticket.status === "PENDING" ? "bg-yellow-500" : "bg-red-500"}>
                        {ticket.status}
                      </Badge>
                      <Badge className="bg-gray-500">
                        <Lock className="w-3 h-3 mr-1" /> ENDED
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Winning message */}
                  {winningInfo && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-lg flex flex-col gap-1 text-yellow-800 text-sm">
                      <div className="flex items-center font-bold">
                        <Trophy className="w-4 h-4 mr-2" />
                        🎉 You won <strong className="mx-1">{winningInfo.pattern.replace(/_/g, " ")}</strong>
                        {winningInfo.position && <Badge variant="secondary" className="ml-2 bg-yellow-200 text-yellow-900 border-yellow-300">#{winningInfo.position}</Badge>}
                      </div>
                      <div className="ml-6 text-yellow-700">
                        Prize: ₹{winningInfo.prizeAmount?.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* No win message for completed games */}
                  {!winningInfo && (
                    <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded-lg flex items-center text-gray-600 text-sm">
                      <History className="w-4 h-4 mr-2" />
                      Game completed. Better luck next time!
                    </div>
                  )}

                  {/* Ticket Grid with crossed numbers */}
                  <TicketGrid
                    numbers={ticket.numbers}
                    calledNumbers={drawnNumbers}
                    winningInfo={winningInfo || undefined}
                    ticketNumber={ticket.ticketNumber}
                  />

                  {/* Numbers called info */}
                  {drawnNumbers.length > 0 && (
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      {drawnNumbers.length} numbers were called
                    </div>
                  )}

                  {/* Game Rules */}
                  {ticket.game?.winningRules && ticket.game.winningRules.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="text-xs font-medium text-gray-500 mb-2">Game Prizes:</div>
                      <GameRulesDisplay
                        winningRules={ticket.game.winningRules}
                        compact
                        showPrizes={false}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
