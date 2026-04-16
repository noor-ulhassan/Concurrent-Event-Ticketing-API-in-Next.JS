import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Event } from "@/models/Event";
import { Ticket } from "@/models/Ticket";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    await connectDB();
    const events = await Event.find().sort({ createdAt: -1 });

    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const available = await Ticket.countDocuments({
          eventId: event._id,
          status: "Available",
        });
        const held = await Ticket.countDocuments({
          eventId: event._id,
          status: "Held",
        });
        const purchased = await Ticket.countDocuments({
          eventId: event._id,
          status: "Purchased",
        });

        return {
          ...event.toObject(),
          stats: {
            available,
            held,
            purchased,
          },
        };
      }),
    );

    return NextResponse.json({ events: eventsWithStats }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
