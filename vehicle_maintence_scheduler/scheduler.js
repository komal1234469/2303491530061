// Vehicle Maintenance Scheduler
// Afford Medical Technologies — Backend Track
// Problem: 0/1 Knapsack — maximise importance score within mechanic-hour budget

const API_BASE = "http://4.224.186.213/evaluation-service";

// NOTE: Replace this with your actual Bearer token from the portal
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJrMTI0NTc4NTdAZ21haWwuY29tIiwiZXhwIjoxNzgxMTY0NTkwLCJpYXQiOjE3ODExNjM2OTAsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJjYzI3OTZmNS04NzE5LTQzY2YtYTE3ZS1lYzcxZTA2YTVhOTYiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJrb21hbCBnb3N3YW1pIiwic3ViIjoiMzMxMTU1YTEtMWE3My00MmY3LTliMGYtOGQ2ODQ4NzhjMjY1In0sImVtYWlsIjoiazEyNDU3ODU3QGdtYWlsLmNvbSIsIm5hbWUiOiJrb21hbCBnb3N3YW1pIiwicm9sbE5vIjoiMjMwMzQ5MTUzMDA2MSIsImFjY2Vzc0NvZGUiOiJCQVZEU2giLCJjbGllbnRJRCI6IjMzMTE1NWExLTFhNzMtNDJmNy05YjBmLThkNjg0ODc4YzI2NSIsImNsaWVudFNlY3JldCI6IldKY3dld2F4SFNGY25kZWIifQ.8HqfZJt0Zdkv_-3Ftd1LTMq0-FbBduMG19_NZYQzZxM";

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  "Content-Type": "application/json",
};

// ─── Fetch all depots ────────────────────────────────────────────────────────
async function fetchDepots() {
  const res = await fetch(`${API_BASE}/depots`, { headers });
  if (!res.ok) throw new Error(`Depots API failed: ${res.status}`);
  const data = await res.json();
  return data.depots; // [{ ID, MechanicHours }, ...]
}

// ─── Fetch all vehicles ──────────────────────────────────────────────────────
async function fetchVehicles() {
  const res = await fetch(`${API_BASE}/vehicles`, { headers });
  if (!res.ok) throw new Error(`Vehicles API failed: ${res.status}`);
  const data = await res.json();
  return data.vehicles; // [{ TaskID, Duration, Impact }, ...]
}

// ─── 0/1 Knapsack (DP) ───────────────────────────────────────────────────────
// capacity  = MechanicHours available for this depot (integer hours)
// tasks     = array of { TaskID, Duration, Impact }
// Returns   = { selectedTasks, totalDuration, totalImpact }
function knapsack(capacity, tasks) {
  const n = tasks.length;

  // dp[i][w] = max impact using first i tasks with w hours budget
  // Use 1-D rolling array to save memory
  const dp = new Array(capacity + 1).fill(0);
  const chosen = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(false)
  );

  for (let i = 0; i < n; i++) {
    const { Duration, Impact } = tasks[i];
    // Traverse backwards to maintain 0/1 (each task used at most once)
    for (let w = capacity; w >= Duration; w--) {
      const withItem = dp[w - Duration] + Impact;
      if (withItem > dp[w]) {
        dp[w] = withItem;
        chosen[i + 1][w] = true;
      }
    }
  }

  // Back-track to find which tasks were selected
  const selectedTasks = [];
  let w = capacity;
  for (let i = n; i >= 1; i--) {
    if (chosen[i][w]) {
      selectedTasks.push(tasks[i - 1]);
      w -= tasks[i - 1].Duration;
    }
  }

  return {
    selectedTasks: selectedTasks.reverse(),
    totalDuration: capacity - w,
    totalImpact: dp[capacity],
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("   Vehicle Maintenance Scheduler — AffordMed");
  console.log("═══════════════════════════════════════════════════\n");

  // 1. Fetch data
  console.log("Fetching depots and vehicles from API...\n");
  const [depots, vehicles] = await Promise.all([fetchDepots(), fetchVehicles()]);

  console.log(`Depots fetched  : ${depots.length}`);
  console.log(`Vehicles fetched: ${vehicles.length}\n`);

  // 2. Run scheduler for each depot
  const results = [];

  for (const depot of depots) {
    const { ID: depotId, MechanicHours: budget } = depot;

    console.log(`─────────────────────────────────────────`);
    console.log(`Depot ${depotId}  |  Budget: ${budget} mechanic-hours`);

    const { selectedTasks, totalDuration, totalImpact } = knapsack(
      budget,
      vehicles
    );

    console.log(`  Tasks selected : ${selectedTasks.length}`);
    console.log(`  Hours used     : ${totalDuration} / ${budget}`);
    console.log(`  Total impact   : ${totalImpact}`);
    console.log(
      `  Tasks          : ${selectedTasks.map((t) => t.TaskID.slice(0, 8) + "...").join(", ")}`
    );

    results.push({
      depotId,
      budget,
      hoursUsed: totalDuration,
      totalImpact,
      selectedTasks,
    });
  }

  // 3. Summary
  console.log("\n═══════════════════════════════════════════════════");
  console.log("SUMMARY");
  console.log("═══════════════════════════════════════════════════");
  results.forEach((r) => {
    console.log(
      `Depot ${r.depotId}: ${r.selectedTasks.length} tasks | ` +
        `${r.hoursUsed}/${r.budget} hrs | Impact: ${r.totalImpact}`
    );
  });

  // 4. Full output (for screenshot)
  console.log("\n══ FULL RESULT (JSON) ═══════════════════════════");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
