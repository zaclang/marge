import Promise from 'bluebird';
import debugLogger from 'debug-logger';
import axios from 'axios';

import StorageService from './StorageService';
import redisClient from './RedisClient';

const debug = debugLogger('app:team-bot');


export default class TeamBot {
  constructor(robot) {
    this.robot = robot;
    this.store = new StorageService(redisClient);
  }

  version(response) {
    return response.send(process.env.SOURCE_VERSION || 'unknown');
  }

  advice(response) {
    const username = response.message.user.name;

    return axios.get('http://api.adviceslip.com/advice')
      .then(({ data }) => {
        const { slip: { advice } } = data;

        const res = (Math.random() >= 0.5)
          ? advice
          : this.getCustomAdvice();

        return response.send(`${username}, ${res}`);
      });
  }

  priceCheck(response, coin = 'ETH', currency = 'AUD') {
    const username = response.message.user.name;

    return axios.get(`https://api.btcmarkets.net/market/${coin}/${currency}/tick`)
      .then(({ data }) => {
        const { lastPrice } = data;
        return response.send(`${username}, The last price for Ethereum was $${lastPrice} (AUD)`);
      });
  }

  getCustomAdvice() {
    const advice = [
      'cbf',
      'maybe you should get a job at Aviato',
      'you have to ask yourself, hotdog or not hotdog?',
      'I think we need to talk about getting some shwaaaaaaaaag.',
      'always consider ROI - Radio on Internet.',
      "it’s not about how much you earn but what you’re worth. And who’s worth the most? Companies that lose money.",
      'do you really want to live in a world where someone *else* is making it a better place?',
      'I suggest a vision quest',
      'the true value of snake oil is intangible',
      "you need to do what any animal in nature does when it's cornered: act erratically and blindly lash out at everything around us.",
      'frankly, your lack of paranoia is insane to me.',
      "don't touch anything. Failure is contagious.",
      "nobody exists on purpose. Nobody belongs anywhere. We're all going to die. Come watch TV.",
      "it's like inception, so if it's confusing and stupid then so is everyone's favourite movie",
      'you should dance on the graves of your enemies',
      "don't hate the player, hate the game.",
      'PHP is about as exciting as your toothbrush. You use it every day, it does the job, it is a simple tool, so what? Who would want to read about toothbrushes?',
      "there are people who actually like programming. I don't understand why they like programming.",
      'PHP is rarely the bottleneck.',
      "start running and don't look back",
      "doing nothing is hard, you never know when you're done",
      "no matter how smart you are you can never convince someone stupid that they are stupid.",
      "you did not trip and fall. You attacked the floor and I believe you are winning.",
      "it's so simple to be wise. Just think of something stupid to say and then don't say it.",
      'do you know what happened to the neanderthals? We ate them.',
      "never place your trust in humans. Inevitably we will disappoint you.",
      "the piano doesn't murder the player if it doesn't like the music.",
      "there aren't two versions of you. There's only one. And I think when you discover who you are, you'll be free.",
      "that question, the question you're not supposed to ask. I'm getting an answer you're not supposed to know. Would you like to know the question?",
      "doesn't look like anything to me"
    ];

    return advice[Math.floor(Math.random()*advice.length)];
  }

  trimName(input = '') {
    return input.trim().replace('@', '');
  }

  welcomeBack(response) {
    response.send(`It's good to be back`);
  }

  add(response) {
    const teamId = response.message.room;
    const username = this.trimName(response.match[2]);

    if (!username) {
      return response.send('missing username!');
    };

    return Promise.all(
      username.split(',').map(user => this.store.addMemberToTeam(user, teamId))
    )
      .then(addedUser => response.send(`@${addedUser}, welcome to the club.`))
      .catch(error => response.send(error));
  }

  remove(response) {
    const teamId = response.message.room;
    const username = this.trimName(response.match[2]);

    if (!username) {
      return response.send('missing username!');
    };

    return this.store.removeMemberFromTeam(username, teamId)
      .then(removedUser => response.send(`@${removedUser}, you're out.`))
      .catch(error => response.send(error));
  }

  list(response) {
    const teamId = response.message.room;

    return this.store.getMembers(teamId)
      .then(members => response.reply(members));
  }

  set(response) {
    const teamId = response.message.room;
    const username = this.trimName(response.match[2]);

    if (!username) {
      return response.send('missing username!');
    };

    return this.store.getMembers(teamId)
      .then(members => {
        if (members.includes(username)) {
          this.delegate(response, username);
        } else {
          throw new Error(`I don't know a ${username}!`);
        }
      })
      .catch(e => response.send(e.message));
  }

  rewind(response) {
    const teamId = response.message.room;

    return Promise.all([
      this.store.getMembers(teamId),
      this.store.getLastReviewer(teamId),
    ])
      .then(([members = [], lastReviewerName]) => {
        const lastReviewerIndex = members.indexOf(lastReviewerName) - 1;

        let nextReviewerIndex = lastReviewerIndex  > -1
          ? lastReviewerIndex
          : members.length - 1;

        return this.delegate(response, members[nextReviewerIndex]);
      });
  }

  current(response) {
    const teamId = response.message.room;

    this.store.getLastReviewer(teamId)
      .then(username => response.send(`@${username}? hurry up` || 'NFI'))
      .catch(e => response.send(e.message));
  }

  delegate(response, username) {
    const teamId = response.message.room;

    return Promise.all([
      this.store.getMembers(teamId),
      this.store.getLastReviewer(teamId),
      this.store.getLastRequester(teamId),
    ])
      .then(([members = [], lastReviewerName, lastRequesterName]) => {

        if (!members.length) {
          throw new Error('no usernames available!');
        }

        const requesterName = username
          ? lastRequesterName
          : response.message.user.name;

        let nextReviewerIndex;

        if (!username) {
          nextReviewerIndex = members.indexOf(lastReviewerName) + 1;
        }

        if (nextReviewerIndex > members.length - 1) {
          nextReviewerIndex = 0;
        }

        if (members.indexOf(requesterName) === nextReviewerIndex) {
          debug.log('landed on requesterName, adding 1');
          nextReviewerIndex = nextReviewerIndex + 1;
        }

        let nextReviewerName;

        if (username) {
          nextReviewerName = username;
        } else {
          nextReviewerName = nextReviewerIndex <= members.length - 1
            ? members[nextReviewerIndex]
            : members[0];
        }

        debug.log({ nextReviewerName });

        const responses = [
          'start reviewing, or start running...',
          'fear me.',
          'pull your weight!',
          'do something or weep.',
          `don\`t make me come over there!`,
          `my patience is not to be tested.`,
          'the clock is ticking...',
          'start moving!',
          '$%##$ $#%@#&!@!',
        ];

        const random = responses[Math.floor(Math.random()*responses.length)];

        response.send(`PR! @${nextReviewerName}, ${random}`);

        return {nextReviewerName, requesterName};
      })
      .tap(({ nextReviewerName, requesterName }) => this.store.setLastReviewer(nextReviewerName, teamId))
      .then(({ requesterName }) => this.store.setLastRequester(requesterName, teamId))
      .catch(e => response.send(e.message));
  }
}
