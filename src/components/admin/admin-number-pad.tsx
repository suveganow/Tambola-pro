"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminNumberPadProps {
  drawnNumbers: number[];
  onNumberSelect: (number: number) => void;
  disabled?: boolean;
  onVoiceToggle?: () => void;
  voiceEnabled?: boolean;
}

export function AdminNumberPad({
  drawnNumbers,
  onNumberSelect,
  disabled = false,
  onVoiceToggle,
  voiceEnabled = true,
}: AdminNumberPadProps) {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [isCallingNumber, setIsCallingNumber] = useState(false);

  // Generate numbers 1-90 grouped by columns (like Tambola board)
  const getNumbersByColumn = () => {
    const columns: number[][] = [];
    for (let col = 0; col < 9; col++) {
      const start = col === 0 ? 1 : col * 10;
      const end = col === 8 ? 90 : (col + 1) * 10 - 1;
      const nums: number[] = [];
      for (let n = start; n <= end; n++) {
        nums.push(n);
      }
      columns.push(nums);
    }
    return columns;
  };

  const handleNumberClick = useCallback(async (num: number) => {
    if (disabled || drawnNumbers.includes(num) || isCallingNumber) return;

    setSelectedNumber(num);
    setIsCallingNumber(true);

    try {
      await onNumberSelect(num);
      toast.success(`Number ${num} called!`, {
        description: "The number has been announced to all players.",
      });
    } catch (error) {
      toast.error("Failed to call number");
    } finally {
      setIsCallingNumber(false);
      setSelectedNumber(null);
    }
  }, [disabled, drawnNumbers, isCallingNumber, onNumberSelect]);

  const columns = getNumbersByColumn();
  const remainingNumbers = 90 - drawnNumbers.length;

  return (
    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold text-lg">Number Pad</h3>
            <p className="text-indigo-100 text-sm">
              {remainingNumbers} numbers remaining
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onVoiceToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onVoiceToggle}
                className="text-white hover:bg-white/20"
              >
                {voiceEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </Button>
            )}
            {isCallingNumber && (
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Calling...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Number Display */}
      {selectedNumber && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 text-center">
          <span className="text-white font-bold text-2xl">
            Calling: {selectedNumber}
          </span>
        </div>
      )}

      {/* Number Grid */}
      <div className="p-4">
        <div className="grid grid-cols-9 gap-1.5">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-1.5">
              {column.map((num) => {
                const isDrawn = drawnNumbers.includes(num);
                const isSelected = selectedNumber === num;

                return (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    disabled={disabled || isDrawn || isCallingNumber}
                    className={cn(
                      "w-full aspect-square rounded-lg font-bold text-sm transition-all duration-200",
                      "flex items-center justify-center",
                      "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1",
                      isDrawn
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed line-through"
                        : isSelected
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white scale-110 shadow-lg"
                          : "bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-800 hover:from-indigo-200 hover:to-purple-200 hover:scale-105 cursor-pointer shadow-sm",
                      disabled && !isDrawn && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t p-3 bg-gray-50">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-100 to-purple-100" />
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200" />
            <span className="text-gray-600">Called</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-400 to-orange-500" />
            <span className="text-gray-600">Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
