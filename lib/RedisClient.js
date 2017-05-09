import redis from 'redis';
import Promise from 'bluebird';

class RedisClient {

  constructor() {
    const url = process.env.REDIS_URL || process.env.REDISCLOUD_URL || null;

    console.log('Creating Redis Client.');
    this.client = Promise.promisifyAll(redis.createClient(url));

    this.client.on('error', (err) => console.log('Redis Client Error:', err));
    this.client.on('ready', () => console.log('Redis Client Successfully Connected!'));

    process.on('uncaughtException', () => this.destroy());
    process.on('SIGTERM', () => this.destroy());
  }

  getClient() {
    return this.client;
  }

  destroy() {
    console.log('Quitting Redis Client.');
    this.client.quit();
  }

}

export default new RedisClient().getClient();
