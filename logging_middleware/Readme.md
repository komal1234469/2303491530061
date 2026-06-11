# Logging Middleware

Express.js middleware that logs every HTTP request and error with timestamp, method, URL, status code, and response time.

## Files

| File | Purpose |
|------|---------|
| `logger.js` | Core middleware — `requestLogger` and `errorLogger` |
| `index.js` | Demo Express app using the middleware |

## Setup & Run

```bash
npm install
npm start
```

Server runs at `http://localhost:3000`

## What Gets Logged

Every request logs:
- Timestamp (ISO 8601)
- HTTP Method (GET, POST, etc.)
- URL
- Client IP
- Status Code
- Response time in ms

Errors additionally log:
- Error message
- Stack trace

## Log Output

Logs are saved to `logs/app.log` in JSON format and printed to console with colors:

```
[INFO]  2025-06-11T10:00:00.000Z — Incoming Request { method: 'GET', url: '/users', ip: '::1' }
[INFO]  2025-06-11T10:00:00.005Z — Response Sent { method: 'GET', url: '/users', statusCode: 200, durationMs: 5 }
[ERROR] 2025-06-11T10:00:01.000Z — Unhandled Error { message: 'Test error', statusCode: 500 }
```

## Sample Routes (for testing)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | Health check |
| GET | `/users` | List users |
| POST | `/users` | Create user |
| GET | `/notifications` | List notifications |
| GET | `/error-test` | Trigger error log |
