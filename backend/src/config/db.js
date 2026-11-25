import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

let memoryServer = null;

/**
 * Connect Mongoose to MongoDB.
 * Uses process.env.MONGODB_URI when provided; otherwise spins up a local persistent
 * MongoDB instance via mongodb-memory-server so the app runs out-of-the-box with zero config.
 */
export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  let uri = (process.env.MONGODB_URI || "").trim();

  if (!uri) {
    process.env.MONGOMS_DOWNLOAD_DIR =
      process.env.MONGOMS_DOWNLOAD_DIR || path.resolve(process.cwd(), ".mongoms-cache");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const dbPath = path.resolve(process.cwd(), ".mongodb-data");
    fs.mkdirSync(dbPath, { recursive: true });

    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: "mk_cosmetic",
        dbPath,
        storageEngine: "wiredTiger",
      },
    });
    uri = memoryServer.getUri("mk_cosmetic");
    console.log(`[DB] Connected to persistent local MongoDB instance at ${dbPath}`);
  } else {
    console.log("[DB] Connecting to configured MONGODB_URI...");
  }

  await mongoose.connect(uri, {
    autoIndex: true,
  });

  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
