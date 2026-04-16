import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Ticket } from "@/models/Ticket";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { ticketId, userId } = body;
    
    if (!ticketId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    
    const ticket = await Ticket.findOneAndUpdate(
      { 
        _id: ticketId, 
        userId: userId, 
        status: "Held",
        holdExpiresAt: { $gt: new Date() } // Ensures the hold hasn't expired
      },
      { 
        $set: { status: "Purchased" },
        $unset: { holdExpiresAt: "" }
      },
      { new: true }
    );
    
    if (!ticket) {
      return NextResponse.json({ error: "Ticket holding expired, or not found" }, { status: 400 });
    }
    
    return NextResponse.json({ message: "Ticket purchased successfully", ticket }, { status: 200 });
  } catch (error) {
    console.error("Purchase Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
