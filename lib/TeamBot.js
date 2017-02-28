import Conversation from 'hubot-conversation';

export default class TeamBot {

  constructor(robot) {
    this.robot = robot;

    // this.conversation = new Conversation(robot);
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
      response.reply('username doesn\'t exist!');
      return;
    }

    members.splice(indexOfUsername, 1);
    this.robot.brain.set('members', members);
  }

  list(response) {
    response.reply(this.robot.brain.get('members'));
  }

  whoami(response) {
    response(`you are ${response.message.user.name}`);
  }

  skip(response) {
    return delegate(response);
  }

  delegate(response) {
    const members = this.robot.brain.get('members');
    const requestor = response.message.user.name;

    if (!members) {
      response.reply('no usernames available!');
      return;
    }

    const lastReviewer = this.robot.brain.get('lastReviewer');
    const availableMembers = members.filter(name =>
      (name !== requestor) && (name !== lastReviewer));

    const newIndex = members.indexOf(lastReviewer) + 1;

    const reviewer = newIndex <= members.length - 1
      ? members[newIndex]
      : members[0];

    // todo exclude requestor

    response.send(`@${reviewer} get to work!`);
    this.robot.brain.set('lastReviewer', reviewer);
  }

}
