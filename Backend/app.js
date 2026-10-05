// 1. Force Node.js to use stable public DNS servers (fixes the network error)
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// 2. Load your environment variables BEFORE anything else
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET must be configured in Backend/.env before startup.",
  );
}

// 1. Import  cron job configuration
const startAutoCheckoutJob = require("./cjobs/cronJobs.js");

// 3. Now it is safe to import express and your database module
const express = require("express");
const cors = require("cors");
const connectDB = require("./settings/db.js");
const { sendError } = require("./utils/response.js");
const PORT = process.env.PORT || 3000;
const visitors = require("./routes/visitors.js");
const app = express();
const auth = require("./routes/auth.js");
const users = require("./routes/user.js");
const hosts = require("./routes/host.js");
const admin = require("./routes/admin.js");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://127.0.0.1:3001",
  }),
);
app.use(express.json());
// Fire up the background task manager loop
startAutoCheckoutJob();
console.log(
  "⚡ Background task manager initialized (Midnight Auto-Checkout Active).",
);

// Always use api/v1/feature-name for all routes in this file
app.use("/api/v1/visitors", visitors);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/hosts", hosts);
app.use("/api/v1/admin", admin);

app.use((req, res) => {
  return sendError(res, 404, "Endpoint not found.");
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return sendError(res, 400, "Request body contains invalid JSON.");
  }

  console.error("Unhandled server error:", error);
  return sendError(res, 500, "Internal server error.");
});

const startserver = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`App Listening on Port ${PORT}`);
  });
};

startserver();
