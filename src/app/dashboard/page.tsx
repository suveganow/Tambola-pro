"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, Trophy, Gamepad2, Mail, User as UserIcon, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { useRouter } from "next/navigation";

interface Ticket {
  _id: string;
  gameId: string;
  userId: string;
  game?: {
    status: string;
    prizes?: {
      winner: string;
      winnerTicketId?: string;
      amount: number;
      status: string;
    }[];
  };
}

export default function ProfilePage() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "user",
    redirectTo: "/admin/dashboard",
  });

  const { user, isLoaded: userLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();

  const [stats, setStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    xpWon: 0,
    balance: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/api/tickets?includeGameData=true");
        const allTickets: Ticket[] = res.data;

        // Calculate stats
        const uniqueGames = new Set(allTickets.map(t => t.gameId)).size;

        // Calculate wins from CLOSED games
        let wins = 0;
        let xpWon = 0;

        allTickets.forEach(ticket => {
          if (ticket.game?.status === "CLOSED" || ticket.game?.status === "LIVE") {
            // Check if THIS specific ticket won any prize
            // The prize object in game.prizes has 'winnerTicketId'
            const wonPrizes = ticket.game?.prizes?.filter(p =>
              p.status === "WON" &&
              p.winnerTicketId === ticket._id // Match specific ticket ID
            );

            if (wonPrizes && wonPrizes.length > 0) {
              wonPrizes.forEach(p => {
                // Double check user match for safety, though ticket._id check is strong
                if (p.winner === user?.id) {
                  wins++;
                  // Ensure amount is a number to prevent NaN
                  xpWon += (Number(p.amount) || 0);
                }
              });
            }
          }
        });

        setStats(prev => ({
          ...prev,
          gamesPlayed: uniqueGames,
          wins: wins,
          xpWon: xpWon,
          balance: xpWon // Available XP = Total Won XP (as requested)
        }));

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (isAuthorized && user?.id) {
      fetchStats();
    }
  }, [isAuthorized, user?.id]);

  if (roleLoading || !userLoaded || !isAuthorized) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card className="border-none shadow-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user?.imageUrl}
                alt={user?.fullName || "User"}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white/20 shadow-xl object-cover"
              />
              <Badge className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 border-2 border-white px-2 py-0.5">
                Pro Player
              </Badge>
            </div>

            {/* Name & Info */}
            <div className="text-center sm:text-left flex-1 space-y-2">
              <h1 className="text-2xl sm:text-4xl font-bold">{user?.fullName}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-purple-100 text-sm sm:text-base">
                <Mail className="w-4 h-4" />
                {user?.primaryEmailAddress?.emailAddress}
              </div>
              <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openUserProfile()}
                  className="bg-white/10 hover:bg-white/20 text-white border-0"
                >
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </Button>
              </div>
            </div>

            {/* XP Balance Card (Inset) */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[160px] text-center border border-white/10">
              <div className="text-purple-200 text-xs uppercase tracking-wider font-semibold mb-1">Available XP</div>
              <div className="text-3xl font-black text-yellow-300 flex items-center justify-center gap-1">
                <Star className="w-6 h-6 fill-yellow-300 text-yellow-300" />
                {stats.balance.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-purple-600" /> Your Statistics
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Games Played */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Games Played</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.gamesPlayed}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Gamepad2 className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Wins */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-yellow-500">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Wins</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.wins}</h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        {/* XP Won */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-purple-500">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total XP Won</p>
              <h3 className="text-3xl font-bold text-purple-600">{stats.xpWon.toLocaleString()}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={() => signOut(() => router.push("/"))}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
