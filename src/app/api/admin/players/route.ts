import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Ticket from "@/models/Ticket";
import Admin from "@/models/Admin";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build search query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const [players, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Get ticket stats for each player
    const playerIds = players.map(p => p.clerkId);
    const ticketStats = await Ticket.aggregate([
      { $match: { userId: { $in: playerIds } } },
      {
        $group: {
          _id: "$userId",
          totalTickets: { $sum: 1 },
          activeTickets: {
            $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] }
          },
          gamesPlayed: { $addToSet: "$gameId" }
        }
      },
      {
        $project: {
          _id: 1,
          totalTickets: 1,
          activeTickets: 1,
          gamesPlayed: { $size: "$gamesPlayed" }
        }
      }
    ]);

    const statsMap = new Map(ticketStats.map(s => [s._id, s]));

    const playersWithStats = players.map(player => ({
      ...player,
      stats: statsMap.get(player.clerkId) || {
        totalTickets: 0,
        activeTickets: 0,
        gamesPlayed: 0
      }
    }));

    return NextResponse.json({
      players: playersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
