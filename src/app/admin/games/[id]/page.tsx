"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { NumberDisplay } from "@/components/admin/game-control/number-display";
import { NumberGrid } from "@/components/admin/game-control/number-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Ticket, Trophy, Clock, Loader2, ArrowLeft,
  Play, Pause, Square, Volume2, VolumeX, Zap, StopCircle
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Link from "next/link";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { SocketProvider } from "@/components/providers/socket-provider";
import { useGameStore } from "@/store/useGameStore";
import { useVoiceAnnouncer } from "@/components/game/voice-announcer";
import { WinnerAnnouncement } from "@/components/game/winner-announcement";
import {
  connectSocket,
  getSocket,
  joinGame,
  startGame as startGameSocket,
  startAutoPlay,
  stopAutoPlay,
  pauseGame,
  resumeGame,
  endGame as endGameSocket,
  adminCallNumber,
} from "@/lib/socket";
import { AdminNumberPad } from "@/components/admin/admin-number-pad";

type GameStatus = "WAITING" | "LIVE" | "PAUSED" | "CLOSED";

interface Game {
  _id: string;
  name: string;
  status: GameStatus;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  drawnNumbers: number[];
  prizes: {
    name: string;
    amount: number;
    winner?: string;
    winnerName?: string;
    winnerEmail?: string;
    status: "OPEN" | "WON";
    ruleType?: string;
  }[];
  winningRules?: any[];
  autoClose?: {
    enabled: boolean;
    afterWinners: number;
    currentTotalWinners: number;
  };
  pendingTicketsList?: any[];
}

function GameControlContent() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingTickets, setPendingTickets] = useState<any[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const lastAnnouncedNumber = useRef<number | null>(null);

  // Zustand store
  const {
    gameStatus,
    setGameStatus,
    currentNumber,
    drawnNumbers,
    setDrawnNumbers,
    recentNumbers,
    isAutoPlaying,
    setIsAutoPlaying,
    currentWinner,
    showWinnerModal,
    setShowWinnerModal,
    setCurrentWinner,
    addDrawnNumber,
    addWinner,
    setIsConnected,
  } = useGameStore();

  // Voice announcer
  const {
    announceNumber,
    announceWinner,
    announceGameStart,
    announceGamePaused,
    announceGameResumed,
    announceGameEnd
  } = useVoiceAnnouncer();

  // Fetch game data
  const fetchGame = useCallback(async () => {
    try {
      const res = await axios.get(`/api/games/${gameId}`);
      const gameData = res.data;
      setGame(gameData);
      setGameStatus(gameData.status);
      setDrawnNumbers(gameData.drawnNumbers || []);
      setPendingTickets(gameData.pendingTicketsList || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch game details");
    } finally {
      setLoading(false);
    }
  }, [gameId, setGameStatus, setDrawnNumbers]);

  // Setup socket connection and events
  useEffect(() => {
    const socket = connectSocket();

    // Handle existing connection
    if (socket.connected) {
      console.log("Socket already connected, joining game...");
      setIsConnected(true);
      joinGame(gameId);
    }

    socket.on("connect", () => {
      console.log("Admin connected to socket");
      setIsConnected(true);
      joinGame(gameId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("number-called", (data: { number: number; drawnNumbers?: number[] }) => {
      if (data.drawnNumbers) {
        setDrawnNumbers(data.drawnNumbers);
      } else {
        addDrawnNumber(data.number);
      }

      // Announce number with voice if enabled
      if (isVoiceEnabled && data.number !== lastAnnouncedNumber.current) {
        lastAnnouncedNumber.current = data.number;
        announceNumber(data.number);
      }
    });

    socket.on("game-status-changed", (data: { status: GameStatus }) => {
      setGameStatus(data.status);

      if (isVoiceEnabled) {
        if (data.status === "LIVE") announceGameStart();
        else if (data.status === "PAUSED") announceGamePaused();
        else if (data.status === "CLOSED") announceGameEnd();
      }
    });

    socket.on("auto-play-started", () => {
      setIsAutoPlaying(true);
      toast.success("Auto-play started!");
    });

    socket.on("auto-play-stopped", () => {
      setIsAutoPlaying(false);
      toast.info("Auto-play stopped");
    });

    socket.on("winner-detected", (winner: any) => {
      addWinner(winner);
      if (isVoiceEnabled) {
        announceWinner(winner.winnerName, winner.prizeName);
      }
      // Refresh game data to get updated prizes
      fetchGame();
    });

    socket.on("game-closed", (data: { reason: string }) => {
      setGameStatus("CLOSED");
      setIsAutoPlaying(false);
      toast.success("Game completed!");
      if (isVoiceEnabled) announceGameEnd();
      fetchGame();
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("number-called");
      socket.off("game-status-changed");
      socket.off("auto-play-started");
      socket.off("auto-play-stopped");
      socket.off("winner-detected");
      socket.off("game-closed");
    };
  }, [gameId, isVoiceEnabled, setIsConnected, setDrawnNumbers, addDrawnNumber,
    setGameStatus, setIsAutoPlaying, addWinner, announceNumber, announceWinner,
    announceGameStart, announceGamePaused, announceGameEnd, fetchGame]);

  // Initial data fetch
  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  // Game control handlers
  const handleStartGame = async () => {
    try {
      // 1. Call API to update DB state (reliable)
      await axios.post(`/api/games/${gameId}/start`);

      // 2. Emit socket event for real-time updates (if connected)
      startGameSocket(gameId);

      // 3. Local updates
      if (isVoiceEnabled) announceGameStart();
      toast.success("Game started successfully!", {
        description: "All users have been notified."
      });

      // Refresh game data
      fetchGame();
    } catch (error: any) {
      console.error("Failed to start game:", error);
      const msg = error.response?.data?.error || "Failed to start game";
      toast.error(msg);
    }
  };

  const handleStartAutoPlay = () => {
    startAutoPlay(gameId);
    if (isVoiceEnabled) announceGameStart();
  };

  const handleStopAutoPlay = () => {
    stopAutoPlay(gameId);
  };

  const handlePauseGame = () => {
    pauseGame(gameId);
    if (isVoiceEnabled) announceGamePaused();
  };

  const handleResumeGame = () => {
    resumeGame(gameId);
    if (isVoiceEnabled) announceGameResumed();
  };

  const handleEndGame = () => {
    if (confirm("Are you sure you want to end the game?")) {
      endGameSocket(gameId);
      if (isVoiceEnabled) announceGameEnd();
    }
  };

  // Admin manual number call
  const handleManualCallNumber = (number: number) => {
    adminCallNumber(gameId, number);
    // Voice announcement will be handled by socket event listener
  };

  // Ticket management
  const handleConfirmTicket = async (ticketId: string) => {
    try {
      await axios.patch("/api/admin/tickets", { ticketId, status: "ACTIVE" });
      toast.success("Ticket confirmed!");
      fetchGame();
    } catch (error) {
      console.error(error);
      toast.error("Failed to confirm ticket");
    }
  };

  const handleRejectTicket = async (ticketId: string) => {
    try {
      await axios.patch("/api/admin/tickets", { ticketId, status: "REJECTED" });
      toast.success("Ticket rejected");
      fetchGame();
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject ticket");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Game not found</p>
        <Link href="/admin/games">
          <Button variant="link">Back to Games</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Winner Modal */}
      {showWinnerModal && currentWinner && (
        <WinnerAnnouncement
          winnerName={currentWinner.winnerName}
          winnerId={currentWinner.winnerId}
          ticketId={currentWinner.ticketId}
          prizeName={currentWinner.prizeName}
          prizeAmount={currentWinner.prizeAmount}
          xpPoints={currentWinner.xpPoints}
          ruleType={currentWinner.ruleType}
          onClose={() => {
            setShowWinnerModal(false);
            setCurrentWinner(null);
          }}
        />
      )}

      <div className="space-y-4 sm:space-y-6">
        {/* Back Button */}
        <Link href="/admin/games">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Games
          </Button>
        </Link>

        {/* Header & Status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{game.name}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <Ticket className="w-4 h-4 mr-1" /> {game.soldTickets} / {game.totalTickets} Tickets
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" /> ₹{game.ticketPrice} per ticket
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Voice toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={isVoiceEnabled ? "text-green-600" : "text-gray-400"}
            >
              {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>

            <Badge
              className={`text-base sm:text-lg px-3 sm:px-4 py-1 ${gameStatus === "LIVE"
                ? "bg-green-500"
                : gameStatus === "PAUSED"
                  ? "bg-yellow-500"
                  : gameStatus === "CLOSED"
                    ? "bg-gray-500"
                    : "bg-blue-500"
                }`}
            >
              {isAutoPlaying && gameStatus === "LIVE" && (
                <Zap className="w-4 h-4 mr-1 animate-pulse" />
              )}
              {gameStatus}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Controls & Current Number */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <NumberDisplay currentNumber={currentNumber} isAnimating={isAutoPlaying} />

            {/* Game Controls */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Game Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Start Game / Start Auto-Play */}
                  {gameStatus === "WAITING" && (
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 w-full col-span-2"
                      onClick={handleStartGame}
                    >
                      <Play className="mr-2 h-5 w-5" /> Start Game
                    </Button>
                  )}

                  {gameStatus === "LIVE" && !isAutoPlaying && (
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full col-span-2 shadow-lg"
                      onClick={handleStartAutoPlay}
                    >
                      <Zap className="mr-2 h-5 w-5" /> Start Auto-Play
                    </Button>
                  )}

                  {gameStatus === "LIVE" && isAutoPlaying && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full col-span-2 border-orange-500 text-orange-500 hover:bg-orange-50"
                      onClick={handleStopAutoPlay}
                    >
                      <StopCircle className="mr-2 h-5 w-5" /> Stop Auto-Play
                    </Button>
                  )}

                  {gameStatus === "LIVE" && (
                    <Button
                      size="lg"
                      className="bg-yellow-500 hover:bg-yellow-600 text-black w-full"
                      onClick={handlePauseGame}
                    >
                      <Pause className="mr-2 h-5 w-5" /> Pause
                    </Button>
                  )}

                  {gameStatus === "PAUSED" && (
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 w-full"
                      onClick={handleResumeGame}
                    >
                      <Play className="mr-2 h-5 w-5" /> Resume
                    </Button>
                  )}

                  {gameStatus !== "CLOSED" && gameStatus !== "WAITING" && (
                    <Button
                      size="lg"
                      variant="destructive"
                      className="w-full"
                      onClick={handleEndGame}
                    >
                      <Square className="mr-2 h-5 w-5" /> End Game
                    </Button>
                  )}
                </div>

                {/* Auto-play indicator */}
                {isAutoPlaying && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-purple-700">
                      Auto-play active - Numbers every 1 second
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Numbers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent Numbers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {recentNumbers.map((num, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className={`text-base sm:text-lg w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center ${i === 0 ? "bg-purple-100 border-purple-400 text-purple-700" : ""
                        }`}
                    >
                      {num}
                    </Badge>
                  ))}
                  {recentNumbers.length === 0 && (
                    <span className="text-gray-400 text-sm">No numbers drawn yet</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Number Grid & Winners */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base sm:text-lg">Game Board</CardTitle>
                  <span className="text-sm text-gray-500">
                    {drawnNumbers.length} / 90 Drawn
                  </span>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <NumberGrid drawnNumbers={drawnNumbers} />
              </CardContent>
            </Card>

            {/* Admin Number Pad - Manual Number Calling */}
            {(gameStatus === "LIVE" || gameStatus === "PAUSED") && (
              <AdminNumberPad
                drawnNumbers={drawnNumbers}
                onNumberSelect={handleManualCallNumber}
                disabled={false}
                onVoiceToggle={() => setIsVoiceEnabled(!isVoiceEnabled)}
                voiceEnabled={isVoiceEnabled}
              />
            )}

            {/* Winners Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" /> Winners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {game.prizes.map((prize, index) => (
                    <div
                      key={index}
                      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-lg border gap-2 ${prize.status === "WON"
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-100"
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{prize.name}</span>
                          <span className="text-sm text-gray-500">₹{prize.amount}</span>
                          {prize.ruleType && (
                            <Badge variant="outline" className="text-xs sm:hidden xl:inline-flex">
                              {prize.ruleType.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>

                        {/* Winner Details */}
                        {prize.status === "WON" && (
                          <div className="mt-1 flex flex-col">
                            {prize.winnerName && (
                              <span className="text-sm font-medium text-green-700">
                                🏆 {prize.winnerName}
                              </span>
                            )}
                            {prize.winnerEmail && (
                              <span className="text-xs text-gray-500">
                                {prize.winnerEmail}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          prize.status === "WON"
                            ? "bg-white text-green-600 border-green-300"
                            : "bg-white text-gray-500 border-gray-200"
                        }
                      >
                        {prize.status === "WON" ? "✓ Won" : "Waiting..."}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Confirmations Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-600 text-base sm:text-lg">
                  <Clock className="w-5 h-5 mr-2" /> Pending Ticket Confirmations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTickets.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-4">
                      No pending tickets
                    </div>
                  ) : (
                    pendingTickets.map((ticket: any) => (
                      <div
                        key={ticket._id}
                        className="border rounded-lg p-3 sm:p-4 bg-yellow-50/50"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                          <div>
                            <div className="font-bold text-sm sm:text-base">
                              {ticket.userName || `User: ${ticket.userId}`}
                            </div>
                            <div className="text-xs text-gray-600">
                              {ticket.userEmail}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 mt-1">
                              Ticket #{ticket._id.slice(-6)} •{" "}
                              {new Date(ticket.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex-1"
                            onClick={() => handleConfirmTicket(ticket._id)}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleRejectTicket(ticket._id)}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default function GameControlPage() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "admin",
    redirectTo: "/dashboard",
  });

  if (roleLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return <GameControlContent />;
}
