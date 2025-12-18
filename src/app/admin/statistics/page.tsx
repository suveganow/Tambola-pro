"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Loader2,
  TrendingUp,
  Users,
  Gamepad2,
  DollarSign,
  Ticket,
  Activity,
  BarChart3,
} from "lucide-react";
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

interface ChartData {
  dailyRevenue: { _id: string; revenue: number; ticketsSold: number }[];
  dailyGames: { _id: string; count: number }[];
}

export default function StatisticsPage() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "admin",
    redirectTo: "/dashboard",
  });

  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/api/admin/stats");
        setStats(res.data.stats);
        setCharts(res.data.charts);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch statistics");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthorized) {
      fetchStats();
    }
  }, [isAuthorized]);

  if (roleLoading || !isAuthorized || loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Calculate max values for chart scaling
  const maxRevenue = Math.max(...(charts?.dailyRevenue.map((d) => d.revenue) || [1]), 1);
  const maxGames = Math.max(...(charts?.dailyGames.map((d) => d.count) || [1]), 1);

  // Get last 7 days labels
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
      });
    }
    return days;
  };

  const last7Days = getLast7Days();

  // Map data to last 7 days
  const revenueByDay = last7Days.map((day) => {
    const data = charts?.dailyRevenue.find((d) => d._id === day.date);
    return {
      ...day,
      revenue: data?.revenue || 0,
      tickets: data?.ticketsSold || 0,
    };
  });

  const gamesByDay = last7Days.map((day) => {
    const data = charts?.dailyGames.find((d) => d._id === day.date);
    return {
      ...day,
      count: data?.count || 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Statistics</h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
          Platform analytics and insights
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
        <StatCard
          title="Total Players"
          value={stats.totalPlayers.toLocaleString()}
          icon={<Users className="h-4 w-4 text-blue-500" />}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Total Games"
          value={stats.totalGames.toString()}
          icon={<Gamepad2 className="h-4 w-4 text-purple-500" />}
          className="border-l-4 border-l-purple-500"
        />
        <StatCard
          title="Tickets Sold"
          value={stats.totalTickets.toLocaleString()}
          icon={<Ticket className="h-4 w-4 text-orange-500" />}
          className="border-l-4 border-l-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        {/* Games Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
              Games Created (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-x-auto">
              <div className="min-w-[300px]">
                <div className="flex items-end justify-between h-48 gap-1 sm:gap-2">
                  {gamesByDay.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t transition-all hover:from-purple-600 hover:to-purple-500"
                        style={{
                          height: `${maxGames > 0 ? (day.count / maxGames) * 100 : 0
                            }%`,
                          minHeight: day.count > 0 ? "8px" : "2px",
                        }}
                        title={`${day.count} games`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  {gamesByDay.map((day, index) => (
                    <span key={index} className="flex-1 text-center">
                      {day.label}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between mt-4">
                  {gamesByDay.map((day, index) => (
                    <div key={index} className="flex-1 text-center">
                      <div className="font-semibold text-gray-900 text-base sm:text-lg">
                        {day.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Activity className="h-5 w-5 mr-2 text-blue-500" />
            Game Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.waitingGames}
              </div>
              <div className="text-sm text-blue-800 mt-1">Waiting</div>
              <div className="text-xs text-blue-600 mt-1">
                {stats.totalGames > 0
                  ? ((stats.waitingGames / stats.totalGames) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.liveGames}
              </div>
              <div className="text-sm text-green-800 mt-1">Live</div>
              <div className="text-xs text-green-600 mt-1">
                {stats.totalGames > 0
                  ? ((stats.liveGames / stats.totalGames) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {stats.pausedGames}
              </div>
              <div className="text-sm text-yellow-800 mt-1">Paused</div>
              <div className="text-xs text-yellow-600 mt-1">
                {stats.totalGames > 0
                  ? ((stats.pausedGames / stats.totalGames) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-gray-600">
                {stats.closedGames}
              </div>
              <div className="text-sm text-gray-800 mt-1">Completed</div>
              <div className="text-xs text-gray-600 mt-1">
                {stats.totalGames > 0
                  ? ((stats.closedGames / stats.totalGames) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Tickets per Game</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalGames > 0
                    ? Math.round(stats.totalTickets / stats.totalGames)
                    : 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Ticket className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Tickets per Player</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalPlayers > 0
                    ? (stats.totalTickets / stats.totalPlayers).toFixed(1)
                    : 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
