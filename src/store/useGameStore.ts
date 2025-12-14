import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Winner information interface
export interface WinnerInfo {
  winnerName: string;
  winnerEmail?: string;
  winnerId: string;
  ticketId: string;
  prizeName: string;
  prizeAmount: number;
  xpPoints: number;
  ruleType: string;
  timestamp?: number;
}

// Prize interface
export interface Prize {
  name: string;
  amount: number;
  xpPoints: number;
  position: number;
  ruleType: string;
  winner?: string;
  winnerTicketId?: string;
  status: 'OPEN' | 'WON';
  wonAt?: Date;
}

// Game status type
export type GameStatus = 'WAITING' | 'LIVE' | 'PAUSED' | 'CLOSED';

// Full game state interface
export interface GameState {
  // Core identifiers
  activeGameId: string | null;
  selectedTickets: number;

  // Real-time game state
  currentNumber: number | null;
  drawnNumbers: number[];
  recentNumbers: number[];
  gameStatus: GameStatus;

  // Auto-play state
  isAutoPlaying: boolean;
  isConnected: boolean;

  // Winners and prizes
  winners: WinnerInfo[];
  prizes: Prize[];
  currentWinner: WinnerInfo | null;
  showWinnerModal: boolean;

  // Game metadata
  gameName: string;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;

  // Actions
  setActiveGameId: (id: string | null) => void;
  setSelectedTickets: (count: number) => void;

  // Real-time actions
  setCurrentNumber: (number: number | null) => void;
  addDrawnNumber: (number: number) => void;
  setDrawnNumbers: (numbers: number[]) => void;
  setGameStatus: (status: GameStatus) => void;

  // Auto-play actions
  setIsAutoPlaying: (playing: boolean) => void;
  setIsConnected: (connected: boolean) => void;

  // Winner actions
  addWinner: (winner: WinnerInfo) => void;
  setCurrentWinner: (winner: WinnerInfo | null) => void;
  setShowWinnerModal: (show: boolean) => void;
  setPrizes: (prizes: Prize[]) => void;

  // Game metadata actions
  setGameMetadata: (data: {
    gameName?: string;
    ticketPrice?: number;
    totalTickets?: number;
    soldTickets?: number;
    prizes?: Prize[];
  }) => void;

  // Utility actions
  reset: () => void;
  resetGameState: () => void;
}

const initialState = {
  activeGameId: null,
  selectedTickets: 1,
  currentNumber: null,
  drawnNumbers: [],
  recentNumbers: [],
  gameStatus: 'WAITING' as GameStatus,
  isAutoPlaying: false,
  isConnected: false,
  winners: [],
  prizes: [],
  currentWinner: null,
  showWinnerModal: false,
  gameName: '',
  ticketPrice: 0,
  totalTickets: 0,
  soldTickets: 0,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Core setters
      setActiveGameId: (id) => set({ activeGameId: id }),
      setSelectedTickets: (count) => set({ selectedTickets: count }),

      // Real-time state management
      setCurrentNumber: (number) => set({ currentNumber: number }),

      addDrawnNumber: (number) => {
        const { drawnNumbers, recentNumbers } = get();
        const newDrawnNumbers = [...drawnNumbers, number];
        const newRecentNumbers = [number, ...recentNumbers].slice(0, 10);
        set({
          currentNumber: number,
          drawnNumbers: newDrawnNumbers,
          recentNumbers: newRecentNumbers,
        });
      },

      setDrawnNumbers: (numbers) => {
        const recentNumbers = [...numbers].reverse().slice(0, 10);
        const currentNumber = numbers.length > 0 ? numbers[numbers.length - 1] : null;
        set({
          drawnNumbers: numbers,
          recentNumbers,
          currentNumber,
        });
      },

      setGameStatus: (status) => set({ gameStatus: status }),

      // Auto-play state
      setIsAutoPlaying: (playing) => set({ isAutoPlaying: playing }),
      setIsConnected: (connected) => set({ isConnected: connected }),

      // Winner management
      addWinner: (winner) => {
        const { winners } = get();
        const winnerWithTimestamp = { ...winner, timestamp: Date.now() };
        set({
          winners: [...winners, winnerWithTimestamp],
          currentWinner: winnerWithTimestamp,
          showWinnerModal: true,
        });
      },

      setCurrentWinner: (winner) => set({ currentWinner: winner }),
      setShowWinnerModal: (show) => set({ showWinnerModal: show }),
      setPrizes: (prizes) => set({ prizes }),

      // Game metadata
      setGameMetadata: (data) => set((state) => ({
        gameName: data.gameName ?? state.gameName,
        ticketPrice: data.ticketPrice ?? state.ticketPrice,
        totalTickets: data.totalTickets ?? state.totalTickets,
        soldTickets: data.soldTickets ?? state.soldTickets,
        prizes: data.prizes ?? state.prizes,
      })),

      // Reset functions
      reset: () => set(initialState),

      resetGameState: () => set({
        currentNumber: null,
        drawnNumbers: [],
        recentNumbers: [],
        gameStatus: 'WAITING',
        isAutoPlaying: false,
        winners: [],
        currentWinner: null,
        showWinnerModal: false,
      }),
    }),
    {
      name: 'tambola-game-storage',
      partialize: (state) => ({
        // Only persist essential data
        activeGameId: state.activeGameId,
        selectedTickets: state.selectedTickets,
      }),
    }
  )
);

// Selector hooks for performance optimization
export const useGameStatus = () => useGameStore((state) => state.gameStatus);
export const useCurrentNumber = () => useGameStore((state) => state.currentNumber);
export const useDrawnNumbers = () => useGameStore((state) => state.drawnNumbers);
export const useRecentNumbers = () => useGameStore((state) => state.recentNumbers);
export const useIsAutoPlaying = () => useGameStore((state) => state.isAutoPlaying);
export const useWinners = () => useGameStore((state) => state.winners);
export const useCurrentWinner = () => useGameStore((state) => state.currentWinner);
export const useShowWinnerModal = () => useGameStore((state) => state.showWinnerModal);
