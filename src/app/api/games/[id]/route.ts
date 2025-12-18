import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Game from "@/models/Game";
import Ticket from "@/models/Ticket";
import Admin from "@/models/Admin";
import { auth } from "@clerk/nextjs/server";

import User from "@/models/User";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const game = await Game.findById(id).lean();
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get ticket stats for this game
    const [totalSold, pendingTickets, activeTickets] = await Promise.all([
      Ticket.countDocuments({ gameId: id, status: { $in: ["ACTIVE", "PENDING"] } }),
      Ticket.countDocuments({ gameId: id, status: "PENDING" }),
      Ticket.countDocuments({ gameId: id, status: "ACTIVE" })
    ]);

    // Get pending tickets
    const pendingTicketsRaw = await Ticket.find({ gameId: id, status: "PENDING" })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Populate user info manually since userId is a string (clerkId)
    const pendingTicketsList = await Promise.all(
      pendingTicketsRaw.map(async (ticket) => {
        const user = await User.findOne({ clerkId: ticket.userId }).select("firstName lastName email");
        return {
          ...ticket,
          userName: user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown User",
          userEmail: user ? user.email : "",
        };
      })
    );

    return NextResponse.json({
      ...game,
      soldTickets: totalSold,
      pendingTickets,
      activeTickets,
      pendingTicketsList
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await dbConnect();

    // Check if user is admin from database
    const admin = await Admin.findOne({ clerkId: userId });
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const game = await Game.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error updating game:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Check if user is admin from database
    const admin = await Admin.findOne({ clerkId: userId });
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if game exists
    const game = await Game.findById(id);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Don't allow deletion of live games
    if (game.status === "LIVE") {
      return NextResponse.json(
        { error: "Cannot delete a live game" },
        { status: 400 }
      );
    }

    // Delete associated tickets
    await Ticket.deleteMany({ gameId: id });

    // Delete the game
    await Game.findByIdAndDelete(id);

    return NextResponse.json({ message: "Game deleted successfully" });
  } catch (error) {
    console.error("Error deleting game:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
