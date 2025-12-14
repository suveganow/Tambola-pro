import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Game from "@/models/Game";
import Admin from "@/models/Admin";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

// Prize schema (XP only, no money)
const prizeSchema = z.object({
  name: z.string().min(1),
  xpPoints: z.number().min(0),
  position: z.number().min(1),
  ruleType: z.enum(['FULL_HOUSE', 'TOP_LINE', 'MIDDLE_LINE', 'BOTTOM_LINE', 'EARLY_FIVE', 'CORNERS']),
  status: z.enum(['OPEN', 'WON']).default('OPEN'),
});

// Winning rule schema
const winningRuleSchema = z.object({
  type: z.enum(['FULL_HOUSE', 'TOP_LINE', 'MIDDLE_LINE', 'BOTTOM_LINE', 'EARLY_FIVE', 'CORNERS']),
  maxWinners: z.number().min(1).max(10),
  currentWinners: z.number().default(0),
  isCompleted: z.boolean().default(false),
  prizes: z.array(prizeSchema).min(1),
});

// Auto-close schema
const autoCloseSchema = z.object({
  enabled: z.boolean(),
  afterWinners: z.number().min(1),
  currentTotalWinners: z.number().default(0),
});

// Main game creation schema
const createGameSchema = z.object({
  name: z.string().min(3),
  ticketXpCost: z.number().min(0),
  totalTickets: z.number().min(1),
  winningRules: z.array(winningRuleSchema).min(1),
  autoClose: autoCloseSchema,
  // Legacy prizes array (optional, for backward compatibility)
  prizes: z.array(prizeSchema).optional(),
});

// Legacy schema for backward compatibility
const legacyCreateGameSchema = z.object({
  name: z.string().min(3),
  ticketPrice: z.number().min(1),
  totalTickets: z.number().min(5),
  prizes: z.array(z.object({
    name: z.string(),
    amount: z.number(),
  })).min(1),
});

export async function POST(req: Request) {
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

    const body = await req.json();

    // Try new schema first
    const newSchemaResult = createGameSchema.safeParse(body);

    if (newSchemaResult.success) {
      // New format with winning rules
      const data = newSchemaResult.data;

      // Flatten all prizes from winning rules for legacy compatibility
      const allPrizes = data.winningRules.flatMap(rule =>
        rule.prizes.map(prize => ({
          ...prize,
          ruleType: rule.type,
        }))
      );

      const game = await Game.create({
        name: data.name,
        ticketXpCost: data.ticketXpCost,
        totalTickets: data.totalTickets,
        winningRules: data.winningRules,
        autoClose: data.autoClose,
        prizes: allPrizes,
        createdBy: userId,
        status: "WAITING",
      });

      return NextResponse.json(game);
    }

    // Try legacy schema for backward compatibility
    const legacyResult = legacyCreateGameSchema.safeParse(body);

    if (legacyResult.success) {
      // Legacy format - convert to new format
      const data = legacyResult.data;

      // Convert legacy prizes to new format with default values
      const convertedPrizes = data.prizes.map((prize, index) => ({
        name: prize.name,
        amount: prize.amount,
        xpPoints: 100, // Default XP
        position: index + 1,
        ruleType: 'FULL_HOUSE' as const,
        status: 'OPEN' as const,
      }));

      const game = await Game.create({
        name: data.name,
        ticketPrice: data.ticketPrice,
        totalTickets: data.totalTickets,
        prizes: convertedPrizes,
        winningRules: [{
          type: 'FULL_HOUSE',
          maxWinners: data.prizes.length,
          currentWinners: 0,
          isCompleted: false,
          prizes: convertedPrizes,
        }],
        autoClose: {
          enabled: true,
          afterWinners: data.prizes.length,
          currentTotalWinners: 0,
        },
        createdBy: userId,
        status: "WAITING",
      });

      return NextResponse.json(game);
    }

    // Neither schema matched
    return NextResponse.json({
      error: "Invalid request data",
      details: newSchemaResult.error?.issues || legacyResult.error?.issues
    }, { status: 400 });

  } catch (error: any) {
    console.error("Error creating game:", error);

    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      return NextResponse.json({
        error: "Validation failed",
        details: errorMessages
      }, { status: 400 });
    }

    // Handle MongoDB errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return NextResponse.json({
        error: "Database error occurred. Please try again."
      }, { status: 500 });
    }

    return NextResponse.json({
      error: error.message || "An unexpected error occurred while creating the game."
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const games = await Game.find({}).sort({ createdAt: -1 });
    return NextResponse.json(games);
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
