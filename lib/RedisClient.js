import redis from "redis";
import Promise from "bluebird";
import debugLogger from "debug-logger";

const debug = debugLogger("app:redis");

class RedisClient {
  constructor() {
    const url = process.env.REDIS_URL || process.env.REDISCLOUD_URL || null;

    debug.info("Creating Redis Client.");
    this.client = Promise.promisifyAll(redis.createClient(url));

    this.client.on("error", err => debug.error("Redis Client Error:", err));
    this.client.on("ready", () =>
      debug.info("Redis Client Successfully Connected!")
    );

    process.on("uncaughtException", () => this.destroy());
    process.on("SIGTERM", () => this.destroy());
  }

  getClient() {
    return this.client;
  }

  destroy() {
    debug.info("Quitting Redis Client.");
    this.client.quit();
  }
}

export default new RedisClient().getClient();
