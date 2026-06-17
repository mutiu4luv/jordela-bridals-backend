const express = require("express");
const cors = require("cors");
const authRouter = require("./routes/auth");
const formsRouter = require("./routes/forms");
const uploadsRouter = require("./routes/uploads");

const app = express();

const defaultAllowedOrigins = new Set([
  "https://jodella-bridals.vercel.app",
  "https://jordela-bridals.vercel.app",
  "https://jodella-bridals.vercel.app/",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:3000",
]);

if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => defaultAllowedOrigins.add(origin));
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.trim();
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/.test(
      normalizedOrigin
    );
    const isAllowed =
      defaultAllowedOrigins.has(normalizedOrigin) || isLocalhost;

    return callback(null, isAllowed);
  },
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});
app.use(express.json({ limit: "2mb" }));
const connectDatabase = require("./config/database");

async function attachDatabase(req, res, next) {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    console.error("Database connection middleware error:", error);
    return res.status(500).json({ message: "Database connection failed." });
  }
}

app.get("/", (_req, res) => {
  res.send("Jodella backend API is running.");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send("User-agent: *\nDisallow: /");
});

app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

app.use("/api/uploads", uploadsRouter);
app.use("/api/auth", attachDatabase, authRouter);
app.use("/api/forms", attachDatabase, formsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

module.exports = app;
