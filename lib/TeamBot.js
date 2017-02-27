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

  delegate(response) {
    const members = this.robot.brain.get('members');

    if (!members) {
      response.reply('no usernames available!');
      return;
    }

    const lastReviewerIndex = this.robot.brain.get('lastReviewerIndex');
    const newIndex = members[lastReviewerIndex+1]
      ? lastReviewerIndex + 1
      : 0;

    console.log('newIndex ', newIndex);

    response.reply(`@${members[newIndex]}: your turn`);
    this.robot.brain.set('lastReviewerIndex', newIndex);
  }

}
