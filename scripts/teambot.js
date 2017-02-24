//
// Description:
//
// Configuration:
//
// Commands:
//   hubot add <username>
//   hubot remove <username>
//

import TeamBot from '../lib/TeamBot';

module.exports = (robot) => {

  let teamBot = new TeamBot(robot);

  // console.log('ROBOT:', robot.adapterName, 'MAP:', _.flatMap(robot));

  robot.hear(/github/i, teamBot.delegate.bind(teamBot));
  robot.respond(/(add)(.*)/i, teamBot.add.bind(teamBot));
  robot.respond(/(remove)(.*)/i, teamBot.remove.bind(teamBot));
};
