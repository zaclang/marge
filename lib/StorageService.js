import debugLogger from 'debug-logger';
const debug = debugLogger('app:storage-service');

class StorageService {

  constructor(redisClient, teamId = 0) {
    this.client = redisClient;
    this.teamId = teamId;
  }

  addMember(username) {
    return this.getMembers(this.teamId)
      .then((members) => {
        if (members.indexOf(username) > -1) {
          return Promise.reject(new Error('username exists'));
        }

        members.push(username);
        return this.client.setAsync(`members:${this.teamId}`, `${members}`);
      })
  }

  removeMember(username) {
    if (username === 'zac') {
      return Promise.reject(new Error(`I can't do that!`));
    }

    return this.getMembers(this.teamId)
      .then(members => {
        const indexOfUsername = members.indexOf(username);

        if (indexOfUsername < 0) {
          throw new Error(`I don't know a ${username}!`);
        }

        members.splice(indexOfUsername, 1);
        return this.client.setAsync(`members:${this.teamId}`, `${members}`);
      });
  }

  getMembers() {
    return this.client.getAsync(`members:${this.teamId}`)
      .then(members => members && members.split(',') || []);
  }

  setLastReviewer(username) {
    debug.info('setting last reviewer to ', username);
    return this.client.setAsync(`lastReviewer:${this.teamId}`, username);
  }

  getLastReviewer() {
    return this.client.getAsync(`lastReviewer:${this.teamId}`);
  }

  setLastRequestor(username) {
    debug.info('setting last requestor to ', username);
    return this.client.setAsync(`lastRequestor:${this.teamId}`, username);
  }

  getLastRequestor() {
    return this.client.getAsync(`lastRequestor:${this.teamId}`);
  }
}

export default StorageService;
