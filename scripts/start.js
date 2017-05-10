//
// Description:
//
// Configuration:
//
// Commands:
//   hubot add <username>
//   hubot remove <username>
//   hubot list
//   hubot skip
//   hubot rewind
//   hubot set <username>
//   hubot current
//

import TeamBot from '../lib/TeamBot';
import githubEventParser from '../lib/GithubEventParser';

module.exports = (robot) => {
  let teamBot = new TeamBot(robot);
  

  robot.hear(/.*github.com\/crimson-education\/.*\/pull/i, teamBot.delegate.bind(teamBot));
  robot.hear(/welcome back @?marge/i, teamBot.welcomeBack.bind(teamBot));
  robot.respond(/(add)(.*)/i, teamBot.add.bind(teamBot));
  robot.respond(/(remove)(.*)/i, teamBot.remove.bind(teamBot));
  robot.respond(/(list)(.*)/i, teamBot.list.bind(teamBot));
  robot.respond(/(skip)(.*)/i, teamBot.skip.bind(teamBot));
  robot.respond(/(rewind)(.*)/i, teamBot.rewind.bind(teamBot));
  robot.respond(/(current)(.*)/i, teamBot.current.bind(teamBot));
  robot.respond(/(set)(.*)/i, teamBot.set.bind(teamBot));
  robot.respond(/(version)(.*)/i, teamBot.version.bind(teamBot));  

  robot.router.post('/webook', (req, res) => {
    let data = req.body.payload != null ? JSON.parse(req.body.payload) : req.body; 
    let room = 'testing';  
    let message = data.pull_request.url;



    if (typeof room !== 'string' || typeof message === 'undefined') {
      res.send(422); return;
    }

    // if (typeof message === 'string') {
    //   robot.messageRoom(room, message);
    // }

    res.send(message);       
  });
};
