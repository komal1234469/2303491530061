// logging_middleware/logger.js
// Express Logging Middleware
// Logs every request with method, URL, status, response time, and body

const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logFile = path.join(logsDir, "app.log");

// ─── Write log to file + console ────────────────────────────────────────────
function writeLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };

  const logLine = JSON.stringify(logEntry) + "\n";

  // Write to file
  fs.appendFileSync(logFile, logLine);

  // Print to console with color
  const colors = {
    INFO:  "\x1b[36m",  // cyan
    WARN:  "\x1b[33m",  // yellow
    ERROR: "\x1b[31m",  // red
    RESET: "\x1b[0m",
  };

  const color = colors[level] || colors.RESET;
  console.log(`${color}[${level}]${colors.RESET} ${timestamp} — ${message}`, 
    Object.keys(meta).length ? meta : ""
  );
}

// ─── Request Logger Middleware ───────────────────────────────────────────────
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Log incoming request
  writeLog("INFO", `Incoming Request`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"] || "unknown",
    body: req.method !== "GET" ? req.body : undefined,
  });

  // Override res.end to capture response details
  const originalEnd = res.end.bind(res);
  res.end = function (chunk, encoding) {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? "ERROR"
                : res.statusCode >= 400 ? "WARN"
                : "INFO";

    writeLog(level, `Response Sent`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
    });

    return originalEnd(chunk, encoding);
  };

  next();
}

// ─── Error Logger Middleware ─────────────────────────────────────────────────
function errorLogger(err, req, res, next) {
  writeLog("ERROR", `Unhandled Error`, {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: err.message || "Something went wrong.",
    },
  });
}

module.exports = { requestLogger, errorLogger, writeLog };
