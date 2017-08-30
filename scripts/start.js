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

  robot.hear(/.*github.com\/.*\/.*\/pull/i, marge.delegate.bind(marge));
  robot.hear(/welcome back @?marge/i, marge.welcomeBack.bind(marge));
  robot.respond(/(add)(.*)/i, marge.add.bind(marge));
  robot.respond(/(remove)(.*)/i, marge.remove.bind(marge));
  robot.respond(/(list)(.*)/i, marge.list.bind(marge));
  robot.respond(/(skip)(.*)/i, marge.delegate.bind(marge));
  robot.respond(/(rewind)(.*)/i, marge.rewind.bind(marge));
  robot.respond(/(current)(.*)/i, marge.current.bind(marge));
  robot.respond(/(assign|set)(.*)/i, marge.delegate.bind(marge));
  robot.respond(/(version)(.*)/i, marge.version.bind(marge));
  robot.respond(/(advise|advice)( for )?(.*)?$/i, marge.advice.bind(marge));
  robot.respond(/(price check)/gi, marge.priceCheck.bind(marge));
  robot.respond(/(reset)/gi, marge.reset.bind(marge));

  //robot.router.post('/webook', (req, res) => {
  //  let data = req.body.payload != null ? JSON.parse(req.body.payload) : req.body;
  //  let room = 'testing';
  //  let message = data.pull_request.url;
  //
  //
  //
  //  if (typeof room !== 'string' || typeof message === 'undefined') {
  //    res.send(422); return;
  //  }
  //
  //  // if (typeof message === 'string') {
  //  //   robot.messageRoom(room, message);
  //  // }
  //
  //  res.send(message);
  //});
};
