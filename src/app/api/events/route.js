import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Event } from "@/models/Event";
import { Ticket } from "@/models/Ticket";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, totalCapacity } = body;

    const newEvent = await Event.create({
      name: name,
      totalCapacity: totalCapacity,
    });

    const ticketCreate = [];
    for (let i = 0; i < totalCapacity; i++) {
      ticketCreate.push({
        eventId: newEvent._id,
        status: "Available",
      });
    }
    await Ticket.insertMany(ticketCreate);

    return NextResponse.json(
      {
        message: "Event and Tickets created",
        eventId: newEvent._id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
