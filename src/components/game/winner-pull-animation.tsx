"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface WinnerPullAnimationProps {
  winnerName: string;
  ticketNumber: number;
  prizeName: string;
  prizeAmount: number;
  ruleType: string;
  onClose: () => void;
}

export function WinnerPullAnimation({
  winnerName,
  ticketNumber,
  prizeName,
  prizeAmount,
  ruleType,
  onClose,
}: WinnerPullAnimationProps) {
  const [stage, setStage] = useState<"pull" | "reveal" | "celebrate">("pull");

  useEffect(() => {
    // Stage transitions
    const pullTimer = setTimeout(() => setStage("reveal"), 1500);
    const revealTimer = setTimeout(() => setStage("celebrate"), 3000);

    return () => {
      clearTimeout(pullTimer);
      clearTimeout(revealTimer);
    };
  }, []);

  useEffect(() => {
    if (stage === "celebrate") {
      // Trigger confetti celebration
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ["#FFD700", "#FFA500", "#FF6347"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ["#FFD700", "#FFA500", "#FF6347"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Auto-close after celebration
      const closeTimer = setTimeout(onClose, 6000);
      return () => clearTimeout(closeTimer);
    }
  }, [stage, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white z-50"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Pull Animation Stage */}
        {stage === "pull" && (
          <motion.div
            initial={{ y: 500, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className="text-center"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, -5, 5, 0],
              }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="text-8xl mb-4"
            >
              🎫
            </motion.div>
            <p className="text-white text-2xl font-bold animate-pulse">
              Pulling Winner...
            </p>
          </motion.div>
        )}

        {/* Reveal Stage */}
        {stage === "reveal" && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="relative"
            >
              <Trophy className="w-32 h-32 text-yellow-400 mx-auto drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sparkles className="w-40 h-40 text-yellow-300/30" />
              </motion.div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-bold text-white mt-6"
            >
              {ruleType.replace(/_/g, " ")}
            </motion.p>
          </motion.div>
        )}

        {/* Celebrate Stage - Full Winner Display */}
        {stage === "celebrate" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            {/* Trophy with glow */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                filter: [
                  "drop-shadow(0 0 20px rgba(250,204,21,0.5))",
                  "drop-shadow(0 0 40px rgba(250,204,21,0.8))",
                  "drop-shadow(0 0 20px rgba(250,204,21,0.5))",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Trophy className="w-24 h-24 text-yellow-400 mx-auto" />
            </motion.div>

            {/* Winner Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-full text-xl font-bold inline-flex items-center gap-2"
            >
              <Star className="w-5 h-5" />
              WINNER!
              <Star className="w-5 h-5" />
            </motion.div>

            {/* Winner Details Card */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md mx-auto space-y-4"
            >
              {/* Ticket Number */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl py-4 px-6">
                <p className="text-purple-200 text-sm">Ticket Number</p>
                <p className="text-5xl font-black text-white">#{ticketNumber}</p>
              </div>

              {/* Winner Name */}
              <div>
                <p className="text-gray-400 text-sm">Winner</p>
                <p className="text-2xl font-bold text-white">{winnerName}</p>
              </div>

              {/* Prize */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-gray-400 text-xs">Prize</p>
                  <p className="text-lg font-bold text-yellow-400">{prizeName}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-gray-400 text-xs">Prize Value</p>
                  <p className="text-lg font-bold text-green-400">{prizeAmount.toLocaleString()} XP</p>
                </div>
              </div>

              {/* Rule Type Badge */}
              <div className="inline-block bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 px-4 py-2 rounded-full text-yellow-400 font-medium">
                {ruleType.replace(/_/g, " ")}
              </div>
            </motion.div>

            {/* Close Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Button
                onClick={onClose}
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10"
              >
                Continue Playing
              </Button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
