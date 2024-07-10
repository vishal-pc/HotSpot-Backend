import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const bullRedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || "",
  // Adjust these options for Bull compatibility
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

const createBullRedisClient = (type: "client" | "subscriber" | "bclient") => {
  return new Redis(bullRedisOptions);
};
export { createBullRedisClient };
