import { cn } from "@/lib/utils";
import { Trophy, Star } from "lucide-react";

interface WinningInfo {
  pattern: string;
  position?: number;
  prizeAmount?: number;
}

interface TicketGridProps {
  numbers: (number | null)[][]; // 3x9 grid
  calledNumbers?: number[];
  small?: boolean;
  className?: string;
  winningInfo?: WinningInfo;
  showWinningHighlight?: boolean;
  highlightLine?: "TOP" | "MIDDLE" | "BOTTOM" | "FULL_HOUSE" | "CORNERS" | null;
  ticketNumber?: number;
}

export function TicketGrid({
  numbers,
  calledNumbers = [],
  small = false,
  className,
  winningInfo,
  showWinningHighlight = false,
  highlightLine,
  ticketNumber,
}: TicketGridProps) {
  // Determine which cells should be highlighted based on winning pattern
  const shouldHighlightCell = (rowIndex: number, colIndex: number, num: number | null): boolean => {
    if (!showWinningHighlight || !highlightLine || num === null) return false;

    switch (highlightLine) {
      case "TOP":
        return rowIndex === 0 && calledNumbers.includes(num);
      case "MIDDLE":
        return rowIndex === 1 && calledNumbers.includes(num);
      case "BOTTOM":
        return rowIndex === 2 && calledNumbers.includes(num);
      case "FULL_HOUSE":
        return calledNumbers.includes(num);
      case "CORNERS":
        return (rowIndex === 0 || rowIndex === 2) && calledNumbers.includes(num);
      default:
        return false;
    }
  };

  return (
    <div className="relative">
      {/* Ticket Number Badge */}
      {ticketNumber && (
        <div className="absolute -top-2 -left-2 z-10">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-full shadow-lg border-2 border-white">
            {ticketNumber}
          </div>
        </div>
      )}

      {/* Winning badge */}
      {winningInfo && (
        <div className="absolute -top-3 -right-2 z-10">
          <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
            <Trophy className="w-3 h-3" />
            {winningInfo.pattern.replace(/_/g, " ")}
            {winningInfo.position && (
              <span className="bg-white/20 px-1.5 rounded">#{winningInfo.position}</span>
            )}
          </div>
        </div>
      )}

      {/* Prize amount */}
      {winningInfo?.prizeAmount && !ticketNumber && (
        <div className="absolute -top-3 -left-2 z-10">
          <div className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            <Star className="w-3 h-3" />
            ₹{winningInfo.prizeAmount.toLocaleString()}
          </div>
        </div>
      )}

      <div className={cn("overflow-x-auto", ticketNumber ? "pt-2 pl-2" : "pt-2")}>
        <div className={cn(
          "grid grid-rows-3 gap-0 border-2 rounded-lg overflow-hidden min-w-[240px]",
          winningInfo
            ? "border-yellow-500 bg-yellow-50 shadow-lg shadow-yellow-200"
            : "border-indigo-600 bg-indigo-50",
          className
        )}>
          {numbers.map((row, rowIndex) => (
            <div key={rowIndex} className={cn(
              "grid grid-cols-9 divide-x border-b last:border-b-0",
              winningInfo ? "divide-yellow-200 border-yellow-200" : "divide-indigo-200 border-indigo-200"
            )}>
              {row.map((num, colIndex) => {
                const isMarked = num !== null && calledNumbers.includes(num);
                const isWinningCell = shouldHighlightCell(rowIndex, colIndex, num);

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      "flex items-center justify-center font-bold relative transition-all duration-300",
                      small ? "h-5 sm:h-6 text-[10px] sm:text-xs" : "h-9 sm:h-11 md:h-12 text-sm sm:text-base md:text-lg",
                      // Base cell style
                      num === null
                        ? (winningInfo ? "bg-yellow-50/50" : "bg-indigo-50/50")
                        : "bg-white",
                      // Number text color
                      num !== null && !isMarked && "text-indigo-900",
                      // Marked (called) number style - green theme
                      isMarked && !isWinningCell && "bg-emerald-100 text-emerald-800",
                      // Winning cell highlight - gold theme
                      isWinningCell && "bg-gradient-to-br from-amber-100 to-yellow-200 text-amber-900"
                    )}
                  >
                    {/* Number display */}
                    <span className={cn(
                      "relative z-10 select-none",
                      isMarked && "font-extrabold"
                    )}>
                      {num !== null ? num : ""}
                    </span>

                    {/* Rounded circle mark for called numbers */}
                    {isMarked && num !== null && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {/* Rounded circle with checkmark */}
                        <div className={cn(
                          "absolute rounded-full border-2 flex items-center justify-center",
                          small ? "w-5 h-5" : "w-7 h-7 sm:w-8 sm:h-8",
                          isWinningCell
                            ? "border-amber-500 bg-amber-400/30"
                            : "border-emerald-500 bg-emerald-400/30"
                        )}>
                          {/* Inner checkmark */}
                          <svg
                            className={cn(
                              small ? "w-3 h-3" : "w-4 h-4 sm:w-5 sm:h-5",
                              isWinningCell ? "text-amber-600" : "text-emerald-600"
                            )}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
