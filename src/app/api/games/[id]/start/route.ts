import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Game from "@/models/Game";
import Ticket from "@/models/Ticket";
import Admin from "@/models/Admin";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Check if user is admin
    const admin = await Admin.findOne({ clerkId: userId });
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const game = await Game.findById(id);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status === "LIVE") {
      return NextResponse.json({ message: "Game is already live", game });
    }

    // Update game status
    const updatedGame = await Game.findByIdAndUpdate(
      id,
      { status: "LIVE" },
      { new: true }
    );

    // Fetch active tickets to notify (logic for notification usually happens via socket, 
    // but we return success here so the frontend can emit the socket event if connected)

    return NextResponse.json({
      message: "Game started successfully",
      game: updatedGame
    });

  } catch (error: any) {
    console.error("Error starting game:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message
    }, { status: 500 });
  }
}
