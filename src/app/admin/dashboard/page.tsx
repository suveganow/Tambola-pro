"use client";

import { CreateGameDialog } from "@/components/admin/create-game-dialog";
import { GamesTable } from "@/components/admin/games-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { Gamepad2, Users, DollarSign, Activity, Loader2, Clock, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useRoleProtection } from "@/hooks/useRoleProtection";

interface Stats {
  totalGames: number;
  liveGames: number;
  waitingGames: number;
  pausedGames: number;
  closedGames: number;
  totalPlayers: number;
  totalTickets: number;
  totalRevenue: number;
}

interface DashboardData {
  stats: Stats;
  recentGames: any[];
  charts: {
    dailyRevenue: any[];
    dailyGames: any[];
  };
}

export default function AdminDashboardPage() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "admin",
    redirectTo: "/dashboard",
  });

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, gamesRes] = await Promise.all([
        axios.get("/api/admin/stats"),
        axios.get("/api/games")
      ]);

      setData({
        ...statsRes.data,
        recentGames: gamesRes.data.slice(0, 5)
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized]);

  // Show loading while checking role
  if (roleLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const { stats, recentGames } = data;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
            Manage games, players, and platform settings.
          </p>
        </div>
        <CreateGameDialog onGameCreated={fetchData} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Total Games"
          value={stats.totalGames.toString()}
          icon={<Gamepad2 className="h-4 w-4 text-purple-500" />}
          className="border-l-4 border-l-purple-500"
        />
        <StatCard
          title="Live Games"
          value={stats.liveGames.toString()}
          icon={<Activity className="h-4 w-4 text-green-500" />}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title="Total Players"
          value={stats.totalPlayers.toLocaleString()}
          icon={<Users className="h-4 w-4 text-blue-500" />}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-yellow-500" />}
          className="border-l-4 border-l-yellow-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6">
        <StatCard
          title="Waiting"
          value={stats.waitingGames.toString()}
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Paused"
          value={stats.pausedGames.toString()}
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          className="border-l-4 border-l-yellow-500"
        />
        <StatCard
          title="Completed"
          value={stats.closedGames.toString()}
          icon={<CheckCircle className="h-4 w-4 text-gray-500" />}
          className="border-l-4 border-l-gray-500"
        />
      </div>

      {/* Games Management */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Recent Games</h2>
        {recentGames.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            No games yet. Create your first game to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <GamesTable data={recentGames} />
          </div>
        )}
      </div>
    </div>
  );
}
