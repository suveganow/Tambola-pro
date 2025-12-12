"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { TicketGrid } from "@/components/ticket/ticket-grid";
import { Loader2, AlertCircle, Lock } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  gameName: string;
  ticketPrice: number;
  gameStatus?: "WAITING" | "LIVE" | "PAUSED" | "CLOSED";
  onConfirm: () => void;
}

export function BookingDialog({
  open,
  onOpenChange,
  gameId,
  gameName,
  ticketPrice,
  gameStatus,
  onConfirm,
}: BookingDialogProps) {
  const [isBooking, setIsBooking] = useState(false);
  const [currentGameStatus, setCurrentGameStatus] = useState(gameStatus);
  const [isVerifying, setIsVerifying] = useState(false);

  // Verify game status when dialog opens
  useEffect(() => {
    if (open && gameId) {
      verifyGameStatus();
    }
  }, [open, gameId]);

  const verifyGameStatus = async () => {
    setIsVerifying(true);
    try {
      const res = await axios.get(`/api/games/${gameId}`);
      setCurrentGameStatus(res.data.status);
    } catch (error) {
      console.error("Failed to verify game status:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirm = async () => {
    // Final status check before booking
    if (currentGameStatus !== "WAITING") {
      toast.error(getStatusErrorMessage(currentGameStatus));
      onOpenChange(false);
      return;
    }

    setIsBooking(true);
    try {
      await axios.post("/api/tickets/buy", {
        gameId,
        quantity: 1,
      });
      toast.success("Ticket booked successfully!", {
        description: `Your ticket for "${gameName}" has been reserved.`,
      });
      onConfirm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Booking error:", error);

      let errorMessage = "Failed to book ticket. Please try again.";

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          errorMessage = "Please log in to book tickets.";
        } else if (status === 400) {
          errorMessage = data?.error || "Invalid booking request.";
        } else if (status === 404) {
          errorMessage = "Game not found. It may have been removed.";
        } else if (status === 409) {
          errorMessage = data?.error || "Ticket is no longer available.";
        } else if (status === 500) {
          errorMessage = "Server error occurred. Please try again later.";
        } else if (data?.error) {
          errorMessage = typeof data.error === 'string' ? data.error : "Booking failed.";
        }
      } else if (error.request) {
        errorMessage = "Unable to connect to server. Check your connection.";
      }

      toast.error("Booking Failed", {
        description: errorMessage,
        duration: 5000,
      });

      // Refresh game status in case it changed
      verifyGameStatus();
    } finally {
      setIsBooking(false);
    }
  };

  const getStatusErrorMessage = (status?: string) => {
    switch (status) {
      case "CLOSED":
        return "This game has ended. Booking is no longer available.";
      case "LIVE":
        return "This game has started. You can no longer book tickets.";
      case "PAUSED":
        return "This game is currently paused. Please try again later.";
      default:
        return "Game is not accepting bookings at this time.";
    }
  };

  const isGameUnavailable = currentGameStatus && currentGameStatus !== "WAITING";

  // Generate a random preview ticket
  const previewTicket = generateRandomTicket();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isGameUnavailable ? "Booking Unavailable" : "Confirm Booking"}
          </DialogTitle>
          <DialogDescription>
            {isGameUnavailable ? (
              <span className="text-red-600">{gameName}</span>
            ) : (
              <>
                You are booking a ticket for{" "}
                <span className="font-bold text-purple-700">{gameName}</span>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isVerifying ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-gray-500">Verifying game availability...</p>
          </div>
        ) : isGameUnavailable ? (
          <div className="py-6 space-y-4">
            <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200">
              <Lock className="h-12 w-12 text-red-500 mb-3" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                {currentGameStatus === "CLOSED" ? "Game Closed" :
                  currentGameStatus === "LIVE" ? "Game In Progress" :
                    currentGameStatus === "PAUSED" ? "Game Paused" : "Unavailable"}
              </h3>
              <p className="text-center text-red-600 text-sm">
                {getStatusErrorMessage(currentGameStatus)}
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                The game status may have changed since you last viewed it. Please refresh the page to see updated game information.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Ticket Price:</span>
              <span className="font-bold text-lg">₹{ticketPrice}</span>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Your Ticket Preview:</div>
              <TicketGrid numbers={previewTicket} />
              <p className="text-xs text-gray-500 text-center">
                * This is a randomly generated ticket. Your actual ticket numbers may vary.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {isGameUnavailable ? (
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-gray-600 hover:bg-gray-700"
            >
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBooking}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isBooking || isVerifying}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isBooking ? "Booking..." : "Confirm & Pay"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper to generate a valid Tambola ticket structure (simplified for preview)
function generateRandomTicket(): (number | null)[][] {
  const grid: (number | null)[][] = Array(3).fill(null).map(() => Array(9).fill(null));

  for (let r = 0; r < 3; r++) {
    const cols = new Set<number>();
    while (cols.size < 5) {
      cols.add(Math.floor(Math.random() * 9));
    }

    Array.from(cols).forEach(c => {
      const min = c * 10 + 1;
      const max = c === 8 ? 90 : (c + 1) * 10;
      grid[r][c] = Math.floor(Math.random() * (max - min + 1)) + min;
    });
  }

  return grid;
}
