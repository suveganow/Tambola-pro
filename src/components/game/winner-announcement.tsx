"use client";

import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, Star } from "lucide-react";
import { useVoiceAnnouncer } from "./voice-announcer";

interface WinnerAnnouncementProps {
  winnerName: string;
  winnerId?: string;
  ticketId?: string;
  prizeName: string;
  prizeAmount: number;
  xpPoints?: number;
  ruleType?: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function WinnerAnnouncement({
  winnerName,
  winnerId,
  ticketId,
  prizeName,
  prizeAmount,
  xpPoints = 0,
  ruleType,
  onClose,
  autoClose = true,
  autoCloseDelay = 10000,
}: WinnerAnnouncementProps) {
  const [open, setOpen] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const { announceWinner } = useVoiceAnnouncer();

  // Trigger gold confetti celebration
  const triggerConfetti = useCallback(() => {
    const duration = 6 * 1000;
    const animationEnd = Date.now() + duration;

    // Gold and premium color palette
    const colors = ["#FFD700", "#FFA500", "#FF6347", "#FFE4B5", "#FFDAB9", "#FF69B4"];

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    // Main burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      startVelocity: 45,
      ticks: 200,
      zIndex: 9999,
    });

    // Continuous side bursts
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 30 * (timeLeft / duration);

      // Left burst
      confetti({
        particleCount: Math.floor(particleCount),
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        ticks: 150,
        zIndex: 9999,
      });

      // Right burst
      confetti({
        particleCount: Math.floor(particleCount),
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        ticks: 150,
        zIndex: 9999,
      });
    }, 300);

    // Star-shaped confetti
    const starInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(starInterval);
        return;
      }

      confetti({
        particleCount: 10,
        spread: 360,
        origin: { x: randomInRange(0.2, 0.8), y: randomInRange(0.2, 0.5) },
        colors: ["#FFD700", "#FFF8DC"],
        shapes: ["star"],
        scalar: 1.2,
        ticks: 100,
        zIndex: 9999,
      });
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(starInterval);
    };
  }, []);

  useEffect(() => {
    // Trigger confetti and voice announcement
    const cleanup = triggerConfetti();

    // Delay content reveal for dramatic effect
    const showTimer = setTimeout(() => {
      setShowContent(true);
      announceWinner(winnerName, prizeName);
    }, 500);

    // Auto-close timer
    let closeTimer: NodeJS.Timeout;
    if (autoClose) {
      closeTimer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
    }

    return () => {
      cleanup?.();
      clearTimeout(showTimer);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [triggerConfetti, announceWinner, winnerName, prizeName, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  // Format ticket ID for display
  const displayTicketId = ticketId ? `#${ticketId.slice(-6).toUpperCase()}` : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg text-center border-4 border-yellow-400 bg-gradient-to-b from-yellow-50 via-white to-yellow-50 shadow-2xl overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 via-transparent to-yellow-200/20 animate-pulse pointer-events-none" />

        <DialogHeader className="relative z-10">
          <DialogTitle className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 flex flex-col items-center gap-3">
            {/* Animated trophy */}
            <div className="relative">
              <Trophy className="w-20 h-20 text-yellow-500 animate-bounce" />
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-ping" />
              <Star className="absolute -top-1 -left-3 w-6 h-6 text-orange-400 animate-pulse" />
            </div>
            <span className="animate-pulse">🎉 WINNER! 🎉</span>
          </DialogTitle>
        </DialogHeader>

        <div className={`py-6 space-y-6 relative z-10 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Winner name with glow effect */}
          <div className="space-y-2">
            <div className="text-lg text-gray-600">Congratulations to</div>
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-purple-400/30 blur-xl rounded-full" />
              <div className="relative text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 animate-pulse px-4 py-1">
                {winnerName}
              </div>
            </div>
            {/* Ticket ID display */}
            {displayTicketId && (
              <div className="text-sm text-gray-500 font-mono bg-gray-100 inline-block px-3 py-1 rounded-full">
                Ticket {displayTicketId}
              </div>
            )}
          </div>

          {/* Prize card with premium styling */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl blur opacity-30" />
            <div className="relative bg-gradient-to-br from-yellow-100 via-yellow-50 to-orange-50 p-6 rounded-2xl border-2 border-yellow-300 shadow-lg">
              {/* Rule type badge */}
              {ruleType && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    {ruleType.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              <div className="text-sm font-bold text-yellow-800 uppercase tracking-widest mt-2">
                Prize Won
              </div>
              <div className="text-2xl font-black text-gray-900 mt-2">
                {prizeName}
              </div>

              {/* Prize amount with animation */}
              <div className="mt-4 relative">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-emerald-500 to-green-500">
                  ₹{prizeAmount.toLocaleString('en-IN')}
                </div>
              </div>

              {/* XP Points */}
              {xpPoints > 0 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  <span className="text-lg font-bold text-purple-600">
                    +{xpPoints} XP
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={handleClose}
          className="w-full relative z-10 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 hover:from-purple-700 hover:via-pink-600 hover:to-purple-700 text-lg font-bold py-6 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Awesome!
        </Button>

        {/* Auto-close indicator */}
        {autoClose && (
          <div className="text-xs text-gray-400 mt-2">
            Closes automatically in a few seconds...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Wrapper component that uses the Zustand store
export function WinnerAnnouncementFromStore() {
  const { useGameStore } = require("@/store/useGameStore");
  const { currentWinner, showWinnerModal, setShowWinnerModal, setCurrentWinner } = useGameStore();

  if (!showWinnerModal || !currentWinner) return null;

  return (
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
  );
}
