import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Ticket } from "@/models/Ticket";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    await connectDB();
    
    // Also populate the event data so the frontend can display Event names
    const tickets = await Ticket.find({ userId }).populate('eventId').sort({ holdExpiresAt: 1 });
    
    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch user tickets:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
