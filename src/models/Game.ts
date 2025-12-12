import mongoose, { Schema, Document } from 'mongoose';

// Winning rule types for Tambola
export type WinningRuleType =
  | 'FULL_HOUSE'      // All 15 numbers on ticket
  | 'TOP_LINE'        // All 5 numbers in top row
  | 'MIDDLE_LINE'     // All 5 numbers in middle row
  | 'BOTTOM_LINE'     // All 5 numbers in bottom row
  | 'EARLY_FIVE'      // First 5 numbers crossed in any row
  | 'CORNERS';        // 4 corner numbers

export interface IPrize {
  name: string;
  xpPoints: number;
  position: number; // 1st, 2nd, 3rd, etc.
  ruleType: WinningRuleType; // Which winning rule this prize is for
  winner?: string; // User ID
  winnerTicketId?: string; // Ticket ID
  status: 'OPEN' | 'WON';
  wonAt?: Date;
}

export interface IWinningRule {
  type: WinningRuleType;
  maxWinners: number; // Number of winners allowed for this rule
  currentWinners: number; // Current count of winners
  isCompleted: boolean; // All winner slots filled
  prizes: IPrize[]; // Prizes associated with this rule
}

export interface IAutoClose {
  enabled: boolean;
  afterWinners: number; // Close after N total winners
  currentTotalWinners: number;
}

export interface IGame extends Document {
  name: string;
  status: 'WAITING' | 'LIVE' | 'PAUSED' | 'CLOSED';
  ticketXpCost: number;
  totalTickets: number;
  soldTickets: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  drawnNumbers: number[];
  // Legacy prizes array for backward compatibility
  prizes: IPrize[];
  // New winning rules configuration
  winningRules: IWinningRule[];
  // Auto-close configuration
  autoClose: IAutoClose;
}

const PrizeSchema = new Schema({
  name: { type: String, required: true },
  xpPoints: { type: Number, required: true, default: 0, min: 0 },
  position: { type: Number, required: true, min: 1 },
  ruleType: {
    type: String,
    enum: ['FULL_HOUSE', 'TOP_LINE', 'MIDDLE_LINE', 'BOTTOM_LINE', 'EARLY_FIVE', 'CORNERS'],
    required: true
  },
  winner: { type: String },
  winnerTicketId: { type: String },
  status: { type: String, enum: ['OPEN', 'WON'], default: 'OPEN' },
  wonAt: { type: Date }
}, { _id: true });

const WinningRuleSchema = new Schema({
  type: {
    type: String,
    enum: ['FULL_HOUSE', 'TOP_LINE', 'MIDDLE_LINE', 'BOTTOM_LINE', 'EARLY_FIVE', 'CORNERS'],
    required: true
  },
  maxWinners: { type: Number, required: true, min: 1, max: 10 },
  currentWinners: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  prizes: [PrizeSchema]
}, { _id: true });

const AutoCloseSchema = new Schema({
  enabled: { type: Boolean, default: false },
  afterWinners: { type: Number, min: 1, default: 1 },
  currentTotalWinners: { type: Number, default: 0 }
}, { _id: false });

const GameSchema: Schema = new Schema({
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['WAITING', 'LIVE', 'PAUSED', 'CLOSED'],
    default: 'WAITING'
  },
  ticketXpCost: { type: Number, required: true, min: 0 },
  totalTickets: { type: Number, required: true, min: 1 },
  soldTickets: { type: Number, default: 0 },
  createdBy: { type: String, required: true },
  drawnNumbers: { type: [Number], default: [] },
  // Legacy prizes array (kept for backward compatibility)
  prizes: [PrizeSchema],
  // New winning rules with embedded prizes
  winningRules: {
    type: [WinningRuleSchema],
    default: []
  },
  // Auto-close configuration
  autoClose: {
    type: AutoCloseSchema,
    default: { enabled: false, afterWinners: 1, currentTotalWinners: 0 }
  }
}, { timestamps: true });

// Index for faster queries on game status
GameSchema.index({ status: 1 });
GameSchema.index({ createdBy: 1 });
GameSchema.index({ createdAt: -1 });

export default mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);
