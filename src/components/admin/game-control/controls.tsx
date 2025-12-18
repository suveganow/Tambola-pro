import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Zap, StopCircle } from "lucide-react";

interface GameControlsProps {
  gameStatus: "WAITING" | "LIVE" | "PAUSED" | "CLOSED";
  isAutoPlaying?: boolean;
  onStart: () => void;
  onStartAutoPlay?: () => void;
  onStopAutoPlay?: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onDraw?: () => void;
  canDraw?: boolean;
}

export function GameControls({
  gameStatus,
  isAutoPlaying = false,
  onStart,
  onStartAutoPlay,
  onStopAutoPlay,
  onPause,
  onResume,
  onEnd,
  onDraw,
  canDraw,
}: GameControlsProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-2 gap-4">
        {/* Start Game */}
        {gameStatus === "WAITING" && (
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 w-full col-span-2"
            onClick={onStart}
          >
            <Play className="mr-2 h-5 w-5" /> Start Game
          </Button>
        )}

        {/* Auto-Play Controls */}
        {gameStatus === "LIVE" && !isAutoPlaying && onStartAutoPlay && (
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full col-span-2 shadow-lg"
            onClick={onStartAutoPlay}
          >
            <Zap className="mr-2 h-5 w-5" /> Start Auto-Play
          </Button>
        )}

        {gameStatus === "LIVE" && isAutoPlaying && onStopAutoPlay && (
          <Button
            size="lg"
            variant="outline"
            className="w-full col-span-2 border-orange-500 text-orange-500 hover:bg-orange-50"
            onClick={onStopAutoPlay}
          >
            <StopCircle className="mr-2 h-5 w-5" /> Stop Auto-Play
          </Button>
        )}

        {/* Pause/Resume */}
        {gameStatus === "LIVE" && (
          <Button
            size="lg"
            className="bg-yellow-500 hover:bg-yellow-600 text-black w-full"
            onClick={onPause}
          >
            <Pause className="mr-2 h-5 w-5" /> Pause Game
          </Button>
        )}

        {gameStatus === "PAUSED" && (
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 w-full"
            onClick={onResume}
          >
            <Play className="mr-2 h-5 w-5" /> Resume Game
          </Button>
        )}

        {/* End Game */}
        {(gameStatus === "LIVE" || gameStatus === "PAUSED") && (
          <Button
            size="lg"
            variant="destructive"
            className="w-full"
            onClick={onEnd}
          >
            <Square className="mr-2 h-5 w-5" /> End Game
          </Button>
        )}
      </div>

      {/* Auto-play status indicator */}
      {isAutoPlaying && (
        <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-purple-700">
            Auto-play active - Numbers every 3 seconds
          </span>
        </div>
      )}

      {/* Manual Draw Button (legacy support) */}
      {onDraw && !isAutoPlaying && gameStatus === "LIVE" && (
        <Button
          size="lg"
          className="w-full h-20 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg transform active:scale-95 transition-all"
          onClick={onDraw}
          disabled={!canDraw}
        >
          <Zap className="mr-3 h-7 w-7" />
          DRAW NUMBER
        </Button>
      )}
    </div>
  );
}
