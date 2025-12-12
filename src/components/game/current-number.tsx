import { cn } from "@/lib/utils";

interface CurrentNumberProps {
  currentNumber: number | null;
  lastNumbers: number[];
  isAnimating?: boolean;
}

export function CurrentNumber({ currentNumber, lastNumbers, isAnimating }: CurrentNumberProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center">
        <div className="text-sm uppercase tracking-wider font-semibold mb-2 opacity-80">
          Current Number
        </div>
        <div
          className={cn(
            "text-9xl font-black transition-all duration-300 transform",
            isAnimating ? "scale-110 opacity-80" : "scale-100 opacity-100",
            !currentNumber && "text-7xl opacity-50"
          )}
        >
          {currentNumber || "--"}
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Last 5 Numbers
        </div>
        <div className="flex gap-2">
          {lastNumbers.slice(0, 5).map((num, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-full bg-white border flex items-center justify-center font-bold text-gray-700 shadow-sm"
            >
              {num}
            </div>
          ))}
          {lastNumbers.length === 0 && (
            <span className="text-sm text-gray-400 italic">Waiting for start...</span>
          )}
        </div>
      </div>
    </div>
  );
}
