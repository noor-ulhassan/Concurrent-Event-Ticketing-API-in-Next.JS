# Event Ticketing System

A Next.js application that provides a concurrent event ticketing backend with rate-limiting and a frontend dashboard.

## Overview

This project handles high-concurrency ticket reservations. It minimizes double-booking risks during traffic spikes by utilizing a pessimistic locking technique via atomic MongoDB operations. It integrates Upstash Redis to apply sliding-window rate limits, protecting the endpoints from excessive traffic.

## Features

- Event Management: Create and view events alongside live ticket inventory.
- Concurrent Reservations: Uses MongoDB's atomic `findOneAndUpdate` to hold tickets securely, managing race conditions.
- Hold Strategy: Tickets are reserved for a strict 5-minute checkout window before expiring.
- Auto-Release Sweeper: An administrative endpoint to release expired held tickets back into the available pool.
- Bot Protection: Upstash Redis manages IP-based rate limiting (configured for 5 requests per 10 seconds).
- Client Dashboard: A Next.js frontend built with Tailwind CSS v4 outlining the user workflow.

## Technologies Used

- Next.js (App Router)
- MongoDB (Mongoose)
- Upstash Redis
- Tailwind CSS

## Prerequisites

- Node.js (v18 or higher)
- Local or Cloud MongoDB instance
- Upstash Redis account

## Configuration

Create a `.env` file in the root directory and define the following variables:

```text
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
MONGO_URI=mongodb://localhost:27017/your_database_name
```

## Setup and Running

Install project dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## API Endpoints

- `GET /api/events`
  Retrieves all events and their aggregated ticket availability statistics.

- `POST /api/events`
  Creates a new event. Requires `name` and `totalCapacity` in the JSON body. Generates available ticket documents.

- `GET /api/tickets/me`
  Retrieves tickets currently held or purchased by a specific `userId`.

- `POST /api/tickets/reserve`
  Applies IP rate-limiting. Uses an atomic operation to update a ticket's status from "Available" to "Held", assigns it to the user, and sets an expiration timestamp.

- `POST /api/tickets/purchase`
  Validates the ticket is held by the requesting user and hasn't expired, then changes the status to "Purchased".

- `POST /api/admin/release-holds`
  Administrative endpoint that scans the ticket collection and resets any expired "Held" tickets back to "Available".
