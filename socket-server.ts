import { createServer } from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import "dotenv/config";

const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3001", 10); // Default to 3001 to avoid conflict if run locally with Next.js

// Track active auto-play sessions
const activeGames = new Map<string, NodeJS.Timeout>();

// MongoDB connection string (from env)
const MONGODB_URI = process.env.MONGODB_URI || "";

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log("Socket server connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error:", error);
    }
  }
}

// Import models dynamically to avoid schema issues
async function getModels() {
  const Game = (await import("./src/models/Game")).default;
  const Ticket = (await import("./src/models/Ticket")).default;
  const User = (await import("./src/models/User")).default;
  return { Game, Ticket, User };
}

// Winner detection logic
function checkEarlyFive(ticket: (number | null)[][], calledNumbers: number[]): boolean {
  let count = 0;
  for (const row of ticket) {
    for (const num of row) {
      if (num !== null && calledNumbers.includes(num)) {
        count++;
      }
    }
  }
  return count >= 5;
}

function checkTopLine(ticket: (number | null)[][], calledNumbers: number[]): boolean {
  const row = ticket[0];
  for (const num of row) {
    if (num !== null && !calledNumbers.includes(num)) {
      return false;
    }
  }
  return true;
}

function checkMiddleLine(ticket: (number | null)[][], calledNumbers: number[]): boolean {
  const row = ticket[1];
  for (const num of row) {
    if (num !== null && !calledNumbers.includes(num)) {
      return false;
    }
  }
  return true;
}

function checkBottomLine(ticket: (number | null)[][], calledNumbers: number[]): boolean {
  const row = ticket[2];
  for (const num of row) {
    if (num !== null && !calledNumbers.includes(num)) {
      return false;
    }
  }
  return true;
}

function checkFullHouse(ticket: (number | null)[][], calledNumbers: number[]): boolean {
  for (const row of ticket) {
    for (const num of row) {
      if (num !== null && !calledNumbers.includes(num)) {
        return false;
      }
    }
  }
  return true;
}

function checkCorners(ticket: (number | null)[][], calledNumbers: number[]): boolean {
  const getRowCorners = (rowIndex: number) => {
    const row = ticket[rowIndex];
    const first = row.find(n => n !== null);
    const last = [...row].reverse().find(n => n !== null);
    return [first, last];
  };

  const topCorners = getRowCorners(0);
  const bottomCorners = getRowCorners(2);
  const allCorners = [...topCorners, ...bottomCorners];

  for (const num of allCorners) {
    if (num !== undefined && num !== null && !calledNumbers.includes(num)) {
      return false;
    }
  }
  return true;
}

// Check if a ticket wins for a specific rule type
function checkWinForRule(
  ticket: (number | null)[][],
  calledNumbers: number[],
  ruleType: string
): boolean {
  switch (ruleType) {
    case "EARLY_FIVE":
      return checkEarlyFive(ticket, calledNumbers);
    case "TOP_LINE":
      return checkTopLine(ticket, calledNumbers);
    case "MIDDLE_LINE":
      return checkMiddleLine(ticket, calledNumbers);
    case "BOTTOM_LINE":
      return checkBottomLine(ticket, calledNumbers);
    case "FULL_HOUSE":
      return checkFullHouse(ticket, calledNumbers);
    case "CORNERS":
      return checkCorners(ticket, calledNumbers);
    default:
      return false;
  }
}

// Create simple HTTP server
const httpServer = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Socket Server Running');
});

// CORS configuration
const allowedOrigins = [
  ...(process.env.NEXT_PUBLIC_SOCKET_URL || "").split(","),
  ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean).map(origin => origin.trim());

console.log("Allowed CORS Origins:", allowedOrigins);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    methods: ["GET", "POST"],
    credentials: true
  },
});

io.on("connection", (socket: Socket) => {
  console.log("Client connected:", socket.id);

  // Join a game room
  socket.on("join-game", (gameId: string) => {
    socket.join(`game-${gameId}`);
    console.log(`Socket ${socket.id} joined game-${gameId}`);

    // Notify others in the room
    socket.broadcast.to(`game-${gameId}`).emit("player-joined", {
      userId: "Anonymous", // Ideally pass real user info here
      name: "A player"
    });
  });

  // Leave a game room
  socket.on("leave-game", (gameId: string) => {
    socket.leave(`game-${gameId}`);
    console.log(`Socket ${socket.id} left game-${gameId}`);
  });

  // Manual number call (backup for non-auto-play)
  socket.on("call-number", ({ gameId, number }) => {
    console.log(`Number ${number} called in game-${gameId}`);
    io.to(`game-${gameId}`).emit("number-called", { number, timestamp: Date.now() });
  });

  // Helper to start auto-play loop
  const startAutoPlayLoop = async (gameId: string) => {
    // Clear existing
    if (activeGames.has(gameId)) clearInterval(activeGames.get(gameId)!);

    const interval = setInterval(async () => {
      try {
        await connectDB();
        const { Game, Ticket, User } = await getModels();
        const game = await Game.findById(gameId);

        if (!game || game.status === "CLOSED") {
          console.log(`Game ${gameId} is closed, stopping auto-play`);
          clearInterval(interval);
          activeGames.delete(gameId);
          return;
        }

        if (game.status === "PAUSED") {
          // Just skip this tick, don't stop
          return;
        }

        const drawnNumbers: number[] = game.drawnNumbers || [];

        // Check if all numbers drawn
        if (drawnNumbers.length >= 90) {
          console.log(`All numbers drawn in game-${gameId}, ending game`);
          await Game.findByIdAndUpdate(gameId, { status: "CLOSED" });
          io.to(`game-${gameId}`).emit("game-closed", {
            reason: "all_numbers_drawn",
            totalNumbers: 90,
          });
          clearInterval(interval);
          activeGames.delete(gameId);
          return;
        }

        // Generate a new random number
        let newNumber: number;
        do {
          newNumber = Math.floor(Math.random() * 90) + 1;
        } while (drawnNumbers.includes(newNumber));

        // Update game with new number
        const updatedNumbers = [...drawnNumbers, newNumber];
        await Game.findByIdAndUpdate(gameId, {
          drawnNumbers: updatedNumbers,
        });

        // Broadcast the number
        io.to(`game-${gameId}`).emit("number-called", {
          number: newNumber,
          drawnNumbers: updatedNumbers,
          timestamp: Date.now(),
        });
        console.log(`Number ${newNumber} called in game-${gameId} (${updatedNumbers.length}/90)`);

        // Check for winners
        const activeTickets = await Ticket.find({
          gameId: gameId,
          status: "ACTIVE",
        });

        // Re-fetch game to get latest winning rules
        const currentGame = await Game.findById(gameId);
        if (!currentGame) return;

        let totalWinnersFound = 0;
        const winnersToAnnounce: any[] = [];

        // Check each winning rule
        for (const rule of currentGame.winningRules) {
          if (rule.isCompleted) continue;

          // Check each ticket for this rule
          for (const ticket of activeTickets) {
            // Skip if this ticket already won this rule
            const alreadyWon = rule.prizes.some(
              (p: any) => p.winnerTicketId === ticket._id.toString()
            );
            if (alreadyWon) continue;

            // Check if ticket wins for this rule
            const isWinner = checkWinForRule(ticket.numbers, updatedNumbers, rule.type);

            if (isWinner) {
              // Find an open prize for this rule
              const openPrize = rule.prizes.find((p: any) => p.status === "OPEN");

              if (openPrize) {
                const user = await User.findOne({ clerkId: ticket.userId });
                // Construct a proper name from first/last name, or fall back to email or ID
                const winnerName = (user?.firstName || user?.lastName)
                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                  : `User ${ticket.userId.slice(-6)}`;
                const winnerEmail = user?.email || "";

                openPrize.winner = ticket.userId;
                openPrize.winnerName = winnerName;
                openPrize.winnerEmail = winnerEmail;
                openPrize.winnerTicketId = ticket._id.toString();
                openPrize.status = "WON";
                openPrize.wonAt = new Date();

                rule.currentWinners += 1;
                if (rule.currentWinners >= rule.maxWinners) {
                  rule.isCompleted = true;
                }

                currentGame.autoClose.currentTotalWinners += 1;
                totalWinnersFound++;

                winnersToAnnounce.push({
                  winnerName,
                  winnerEmail,
                  winnerId: ticket.userId,
                  ticketId: ticket._id.toString(),
                  prizeName: openPrize.name,
                  prizeAmount: openPrize.amount,
                  xpPoints: openPrize.xpPoints,
                  ruleType: rule.type,
                });

                console.log(`Winner found! ${winnerName} (${winnerEmail}) won ${openPrize.name} (${rule.type})`);
              }
            }
          }
        }

        // Save updates if winners were found
        if (totalWinnersFound > 0) {
          await currentGame.save();

          // Announce each winner
          for (const winner of winnersToAnnounce) {
            io.to(`game-${gameId}`).emit("winner-detected", winner);
          }

          // Update legacy prizes array too
          await Game.findByIdAndUpdate(gameId, {
            prizes: currentGame.winningRules.flatMap((r: any) => r.prizes),
          });
        }

        // Check if game should auto-close
        const updatedGame = await Game.findById(gameId);
        if (updatedGame?.autoClose.enabled) {
          const allRulesCompleted = updatedGame.winningRules.every(
            (r: any) => r.isCompleted
          );
          const reachedWinnerLimit =
            updatedGame.autoClose.currentTotalWinners >=
            updatedGame.autoClose.afterWinners;

          if (allRulesCompleted || reachedWinnerLimit) {
            console.log(`Auto-closing game-${gameId}`);
            await Game.findByIdAndUpdate(gameId, { status: "CLOSED" });
            io.to(`game-${gameId}`).emit("game-closed", {
              reason: allRulesCompleted ? "all_prizes_won" : "winner_limit_reached",
              totalWinners: updatedGame.autoClose.currentTotalWinners,
            });
            clearInterval(interval);
            activeGames.delete(gameId);
          }
        }
      } catch (error) {
        console.error("Error in auto-play:", error);
      }
    }, 3000); // 3 second interval (Updated as per request)

    activeGames.set(gameId, interval);
  };

  // Admin manual number call with winner detection
  socket.on("admin-call-number", async ({ gameId, number }) => {
    console.log(`Admin calling number ${number} in game-${gameId}`);

    await connectDB();
    const { Game, Ticket, User } = await getModels();

    try {
      const game = await Game.findById(gameId);
      if (!game) {
        socket.emit("error", { message: "Game not found" });
        return;
      }

      if (game.status !== "LIVE" && game.status !== "PAUSED") {
        socket.emit("error", { message: "Game is not live" });
        return;
      }

      const drawnNumbers: number[] = game.drawnNumbers || [];

      // Check if number already called
      if (drawnNumbers.includes(number)) {
        socket.emit("error", { message: `Number ${number} already called` });
        return;
      }

      // Add the manually called number
      const updatedNumbers = [...drawnNumbers, number];
      await Game.findByIdAndUpdate(gameId, {
        drawnNumbers: updatedNumbers,
      });

      // Broadcast the number to all users
      io.to(`game-${gameId}`).emit("number-called", {
        number,
        drawnNumbers: updatedNumbers,
        timestamp: Date.now(),
        isManual: true,
      });
      console.log(`Admin called ${number} in game-${gameId} (${updatedNumbers.length}/90)`);

      // Check for winners (same logic as auto-play)
      const activeTickets = await Ticket.find({
        gameId: gameId,
        status: "ACTIVE",
      });

      const currentGame = await Game.findById(gameId);
      if (!currentGame) return;

      let totalWinnersFound = 0;
      const winnersToAnnounce: any[] = [];

      for (const rule of currentGame.winningRules) {
        if (rule.isCompleted) continue;

        for (const ticket of activeTickets) {
          const alreadyWon = rule.prizes.some(
            (p: any) => p.winnerTicketId === ticket._id.toString()
          );
          if (alreadyWon) continue;

          const isWinner = checkWinForRule(ticket.numbers, updatedNumbers, rule.type);

          if (isWinner) {
            const openPrize = rule.prizes.find((p: any) => p.status === "OPEN");

            if (openPrize) {
              const user = await User.findOne({ clerkId: ticket.userId });
              // Construct a proper name from first/last name, or fall back to email or ID
              const winnerName = (user?.firstName || user?.lastName)
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : `User ${ticket.userId.slice(-6)}`;
              const winnerEmail = user?.email || "";

              // Update the prize
              openPrize.winner = ticket.userId;
              openPrize.winnerName = winnerName;
              openPrize.winnerEmail = winnerEmail;
              openPrize.winnerTicketId = ticket._id.toString();
              openPrize.status = "WON";
              openPrize.wonAt = new Date();

              rule.currentWinners += 1;
              if (rule.currentWinners >= rule.maxWinners) {
                rule.isCompleted = true;
              }

              currentGame.autoClose.currentTotalWinners += 1;
              totalWinnersFound++;

              winnersToAnnounce.push({
                winnerName,
                winnerEmail,
                winnerId: ticket.userId,
                ticketId: ticket._id.toString(),
                ticketNumber: ticket.ticketNumber,
                prizeName: openPrize.name,
                prizeAmount: openPrize.amount,
                xpPoints: openPrize.xpPoints,
                ruleType: rule.type,
              });

              console.log(`Winner found! ${winnerName} (${winnerEmail}) won ${openPrize.name} (${rule.type})`);
            }
          }
        }
      }

      if (totalWinnersFound > 0) {
        await currentGame.save();
        for (const winner of winnersToAnnounce) {
          io.to(`game-${gameId}`).emit("winner-detected", winner);
        }
        await Game.findByIdAndUpdate(gameId, {
          prizes: currentGame.winningRules.flatMap((r: any) => r.prizes),
        });
      }

      // Check if all numbers drawn
      if (updatedNumbers.length >= 90) {
        await Game.findByIdAndUpdate(gameId, { status: "CLOSED" });
        io.to(`game-${gameId}`).emit("game-closed", {
          reason: "all_numbers_drawn",
          totalNumbers: 90,
        });
      }

      // *** MAGIC TRICK: Reset auto-play if active ***
      if (activeGames.has(gameId)) {
        console.log(`Admin manual call: Restarting auto-play timer for game-${gameId}`);
        startAutoPlayLoop(gameId); // Restart the loop = Wait full 4s before next number
      }

    } catch (error) {
      console.error("Error in admin-call-number:", error);
      socket.emit("error", { message: "Failed to call number" });
    }
  });

  // Start game and notify all booked users
  socket.on("start-game", async ({ gameId }) => {
    console.log(`Starting game-${gameId}`);

    await connectDB();
    const { Game, Ticket, User } = await getModels();

    try {
      // Update game status to LIVE
      await Game.findByIdAndUpdate(gameId, { status: "LIVE" });

      // Get all ticket holders for this game
      const tickets = await Ticket.find({ gameId, status: "ACTIVE" }).distinct("userId");

      // Broadcast game started to the game room
      io.to(`game-${gameId}`).emit("game-started", {
        gameId,
        message: "Game has started! Join now to play.",
      });

      // Also emit to all connected sockets (for notifications)
      io.emit("game-notification", {
        type: "GAME_STARTED",
        gameId,
        message: "A game you have tickets for has started!",
        ticketHolders: tickets,
      });

      io.to(`game-${gameId}`).emit("game-status-changed", { status: "LIVE" });
      console.log(`Game ${gameId} started, notified ${tickets.length} users`);
    } catch (error) {
      console.error("Error starting game:", error);
      socket.emit("error", { message: "Failed to start game" });
    }
  });

  // Start auto-play
  socket.on("start-auto-play", async ({ gameId }) => {
    console.log(`Starting auto-play for game-${gameId}`);

    await connectDB();
    const { Game } = await getModels();

    // Update game status to LIVE
    await Game.findByIdAndUpdate(gameId, { status: "LIVE" });
    io.to(`game-${gameId}`).emit("game-status-changed", { status: "LIVE" });

    // Start the auto-play loop
    startAutoPlayLoop(gameId);

    io.to(`game-${gameId}`).emit("auto-play-started", { gameId });
  });

  // Stop auto-play
  socket.on("stop-auto-play", async ({ gameId }) => {
    console.log(`Stopping auto-play for game-${gameId}`);

    if (activeGames.has(gameId)) {
      clearInterval(activeGames.get(gameId)!);
      activeGames.delete(gameId);
    }

    io.to(`game-${gameId}`).emit("auto-play-stopped", { gameId });
  });

  // Pause game
  socket.on("pause-game", async ({ gameId }) => {
    console.log(`Pausing game-${gameId}`);
    await connectDB();
    const { Game } = await getModels();
    await Game.findByIdAndUpdate(gameId, { status: "PAUSED" });
    io.to(`game-${gameId}`).emit("game-status-changed", { status: "PAUSED" });
  });

  // Resume game
  socket.on("resume-game", async ({ gameId }) => {
    console.log(`Resuming game-${gameId}`);
    await connectDB();
    const { Game } = await getModels();
    await Game.findByIdAndUpdate(gameId, { status: "LIVE" });
    io.to(`game-${gameId}`).emit("game-status-changed", { status: "LIVE" });
  });

  // End game
  socket.on("end-game", async ({ gameId }) => {
    console.log(`Ending game-${gameId}`);

    // Stop auto-play if running
    if (activeGames.has(gameId)) {
      clearInterval(activeGames.get(gameId)!);
      activeGames.delete(gameId);
    }

    await connectDB();
    const { Game } = await getModels();
    await Game.findByIdAndUpdate(gameId, { status: "CLOSED" });
    io.to(`game-${gameId}`).emit("game-closed", { reason: "manual_end" });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`> Socket Server Ready on http://${hostname}:${port}`);
});
