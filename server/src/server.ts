import { Server } from 'http';
import { app } from './app.js';
import { prisma } from './config/database.js';
import { ENV } from './config/env.js';
import './queues/asset.worker.js';

let server: Server | undefined;

async function startServer() {
  try {
    // 1. Let the error propagate so the server doesn't start if the DB connection fails
    await prisma.$executeRaw`SELECT 1`;
    console.log("✅ Connected to PostgreSQL database");

    server = app.listen(ENV.PORT, () => {
      console.log(`🚀 Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

// 2. Separate graceful shutdown handler
async function gracefulShutdown(signal: string) {
  console.log(`\n⏳ Received ${signal}. Starting graceful shutdown...`);

  // Set a safety timeout to force exit if connections hang
  const forceExitTimeout = setTimeout(() => {
    console.error("⚠️ Graceful shutdown timed out. Forcefully exiting.");
    process.exit(1);
  }, 10000); // 10 seconds

  if (server) {
    console.log("⏳ Closing HTTP server...");
    // Stop accepting new connections and finish active requests
    server.close(async (err) => {
      if (err) {
        console.error("❌ Error closing HTTP server:", err);
      } else {
        console.log("⌛ HTTP server closed.");
      }

      // Close DB connections AFTER the HTTP server stops handling requests
      try {
        await prisma.$disconnect();
        console.log("⚠️ Database disconnected!");
      } catch (dbErr) {
        console.error("❌ Error during database disconnect:", dbErr);
      }

      clearTimeout(forceExitTimeout);
      console.log("👋 Process exited cleanly.");
      process.exit(0);
    });
  } else {
    clearTimeout(forceExitTimeout);
    process.exit(0);
  }
}

// 3. Register signals outside of the startServer function
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// 4. Handle unexpected runtime errors
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

startServer();
