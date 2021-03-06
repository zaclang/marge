// Description:
//   Crypto currency price checker
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot price check

import axios from "axios";

const CRYPTO_COIN = "ETH";
const DEFAULT_CURRENCY = "AUD"; // TODO: btc markets only supports AUD right now - find something else..

module.exports = robot => {
  robot.respond(/price check/i, priceCheck);
};

async function priceCheck(msg) {
  const username = msg.message.user.name;

  try {
    const { data: { lastPrice } } = await axios.get(
      `https://api.btcmarkets.net/market/${CRYPTO_COIN}/${DEFAULT_CURRENCY}/tick`
    );
    msg.send(
      lastPrice
        ? `${username}, The last price for ${CRYPTO_COIN} was $${lastPrice} ${DEFAULT_CURRENCY}`
        : "I have no idea!"
    );
  } catch (error) {
    msg.send(error.message);
  }
}
