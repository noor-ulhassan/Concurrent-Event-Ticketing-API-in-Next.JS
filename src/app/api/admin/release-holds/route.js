import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Ticket } from "@/models/Ticket";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await connectDB();
    const result = await Ticket.updateMany(
      { status: "Held", holdExpiresAt: { $lt: new Date() } },
      { 
        $set: { status: "Available" },
        $unset: { userId: "", holdExpiresAt: "" }
      }
    );
    
    return NextResponse.json({ message: `Released ${result.modifiedCount} held tickets` }, { status: 200 });
  } catch (error) {
    console.error("Release Holds Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
