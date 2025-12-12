"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ticket, Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface TicketSlot {
  ticketNumber: number;
  status: "AVAILABLE" | "PENDING" | "ACTIVE" | "REJECTED";
  isBooked: boolean;
  userId: string | null;
}

interface AllTicketsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  gameName: string;
  ticketPrice: number;
  currentUserId?: string;
  onBookingComplete: () => void;
}

export function AllTicketsModal({
  open,
  onOpenChange,
  gameId,
  gameName,
  ticketPrice,
  currentUserId,
  onBookingComplete,
}: AllTicketsModalProps) {
  const [tickets, setTickets] = useState<TicketSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [totalTickets, setTotalTickets] = useState(0);
  const [soldTickets, setSoldTickets] = useState(0);

  // Fetch all tickets when modal opens
  useEffect(() => {
    if (open && gameId) {
      fetchTickets();
    }
  }, [open, gameId]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/games/${gameId}/tickets`);
      setTickets(res.data.tickets);
      setTotalTickets(res.data.totalTickets);
      setSoldTickets(res.data.soldTickets);
    } catch (error: any) {
      console.error("Error fetching tickets:", error);

      let errorMessage = "Failed to load tickets";
      if (error.response?.status === 404) {
        errorMessage = "Game not found";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error loading tickets";
      } else if (!error.response) {
        errorMessage = "Unable to connect to server";
      }

      toast.error(errorMessage, {
        description: "Please try again or refresh the page.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = (ticketNumber: number, ticket: TicketSlot) => {
    // Can't select booked tickets
    if (ticket.isBooked) return;

    // Toggle selection
    if (selectedTickets.includes(ticketNumber)) {
      setSelectedTickets(selectedTickets.filter(n => n !== ticketNumber));
    } else {
      // Max 6 tickets
      if (selectedTickets.length >= 6) {
        toast.warning("Maximum 6 tickets per booking");
        return;
      }
      setSelectedTickets([...selectedTickets, ticketNumber]);
    }
  };

  const handleBookTickets = async () => {
    if (selectedTickets.length === 0) return;

    setIsBooking(true);
    try {
      await axios.post("/api/tickets/buy", {
        gameId,
        ticketNumbers: selectedTickets,
      });
      toast.success(`${selectedTickets.length} ticket(s) booked successfully!`, {
        description: `Tickets for "${gameName}" have been reserved.`,
      });
      setSelectedTickets([]);
      onBookingComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Booking error:", error);

      let errorMessage = "Failed to book tickets. Please try again.";

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          errorMessage = "Please log in to book tickets.";
        } else if (status === 400) {
          errorMessage = data?.error || "Invalid ticket selection.";
        } else if (status === 409) {
          errorMessage = "Some tickets are no longer available.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (data?.error) {
          errorMessage = typeof data.error === 'string' ? data.error : "Booking failed.";
        }
      } else if (error.request) {
        errorMessage = "Unable to connect to server.";
      }

      toast.error("Booking Failed", {
        description: errorMessage,
        duration: 5000,
      });

      // Refresh tickets in case some were booked by others
      fetchTickets();
    } finally {
      setIsBooking(false);
    }
  };

  const getTicketStyle = (ticket: TicketSlot) => {
    const isSelected = selectedTickets.includes(ticket.ticketNumber);
    const isOwnTicket = ticket.userId === currentUserId;

    if (isSelected) {
      return "bg-gradient-to-br from-green-400 to-emerald-500 text-white border-green-600 scale-105 shadow-lg";
    }
    if (ticket.status === "ACTIVE") {
      return isOwnTicket
        ? "bg-gradient-to-br from-purple-400 to-indigo-500 text-white border-purple-600"
        : "bg-gray-200 text-gray-500 cursor-not-allowed";
    }
    if (ticket.status === "PENDING") {
      return isOwnTicket
        ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-yellow-600"
        : "bg-yellow-100 text-yellow-700 cursor-not-allowed";
    }
    if (ticket.status === "REJECTED" || !ticket.isBooked) {
      return "bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-800 hover:from-blue-200 hover:to-indigo-200 cursor-pointer border-indigo-300";
    }
    return "bg-gray-100 text-gray-400 cursor-not-allowed";
  };

  const availableCount = tickets.filter(t => !t.isBooked).length;
  const totalCost = selectedTickets.length * ticketPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Ticket className="w-6 h-6 text-purple-600" />
            All Tickets - {gameName}
          </DialogTitle>
          <DialogDescription>
            Select the tickets you want to book. Maximum 6 tickets per booking.
          </DialogDescription>
        </DialogHeader>

        {/* Stats Bar */}
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div className="flex gap-4 text-sm">
            <div>
              Total: <span className="font-bold">{totalTickets}</span>
            </div>
            <div>
              Available: <span className="font-bold text-green-600">{availableCount}</span>
            </div>
            <div>
              Booked: <span className="font-bold text-gray-600">{soldTickets}</span>
            </div>
          </div>
          <div className="text-sm font-medium">
            Price: <span className="text-purple-600">₹{ticketPrice}</span> per ticket
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-100 to-indigo-100 border border-indigo-300" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-green-400 to-emerald-500" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-gray-200" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-400 to-indigo-500" />
            <span>Your Ticket</span>
          </div>
        </div>

        {/* Ticket Grid */}
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 lg:grid-cols-20 gap-2">
              {tickets.map((ticket) => (
                <button
                  key={ticket.ticketNumber}
                  onClick={() => handleTicketClick(ticket.ticketNumber, ticket)}
                  disabled={ticket.isBooked || isBooking}
                  className={cn(
                    "relative aspect-square rounded-lg font-bold text-sm transition-all duration-200",
                    "flex items-center justify-center border-2",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1",
                    getTicketStyle(ticket)
                  )}
                >
                  {ticket.ticketNumber}
                  {selectedTickets.includes(ticket.ticketNumber) && (
                    <Check className="absolute -top-1 -right-1 w-4 h-4 bg-white text-green-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selection Summary */}
        {selectedTickets.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600">Selected tickets: </span>
                <span className="font-bold text-green-700">
                  #{selectedTickets.sort((a, b) => a - b).join(", #")}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-xl font-bold text-green-700">₹{totalCost}</div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedTickets([])}
            disabled={selectedTickets.length === 0 || isBooking}
          >
            Clear Selection
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBooking}>
            Cancel
          </Button>
          <Button
            onClick={handleBookTickets}
            disabled={selectedTickets.length === 0 || isBooking}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isBooking ? "Booking..." : `Book ${selectedTickets.length} Ticket(s) - ₹${totalCost}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
