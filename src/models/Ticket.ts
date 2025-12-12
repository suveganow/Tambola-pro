import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  gameId: mongoose.Types.ObjectId;
  userId: string;
  ticketNumber: number; // Serial number starting from 1
  numbers: (number | null)[][]; // 3x9 grid
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  createdAt: Date;
}

const TicketSchema: Schema = new Schema({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  userId: { type: String, required: true },
  ticketNumber: { type: Number, required: true }, // Serial ticket number per game
  numbers: { type: [[Schema.Types.Mixed]], required: true }, // Mixed to allow nulls
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'REJECTED'],
    default: 'PENDING'
  },
}, { timestamps: true });

// Compound index for unique ticket number per game
TicketSchema.index({ gameId: 1, ticketNumber: 1 }, { unique: true });
// Index for user queries
TicketSchema.index({ userId: 1 });
// Index for game queries
TicketSchema.index({ gameId: 1 });

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
