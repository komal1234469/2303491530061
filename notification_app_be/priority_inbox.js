// Stage 6 — Priority Inbox
// Fetches notifications from API and displays top 10 by combined score
// Score = type_weight / (1 + hours_since_delivery)
//
// NOTE: Replace AUTH_TOKEN with your actual Bearer token
 
const API_BASE = "http://4.224.186.213/evaluation-service";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJrMTI0NTc4NTdAZ21haWwuY29tIiwiZXhwIjoxNzgxMTY0NTkwLCJpYXQiOjE3ODExNjM2OTAsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJjYzI3OTZmNS04NzE5LTQzY2YtYTE3ZS1lYzcxZTA2YTVhOTYiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJrb21hbCBnb3N3YW1pIiwic3ViIjoiMzMxMTU1YTEtMWE3My00MmY3LTliMGYtOGQ2ODQ4NzhjMjY1In0sImVtYWlsIjoiazEyNDU3ODU3QGdtYWlsLmNvbSIsIm5hbWUiOiJrb21hbCBnb3N3YW1pIiwicm9sbE5vIjoiMjMwMzQ5MTUzMDA2MSIsImFjY2Vzc0NvZGUiOiJCQVZEU2giLCJjbGllbnRJRCI6IjMzMTE1NWExLTFhNzMtNDJmNy05YjBmLThkNjg0ODc4YzI2NSIsImNsaWVudFNlY3JldCI6IldKY3dld2F4SFNGY25kZWIifQ.8HqfZJt0Zdkv_-3Ftd1LTMq0-FbBduMG19_NZYQzZxM";
 
const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  "Content-Type": "application/json",
};
 
// ─── Scoring weights ─────────────────────────────────────────────────────────
const TYPE_WEIGHT = {
  result:    30,
  placement: 20,
  event:     10,
};
 
// ─── Fetch notifications from API ────────────────────────────────────────────
async function fetchNotifications() {
  const res = await fetch(`${API_BASE}/notifications`, { headers });
  if (!res.ok) throw new Error(`Notifications API failed: ${res.status}`);
  const data = await res.json();
  return data.notifications || [];
}
 
// ─── Compute priority score ──────────────────────────────────────────────────
function computeScore(notification) {
  const weight = TYPE_WEIGHT[notification.notificationType] || 5;
  const createdAt = new Date(notification.createdAt || notification.created_at || Date.now());
  const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const recencyFactor = 1 / (1 + hoursSince);
  return weight * recencyFactor;
}
 
// ─── Get top N by score ───────────────────────────────────────────────────────
function getTopN(notifications, n = 10) {
  return notifications
    .map((notif) => ({ ...notif, _score: computeScore(notif) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, n);
}
 
// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("   Priority Inbox — Top 10 Notifications");
  console.log("   AffordMed Campus Notification Platform");
  console.log("═══════════════════════════════════════════════════\n");
 
  const notifications = await fetchNotifications();
  console.log(`Total notifications fetched: ${notifications.length}\n`);
 
  const top10 = getTopN(notifications, 10);
 
  console.log("┌─────┬────────────┬──────────┬──────────────────────────────────────────┬────────┐");
  console.log("│ Rank│ Type       │ Score    │ Title                                    │ Unread │");
  console.log("├─────┼────────────┼──────────┼──────────────────────────────────────────┼────────┤");
 
  top10.forEach((notif, idx) => {
    const rank  = String(idx + 1).padEnd(4);
    const type  = (notif.notificationType || "unknown").padEnd(10);
    const score = notif._score.toFixed(4).padEnd(8);
    const title = (notif.title || "No title").slice(0, 40).padEnd(40);
    const unread = notif.isRead === false ? "  ●   " : "      ";
    console.log(`│ ${rank}│ ${type} │ ${score} │ ${title} │ ${unread} │`);
  });
 
  console.log("└─────┴────────────┴──────────┴──────────────────────────────────────────┴────────┘");
 
  console.log("\n══ SCORE BREAKDOWN ════════════════════════════════");
  top10.forEach((notif, idx) => {
    const weight = TYPE_WEIGHT[notif.notificationType] || 5;
    const createdAt = new Date(notif.createdAt || notif.created_at || Date.now());
    const hoursSince = ((Date.now() - createdAt.getTime()) / (1000 * 60 * 60)).toFixed(1);
    console.log(
      `#${idx + 1} [${notif.notificationType}] weight=${weight} | ` +
      `${hoursSince}h ago | score=${notif._score.toFixed(4)}`
    );
  });
 
  console.log("\n══ FULL TOP 10 (JSON) ═════════════════════════════");
  console.log(JSON.stringify(top10, null, 2));
}
 
// ─── Simulate maintaining top 10 as new notifications arrive ─────────────────
function maintainTop10(currentTop10, newNotification) {
  const scored = { ...newNotification, _score: computeScore(newNotification) };
  if (currentTop10.length < 10) {
    currentTop10.push(scored);
  } else if (scored._score > currentTop10[9]._score) {
    currentTop10[9] = scored;
  }
  return currentTop10.sort((a, b) => b._score - a._score);
}
 
main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
 
module.exports = { computeScore, getTopN, maintainTop10 };