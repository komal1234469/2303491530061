# Notification System Design

---

# Stage 1

## REST API Design — Campus Notifications Microservice

### Overview

This document defines the REST API contract for the Campus Notification Platform. The platform delivers real-time updates to students across three notification categories:

- **Placements** – job drives, company visits, offer letters
- **Events** – workshops, seminars, fests, deadlines
- **Results** – exam results, internal marks, re-evaluation status

### Base URL

```
https://api.campus-notify.io/v1
```

All endpoints are versioned under `/v1`. Responses are in `application/json`.

### Authentication

All protected endpoints require a Bearer token in the Authorization header.

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained via the `/auth/login` endpoint and expire after 24 hours.

---

### Core API Endpoints

#### `POST /auth/login`

**Request Body:**
```json
{
  "email": "student@campus.edu",
  "password": "securePassword123"
}
```

**Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-06-12T10:00:00Z",
    "user": {
      "id": "usr_a1b2c3",
      "name": "Riya Sharma",
      "email": "student@campus.edu",
      "role": "student",
      "department": "Computer Science",
      "year": 3
    }
  }
}
```

**Response — 401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect."
  }
}
```

---

#### `GET /notifications`

Fetch all notifications for the authenticated user, with optional filters.

**Query Parameters:**

| Parameter | Type    | Required | Description                                    |
|-----------|---------|----------|------------------------------------------------|
| `type`    | string  | No       | Filter: `placement`, `event`, `result`         |
| `status`  | string  | No       | Filter: `read`, `unread`                       |
| `page`    | integer | No       | Page number (default: 1)                       |
| `limit`   | integer | No       | Results per page (default: 20, max: 100)       |
| `sort`    | string  | No       | `asc` or `desc` (default: `desc`)              |

**Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_x9y8z7",
        "type": "placement",
        "title": "Amazon Drive — 2025 Batch",
        "body": "Amazon is conducting an on-campus placement drive for B.Tech final year students on 20th June 2025.",
        "priority": "high",
        "status": "unread",
        "created_at": "2025-06-11T08:30:00Z",
        "expires_at": "2025-06-20T23:59:59Z",
        "metadata": {
          "company": "Amazon",
          "role": "SDE-1",
          "eligible_departments": ["CSE", "ECE", "IT"],
          "eligible_years": [4],
          "apply_link": "https://campus.edu/placements/amazon-2025"
        }
      }
    ],
    "pagination": {
      "total": 48,
      "page": 1,
      "limit": 10,
      "total_pages": 5
    }
  }
}
```

---

#### `GET /notifications/:id`

**Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "notif_x9y8z7",
    "type": "placement",
    "title": "Amazon Drive — 2025 Batch",
    "priority": "high",
    "status": "read",
    "read_at": "2025-06-11T09:10:00Z",
    "metadata": {
      "company": "Amazon",
      "role": "SDE-1",
      "apply_link": "https://campus.edu/placements/amazon-2025"
    }
  }
}
```

**Response — 404:**
```json
{
  "success": false,
  "error": { "code": "NOTIFICATION_NOT_FOUND", "message": "No notification found with id notif_x9y8z7." }
}
```

---

#### `POST /notifications` *(Admin / Staff only)*

**Request Body:**
```json
{
  "type": "event",
  "title": "Tech Fest 2025 — Registrations Open",
  "body": "Annual Tech Fest registrations are now open. Last date: 18th June.",
  "priority": "medium",
  "target_audience": {
    "departments": ["CSE", "ECE", "MECH"],
    "years": [1, 2, 3, 4],
    "roles": ["student"]
  },
  "expires_at": "2025-06-18T23:59:59Z",
  "metadata": {
    "event_date": "2025-06-25",
    "venue": "Main Auditorium",
    "registration_link": "https://campus.edu/events/techfest-2025"
  }
}
```

**Response — 201 Created:**
```json
{
  "success": true,
  "data": {
    "id": "notif_p3q2r1",
    "status": "sent",
    "recipients_count": 842,
    "created_at": "2025-06-11T10:00:00Z"
  }
}
```

---

#### `PATCH /notifications/:id/read`

**Response — 200 OK:**
```json
{
  "success": true,
  "data": { "id": "notif_x9y8z7", "status": "read", "read_at": "2025-06-11T11:45:00Z" }
}
```

#### `PATCH /notifications/read-all`

**Response — 200 OK:**
```json
{
  "success": true,
  "data": { "updated_count": 12, "message": "All notifications marked as read." }
}
```

#### `DELETE /notifications/:id` *(Admin only)*

**Response — 200 OK:**
```json
{
  "success": true,
  "data": { "id": "notif_x9y8z7", "message": "Notification deleted successfully." }
}
```

---

#### `GET /notifications/summary`

**Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "total": 48,
    "unread": 12,
    "by_type": {
      "placement": { "total": 15, "unread": 5 },
      "event":     { "total": 20, "unread": 4 },
      "result":    { "total": 13, "unread": 3 }
    }
  }
}
```

---

#### `GET /users/me/preferences`

**Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "user_id": "usr_a1b2c3",
    "preferences": {
      "placement": { "enabled": true,  "channels": ["push", "email"] },
      "event":     { "enabled": true,  "channels": ["push"] },
      "result":    { "enabled": true,  "channels": ["push", "email", "sms"] }
    },
    "do_not_disturb": { "enabled": false, "from": null, "to": null }
  }
}
```

#### `PUT /users/me/preferences`

**Request Body:**
```json
{
  "placement": { "enabled": true,  "channels": ["push", "email"] },
  "event":     { "enabled": false, "channels": [] },
  "result":    { "enabled": true,  "channels": ["push", "sms"] },
  "do_not_disturb": { "enabled": true, "from": "22:00", "to": "07:00" }
}
```

---

### Real-Time — WebSocket

```
wss://api.campus-notify.io/v1/ws/notifications?token=<jwt_token>
```

**Server → Client Events:**

```json
{ "event": "notification.new",     "data": { "id": "...", "type": "result", "title": "...", "priority": "high" } }
{ "event": "notification.updated", "data": { "id": "...", "status": "read", "read_at": "..." } }
{ "event": "notification.deleted", "data": { "id": "..." } }
```

**Client → Server Actions:**

```json
{ "action": "ack",       "notification_id": "notif_m5n4o3" }
{ "action": "mark_read", "notification_id": "notif_m5n4o3" }
{ "action": "pong" }
```

**WebSocket Error Codes:**

| Code | Reason                  |
|------|-------------------------|
| 4001 | Unauthorized / invalid  |
| 4002 | Token expired           |
| 4003 | User not found          |
| 1000 | Normal closure          |

---

### API Endpoint Summary

| Method | Endpoint                       | Role        | Description                        |
|--------|--------------------------------|-------------|------------------------------------|
| POST   | `/auth/login`                  | Any         | Login, receive JWT                 |
| GET    | `/notifications`               | Student     | List notifications (filtered)      |
| GET    | `/notifications/summary`       | Student     | Unread counts by type              |
| GET    | `/notifications/:id`           | Student     | Get single notification            |
| POST   | `/notifications`               | Admin/Staff | Create & dispatch notification     |
| PATCH  | `/notifications/:id/read`      | Student     | Mark one as read                   |
| PATCH  | `/notifications/read-all`      | Student     | Mark all as read                   |
| DELETE | `/notifications/:id`           | Admin       | Delete notification                |
| GET    | `/users/me/preferences`        | Student     | Get preferences                    |
| PUT    | `/users/me/preferences`        | Student     | Update preferences                 |
| WS     | `/ws/notifications`            | Student     | Real-time stream                   |

---

# Stage 2

## Database Design

### Recommended Database: PostgreSQL

**Why PostgreSQL?**

- **Strong relational integrity** — Foreign keys enforce consistency (notification → sender, delivery → student)
- **JSONB support** — `metadata` varies per notification type; JSONB allows flexible schema without losing queryability
- **Advanced indexing** — Composite, partial, and GIN indexes for query optimisation at scale
- **ACID compliance** — Notifications are fully dispatched or fully rolled back; no partial sends
- **Mature ecosystem** — Works with Node.js (Prisma, pg), Python (SQLAlchemy), supports read replicas

**Why not MongoDB?** The data is highly relational. Enforcing cross-collection consistency manually is error-prone. PostgreSQL's JSONB gives the best of both worlds.

---

### Schema

#### Table: `users`

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(150)        NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT                NOT NULL,
    role          VARCHAR(20)         NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
    department    VARCHAR(100),
    year          SMALLINT            CHECK (year BETWEEN 1 AND 5),
    is_active     BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);
```

#### Table: `notifications`

```sql
CREATE TABLE notifications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type          VARCHAR(20)  NOT NULL CHECK (type IN ('placement', 'event', 'result')),
    title         VARCHAR(150) NOT NULL,
    body          TEXT         NOT NULL,
    priority      VARCHAR(10)  NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    created_by    UUID         NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    expires_at    TIMESTAMPTZ,
    metadata      JSONB,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

#### Table: `notification_audience`

```sql
CREATE TABLE notification_audience (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID        NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    department      VARCHAR(100),
    year            SMALLINT,
    role            VARCHAR(20) CHECK (role IN ('student', 'staff'))
);
```

#### Table: `notification_deliveries`

```sql
CREATE TABLE notification_deliveries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID        NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    student_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (notification_id, student_id)
);
```

#### Table: `user_preferences`

```sql
CREATE TABLE user_preferences (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    placement_on BOOLEAN NOT NULL DEFAULT TRUE,
    event_on     BOOLEAN NOT NULL DEFAULT TRUE,
    result_on    BOOLEAN NOT NULL DEFAULT TRUE,
    channels     TEXT[]  NOT NULL DEFAULT ARRAY['push'],
    dnd_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
    dnd_from     TIME,
    dnd_to       TIME,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### Indexes

```sql
CREATE INDEX idx_deliveries_student_id       ON notification_deliveries(student_id);
CREATE INDEX idx_deliveries_student_unread   ON notification_deliveries(student_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_deliveries_notification_id  ON notification_deliveries(notification_id);
CREATE INDEX idx_deliveries_delivered_at     ON notification_deliveries(student_id, delivered_at DESC);
CREATE INDEX idx_notifications_metadata      ON notifications USING GIN (metadata);
CREATE INDEX idx_notifications_type          ON notifications(type);
```

---

### Key SQL Queries

**GET /notifications — paginated inbox:**
```sql
SELECT n.id, n.type, n.title, n.body, n.priority, n.metadata, n.created_at, nd.is_read, nd.read_at
FROM notification_deliveries nd
JOIN notifications n ON nd.notification_id = n.id
WHERE nd.student_id = $1
  AND ($2::VARCHAR IS NULL OR n.type = $2)
  AND ($3::BOOLEAN IS NULL OR nd.is_read = $3)
ORDER BY n.created_at DESC
LIMIT $4 OFFSET $5;
```

**PATCH /notifications/:id/read:**
```sql
UPDATE notification_deliveries
SET is_read = TRUE, read_at = NOW()
WHERE notification_id = $1 AND student_id = $2 AND is_read = FALSE;
```

**GET /notifications/summary — unread counts:**
```sql
SELECT n.type,
       COUNT(*) FILTER (WHERE nd.is_read = FALSE) AS unread,
       COUNT(*) AS total
FROM notification_deliveries nd
JOIN notifications n ON nd.notification_id = n.id
WHERE nd.student_id = $1
GROUP BY n.type;
```

**POST /notifications — create + fan-out:**
```sql
INSERT INTO notifications (type, title, body, priority, created_by, expires_at, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id;

INSERT INTO notification_deliveries (notification_id, student_id)
SELECT $1, u.id FROM users u
WHERE u.role = 'student' AND u.is_active = TRUE
  AND ($2::TEXT[] IS NULL OR u.department = ANY($2))
  AND ($3::SMALLINT[] IS NULL OR u.year = ANY($3));
```

---

### Scaling Challenges & Solutions

**1. Fan-out at scale (50,000 students per notification)**
- Problem: Inserting 50,000 rows in one transaction causes table locks and latency spikes
- Solution: Async background job queue (BullMQ + Redis or pg-boss). API returns `202 Accepted` immediately; worker fans out in batches of 500–1000 rows

**2. Read-heavy inbox at 5,000,000+ rows**
- Partial index on `is_read = FALSE` keeps the unread index small
- Table partitioning by `student_id` (hash) so inbox queries hit one partition
- Read replicas: all `GET` queries route to replica; writes go to primary
- Redis cache for unread counts — increment/decrement on delivery/read events (O(1) reads)

**3. JSONB metadata querying**
- GIN index already defined for general JSONB lookups
- For frequent patterns (filter by company), use a generated column:

```sql
ALTER TABLE notifications
  ADD COLUMN company TEXT GENERATED ALWAYS AS (metadata->>'company') STORED;
CREATE INDEX idx_notifications_company ON notifications(company);
```

**4. Notification expiry / archiving**
- Scheduled pg_cron job moves notifications older than 90 days to `archived_notifications`
- Keeps active tables lean for fast inbox queries

---

# Stage 3

## Query Analysis

### Original Query (Slow)

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

### Is this query accurate?

**Partially — but it has a design flaw.**

In the normalised schema (Stage 2), notifications are broadcast entities. One row in `notifications` serves thousands of students. Per-student read/unread state lives in `notification_deliveries`. The original query implies a flat schema where each notification row is duplicated per student — this breaks at scale.

**Corrected query using the normalised schema:**

```sql
SELECT n.id, n.type, n.title, n.body, n.priority, n.metadata, n.created_at, nd.delivered_at
FROM notification_deliveries nd
JOIN notifications n ON nd.notification_id = n.id
WHERE nd.student_id = 1042
  AND nd.is_read    = FALSE
ORDER BY nd.delivered_at DESC;
```

### Why is the original query slow?

| Reason | Explanation |
|--------|-------------|
| No composite index on `(studentID, isRead)` | Full sequential scan across 5,000,000 rows |
| `SELECT *` fetches everything | Including large JSONB metadata blobs before ORDER BY |
| `ORDER BY createdAt DESC` without covering index | In-memory filesort after filtering |
| No partial index for `isRead = false` | Index covers all rows, not just the small unread fraction |

### Is "add indexes on every column" good advice?

**No — this is harmful advice.**

| Concern | Explanation |
|---------|-------------|
| Write amplification | Every INSERT/UPDATE/DELETE must update all indexes — 8–10 writes per row instead of 1–2 |
| Storage bloat | Each index is a separate B-tree; 5M-row table with indexes on every column = 3–5× storage |
| Query planner confusion | Too many indexes increase planning time and can cause suboptimal choices |
| Maintenance cost | VACUUM, ANALYZE, REINDEX all take longer |

**Right approach:** Index only columns in `WHERE`, `JOIN ON`, and `ORDER BY` of frequent, expensive queries. Confirm with `EXPLAIN ANALYZE`.

### Correct Index

```sql
-- Covers WHERE student_id = ? AND is_read = FALSE, plus ORDER BY delivered_at DESC
-- Partial: only indexes unread rows — stays small as rows get marked read
CREATE INDEX idx_deliveries_student_unread
    ON notification_deliveries(student_id, delivered_at DESC)
    WHERE is_read = FALSE;
```

### Query: All Students Who Received a Placement Notification

```sql
SELECT DISTINCT u.id AS student_id, u.name, u.email, u.department, u.year
FROM notification_deliveries nd
JOIN notifications n ON nd.notification_id = n.id
JOIN users u         ON nd.student_id      = u.id
WHERE n.type = 'placement'
ORDER BY u.name ASC;
```

**For a specific company (e.g. last 7 days):**

```sql
SELECT u.id, u.name, u.email, nd.is_read, nd.delivered_at
FROM notification_deliveries nd
JOIN notifications n ON nd.notification_id = n.id
JOIN users u         ON nd.student_id      = u.id
WHERE n.type = 'placement'
  AND nd.delivered_at >= NOW() - INTERVAL '7 days'
ORDER BY nd.delivered_at DESC;
```

**Supporting index:**
```sql
CREATE INDEX idx_notifications_placement_company
    ON notifications((metadata->>'company'))
    WHERE type = 'placement';
```

---

# Stage 4

## Performance at Scale — Pagination & Caching Strategy

### Problem

When a student opens their notification inbox, a database query runs on every page load. With 50,000 students and millions of notification rows, simultaneous requests overwhelm the DB — causing high latency and poor user experience.

### Solutions & Trade-offs

#### 1. Cursor-based Pagination (replace OFFSET)

**Problem with OFFSET:** `OFFSET 1000` forces the DB to scan and discard the first 1000 rows on every request — gets slower as pages increase.

**Solution — cursor pagination:**
```sql
-- First page
SELECT nd.delivered_at AS cursor, n.id, n.title, n.type, nd.is_read
FROM notification_deliveries nd
JOIN notifications n ON nd.notification_id = n.id
WHERE nd.student_id = $1 AND nd.is_read = FALSE
ORDER BY nd.delivered_at DESC
LIMIT 20;

-- Next page (client sends last cursor value)
SELECT nd.delivered_at AS cursor, n.id, n.title, n.type, nd.is_read
FROM notification_deliveries nd
JOIN notifications n ON nd.notification_id = n.id
WHERE nd.student_id = $1 AND nd.is_read = FALSE
  AND nd.delivered_at < $2  -- cursor from previous page
ORDER BY nd.delivered_at DESC
LIMIT 20;
```

| Trade-off | Detail |
|-----------|--------|
| ✅ Fast at any depth | No skip scan — index seeks directly to cursor position |
| ✅ Stable results | New notifications during scroll don't shift pages |
| ❌ No random page jump | Cannot go directly to "page 7" — only next/previous |

---

#### 2. Redis Unread Count Cache

**Problem:** `GET /notifications/summary` runs a `COUNT GROUP BY type` query on every badge refresh — very frequent and expensive.

**Solution:**
- Store per-user unread counts in Redis as a hash: `unread:{userId}` → `{ placement: 5, event: 3, result: 2 }`
- On new notification delivery: `HINCRBY unread:{userId} {type} 1`
- On mark-as-read: `HINCRBY unread:{userId} {type} -1`
- `/notifications/summary` reads from Redis (O(1)) instead of the DB

```js
// On delivery (worker)
await redis.hincrby(`unread:${studentId}`, notifType, 1);

// On read
await redis.hincrby(`unread:${studentId}`, notifType, -1);

// On summary endpoint
const counts = await redis.hgetall(`unread:${studentId}`);
```

| Trade-off | Detail |
|-----------|--------|
| ✅ O(1) reads | No DB hit for badge counts |
| ✅ Scales horizontally | Redis cluster handles millions of keys |
| ❌ Cache drift risk | If a bug skips decrement, count goes stale — fix: periodic DB reconciliation |

---

#### 3. Read Replicas for GET Queries

- Route all `GET /notifications` and `GET /notifications/summary` to a **PostgreSQL read replica**
- All writes (mark read, create) go to the primary
- Horizontal read scaling with no application-layer sharding complexity

| Trade-off | Detail |
|-----------|--------|
| ✅ Linear read scaling | Add replicas as load grows |
| ❌ Replication lag | Replica may be 10–100ms behind primary — acceptable for inbox, not for "just marked read" confirmation |

---

#### 4. Summary

| Strategy | Best For | Key Trade-off |
|----------|----------|---------------|
| Cursor pagination | Inbox scroll | No random page jumps |
| Redis unread cache | Badge counts | Needs drift reconciliation |
| Read replicas | GET throughput | Slight replication lag |

---

# Stage 5

## Reliable Notification Dispatch — Fixing notify_all

### Original Pseudocode

```
function notify_all(student_ids: array, message: string):
  for student_id in student_ids:
    send_email(student_id, message)   # calls Email API
    save_to_db(student_id, message)   # DB Insert
    push_to_app(student_id, message)  # real-time push
```

### Shortcomings

**1. No atomicity — partial failures are silent**
- If `send_email` succeeds for 200 students then the Email API goes down, the loop stops mid-way
- Those 200 got the email; the rest did not; the DB may or may not have their records
- There is no retry, no record of failure, no way to resume

**2. Sequential processing is slow**
- With 50,000 students, each iteration waits for email API + DB write + push to complete before moving to the next
- At ~100ms per student: 50,000 × 100ms = **83 minutes** — completely unacceptable

**3. Email and DB write in same loop — coupled failures**
- If the DB write fails after the email is sent, the student gets the email but the app never shows the notification — inconsistent state

**4. No idempotency**
- If the function is called twice (retry after a crash), students get duplicate emails and duplicate DB rows

---

### Revised Design

```
function notify_all(notification_id, student_ids, message):

  // Step 1: Write all delivery rows to DB first (idempotent — UNIQUE constraint)
  bulk_insert_deliveries(notification_id, student_ids)   // one DB transaction

  // Step 2: Enqueue async jobs — one per student (or batch of 100)
  for student_id in student_ids:
    job_queue.enqueue("send_notification", {
      notification_id,
      student_id,
      message,
      attempt: 1
    })

  return { status: "queued", count: student_ids.length }

// Worker picks up jobs independently:
function worker_send_notification(job):
  try:
    send_email(job.student_id, job.message)      // Email API
    push_to_app(job.student_id, job.notification_id)  // WebSocket / FCM
    mark_delivered(job.notification_id, job.student_id)
  catch error:
    if job.attempt < 3:
      job_queue.retry(job, delay=exponential_backoff(job.attempt))
    else:
      log_failed_delivery(job)   // DLQ for manual review
```

### Key Improvements

| Issue | Fix |
|-------|-----|
| Sequential = slow | Job queue processes workers in parallel (e.g. 50 concurrent workers) |
| Email API crash stops everything | Each job retries independently — failure of 1 doesn't affect 2–50,000 |
| No idempotency | DB `UNIQUE(notification_id, student_id)` prevents duplicate rows on retry |
| Coupled email + DB write | DB write happens first in bulk; email is a separate async step |
| No failure visibility | Dead Letter Queue (DLQ) captures all permanent failures for review |

### Why "save to DB and send email together" is wrong

The DB write and email send are two separate systems. They cannot be in the same transaction. If the email API is slow, it holds the DB connection. If the DB write fails after the email is sent, the state is inconsistent. The correct pattern is: **write DB first (source of truth), then trigger side effects (email, push) asynchronously**.

---

# Stage 6

## Priority Inbox — Top 10 Notifications

### Approach

A Priority Inbox ranks notifications by a **combined score** of importance (result > placement > event) and recency (newer = higher). New notifications keep arriving, so the top 10 must stay current without a full DB scan on every load.

### Scoring Formula

```
priority_score = type_weight × recency_factor

type_weight:
  result    → 30
  placement → 20
  event     → 10

recency_factor = 1 / (1 + hours_since_delivery)
  — approaches 1 for brand-new, approaches 0 for very old

final_score = type_weight / (1 + hours_since_delivery)
```

This means a result from 1 hour ago scores `30 / 2 = 15`, while a placement from 10 hours ago scores `20 / 11 = 1.8`.

### Implementation

See `priority_inbox.js` in this repository for the full working implementation using the Notification API.

**Key design decisions:**

1. **No DB query** — reads from the provided Notification API only
2. **In-memory sorted structure** — after fetching, score all notifications and keep top 10
3. **Maintaining top 10 as new notifications arrive** — on each new notification event (WebSocket `notification.new`), score it and insert into the sorted list; evict the lowest if list exceeds 10
4. **Re-score periodically** — recency factor changes over time; re-rank every 5 minutes

### Maintaining Top 10 Efficiently

```
On new notification received:
  score = compute_score(notification)
  if priority_list.length < 10:
    insert notification into priority_list
  else if score > priority_list[9].score:
    replace priority_list[9] with new notification
  re-sort priority_list by score DESC

On periodic refresh (every 5 min):
  re-score all items in priority_list (recency changes over time)
  re-sort
```

This is O(10) = O(1) for each new notification — no DB query needed.

### Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Score in-memory | No DB query needed; scores are approximate (recency is time-based) |
| Re-score every 5 min | Slightly stale between refreshes — acceptable for a priority inbox |
| type_weight fixed | Weights could be personalised per user in a future iteration |
| Top 10 only | Full resort only on refresh; incremental insert for new arrivals |
