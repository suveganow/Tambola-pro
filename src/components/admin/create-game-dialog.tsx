"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Loader2,
  Trash2,
  Trophy,
  Settings,
  Zap,
  Award
} from "lucide-react";
import { useState, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/axios-client";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// Winning rule types
const WINNING_RULE_TYPES = [
  { value: 'FULL_HOUSE', label: 'Full House', description: 'All 15 numbers crossed' },
  { value: 'TOP_LINE', label: 'Top Line', description: 'All 5 numbers in top row' },
  { value: 'MIDDLE_LINE', label: 'Middle Line', description: 'All 5 numbers in middle row' },
  { value: 'BOTTOM_LINE', label: 'Bottom Line', description: 'All 5 numbers in bottom row' },
  { value: 'EARLY_FIVE', label: 'Early Five', description: 'First 5 numbers in any row' },
  { value: 'CORNERS', label: 'Corners', description: '4 corner numbers' },
] as const;

type WinningRuleType = typeof WINNING_RULE_TYPES[number]['value'];

// Prize schema for each winning rule (XP only, no money)
const prizeSchema = z.object({
  name: z.string().min(1, "Prize name is required"),
  xpPoints: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().min(1, "XP must be at least 1")
  ),
  position: z.number().min(1),
});

// Winning rule schema
const winningRuleSchema = z.object({
  type: z.enum(['FULL_HOUSE', 'TOP_LINE', 'MIDDLE_LINE', 'BOTTOM_LINE', 'EARLY_FIVE', 'CORNERS']),
  maxWinners: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().min(1).max(10)
  ),
  prizes: z.array(prizeSchema).min(1, "At least one prize is required"),
});

// Main form schema
const gameSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  totalTickets: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().min(5, "Must have at least 5 tickets")
  ),
  ticketXpCost: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().min(0, "XP cost must be positive")
  ),
  winningRules: z.array(winningRuleSchema).min(1, "At least one winning rule is required"),
  autoClose: z.object({
    enabled: z.boolean(),
    afterWinners: z.preprocess(
      (val) => (typeof val === 'string' ? Number(val) : val),
      z.number().min(1).optional()
    ),
  }),
});

type GameFormValues = z.infer<typeof gameSchema>;

// Default values for a new game
const defaultValues: GameFormValues = {
  name: "",
  totalTickets: 100,
  ticketXpCost: 10,
  winningRules: [
    {
      type: 'FULL_HOUSE',
      maxWinners: 1,
      prizes: [
        { name: "1st Prize", xpPoints: 500, position: 1 }
      ]
    }
  ],
  autoClose: {
    enabled: true,
    afterWinners: 1,
  },
};

// Step indicator component
function StepIndicator({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${i + 1 === step
            ? 'w-8 bg-purple-600'
            : i + 1 < step
              ? 'w-2 bg-purple-400'
              : 'w-2 bg-gray-200'
            }`}
        />
      ))}
    </div>
  );
}

// Prize row component for a winning rule (XP only)
function PrizeRow({
  ruleIndex,
  prizeIndex,
  control,
  register,
  onRemove,
  canRemove,
  errors
}: {
  ruleIndex: number;
  prizeIndex: number;
  control: any;
  register: any;
  onRemove: () => void;
  canRemove: boolean;
  errors: any;
}) {
  const ordinal = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][prizeIndex];

  return (
    <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
        <Trophy className="h-4 w-4 text-white" />
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2">
        <div>
          <Input
            {...register(`winningRules.${ruleIndex}.prizes.${prizeIndex}.name`)}
            placeholder={`${ordinal} Prize`}
            className="text-sm"
          />
          {errors?.winningRules?.[ruleIndex]?.prizes?.[prizeIndex]?.name && (
            <p className="text-red-500 text-xs mt-1">
              {errors.winningRules[ruleIndex].prizes[prizeIndex].name.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <Zap className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-yellow-500" />
            <Input
              {...register(`winningRules.${ruleIndex}.prizes.${prizeIndex}.xpPoints`)}
              type="number"
              placeholder="XP Points"
              className="text-sm pl-7"
            />
            {errors?.winningRules?.[ruleIndex]?.prizes?.[prizeIndex]?.xpPoints && (
              <p className="text-red-500 text-xs mt-1">
                {errors.winningRules[ruleIndex].prizes[prizeIndex].xpPoints.message}
              </p>
            )}
          </div>

          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <input
        type="hidden"
        {...register(`winningRules.${ruleIndex}.prizes.${prizeIndex}.position`)}
        value={prizeIndex + 1}
      />
    </div>
  );
}

// Winning rule configuration component
function WinningRuleConfig({
  ruleIndex,
  rule,
  control,
  register,
  errors,
  onRemove,
}: {
  ruleIndex: number;
  rule: any;
  control: any;
  register: any;
  errors: any;
  onRemove: () => void;
}) {
  const { fields: prizeFields, append: appendPrize, remove: removePrize } = useFieldArray({
    control,
    name: `winningRules.${ruleIndex}.prizes` as const,
  });

  const ruleInfo = WINNING_RULE_TYPES.find(r => r.value === rule.type);

  const addPrize = () => {
    const nextPosition = prizeFields.length + 1;
    const ordinal = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][prizeFields.length];
    appendPrize({
      name: `${ordinal} Prize`,
      xpPoints: 200,
      position: nextPosition,
    });
  };

  return (
    <div className="border border-indigo-200 rounded-xl p-4 bg-gradient-to-br from-white to-indigo-50/30 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Award className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{ruleInfo?.label}</h4>
            <p className="text-xs text-gray-500">{ruleInfo?.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-500 whitespace-nowrap">Max Winners:</Label>
            <Input
              {...register(`winningRules.${ruleIndex}.maxWinners`)}
              type="number"
              min={1}
              max={10}
              className="w-16 h-8 text-sm text-center"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Prize list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">Prizes</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={addPrize}
            disabled={prizeFields.length >= 10}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Prize
          </Button>
        </div>

        <div className="space-y-2">
          {prizeFields.map((prize, prizeIndex) => (
            <PrizeRow
              key={prize.id}
              ruleIndex={ruleIndex}
              prizeIndex={prizeIndex}
              control={control}
              register={register}
              onRemove={() => removePrize(prizeIndex)}
              canRemove={prizeFields.length > 1}
              errors={errors}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CreateGameDialog({ onGameCreated }: { onGameCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<GameFormValues>({
    resolver: zodResolver(gameSchema) as any,
    defaultValues,
  });

  const { fields: ruleFields, append: appendRule, remove: removeRule } = useFieldArray({
    control,
    name: "winningRules",
  });

  const watchAutoClose = watch("autoClose.enabled");
  const watchRules = watch("winningRules");

  // Get available rule types (not already added)
  const getAvailableRuleTypes = useCallback(() => {
    const usedTypes = watchRules?.map(r => r.type) || [];
    return WINNING_RULE_TYPES.filter(r => !usedTypes.includes(r.value));
  }, [watchRules]);

  const addWinningRule = (type: WinningRuleType) => {
    appendRule({
      type,
      maxWinners: 1,
      prizes: [
        { name: "1st Prize", xpPoints: 200, position: 1 }
      ],
    });
  };

  const onSubmit = async (data: GameFormValues) => {
    console.log("Submitting game data:", data);
    setLoading(true);
    try {
      // Calculate total winners for autoClose
      const totalMaxWinners = data.winningRules.reduce((sum, rule) => sum + rule.maxWinners, 0);

      const response = await api.post<any>("/api/games", {
        name: data.name,
        totalTickets: data.totalTickets,
        ticketXpCost: data.ticketXpCost,
        winningRules: data.winningRules.map(rule => ({
          ...rule,
          currentWinners: 0,
          isCompleted: false,
          prizes: rule.prizes.map((prize, idx) => ({
            ...prize,
            position: idx + 1,
            ruleType: rule.type,
            status: 'OPEN',
          })),
        })),
        autoClose: {
          enabled: data.autoClose.enabled,
          afterWinners: data.autoClose.enabled
            ? (data.autoClose.afterWinners || totalMaxWinners)
            : totalMaxWinners,
          currentTotalWinners: 0,
        },
        // Legacy prizes array for backward compatibility
        prizes: data.winningRules.flatMap(rule =>
          rule.prizes.map((prize, idx) => ({
            ...prize,
            position: idx + 1,
            ruleType: rule.type,
            status: 'OPEN',
          }))
        ),
      });

      toast.success("Game created successfully!", {
        description: `"${response.name}" is now ready for players.`,
      });
      setOpen(false);
      setStep(1);
      reset();
      if (onGameCreated) onGameCreated();
    } catch (error: any) {
      console.error("Game creation error:", error);
      const errorMessage = getErrorMessage(error);

      toast.error("Failed to create game", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setStep(1);
      reset();
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast.error("Please check the form for errors", {
      description: Object.keys(errors).map(key => `${key}: ${errors[key]?.message || 'Invalid'}`).join(', ')
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25">
          <Plus className="mr-2 h-4 w-4" /> Create New Game
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Create New Game
          </DialogTitle>
          <DialogDescription>
            Set up a new Tambola game with custom prizes and winning rules.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator step={step} totalSteps={totalSteps} />

        <form onSubmit={handleSubmit(onSubmit, onError)}>
          <ScrollArea className="h-[400px] px-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6 py-4">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl mb-3">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Game Details</h3>
                  <p className="text-sm text-gray-500">Configure the basic game settings</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      Game Name
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g., Weekend Special"
                      className="mt-1"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="totalTickets" className="text-sm font-medium">
                        Total Tickets
                      </Label>
                      <Input
                        id="totalTickets"
                        type="number"
                        {...register("totalTickets")}
                        className="mt-1"
                      />
                      {errors.totalTickets && (
                        <p className="text-red-500 text-xs mt-1">{errors.totalTickets.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="ticketXpCost" className="text-sm font-medium">
                        XP Cost per Ticket
                      </Label>
                      <div className="relative mt-1">
                        <Zap className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500" />
                        <Input
                          id="ticketXpCost"
                          type="number"
                          {...register("ticketXpCost")}
                          className="pl-8"
                        />
                      </div>
                      {errors.ticketXpCost && (
                        <p className="text-red-500 text-xs mt-1">{errors.ticketXpCost.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Winning Rules & Prizes */}
            {step === 2 && (
              <div className="space-y-4 py-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl mb-3">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Winning Rules & Prizes</h3>
                  <p className="text-sm text-gray-500">Add winning rules with prizes and XP</p>
                </div>

                {/* Add Rule Buttons */}
                <div className="flex flex-wrap gap-2 justify-center p-3 bg-gray-50 rounded-lg">
                  {getAvailableRuleTypes().map(ruleType => (
                    <Button
                      key={ruleType.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => addWinningRule(ruleType.value)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {ruleType.label}
                    </Button>
                  ))}
                  {getAvailableRuleTypes().length === 0 && (
                    <p className="text-xs text-gray-500">All rule types have been added</p>
                  )}
                </div>

                {/* Rules List */}
                <div className="space-y-4">
                  {ruleFields.map((rule, index) => (
                    <WinningRuleConfig
                      key={rule.id}
                      ruleIndex={index}
                      rule={watchRules?.[index]}
                      control={control}
                      register={register}
                      errors={errors}
                      onRemove={() => removeRule(index)}
                    />
                  ))}
                </div>

                {errors.winningRules && (
                  <p className="text-red-500 text-xs text-center">
                    {typeof errors.winningRules.message === 'string'
                      ? errors.winningRules.message
                      : "Please check winning rules configuration"}
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Auto-Close Settings */}
            {step === 3 && (
              <div className="space-y-6 py-4">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-3">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Game Completion</h3>
                  <p className="text-sm text-gray-500">Configure when the game should automatically close</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Controller
                      name="autoClose.enabled"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="autoClose"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                        />
                      )}
                    />
                    <div className="flex-1">
                      <Label htmlFor="autoClose" className="font-medium cursor-pointer">
                        Enable Auto-Close
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Automatically close the game after a specified number of winners
                      </p>
                    </div>
                  </div>

                  {watchAutoClose && (
                    <div className="mt-4 ml-7">
                      <Label className="text-sm text-gray-600">Close after how many winners?</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          {...register("autoClose.afterWinners")}
                          type="number"
                          min={1}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-500">winner(s)</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Total configured winners: {
                          watchRules?.reduce((sum, rule) => sum + (Number(rule.maxWinners) || 0), 0) || 0
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-3">Game Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Winning Rules:</span>
                      <span className="font-medium">{watchRules?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Prizes:</span>
                      <span className="font-medium">
                        {watchRules?.reduce((sum, rule) => sum + (rule.prizes?.length || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Winners:</span>
                      <span className="font-medium">
                        {watchRules?.reduce((sum, rule) => sum + (Number(rule.maxWinners) || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total XP Available:</span>
                      <span className="font-medium text-yellow-600">
                        {watchRules?.reduce((sum, rule) =>
                          sum + (rule.prizes?.reduce((pSum, p) => pSum + (Number(p.xpPoints) || 0), 0) || 0),
                          0) || 0} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t bg-gray-50/50">
            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
                className={step === 1 ? "invisible" : ""}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {step < totalSteps ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Game
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
