import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Game from "@/models/Game";
import Ticket from "@/models/Ticket";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { generateTicket } from "@/lib/tambola-generator";

const buyTicketSchema = z.object({
  gameId: z.string(),
  ticketNumbers: z.array(z.number().min(1).max(1000)).min(1).max(6), // Specific ticket numbers to book
});

// Legacy schema for backward compatibility
const legacyBuySchema = z.object({
  gameId: z.string(),
  quantity: z.number().min(1).max(6),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    // Try new schema first (specific ticket numbers)
    const specificTickets = buyTicketSchema.safeParse(body);

    if (specificTickets.success) {
      // Book specific ticket numbers
      const { gameId, ticketNumbers } = specificTickets.data;

      const game = await Game.findById(gameId);
      if (!game) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }

      if (game.status !== "WAITING") {
        let errorMessage = "Game is not accepting bookings";
        if (game.status === "CLOSED") errorMessage = "This game has ended. Booking is no longer available.";
        else if (game.status === "LIVE") errorMessage = "This game has already started. You can no longer book tickets.";
        else if (game.status === "PAUSED") errorMessage = "This game is currently paused. Please try again later.";
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      // Check if any requested ticket number exceeds max
      const maxTicketNumber = Math.max(...ticketNumbers);
      if (maxTicketNumber > game.totalTickets) {
        return NextResponse.json({
          error: `Ticket number ${maxTicketNumber} exceeds total tickets (${game.totalTickets})`
        }, { status: 400 });
      }

      // Check which tickets are already booked (not rejected)
      const existingTickets = await Ticket.find({
        gameId,
        ticketNumber: { $in: ticketNumbers },
        status: { $ne: "REJECTED" }, // Rejected tickets are available again
      });

      const bookedNumbers = existingTickets.map((t: any) => t.ticketNumber);
      const conflictingNumbers = ticketNumbers.filter(n => bookedNumbers.includes(n));

      if (conflictingNumbers.length > 0) {
        return NextResponse.json({
          error: `Ticket(s) #${conflictingNumbers.join(", #")} already booked. Please select different tickets.`,
          conflictingNumbers,
        }, { status: 400 });
      }

      // Create tickets with specific numbers
      const tickets = ticketNumbers.map(ticketNumber => ({
        gameId,
        userId,
        ticketNumber,
        numbers: generateTicket(),
        status: "PENDING",
      }));

      await Ticket.insertMany(tickets);

      // Update game sold count
      game.soldTickets += ticketNumbers.length;
      await game.save();

      return NextResponse.json({
        success: true,
        count: ticketNumbers.length,
        ticketNumbers,
      });
    }

    // Fallback to legacy schema (random ticket numbers)
    const legacyData = legacyBuySchema.safeParse(body);
    if (!legacyData.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { gameId, quantity } = legacyData.data;

    const game = await Game.findById(gameId);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status !== "WAITING") {
      let errorMessage = "Game is not accepting bookings";
      if (game.status === "CLOSED") errorMessage = "This game has ended. Booking is no longer available.";
      else if (game.status === "LIVE") errorMessage = "This game has already started. You can no longer book tickets.";
      else if (game.status === "PAUSED") errorMessage = "This game is currently paused. Please try again later.";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    if (game.soldTickets + quantity > game.totalTickets) {
      return NextResponse.json({ error: "Not enough tickets available" }, { status: 400 });
    }

    // Find available ticket numbers (not booked or rejected)
    const bookedTickets = await Ticket.find({
      gameId,
      status: { $ne: "REJECTED" }
    }).select("ticketNumber").lean();

    const bookedNumbers = new Set(bookedTickets.map((t: any) => t.ticketNumber));
    const availableNumbers: number[] = [];

    for (let i = 1; i <= game.totalTickets; i++) {
      if (!bookedNumbers.has(i)) {
        availableNumbers.push(i);
      }
    }

    if (availableNumbers.length < quantity) {
      return NextResponse.json({ error: "Not enough tickets available" }, { status: 400 });
    }

    // Select random available ticket numbers
    const selectedNumbers: number[] = [];
    for (let i = 0; i < quantity; i++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      selectedNumbers.push(availableNumbers.splice(randomIndex, 1)[0]);
    }

    // Create tickets
    const tickets = selectedNumbers.map(ticketNumber => ({
      gameId,
      userId,
      ticketNumber,
      numbers: generateTicket(),
      status: "PENDING",
    }));

    await Ticket.insertMany(tickets);

    // Update game sold count
    game.soldTickets += quantity;
    await game.save();

    return NextResponse.json({
      success: true,
      count: quantity,
      ticketNumbers: selectedNumbers.sort((a, b) => a - b),
    });
  } catch (error) {
    console.error("Error buying ticket:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
