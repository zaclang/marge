import debugLogger from 'debug-logger';

const debug = debugLogger('app:storage-service');
const PROTECTED_USERNAMES = ['zac'];

class StorageService {

  constructor(redisClient) {
    this.client = redisClient;
  }

  async addMemberToTeam(username, teamId) {
    // TODO: use es6 Set() for the members collection rather than an array
    const members = await this.getTeamMembers(teamId);

    if (!username) {
      throw new Error('missing username!');
    }

    if (members.includes(username)) {
      throw new Error('username exists');
    }

    members.push(username);
    return this.client.setAsync(`members:${teamId}`, `${members}`);
  }

  async removeMemberFromTeam(username, teamId) {
    if (!username) {
      throw new Error('missing username!');
    }

    if (PROTECTED_USERNAMES.includes(username)) {
      throw new Error(`I can't do that!`);
    }

    const members = await this.getTeamMembers(teamId);

    if (!members.includes(username)) {
      throw new Error(`I don't know a ${username}!`);
    }

    members.splice(members.indexOf(username), 1);    
    return this.client.setAsync(`members:${teamId}`, `${members}`);  
  }

  async removeAllMembersFromTeam(teamId) {
    return this.client.setAsync(`members:${teamId}`, `${[]}`);  
  }  

  async getTeamMembers(teamId) {
    const members = await this.client.getAsync(`members:${teamId}`);
    return members 
      ? members.split(',') 
      : [];
  }

  setLastReviewer(username, teamId) {
    debug.info('setting last reviewer to ', username);
    return this.client.setAsync(`lastReviewer:${teamId}`, username);
  }

  getLastReviewer(teamId) {
    return this.client.getAsync(`lastReviewer:${teamId}`);
  }

  setLastRequester(username, teamId) {
    debug.info('setting last requester to ', username);
    return this.client.setAsync(`lastRequester:${teamId}`, username);
  }

  getLastRequester(teamId) {
    return this.client.getAsync(`lastRequester:${teamId}`);
  }
}

export default StorageService;
