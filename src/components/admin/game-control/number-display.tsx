import { cn } from "@/lib/utils";

interface NumberDisplayProps {
  currentNumber: number | null;
  isAnimating?: boolean;
}

export function NumberDisplay({ currentNumber, isAnimating }: NumberDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-xl text-white min-h-[200px]">
      <div className="text-sm uppercase tracking-wider font-semibold mb-2 opacity-80">
        Current Number
      </div>
      <div
        className={cn(
          "text-8xl font-black transition-all duration-300 transform",
          isAnimating ? "scale-110 opacity-80" : "scale-100 opacity-100",
          !currentNumber && "text-6xl opacity-50"
        )}
      >
        {currentNumber || "--"}
      </div>
      {currentNumber && (
        <div className="mt-4 text-xl font-medium bg-white/20 px-4 py-1 rounded-full">
          " {getNumberText(currentNumber)} "
        </div>
      )}
    </div>
  );
}

function getNumberText(num: number): string {
  // Simple number to text converter for demo
  return `Number ${num}`;
}
