import StorageService from './StorageService';
import redisClient from './RedisClient';

export default class TeamBot {

  constructor(robot) {
    this.robot = robot;
    this.store = new StorageService(redisClient, this.teamId);
  }

  trimInput(response) {
    return response.match[2] && response.match[2].trim().replace('@', '');
  }

  add(response) {
    const username = this.trimInput(response);

    this.store.addMember(username)
      .then(() => response.send(`@${username}, welcome to the club.`))
      .catch(e => response.send(e.message))
  }

  remove(response) {
    const username = this.trimInput(response);

    this.store.removeMember(username)
      .then(() => response.send(`@${username}, you're out.`))
      .catch(e => response.send(e.message));
  }

  list(response) {
    return this.store.getMembers()
      .then(members => response.reply(members));
  }

  set(response) {
    const username = this.trimInput(response);

    return this.store.getMembers()
      .then(members => {
        if (members.indexOf(username) > 0) {
          this.delegate(response, { username });
        } else {
          throw new Error(`I don't know a ${username}!`);
        }
      })
      .catch(e => response.send(e.message));
  }

  skip(response) {
    return this.delegate(response, {skip: true});
  }

  rewind(response) {
    return this.delegate(response, {rewind: true});
  }

  current(response) {
    this.store.getLastReviewer()
      .then(username => response.send(`@${username}? hurry up` || 'NFI'))
      .catch(e => response.send(e.message));
  }

  delegate(response, {rewind = false, skip = false, username } = {}) {
    const members = this.robot.brain.get('members');

    if (!members) {
      response.reply('no usernames available!');
      return;
    }

    const lastRequestor = this.robot.brain.get('lastRequestor');

    const requestor = skip || rewind
      ? lastRequestor
      : response.message.user.name;

    const lastReviewer = this.robot.brain.get('lastReviewer');
    let newIndex;

    if (rewind) {
      newIndex = (members.indexOf(lastReviewer) - 1) > -1
        ? (members.indexOf(lastReviewer) - 1)
        : members.length - 1;
    } else {
      newIndex = members.indexOf(lastReviewer) + 1;
    }

    const indexOfRequestor = members.indexOf(requestor);
    if (indexOfRequestor === newIndex) {
      newIndex = newIndex + 1;
    }

    let reviewer;

    if (username) {
      reviewer = username;
    } else {
      reviewer = newIndex <= members.length - 1
        ? members[newIndex]
        : members[0];
    }

    const responses = [
      'get to work!',
      'what are you waiting for?',
      `${requestor ? requestor + ` doesn't` : `we don't`} have all day!`,
      `${requestor ? requestor + ' is' : 'we are'} waiting...`,
      'STOP! PR time.',
      'it\'s not going to review itself',
    ];

    const random = responses[Math.floor(Math.random()*responses.length)];

    response.send(`@${reviewer} ${random}`);

    this.robot.brain.set('lastRequestor', requestor);
    this.robot.brain.set('lastReviewer', reviewer);
  }
}
