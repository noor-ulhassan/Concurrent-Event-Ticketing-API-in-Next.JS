import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Ticket } from "@/models/Ticket";
import { ratelimit } from "@/lib/redis";

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests. You are being rate limited." }, { status: 429 });
    }
    
    await connectDB();
    const body = await request.json();
    const { eventId, userId } = body;
    
    if (!eventId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    
    // Hold expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    const ticket = await Ticket.findOneAndUpdate(
      { eventId, status: "Available" },
      { 
        $set: { 
          status: "Held", 
          userId: userId, 
          holdExpiresAt: expiresAt 
        } 
      },
      { new: true } // Atomically updates and returns the updated document
    );
    
    if (!ticket) {
      return NextResponse.json({ error: "Sold out or no available tickets" }, { status: 400 });
    }
    
    return NextResponse.json({ message: "Ticket reserved successfully", ticket }, { status: 200 });
  } catch (error) {
    console.error("Reserve Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
