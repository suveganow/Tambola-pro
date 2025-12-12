"use client";

import { createContext, useContext, useEffect, useCallback, ReactNode } from "react";
import { Socket } from "socket.io-client";
import { getSocket, connectSocket, disconnectSocket, joinGame, leaveGame } from "@/lib/socket";
import { useGameStore, WinnerInfo } from "@/store/useGameStore";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinGameRoom: (gameId: string) => void;
  leaveGameRoom: (gameId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinGameRoom: () => { },
  leaveGameRoom: () => { },
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
  gameId?: string;
}

export function SocketProvider({ children, gameId }: SocketProviderProps) {
  const {
    setIsConnected,
    addDrawnNumber,
    setDrawnNumbers,
    setGameStatus,
    setIsAutoPlaying,
    addWinner,
  } = useGameStore();

  // Handle socket events
  const setupEventListeners = useCallback((socket: Socket) => {
    // Connection events
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);

      // Rejoin game room if gameId is provided
      if (gameId) {
        joinGame(gameId);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    // Game events
    socket.on("number-called", (data: { number: number; drawnNumbers?: number[]; timestamp: number }) => {
      console.log("Number called:", data.number);
      if (data.drawnNumbers) {
        setDrawnNumbers(data.drawnNumbers);
      } else {
        addDrawnNumber(data.number);
      }
    });

    socket.on("game-status-changed", (data: { status: "WAITING" | "LIVE" | "PAUSED" | "CLOSED" }) => {
      console.log("Game status changed:", data.status);
      setGameStatus(data.status);
    });

    socket.on("auto-play-started", () => {
      console.log("Auto-play started");
      setIsAutoPlaying(true);
    });

    socket.on("auto-play-stopped", () => {
      console.log("Auto-play stopped");
      setIsAutoPlaying(false);
    });

    socket.on("winner-detected", (winner: WinnerInfo) => {
      console.log("Winner detected:", winner);
      addWinner(winner);
    });

    socket.on("game-closed", (data: { reason: string; totalWinners?: number }) => {
      console.log("Game closed:", data);
      setGameStatus("CLOSED");
      setIsAutoPlaying(false);
    });
  }, [gameId, setIsConnected, addDrawnNumber, setDrawnNumbers, setGameStatus, setIsAutoPlaying, addWinner]);

  // Cleanup event listeners
  const cleanupEventListeners = useCallback((socket: Socket) => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("connect_error");
    socket.off("number-called");
    socket.off("game-status-changed");
    socket.off("auto-play-started");
    socket.off("auto-play-stopped");
    socket.off("winner-detected");
    socket.off("game-closed");
  }, []);

  // Initialize socket on mount
  useEffect(() => {
    const socket = connectSocket();
    setupEventListeners(socket);

    // Join game room if gameId is provided
    if (gameId) {
      joinGame(gameId);
    }

    return () => {
      cleanupEventListeners(socket);
      if (gameId) {
        leaveGame(gameId);
      }
    };
  }, [gameId, setupEventListeners, cleanupEventListeners]);

  // Join game room function
  const joinGameRoom = useCallback((id: string) => {
    joinGame(id);
  }, []);

  // Leave game room function
  const leaveGameRoom = useCallback((id: string) => {
    leaveGame(id);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: getSocket(),
        isConnected: useGameStore.getState().isConnected,
        joinGameRoom,
        leaveGameRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
