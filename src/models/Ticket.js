import mongoose, { mongo } from "mongoose";

const ticketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
  },
  status: {
    type: String,
    enum: ["Available", "Held", "Purchased"],
    default: "Available",
  },
  userId: {
    type: String,
  },
  holdExpiresAt: {
    type: Date,
  },
});

export const Ticket =
  mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
