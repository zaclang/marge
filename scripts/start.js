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
//   hubot advice
//   hubot price check

import Marge from "../lib/Marge";

module.exports = robot => {
  let marge = new Marge(robot);

  // bot
  robot.respond(/(version)(.*)/i, marge.version.bind(marge));
  robot.hear(/welcome back @?marge/i, marge.welcomeBack.bind(marge));

  // user management
  robot.respond(/(add)(.*)/i, marge.add.bind(marge));
  robot.respond(/(remove)(.*)/i, marge.remove.bind(marge));
  robot.respond(/(list)(.*)/i, marge.list.bind(marge));
  robot.respond(/(reset)/gi, marge.reset.bind(marge));

  // github
  robot.hear(
    /.*github.com\/.*\/.*\/pull/i,
    marge.assignPullRequest.bind(marge)
  );
  robot.respond(/(skip)(.*)/i, marge.assignPullRequest.bind(marge));
  robot.respond(/(assign|set)(.*)/i, marge.assignPullRequest.bind(marge));
  robot.respond(/(rewind)(.*)/i, marge.rewind.bind(marge));
  robot.respond(/(current)(.*)/i, marge.current.bind(marge));
};
