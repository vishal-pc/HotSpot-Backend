import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();
// Configure Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost", // Redis server host
  port: 6379, // Redis server port
  password: "", // Redis password, if set
  // Additional configuration options if needed
});

// Handle connection error
redisClient.on("error", (err) => {
  console.log("Error connecting to Redis:", err);
});

export default redisClient;
