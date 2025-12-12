import { cn } from "@/lib/utils";

interface NumberGridProps {
  drawnNumbers: number[];
}

export function NumberGrid({ drawnNumbers }: NumberGridProps) {
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="grid grid-cols-10 gap-1 sm:gap-2 p-3 sm:p-4 bg-white rounded-xl border shadow-sm min-w-[280px]">
        {numbers.map((num) => {
          const isDrawn = drawnNumbers.includes(num);
          return (
            <div
              key={num}
              className={cn(
                "aspect-square flex items-center justify-center text-xs sm:text-sm font-bold rounded-md transition-colors",
                isDrawn
                  ? "bg-green-500 text-white shadow-inner"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {num}
            </div>
          );
        })}
      </div>
    </div>
  );
}
