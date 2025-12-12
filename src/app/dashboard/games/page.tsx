"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TicketGrid } from "@/components/ticket/ticket-grid";
import { Clock, CheckCircle, XCircle, Loader2, ArrowLeft, Lock, Pause, Play, Trophy } from "lucide-react";
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
    ruleType?: string;
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

export default function MyTicketsPage() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "user",
    redirectTo: "/admin/dashboard",
  });

  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // API now returns game data embedded with tickets
        const res = await axios.get("/api/tickets?includeGameData=true");
        setTickets(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch tickets");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthorized) {
      fetchTickets();
    }
  }, [isAuthorized]);

  const handleJoinGame = (ticket: Ticket) => {
    const gameStatus = ticket.game?.status;

    if (gameStatus === "CLOSED") {
      toast.error("This game has ended. You can no longer join.");
      return;
    }

    if (gameStatus === "PAUSED") {
      toast.warning("This game is currently paused. Please wait for it to resume.");
      return;
    }

    if (gameStatus === "WAITING") {
      toast.info("This game hasn't started yet. Please wait for the admin to start the game.");
      return;
    }

    router.push(`/dashboard/play/${ticket.gameId}`);
  };

  // Get button content based on game status
  const getJoinButtonContent = (ticket: Ticket) => {
    const gameStatus = ticket.game?.status;

    switch (gameStatus) {
      case "CLOSED":
        return { text: "Game Ended", icon: <Lock className="w-4 h-4 mr-2" />, className: "bg-gray-400 cursor-not-allowed", disabled: true };
      case "PAUSED":
        return { text: "Game Paused", icon: <Pause className="w-4 h-4 mr-2" />, className: "bg-yellow-500 cursor-not-allowed", disabled: true };
      case "WAITING":
        return { text: "Waiting to Start", icon: <Clock className="w-4 h-4 mr-2" />, className: "bg-blue-500 cursor-not-allowed", disabled: true };
      case "LIVE":
        return { text: "Join Live Game", icon: <Play className="w-4 h-4 mr-2" />, className: "bg-green-600 hover:bg-green-700", disabled: false };
      default:
        return { text: "Join Game", icon: <Play className="w-4 h-4 mr-2" />, className: "bg-purple-600 hover:bg-purple-700", disabled: false };
    }
  };

  // Check if this ticket won any prize
  const getWinningInfo = (ticket: Ticket) => {
    if (!ticket.game?.prizes) return null;

    const wonPrize = ticket.game.prizes.find(
      (prize) => prize.status === "WON" && prize.winner === ticket.userId
    );

    if (wonPrize) {
      return {
        pattern: wonPrize.ruleType || wonPrize.name,
        prizeAmount: wonPrize.amount,
      };
    }
    return null;
  };

  // Get game status badge
  const getGameStatusBadge = (ticket: Ticket) => {
    const status = ticket.game?.status;
    switch (status) {
      case "LIVE":
        return <Badge className="bg-green-500 animate-pulse"><Play className="w-3 h-3 mr-1" /> LIVE</Badge>;
      case "CLOSED":
        return <Badge className="bg-gray-500"><Lock className="w-3 h-3 mr-1" /> CLOSED</Badge>;
      case "PAUSED":
        return <Badge className="bg-yellow-500"><Pause className="w-3 h-3 mr-1" /> PAUSED</Badge>;
      case "WAITING":
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> WAITING</Badge>;
      default:
        return null;
    }
  };

  if (roleLoading || !isAuthorized || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Tickets Found</h2>
          <p className="text-gray-500 mb-6">You haven't purchased any tickets yet. Browse available games and book your first ticket!</p>
          <Button onClick={() => router.push("/dashboard")} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="w-4 h-4 mr-2" /> Browse Games
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Tickets</h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">View and manage your booked tickets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {tickets.map((ticket) => {
          const buttonContent = getJoinButtonContent(ticket);
          const gameStatus = ticket.game?.status;
          const isGameClosed = gameStatus === "CLOSED";
          const winningInfo = getWinningInfo(ticket);
          const drawnNumbers = ticket.game?.drawnNumbers || [];

          return (
            <Card key={ticket._id} className={`overflow-hidden ${isGameClosed ? 'opacity-90' : ''} ${winningInfo ? 'ring-2 ring-yellow-400 shadow-lg' : ''}`}>
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
                    {getGameStatusBadge(ticket)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Status messages */}
                {ticket.status === "PENDING" && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center text-yellow-800 text-sm">
                    <Clock className="w-4 h-4 mr-2" /> Waiting for admin confirmation
                  </div>
                )}
                {ticket.status === "REJECTED" && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-800 text-sm">
                    <XCircle className="w-4 h-4 mr-2" /> Booking rejected. Amount refunded.
                  </div>
                )}
                {ticket.status === "ACTIVE" && winningInfo && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-lg flex items-center text-yellow-800 text-sm">
                    <Trophy className="w-4 h-4 mr-2" />
                    🎉 Congratulations! You won <strong className="mx-1">{winningInfo.pattern.replace(/_/g, " ")}</strong> - ₹{winningInfo.prizeAmount?.toLocaleString()}
                  </div>
                )}
                {ticket.status === "ACTIVE" && !winningInfo && gameStatus === "LIVE" && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-800 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" /> Game is live - Join now!
                  </div>
                )}
                {ticket.status === "ACTIVE" && !winningInfo && gameStatus === "WAITING" && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center text-blue-800 text-sm">
                    <Clock className="w-4 h-4 mr-2" /> Waiting for game to start.
                  </div>
                )}
                {ticket.status === "ACTIVE" && !winningInfo && gameStatus === "PAUSED" && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center text-yellow-800 text-sm">
                    <Pause className="w-4 h-4 mr-2" /> Game is paused.
                  </div>
                )}
                {ticket.status === "ACTIVE" && !winningInfo && gameStatus === "CLOSED" && (
                  <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded-lg flex items-center text-gray-700 text-sm">
                    <Lock className="w-4 h-4 mr-2" /> This game has ended.
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
                    {drawnNumbers.length} numbers called
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

                {/* Action button */}
                {ticket.status === "ACTIVE" && (
                  <Button
                    onClick={() => handleJoinGame(ticket)}
                    disabled={buttonContent.disabled}
                    className={`w-full mt-4 ${buttonContent.className}`}
                  >
                    {buttonContent.icon}
                    {buttonContent.text}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
