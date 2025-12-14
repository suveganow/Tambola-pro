"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { connectSocket, getSocket, joinGame } from "@/lib/socket";
import { TicketGrid } from "@/components/ticket/ticket-grid";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Trophy, Users, ArrowLeft, Eye, EyeOff, Crown } from "lucide-react";
import { useVoice } from "@/hooks/use-voice";
import {
  checkEarlyFive,
  checkTopLine,
  checkMiddleLine,
  checkBottomLine,
  checkFullHouse
} from "@/lib/winner-logic";
import Confetti from "react-confetti";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWindowSize } from "react-use";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { WinnerPullAnimation } from "@/components/game/winner-pull-animation";
import { useUser } from "@clerk/nextjs";

interface Winner {
  winnerName: string;
  winnerId: string;
  ticketNumber: number;
  prizeName: string;
  prizeAmount: number;
  ruleType: string;
}

interface AllTicket {
  ticketNumber: number;
  status: string;
  isBooked: boolean;
  userId: string | null;
  numbers: (number | null)[][] | null;
}

export default function UserGameRoom() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "user",
    redirectTo: "/admin/dashboard",
  });

  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const gameId = params.gameId as string;

  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [lastCalledNumber, setLastCalledNumber] = useState<number | null>(null);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<AllTicket[]>([]);
  const [gameName, setGameName] = useState("");
  const [gameStatus, setGameStatus] = useState<string>("LIVE");
  const [loading, setLoading] = useState(true);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false);

  const { speakNumber } = useVoice();
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  // Fetch data
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchData = async () => {
      try {
        // Fetch my tickets
        const ticketsRes = await axios.get(`/api/tickets?gameId=${gameId}`);
        setMyTickets(ticketsRes.data);

        // Fetch all tickets for transparency
        const allTicketsRes = await axios.get(`/api/games/${gameId}/tickets`);
        setAllTickets(allTicketsRes.data.tickets);
        setGameName(allTicketsRes.data.gameName);
        setGameStatus(allTicketsRes.data.gameStatus);

        // Fetch game details for called numbers
        const gameRes = await axios.get(`/api/games/${gameId}`);
        setCalledNumbers(gameRes.data.drawnNumbers || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch game data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Socket connection
    const socket = connectSocket();

    // Handle existing connection
    if (socket.connected) {
      joinGame(gameId);
    }

    socket.on("connect", () => {
      console.log("Connected to socket, joining game...");
      joinGame(gameId);
    });

    socket.on("number-called", (data: { number: number; drawnNumbers?: number[] }) => {
      const number = typeof data === "number" ? data : data.number;
      setLastCalledNumber(number);
      if (data.drawnNumbers) {
        setCalledNumbers(data.drawnNumbers);
      } else {
        setCalledNumbers((prev) => [...prev, number]);
      }
      speakNumber(number);
    });

    socket.on("winner-detected", (winner: Winner) => {
      setWinners(prev => [...prev, winner]);
      setCurrentWinner(winner);
      setShowWinnerAnimation(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 8000);
    });

    socket.on("game-status-changed", (data: { status: string }) => {
      setGameStatus(data.status);
    });

    socket.on("game-closed", () => {
      setGameStatus("CLOSED");
      toast.info("Game has ended!");
    });

    return () => {
      socket.off("connect"); // Clean up connect listener
      socket.off("number-called");
      socket.off("winner-detected");
      socket.off("game-status-changed");
      socket.off("game-closed");
    };
  }, [gameId, speakNumber, isAuthorized]);

  // Sort tickets: winners first, then my tickets, then others
  const sortedAllTickets = useMemo(() => {
    const winnerTicketNumbers = winners.map(w => w.ticketNumber);

    return [...allTickets].sort((a, b) => {
      const aIsWinner = winnerTicketNumbers.includes(a.ticketNumber);
      const bIsWinner = winnerTicketNumbers.includes(b.ticketNumber);
      const aIsMine = a.userId === user?.id;
      const bIsMine = b.userId === user?.id;

      if (aIsWinner && !bIsWinner) return -1;
      if (!aIsWinner && bIsWinner) return 1;
      if (aIsMine && !bIsMine) return -1;
      if (!aIsMine && bIsMine) return 1;
      return a.ticketNumber - b.ticketNumber;
    });
  }, [allTickets, winners, user?.id]);

  const claimWin = (pattern: string, ticketId: string) => {
    const socket = getSocket();
    socket.emit("claim-win", { gameId, ticketId, pattern });
    toast.success(`Claimed ${pattern}! Waiting for confirmation...`);
  };

  const checkPatterns = (ticket: any) => {
    if (ticket.status !== "ACTIVE") return null;
    const nums = ticket.numbers;
    const wins = [];

    if (checkEarlyFive(nums, calledNumbers)) wins.push("Early 5");
    if (checkTopLine(nums, calledNumbers)) wins.push("Top Line");
    if (checkMiddleLine(nums, calledNumbers)) wins.push("Middle Line");
    if (checkBottomLine(nums, calledNumbers)) wins.push("Bottom Line");
    if (checkFullHouse(nums, calledNumbers)) wins.push("Full House");

    return wins;
  };

  const getWinnerForTicket = (ticketNumber: number) => {
    return winners.find(w => w.ticketNumber === ticketNumber);
  };

  if (roleLoading || !isAuthorized) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 relative">
      {showConfetti && <Confetti width={width} height={height} />}

      {/* Winner Pull Animation */}
      {showWinnerAnimation && currentWinner && (
        <WinnerPullAnimation
          winnerName={currentWinner.winnerName}
          ticketNumber={currentWinner.ticketNumber}
          prizeName={currentWinner.prizeName}
          prizeAmount={currentWinner.prizeAmount}
          ruleType={currentWinner.ruleType}
          onClose={() => {
            setShowWinnerAnimation(false);
            setCurrentWinner(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/games")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{gameName || "Live Game"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={gameStatus === "LIVE" ? "bg-green-500 animate-pulse" : gameStatus === "PAUSED" ? "bg-yellow-500" : "bg-gray-500"}>
                {gameStatus}
              </Badge>
              <span className="text-gray-500 text-sm">{calledNumbers.length}/90 numbers</span>
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">Last Called</div>
          <div className="text-3xl sm:text-5xl font-bold text-purple-600 animate-pulse">
            {lastCalledNumber || "--"}
          </div>
        </div>
      </div>

      {/* Winners Section - Always visible at top when there are winners */}
      {winners.length > 0 && (
        <Card className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Crown className="w-5 h-5" /> Winners ({winners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {winners.map((winner, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-yellow-200 shadow-sm"
                >
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <div>
                    <span className="font-bold text-purple-700">#{winner.ticketNumber}</span>
                    <span className="text-gray-600 mx-2">•</span>
                    <span className="text-gray-800">{winner.winnerName}</span>
                  </div>
                  <Badge className="bg-yellow-500">{winner.ruleType.replace(/_/g, " ")}</Badge>
                  <span className="font-bold text-green-600">₹{winner.prizeAmount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress & Recent Numbers */}
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Progress</span>
          <span>{calledNumbers.length} / 90</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${(calledNumbers.length / 90) * 100}%` }}
          />
        </div>

        {calledNumbers.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-2">
            {calledNumbers.slice(-10).reverse().map((num, i) => (
              <div key={i} className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold border ${i === 0 ? "bg-purple-600 text-white border-purple-700" : "bg-purple-100 text-purple-700 border-purple-200"}`}>
                {num}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Board View */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Game Board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex flex-wrap gap-1 min-w-[320px]">
              {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => (
                <div
                  key={num}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs font-medium transition-colors ${calledNumbers.includes(num)
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-400"
                    }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Tickets */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-600" /> Your Tickets ({myTickets.length})
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : myTickets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <p className="text-gray-500">You don't have any tickets for this game.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {myTickets.map((ticket) => {
              const possibleWins = checkPatterns(ticket);
              const winner = getWinnerForTicket(ticket.ticketNumber);

              return (
                <Card key={ticket._id} className={`relative ${winner ? "ring-2 ring-yellow-400 shadow-lg" : ""}`}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-purple-700">Ticket #{ticket.ticketNumber}</span>
                        {winner && <Crown className="w-5 h-5 text-yellow-500" />}
                      </div>
                      <Badge className={ticket.status === 'ACTIVE' ? 'bg-green-500' : ticket.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'}>
                        {ticket.status}
                      </Badge>
                    </div>

                    {winner && (
                      <div className="mb-3 p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg text-center text-yellow-800 text-sm font-medium">
                        🎉 Won {winner.ruleType.replace(/_/g, " ")} - ₹{winner.prizeAmount}
                      </div>
                    )}

                    <TicketGrid
                      numbers={ticket.numbers}
                      calledNumbers={calledNumbers}
                      ticketNumber={ticket.ticketNumber}
                      winningInfo={winner ? { pattern: winner.ruleType, prizeAmount: winner.prizeAmount } : undefined}
                    />

                    {possibleWins && possibleWins.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {possibleWins.map(win => (
                          <Button
                            key={win}
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            onClick={() => claimWin(win, ticket._id)}
                          >
                            <Trophy className="w-3 h-3 mr-1" /> Claim {win}
                          </Button>
                        ))}
                      </div>
                    )}

                    {ticket.status === 'PENDING' && (
                      <div className="mt-2 text-xs text-center text-yellow-600 bg-yellow-50 p-2 rounded">
                        Waiting for Admin confirmation...
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* All Tickets - Transparency View */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" /> All Tickets ({allTickets.length})
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllTickets(!showAllTickets)}
            className="gap-2"
          >
            {showAllTickets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAllTickets ? "Hide" : "Show All"}
          </Button>
        </div>

        {showAllTickets && (
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {sortedAllTickets.map((ticket) => {
                  const winner = getWinnerForTicket(ticket.ticketNumber);
                  const isMine = ticket.userId === user?.id;

                  return (
                    <div
                      key={ticket.ticketNumber}
                      className={`relative p-3 rounded-lg border-2 text-center transition-all ${winner
                        ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400"
                        : isMine
                          ? "bg-purple-100 border-purple-400"
                          : ticket.isBooked
                            ? "bg-gray-100 border-gray-300"
                            : "bg-green-50 border-green-300"
                        }`}
                    >
                      {winner && (
                        <Crown className="absolute -top-2 -right-2 w-5 h-5 text-yellow-500 bg-white rounded-full p-0.5" />
                      )}
                      <div className="text-2xl font-bold text-gray-800">#{ticket.ticketNumber}</div>
                      <div className="text-xs mt-1">
                        {winner ? (
                          <span className="text-yellow-700 font-medium">WINNER</span>
                        ) : isMine ? (
                          <span className="text-purple-700 font-medium">YOUR TICKET</span>
                        ) : ticket.isBooked ? (
                          <span className="text-gray-500">Booked</span>
                        ) : (
                          <span className="text-green-600">Available</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
