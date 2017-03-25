
class StorageService {

  constructor(redisClient, teamId) {
    this.client = redisClient;
    this.teamId = teamId;
  }

  addMember(username) {
    return this.getMembers()
      .then((members) => {
        if (members.indexOf(username) > -1) {
          return Promise.reject(new Error('username exists'));
        }

        members.push(username);
        return this.client.setAsync('members', `${members}`);
      })
  }

  removeMember(username) {
    if (username === 'zac') {
      return Promise.reject(new Error(`I can't do that!`));
    }

    return this.getMembers()
      .then(members => {
        const indexOfUsername = members.indexOf(username);

        if (indexOfUsername < 0) {
          throw new Error(`I don't know a ${username}!`);
        }

        members.splice(indexOfUsername, 1);
        return this.client.setAsync('members', `${members}`);
      });
  }

  getMembers() {
    return this.client.getAsync('members')
      .then(members => members && members.split(',') || []);
  }

  setLastReviewer(username) {
    console.info('setting last reviewer: ', username);
    return this.client.setAsync('lastReviewer', username);
  }

  getLastReviewer() {
    return this.client.getAsync('lastReviewer');
  }

  setLastRequestor(username) {
    console.info('setting last requestor: ', username);
    return this.client.setAsync('lastRequestor', username);
  }

  getLastRequestor() {
    return this.client.getAsync('lastRequestor');
  }
}

export default StorageService;
