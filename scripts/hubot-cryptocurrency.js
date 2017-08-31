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

// TODO: btc markets only supports AUD right now - find something else..
const DEFAULT_CURRENCY = "AUD";
const CRYPTO_ENDPOINT = (coin, currency) =>
  `https://api.btcmarkets.net/market/${coin}/${currency ||
    DEFAULT_CURRENCY}/tick`;

module.exports = robot => {
  robot.respond(/price check (AUD)?/i, priceCheck);
};

async function priceCheck(msg) {
  const username = msg.message.user.name;

  const currency = msg.match[1] || DEFAULT_CURRENCY;
  const endpoint = CRYPTO_ENDPOINT(CRYPTO_COIN, currency.toUpperCase());

  const { data: { lastPrice } } = await axios.get(endpoint);
  return msg.send(
    lastPrice
      ? `${username}, The last price for ${CRYPTO_COIN} was $${lastPrice} ${currency}`
      : "no idea"
  );
}
