import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Game from "@/models/Game";
import User from "@/models/User";
import Ticket from "@/models/Ticket";
import Admin from "@/models/Admin";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Check if user is admin from database
    const admin = await Admin.findOne({ clerkId: userId });
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all statistics in parallel
    const [
      totalGames,
      liveGames,
      waitingGames,
      pausedGames,
      closedGames,
      totalPlayers,
      totalTickets,
      recentGames,
      revenueData
    ] = await Promise.all([
      Game.countDocuments({}),
      Game.countDocuments({ status: "LIVE" }),
      Game.countDocuments({ status: "WAITING" }),
      Game.countDocuments({ status: "PAUSED" }),
      Game.countDocuments({ status: "CLOSED" }),
      User.countDocuments({}),
      Ticket.countDocuments({ status: "ACTIVE" }),
      Game.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      // Calculate revenue from sold tickets
      Ticket.aggregate([
        { $match: { status: "ACTIVE" } },
        {
          $lookup: {
            from: "games",
            localField: "gameId",
            foreignField: "_id",
            as: "game"
          }
        },
        { $unwind: "$game" },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$game.ticketPrice" }
          }
        }
      ])
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Get revenue data for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Ticket.aggregate([
      {
        $match: {
          status: "ACTIVE",
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $lookup: {
          from: "games",
          localField: "gameId",
          foreignField: "_id",
          as: "game"
        }
      },
      { $unwind: "$game" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$game.ticketPrice" },
          ticketsSold: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get games created per day for last 7 days
    const dailyGames = await Game.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return NextResponse.json({
      stats: {
        totalGames,
        liveGames,
        waitingGames,
        pausedGames,
        closedGames,
        totalPlayers,
        totalTickets,
        totalRevenue
      },
      recentGames,
      charts: {
        dailyRevenue,
        dailyGames
      }
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
