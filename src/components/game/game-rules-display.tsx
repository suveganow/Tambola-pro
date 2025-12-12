"use client";

import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Crown, Layers, Grid3X3, Star } from "lucide-react";

interface WinningRule {
  type: string;
  maxWinners: number;
  currentWinners?: number;
  isCompleted?: boolean;
  prizes?: Array<{
    name: string;
    amount: number;
    position?: number;
    status?: string;
  }>;
}

interface GameRulesDisplayProps {
  winningRules?: WinningRule[];
  compact?: boolean;
  showPrizes?: boolean;
}

const RULE_ICONS: Record<string, React.ReactNode> = {
  EARLY_FIVE: <Star className="w-3 h-3" />,
  TOP_LINE: <Layers className="w-3 h-3" />,
  MIDDLE_LINE: <Layers className="w-3 h-3" />,
  BOTTOM_LINE: <Layers className="w-3 h-3" />,
  FULL_HOUSE: <Grid3X3 className="w-3 h-3" />,
  CORNERS: <Target className="w-3 h-3" />,
};

const RULE_COLORS: Record<string, string> = {
  EARLY_FIVE: "bg-pink-100 text-pink-700 border-pink-200",
  TOP_LINE: "bg-blue-100 text-blue-700 border-blue-200",
  MIDDLE_LINE: "bg-purple-100 text-purple-700 border-purple-200",
  BOTTOM_LINE: "bg-indigo-100 text-indigo-700 border-indigo-200",
  FULL_HOUSE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CORNERS: "bg-orange-100 text-orange-700 border-orange-200",
};

export function GameRulesDisplay({
  winningRules = [],
  compact = false,
  showPrizes = true,
}: GameRulesDisplayProps) {
  if (!winningRules || winningRules.length === 0) {
    return null;
  }

  const formatRuleName = (type: string) => {
    return type.replace(/_/g, " ");
  };

  // Calculate total prize pool
  const totalPrizePool = winningRules.reduce((total, rule) => {
    const rulePrizes = rule.prizes?.reduce((sum, prize) => sum + prize.amount, 0) || 0;
    return total + rulePrizes;
  }, 0);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {winningRules.map((rule, index) => (
          <Badge
            key={index}
            variant="outline"
            className={`text-[10px] py-0.5 px-1.5 ${RULE_COLORS[rule.type] || 'bg-gray-100 text-gray-700'}`}
          >
            {RULE_ICONS[rule.type]}
            <span className="ml-1">{formatRuleName(rule.type)}</span>
            {rule.isCompleted && <Trophy className="w-2.5 h-2.5 ml-1 text-yellow-500" />}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Total Prize Pool */}
      {showPrizes && totalPrizePool > 0 && (
        <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
          <Crown className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            Total Prizes:
          </span>
          <span className="text-sm font-bold text-yellow-900">
            ₹{totalPrizePool.toLocaleString()}
          </span>
        </div>
      )}

      {/* Rules List */}
      <div className="grid gap-2">
        {winningRules.map((rule, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-2 rounded-lg border ${rule.isCompleted
                ? 'bg-gray-50 border-gray-200 opacity-60'
                : RULE_COLORS[rule.type] || 'bg-gray-50 border-gray-200'
              }`}
          >
            <div className="flex items-center gap-2">
              {RULE_ICONS[rule.type]}
              <span className="text-sm font-medium">
                {formatRuleName(rule.type)}
              </span>
              {rule.isCompleted && (
                <Badge className="bg-gray-400 text-white text-[10px] py-0 px-1.5">
                  WON
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              {rule.maxWinners > 1 && (
                <span className="text-gray-500">
                  {rule.currentWinners || 0}/{rule.maxWinners} winners
                </span>
              )}
              {showPrizes && rule.prizes && rule.prizes.length > 0 && (
                <span className="font-bold">
                  ₹{rule.prizes.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
