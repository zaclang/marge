import Conversation from 'hubot-conversation';

export default class TeamBot {

  constructor(robot) {
    this.robot = robot;
  }

  add(response) {
    const username = response.match[2] && response.match[2].trim().replace('@', '');

    if (!username) {
      response.reply('missing username!');
      return;
    }

    const members = this.robot.brain.get('members') || [];

    if (members.indexOf(username) > -1) {
      response.reply('username exists!');
      return;
    }

    members.push(username);
    this.robot.brain.set('members', members);

    response.send(`@${username}, welcome to the club.`);
  }

  remove(response) {
    const username = response.match[2] && response.match[2].trim();

    if (!username) {
      response.reply('missing username!');
      return;
    }

    const members = this.robot.brain.get('members');
    const indexOfUsername = members.indexOf(username);

    if (indexOfUsername < 0) {
      response.reply(`I don\t know a ${username}!`);
      return;
    }

    members.splice(indexOfUsername, 1);
    this.robot.brain.set('members', members);

    response.send(`@${username}, you're out.`);
  }

  list(response) {
    response.reply(this.robot.brain.get('members'));
  }

  set(response) {
    const members = this.robot.brain.get('members');
    const user = response.match[2] && response.match[2].trim().replace('@', '');

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
    response.send(`${user}? hurry up` || 'NFI');
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
      this.skip(response);
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
