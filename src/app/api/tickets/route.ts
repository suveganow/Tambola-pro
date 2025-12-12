import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ticket from "@/models/Ticket";
import Game from "@/models/Game";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId");
    const includeGameData = searchParams.get("includeGameData") === "true";

    await dbConnect();

    const query: any = { userId };
    if (gameId) {
      query.gameId = gameId;
    }

    const tickets = await Ticket.find(query).sort({ createdAt: -1 }).lean();

    // If requested, populate game data for each ticket
    if (includeGameData || !gameId) {
      // Get unique game IDs
      const gameIds = [...new Set(tickets.map((t: any) => t.gameId.toString()))];

      // Fetch all games in one query
      const games = await Game.find({ _id: { $in: gameIds } }).lean();

      // Create a map for quick lookup
      const gamesMap = new Map();
      games.forEach((game: any) => {
        gamesMap.set(game._id.toString(), {
          _id: game._id,
          name: game.name,
          status: game.status,
          drawnNumbers: game.drawnNumbers || [],
          prizes: game.prizes || [],
          winningRules: game.winningRules || [],
          ticketPrice: game.ticketPrice,
          totalTickets: game.totalTickets,
          soldTickets: game.soldTickets,
        });
      });

      // Attach game data to each ticket
      const ticketsWithGames = tickets.map((ticket: any) => ({
        ...ticket,
        game: gamesMap.get(ticket.gameId.toString()) || null,
      }));

      return NextResponse.json(ticketsWithGames);
    }

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
