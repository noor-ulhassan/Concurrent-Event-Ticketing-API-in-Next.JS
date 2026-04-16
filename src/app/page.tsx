"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [userId, setUserId] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [newEventName, setNewEventName] = useState("");
  const [newEventCapacity, setNewEventCapacity] = useState("");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  useEffect(() => {
    let storedUserId = localStorage.getItem("demoUserId");
    if (!storedUserId) {
      storedUserId = "user_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("demoUserId", storedUserId);
    }
    setUserId(storedUserId);
    fetchData(storedUserId);
  }, []);

  const fetchData = async (uid: string) => {
    setIsLoading(true);
    try {
      const [eventsRes, ticketsRes] = await Promise.all([
        fetch("/api/events"),
        fetch(`/api/tickets/me?userId=${uid}`)
      ]);
      
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setMyTickets(ticketsData.tickets || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data.");
    } finally {
      setIsLoading(false);
    }
  };

  const reserveTicket = async (eventId: string) => {
    setActionLoading(eventId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/tickets/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, userId })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to reserve ticket");
      } else {
        setSuccess("Ticket reserved! You have 5 minutes to purchase it.");
        await fetchData(userId); 
      }
    } catch (err) {
      setError("Network or server error occurred.");
    } finally {
      setActionLoading(null);
    }
  };

  const purchaseTicket = async (ticketId: string) => {
    setActionLoading(ticketId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, userId })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to purchase ticket");
      } else {
        setSuccess("Purchase successful!");
        await fetchData(userId);
      }
    } catch (err) {
      setError("Network or server error occurred.");
    } finally {
      setActionLoading(null);
    }
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName || !newEventCapacity) return;
    setIsCreatingEvent(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newEventName, totalCapacity: parseInt(newEventCapacity) })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to create event");
      else {
        setSuccess("Event created successfully");
        setNewEventName("");
        setNewEventCapacity("");
        await fetchData(userId);
      }
    } catch (err) {
      setError("Failed to create event.");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const Countdown = ({ expiresAt }: { expiresAt: string }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const diff = expiry - now;
        
        if (diff <= 0) {
          setTimeLeft("Expired");
          clearInterval(interval);
        } else {
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }, [expiresAt]);

    return <span className={timeLeft === "Expired" ? "text-red-500 font-bold" : "text-amber-500 font-mono"}>{timeLeft}</span>;
  };

  if (isLoading && !events.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pb-20">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
            Events Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Secure ticket reservations and purchases.
          </p>
        </header>

        {userId && (
          <div className="flex items-center justify-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-full max-w-sm mx-auto shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-md uppercase">
              {userId.substring(5, 7)}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">User ID</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{userId}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-md text-green-700 dark:text-green-400">
            {success}
          </div>
        )}

        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-800 mb-10 transition-shadow">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            Add New Event
          </h2>
          <form onSubmit={createEvent} className="flex flex-col md:flex-row gap-4">
            <input type="text" placeholder="Event Name" className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white" value={newEventName} onChange={e => setNewEventName(e.target.value)} required />
            <input type="number" placeholder="Capacity" min="1" className="w-full md:w-32 px-4 py-3 border rounded-lg focus:ring-2 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white" value={newEventCapacity} onChange={e => setNewEventCapacity(e.target.value)} required />
            <button type="submit" disabled={isCreatingEvent} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isCreatingEvent ? "..." : "Create"}
            </button>
          </form>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-800 mb-10 transition-shadow">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
            Available Events
          </h2>
          
          {events.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">No events currently scheduled.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const available = event.stats?.available || 0;
                const outOfStock = available === 0;

                return (
                  <div key={event._id} className="flex flex-col bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{event.name}</h3>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider rounded-full">Live</span>
                      </div>
                      
                      <div className="space-y-3 mb-6 flex-1">
                        <div className="flex justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Capacity</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{event.totalCapacity}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Available</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">{available}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Held</span>
                          <span className="font-semibold text-amber-500">{event.stats?.held || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
                      <button 
                        className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center transition-colors ${
                          actionLoading === event._id
                            ? "bg-blue-400 cursor-not-allowed"
                            : outOfStock
                              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        }`}
                        onClick={() => reserveTicket(event._id)}
                        disabled={actionLoading === event._id || outOfStock}
                      >
                        {actionLoading === event._id ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                        ) : outOfStock ? "Sold Out" : "Reserve Ticket"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {myTickets.length > 0 && (
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
              My Tickets
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTickets.map((ticket) => {
                const isHeld = ticket.status === "Held";
                const isPurchased = ticket.status === "Purchased";
                const isExpired = isHeld && new Date(ticket.holdExpiresAt).getTime() < new Date().getTime();

                return (
                  <div key={ticket._id} className={`flex flex-col bg-gray-50 dark:bg-gray-950 border rounded-xl overflow-hidden transition-shadow ${
                    isPurchased ? "border-green-500/50 shadow-green-500/10" : "border-amber-500/50 shadow-amber-500/10"
                  }`}>
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                          {ticket.eventId?.name || "Unknown Event"}
                        </h3>
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                          isPurchased 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Ticket ID</span>
                          <span className="font-mono text-gray-600 dark:text-gray-300 text-sm">...{ticket._id.substring(18)}</span>
                        </div>
                        {isHeld && ticket.holdExpiresAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Expires In</span>
                            <span className="font-medium text-right">
                              <Countdown expiresAt={ticket.holdExpiresAt} />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
                      {isHeld ? (
                        <button 
                          className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center transition-colors ${
                            actionLoading === ticket._id || isExpired
                              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                              : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                          }`}
                          onClick={() => purchaseTicket(ticket._id)}
                          disabled={actionLoading === ticket._id || isExpired}
                        >
                          {actionLoading === ticket._id ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                          ) : isExpired ? "Expired" : "Complete Purchase"}
                        </button>
                      ) : (
                        <div className="w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 cursor-default">
                          Purchased
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
