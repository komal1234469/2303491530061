// logging_middleware/index.js
// Demo Express app showing the logging middleware in action

const express = require("express");
const { requestLogger, errorLogger, writeLog } = require("./logger");

const app = express();
const PORT = 3000;

// ─── Built-in middlewares ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Attach logging middleware ───────────────────────────────────────────────
app.use(requestLogger);

// ─── Sample Routes ───────────────────────────────────────────────────────────

// GET /
app.get("/", (req, res) => {
  res.json({ message: "Logging Middleware is running!" });
});

// GET /users
app.get("/users", (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: "Riya Sharma",   role: "student" },
      { id: 2, name: "Arjun Mehta",   role: "staff" },
      { id: 3, name: "Priya Nair",    role: "admin" },
    ],
  });
});

// POST /users
app.post("/users", (req, res) => {
  const { name, role } = req.body;
  if (!name || !role) {
    return res.status(400).json({
      success: false,
      error: { code: "MISSING_FIELDS", message: "name and role are required." },
    });
  }
  res.status(201).json({
    success: true,
    data: { id: 4, name, role, created_at: new Date().toISOString() },
  });
});

// GET /notifications (sample)
app.get("/notifications", (req, res) => {
  res.json({
    success: true,
    data: {
      notifications: [
        { id: "notif_1", type: "placement", title: "Amazon Drive 2025", status: "unread" },
        { id: "notif_2", type: "result",    title: "Sem 6 Results Out",  status: "read"   },
      ],
    },
  });
});

// Route that throws an error — to demo error logging
app.get("/error-test", (req, res, next) => {
  const err = new Error("This is a test error for logging demonstration");
  err.status = 500;
  next(err);
});

// ─── Error Logger (must be last) ─────────────────────────────────────────────
app.use(errorLogger);

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  writeLog("INFO", `Server started`, { port: PORT, url: `http://localhost:${PORT}` });
});

module.exports = app;
