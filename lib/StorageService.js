import debugLogger from "debug-logger";

const debug = debugLogger("app:storage-service");

const rk = (...args) => args.join(":");

class StorageService {
  constructor(redisClient) {
    this.client = redisClient;
  }

  async addToList(teamId, key, value) {
    const list = await this.getList(teamId, key);

    if (!value) {
      throw new Error("missing value!");
    }

    if (list.includes(value)) {
      throw new Error("value exists!");
    }

    list.push(value);
    return this.set(teamId, key, list.toString());
  }

  async removeFromList(teamId, key, value) {
    if (!value) {
      throw new Error("missing value!");
    }

    const list = await this.getList(teamId, key);

    if (!list.includes(value)) {
      throw new Error(`I don't know a ${value}!`);
    }

    list.splice(list.indexOf(value), 1);
    return this.set(teamId, key, list.toString());
  }

  async getList(teamId, key) {
    const list = await this.get(teamId, key);
    return list ? list.split(",") : [];
  }

  get(teamId, key) {
    return this.client.getAsync(rk(key, teamId));
  }

  set(teamId, key, value) {
    return this.client.setAsync(rk(key, teamId), value);
  }

  clear(teamId, key) {
    return this.client.setAsync(rk(key, teamId), "");
  }
}

export default StorageService;
