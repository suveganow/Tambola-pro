import { Badge } from "@/components/ui/badge";
import { Users, Clock, Trophy } from "lucide-react";

interface GameHeaderProps {
  gameName: string;
  status: "WAITING" | "LIVE" | "PAUSED" | "CLOSED";
  playersConnected: number;
  timeElapsed: string;
  prizes: { name: string; amount: number; status: "OPEN" | "WON" }[];
}

export function GameHeader({
  gameName,
  status,
  playersConnected,
  timeElapsed,
  prizes,
}: GameHeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{gameName}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" /> {playersConnected} Players
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" /> {timeElapsed}
            </span>
          </div>
        </div>
        <Badge
          className="text-lg px-4 py-1"
          variant={status === "LIVE" ? "default" : "secondary"}
        >
          {status}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t">
        {prizes.map((prize, index) => (
          <div
            key={index}
            className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${prize.status === "WON"
              ? "bg-gray-100 text-gray-500 border-gray-200"
              : "bg-yellow-50 text-yellow-800 border-yellow-200"
              }`}
          >
            <Trophy className="w-3 h-3 mr-2" />
            {prize.name}: {prize.amount} XP
            {prize.status === "WON" && <span className="ml-2 text-xs">(WON)</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
