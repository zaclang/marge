// Description:
//   Cryptocurrency price checker
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot price check

import debugLogger from "debug-logger";
const debug = debugLogger("app:crypto-checker");

import axios from "axios";
const CRYPTO_COIN = "ETH";
const CURRENCY = "AUD";
const CRYPTO_ENDPOINT = `https://api.btcmarkets.net/market/${CRYPTO_COIN}/${CURRENCY}/tick`;

module.exports = robot => {
  robot.respond(/price check/i, priceCheck);
};

async function priceCheck(msg) {
  const username = msg.message.user.name;
  const { data: { lastPrice } } = await axios.get(CRYPTO_ENDPOINT);
  return msg.send(
    `${username}, The last price for ${CRYPTO_COIN} was $${lastPrice} (${CURRENCY})`
  );
}
