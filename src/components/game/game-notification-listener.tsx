"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { connectSocket, getSocket, joinGame } from "@/lib/socket";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Bell, Play, X } from "lucide-react";

interface GameNotification {
  type: "GAME_STARTED" | "WINNER_ANNOUNCED" | "GAME_ENDED";
  gameId: string;
  message: string;
  ticketHolders?: string[];
  gameName?: string;
}

export function GameNotificationListener() {
  const { user } = useUser();
  const router = useRouter();
  const [notification, setNotification] = useState<GameNotification | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const socket = connectSocket();

    // Listen for game notifications
    socket.on("game-notification", (data: GameNotification) => {
      console.log("Received game notification:", data);

      // Check if this user is a ticket holder
      if (data.ticketHolders?.includes(user.id)) {
        setNotification(data);
        setShowNotification(true);

        // Show toast notification
        toast.custom(
          (t) => (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl shadow-xl flex items-center gap-4 animate-pulse">
              <div className="flex-shrink-0">
                <Bell className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">🎮 Game Started!</p>
                <p className="text-sm text-green-100">{data.message}</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  router.push(`/dashboard/play/${data.gameId}`);
                  toast.dismiss(t);
                }}
                className="bg-white text-green-600 hover:bg-green-50"
              >
                <Play className="w-4 h-4 mr-1" /> Join Now
              </Button>
            </div>
          ),
          {
            duration: 15000,
            position: "top-center",
          }
        );
      }
    });

    // Listen for game started in rooms the user has joined
    socket.on("game-started", (data: { gameId: string; message: string }) => {
      toast.success(data.message, {
        action: {
          label: "Join Game",
          onClick: () => router.push(`/dashboard/play/${data.gameId}`),
        },
        duration: 10000,
      });
    });

    return () => {
      socket.off("game-notification");
      socket.off("game-started");
    };
  }, [user?.id, router]);

  // Floating notification banner
  if (showNotification && notification) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
          <Bell className="w-5 h-5 animate-ring" />
          <span className="font-medium">Your game is live!</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              router.push(`/dashboard/play/${notification.gameId}`);
              setShowNotification(false);
            }}
            className="bg-white text-purple-600 hover:bg-purple-50"
          >
            <Play className="w-4 h-4 mr-1" /> Join
          </Button>
          <button
            onClick={() => setShowNotification(false)}
            className="ml-2 hover:bg-white/20 rounded-full p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
