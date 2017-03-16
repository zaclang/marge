import StorageService from './StorageService';
import redisClient from './RedisClient';

export default class TeamBot {

  constructor(robot) {
    this.robot = robot;
    this.store = new StorageService(redisClient, this.teamId);
  }

  add(response) {
    const username = response.match[2] && response.match[2].trim().replace('@', '');

    if (!username) {
      response.reply('missing username!');
      return;
    }

    this.store.addMember(username)
      .then(() => response.send(`@${username}, welcome to the club.`))
      .catch(e => response.send(e.message))
  }

  remove(response) {
    const username = response.match[2] && response.match[2].trim();

    this.store.removeMember(username)
      .then(() => response.send(`@${username}, you're out.`))
      .catch(e => response.send(e.message));
  }

  list(response) {
    return this.store.getMembers()
      .then(members => response.reply(members));
  }

  set(response) {
    const user = response.match[2] && response.match[2].trim().replace('@', '');

    const members = this.robot.brain.get('members');

    if (members.indexOf(user) < 0) {
      response.reply(`I don't know a ${user}!`);
      return;
    }

    this.delegate(response, { user });
  }

  skip(response) {
    return this.delegate(response, {skip: true});
  }

  rewind(response) {
    return this.delegate(response, {rewind: true});
  }

  current(response) {
    const user = this.robot.brain.get('lastReviewer');
    response.send(`@${user}? hurry up` || 'NFI');
  }

  delegate(response, {rewind = false, skip = false, user } = {}) {
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

    if (user) {
      reviewer = user;
    } else {
      reviewer = newIndex <= members.length - 1
        ? members[newIndex]
        : members[0];
    }

    const responses = [
      '$%@##$!! DO SOMETHING!',
      `you're really slacking off here.,`,
      `we're counting on you. Don't screw this up..`,
      `I demand you review this PR immediately`,
      `I'm sick if your slowness. YOUR TURN!!`,
      `do some work..`,
      `be a team player`,
    ];

    const random = responses[Math.floor(Math.random()*responses.length)];

    response.send(`@${reviewer} ${random}`);

    this.robot.brain.set('lastRequestor', requestor);
    this.robot.brain.set('lastReviewer', reviewer);
  }
}
