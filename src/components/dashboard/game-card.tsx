import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Ticket, Clock, Ban, Lock } from "lucide-react";

interface GameCardProps {
  id: string;
  name: string;
  status: "WAITING" | "LIVE" | "PAUSED" | "CLOSED";
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  startTime: string;
  onBook: (id: string) => void;
  onJoinGame?: (id: string) => void;
}

export function GameCard({
  id,
  name,
  status,
  ticketPrice,
  totalTickets,
  soldTickets,
  startTime,
  onBook,
  onJoinGame,
}: GameCardProps) {
  const availableTickets = totalTickets - soldTickets;

  // Determine if booking is disabled and why
  const isGameClosed = status === "CLOSED";
  const isGamePaused = status === "PAUSED";
  const isGameLive = status === "LIVE";
  const isSoldOut = availableTickets === 0;
  const canBook = status === "WAITING" && !isSoldOut;
  const canJoin = status === "LIVE" || status === "PAUSED";

  // Get button text and style based on status
  const getButtonContent = () => {
    if (isGameClosed) {
      return {
        text: "Game Closed",
        icon: <Lock className="mr-2 h-4 w-4" />,
        className: "bg-gray-400 cursor-not-allowed",
        disabled: true,
      };
    }
    if (isGamePaused) {
      return {
        text: "Game Paused",
        icon: <Ban className="mr-2 h-4 w-4" />,
        className: "bg-yellow-500 cursor-not-allowed",
        disabled: true,
      };
    }
    if (isGameLive && onJoinGame) {
      return {
        text: "Join Live Game",
        icon: <Ticket className="mr-2 h-4 w-4" />,
        className: "bg-green-600 hover:bg-green-700",
        disabled: false,
      };
    }
    if (isSoldOut) {
      return {
        text: "Sold Out",
        icon: <Ban className="mr-2 h-4 w-4" />,
        className: "bg-gray-400 cursor-not-allowed",
        disabled: true,
      };
    }
    return {
      text: "Book Ticket",
      icon: <Ticket className="mr-2 h-4 w-4" />,
      className: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
      disabled: !canBook,
    };
  };

  const buttonContent = getButtonContent();

  // Get badge color based on status
  const getBadgeClass = () => {
    switch (status) {
      case "LIVE":
        return "bg-green-500 hover:bg-green-600 animate-pulse";
      case "WAITING":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "PAUSED":
        return "bg-yellow-500 hover:bg-yellow-600 text-black";
      case "CLOSED":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "";
    }
  };

  const handleClick = () => {
    if (isGameLive && onJoinGame) {
      onJoinGame(id);
    } else if (canBook) {
      onBook(id);
    }
  };

  return (
    <Card className={`flex flex-col h-full hover:shadow-lg transition-all duration-200 cursor-pointer ${isGameClosed ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold text-purple-900">{name}</CardTitle>
          <Badge className={getBadgeClass()}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="mr-2 h-4 w-4 text-purple-500" />
          <span>Starts: {startTime}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-xs text-purple-600 uppercase font-semibold">Price</div>
            <div className="text-lg font-bold text-purple-900">₹{ticketPrice}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-xs text-blue-600 uppercase font-semibold">Tickets</div>
            <div className="text-lg font-bold text-blue-900">{availableTickets} left</div>
          </div>
        </div>

        {/* Status message for closed/paused games */}
        {isGameClosed && (
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>This game has ended. Booking is no longer available.</span>
          </div>
        )}
        {isGamePaused && (
          <div className="flex items-center gap-2 p-2 bg-yellow-100 rounded-lg text-sm text-yellow-700">
            <Ban className="h-4 w-4" />
            <span>Game is paused. Please wait for the admin to resume.</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full text-white font-bold ${buttonContent.className}`}
          onClick={handleClick}
          disabled={buttonContent.disabled}
        >
          {buttonContent.icon}
          {buttonContent.text}
        </Button>
      </CardFooter>
    </Card>
  );
}
