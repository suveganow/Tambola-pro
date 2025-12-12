"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSocket, connectSocket, joinGame, callNumber } from "@/lib/socket";
import { Loader2, Check, X, Trophy } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { TicketGrid } from "@/components/ticket/ticket-grid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminGameRoom() {
  const params = useParams();
  const gameId = params.id as string;
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingTickets, setPendingTickets] = useState<any[]>([]);
  const [winnerClaim, setWinnerClaim] = useState<any>(null);

  useEffect(() => {
    const socket = connectSocket();
    joinGame(gameId);

    socket.on("claim-win", ({ ticketId, pattern, userId }) => {
      setWinnerClaim({ ticketId, pattern, userId });
    });

    return () => {
      socket.off("claim-win");
    };
  }, [gameId]);

  // Poll for pending tickets
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await axios.get(`/api/admin/tickets?gameId=${gameId}&status=PENDING`);
        setPendingTickets(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 5000);
    return () => clearInterval(interval);
  }, [gameId]);

  const handleTicketAction = async (ticketId: string, status: 'ACTIVE' | 'REJECTED') => {
    try {
      await axios.patch('/api/admin/tickets', { ticketId, status });
      setPendingTickets(prev => prev.filter(t => t._id !== ticketId));
      toast.success(`Ticket ${status === 'ACTIVE' ? 'Approved' : 'Rejected'}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update ticket");
    }
  };

  const callNextNumber = async () => {
    if (calledNumbers.length >= 90) {
      toast.error("All numbers called!");
      return;
    }

    setLoading(true);
    try {
      let nextNum;
      do {
        nextNum = Math.floor(Math.random() * 90) + 1;
      } while (calledNumbers.includes(nextNum));

      setCalledNumbers((prev) => [...prev, nextNum]);
      setCurrentNumber(nextNum);
      callNumber(gameId, nextNum);
    } catch (error) {
      console.error(error);
      toast.error("Failed to call number");
    } finally {
      setLoading(false);
    }
  };

  const confirmWinner = () => {
    if (!winnerClaim) return;
    const socket = getSocket();
    socket.emit("winner-confirmed", {
      gameId,
      winnerName: "Player",
      pattern: winnerClaim.pattern,
      prize: 500
    });
    setWinnerClaim(null);
    toast.success("Winner confirmed!");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Game Room (Admin)</h1>
        <div className="text-base sm:text-xl font-mono bg-gray-100 px-3 sm:px-4 py-2 rounded w-full sm:w-auto text-center">
          Game ID: {gameId}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left: Caller */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 py-8 sm:py-12 bg-white rounded-xl shadow-sm border">
            <div className="text-center w-full px-4 sm:px-8">
              <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-2">Current Number</div>
              <div className="text-6xl sm:text-8xl lg:text-9xl font-bold text-purple-600 mb-6 sm:mb-8">
                {currentNumber || "--"}
              </div>

              {/* Progress */}
              <div className="space-y-2 mb-6 sm:mb-8">
                <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                  <span>Progress</span>
                  <span>{calledNumbers.length} / 90</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-500 ease-out"
                    style={{ width: `${(calledNumbers.length / 90) * 100}%` }}
                  />
                </div>
              </div>

              {/* Recent */}
              {calledNumbers.length > 0 && (
                <div className="flex justify-center gap-2 overflow-x-auto py-4 mb-4">
                  {calledNumbers.slice(-5).reverse().map((num, i) => (
                    <div key={i} className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-100 text-sm sm:text-base">
                      {num}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="text-lg sm:text-xl px-6 sm:px-8 py-4 sm:py-6 bg-purple-600 hover:bg-purple-700"
              onClick={callNextNumber}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : null}
              Call Next Number
            </Button>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Called Numbers</h3>
            <div className="overflow-x-auto -mx-2 px-2 pb-2">
              <div className="flex flex-wrap gap-1.5 sm:gap-2 min-w-[280px]">
                {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => (
                  <div
                    key={num}
                    className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-colors ${calledNumbers.includes(num)
                      ? "bg-purple-100 text-purple-700 border-2 border-purple-200"
                      : "bg-gray-50 text-gray-300"
                      }`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Management */}
        <div className="space-y-6">
          {/* Pending Tickets */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Pending Tickets ({pendingTickets.length})</h3>
            <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto">
              {pendingTickets.length === 0 ? (
                <div className="text-center text-gray-500 py-6 sm:py-8">No pending tickets.</div>
              ) : (
                pendingTickets.map((ticket) => (
                  <div key={ticket._id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm sm:text-base">Ticket #{ticket._id.slice(-4)}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <TicketGrid numbers={ticket.numbers} small />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                        onClick={() => handleTicketAction(ticket._id, 'ACTIVE')}
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 text-xs sm:text-sm"
                        onClick={() => handleTicketAction(ticket._id, 'REJECTED')}
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Claim Dialog */}
      <Dialog open={!!winnerClaim} onOpenChange={(open) => !open && setWinnerClaim(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Winner Claimed!</DialogTitle>
            <DialogDescription>
              A player has claimed <strong>{winnerClaim?.pattern}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Ticket ID: {winnerClaim?.ticketId}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWinnerClaim(null)}>Reject</Button>
            <Button onClick={confirmWinner} className="bg-green-600 hover:bg-green-700">
              Confirm Winner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
