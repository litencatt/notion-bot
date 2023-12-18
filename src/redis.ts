const Redis = require("ioredis")
export const redis = new Redis({
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_HOST,
})
