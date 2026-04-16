const testConcurrency = async () => {
    try {
        console.log("Creating a single event with exactly 1 ticket capacity...");
        const createRes = await fetch("http://localhost:3000/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Concurrency Test Event", totalCapacity: 1 })
        });
        const eventData = await createRes.json();
        
        if (!createRes.ok) {
            console.error("Failed to create event:", eventData);
            return;
        }

        const eventId = eventData.eventId;
        console.log(`Event created (ID: ${eventId}). Now firing 10 simultaneous reserve requests!`);

        // Need to use 10 different simulated IP addresses otherwise Upstash Ratelimit will just block them all with 429
        // Wait, fetch doesn't easily spoof IPs without custom headers! Our route handles x-forwarded-for.
        const requests = Array.from({ length: 10 }).map((_, i) => {
            return fetch("http://localhost:3000/api/tickets/reserve", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "x-forwarded-for": `192.168.1.${i + 1}` // spoofing different IPs to bypass rate limit for testing
                },
                body: JSON.stringify({ eventId, userId: `user_test_${i}` })
            })
            .then(res => res.json().then(data => ({ status: res.status, data })))
            .catch(err => ({ status: 500, data: { error: err.message } }));
        });

        const results = await Promise.all(requests);
        
        // Let's summarize the results
        let successCount = 0;
        let soldOutCount = 0;
        let rateLimitCount = 0;
        
        results.forEach(res => {
            if (res.status === 200) successCount++;
            else if (res.status === 400 && res.data.error.includes("Sold out")) soldOutCount++;
            else if (res.status === 429) rateLimitCount++;
        });

        console.log("---- Test Results ----");
        console.log(`Total Requests Sent : ${results.length}`);
        console.log(`Successfully Held   : ${successCount} (Should be EXACTLY 1)`);
        console.log(`Rejected (Sold Out) : ${soldOutCount} (Should be 9)`);
        console.log(`Rejected (Rate Lim) : ${rateLimitCount}`);

    } catch (error) {
        console.error("Test failed:", error);
    }
};

testConcurrency();
