import Conversation from 'hubot-conversation'

export default class TeamBot {

  constructor(robot) {
    this.robot = robot;

    // this.conversation = new Conversation(robot);
  }

  add(response) {
    const query = response.match[1] && response.match[1].trim();

    if (!query) {
      console.log('missing name');
    }

    const members = this.robot.brain.get('members');

    console.log(members);

    this.robot.brain.set('members', );

    console.log(`members: ${members}`);
  }

  remove(response) {
    const query = response.match[1] && response.match[1].trim();

    console.log(`removing ${query}`);
  }

  delegate(response) {
    console.log
    console.log(`delegating`);

  }

}
