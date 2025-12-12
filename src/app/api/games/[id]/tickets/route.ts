import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Game from "@/models/Game";
import Ticket from "@/models/Ticket";
import { auth } from "@clerk/nextjs/server";

// GET all tickets for a specific game (for transparency)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;

    await dbConnect();

    const game = await Game.findById(gameId);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get all booked tickets for this game
    const bookedTickets = await Ticket.find({ gameId }).lean();

    // Create a map of ticket numbers to their status
    const ticketMap = new Map();
    bookedTickets.forEach((ticket: any) => {
      ticketMap.set(ticket.ticketNumber, {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        userId: ticket.userId,
        _id: ticket._id,
        numbers: ticket.numbers,
      });
    });

    // Generate all ticket slots (1 to totalTickets)
    const allTickets = [];
    for (let i = 1; i <= game.totalTickets; i++) {
      const bookedTicket = ticketMap.get(i);
      if (bookedTicket) {
        allTickets.push({
          ticketNumber: i,
          status: bookedTicket.status, // PENDING, ACTIVE, REJECTED
          isBooked: bookedTicket.status !== "REJECTED", // Rejected tickets are available again
          userId: bookedTicket.userId,
          ticketId: bookedTicket._id,
          numbers: bookedTicket.numbers,
        });
      } else {
        allTickets.push({
          ticketNumber: i,
          status: "AVAILABLE",
          isBooked: false,
          userId: null,
          ticketId: null,
          numbers: null,
        });
      }
    }

    return NextResponse.json({
      gameId,
      gameName: game.name,
      totalTickets: game.totalTickets,
      soldTickets: game.soldTickets,
      ticketPrice: game.ticketPrice,
      gameStatus: game.status,
      tickets: allTickets,
    });
  } catch (error) {
    console.error("Error fetching game tickets:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
