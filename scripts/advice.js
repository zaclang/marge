// Description:
//   Ask Hubot for some advice
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot advice
//   hubot advice for Fred

import axios from "axios";
import { trimName } from "../utils";

import ADVICE from "../data/advice";
const ADVICE_ENDPOINT = "http://api.adviceslip.com/advice";

module.exports = robot => {
  robot.respond(/(advice)( for )?(.*)?/i, getAdvice);
};

async function getAdvice(response) {
  const username = response.message.user.name;
  const target = trimName(response.match[3]); // TODO: verify targets are in the channel

  try {
    const { data } = await axios.get(ADVICE_ENDPOINT);
    const { slip: { advice } } = data;

    const res = Math.random() >= 0.5 ? advice : response.random(ADVICE);
    response.send(`${target || username}, ${res}`);
  } catch (error) {
    response.send(error);
  }
}
