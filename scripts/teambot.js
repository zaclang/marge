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

  robot.hear(/.*github.com\/crimson-education\/.*\/pull/i, teamBot.delegate.bind(teamBot));
  robot.respond(/(add)(.*)/i, teamBot.add.bind(teamBot));
  robot.respond(/(remove)(.*)/i, teamBot.remove.bind(teamBot));
  robot.respond(/(list)(.*)/i, teamBot.list.bind(teamBot));
  robot.respond(/(skip)(.*)/i, teamBot.skip.bind(teamBot));
  robot.respond(/(rewind)(.*)/i, teamBot.rewind.bind(teamBot));
};
