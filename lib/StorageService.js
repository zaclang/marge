import debugLogger from 'debug-logger';

const debug = debugLogger('app:storage-service');
const PROTECTED_USERNAMES = ['zac'];

class StorageService {

  constructor(redisClient) {
    this.client = redisClient;
  }

  addMemberToTeam(username, teamId) {
    return this.getMembers(teamId)
      .then((members) => {
        if (members.indexOf(username) > -1) {
          return Promise.reject(new Error('username exists'));
        }

        members.push(username);
        return this.client.setAsync(`members:${teamId}`, `${members}`);
      }).then(() => username)
  }

  removeMemberFromTeam(username, teamId) {
    if (PROTECTED_USERNAMES.includes(username)) {
      return Promise.reject(new Error(`I can't do that!`));
    }

    return this.getMembers(teamId)
      .then(members => {
        const indexOfUsername = members.indexOf(username);

        if (indexOfUsername < 0) {
          throw new Error(`I don't know a ${username}!`);
        }

        members.splice(indexOfUsername, 1);
        return this.client.setAsync(`members:${teamId}`, `${members}`);
      })
      .then(() => username);
  }

  getMembers(teamId) {
    return this.client.getAsync(`members:${teamId}`)
      .then(members => members && members.split(',') || []);
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
