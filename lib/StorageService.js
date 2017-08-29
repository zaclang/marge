import debugLogger from "debug-logger";

const debug = debugLogger("app:storage-service");
const PROTECTED_USERNAMES = ["zac"];

const rk = (...args) => args.join(":");

class StorageService {
  constructor(redisClient) {
    this.client = redisClient;
  }

  async addMemberToTeam(username, teamId) {
    const members = await this.getTeamMembers(teamId);

    if (!username) {
      throw new Error("missing username!");
    }

    if (members.includes(username)) {
      throw new Error("username exists");
    }

    members.push(username);
    return this.client.setAsync(rk("members", teamId), members.toString());
  }

  async removeMemberFromTeam(username, teamId) {
    if (!username) {
      throw new Error("missing username!");
    }

    if (PROTECTED_USERNAMES.includes(username)) {
      throw new Error(`I can't do that!`);
    }

    const members = await this.getTeamMembers(teamId);

    if (!members.includes(username)) {
      throw new Error(`I don't know a ${username}!`);
    }

    members.splice(members.indexOf(username), 1);
    return this.client.setAsync(rk("members", teamId), members.toString());
  }

  removeAllMembersFromTeam(teamId) {
    return this.client.setAsync(rk("members", teamId), "[]");
  }

  async getTeamMembers(teamId) {
    const members = await this.client.getAsync(rk("members", teamId));
    return members ? members.split(",") : [];
  }

  setLastReviewer(username, teamId) {
    debug.info("setting last reviewer to ", username);
    return this.client.setAsync(rk("lastReviewer", teamId), username);
  }

  getLastReviewer(teamId) {
    return this.client.getAsync(rk("lastReviewer", teamId));
  }

  setLastRequester(username, teamId) {
    debug.info("setting last requester to ", username);
    return this.client.setAsync(rk("lastRequester", teamId), username);
  }

  getLastRequester(teamId) {
    return this.client.getAsync(rk("lastRequester", teamId));
  }
}

export default StorageService;
