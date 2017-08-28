import Promise from 'bluebird';
import debugLogger from 'debug-logger';
import axios from 'axios';

import StorageService from './StorageService';
import redisClient from './RedisClient';

const debug = debugLogger('app:team-bot');
const ADVICE_ENDPOINT = 'http://api.adviceslip.com/advice';

export default class TeamBot {
  constructor(robot) {
    this.robot = robot;
    this.store = new StorageService(redisClient);
  }

  version(response) {
    return response.send(process.env.SOURCE_VERSION || 'unknown');
  }
  
  async advice(response) {
    const username = response.message.user.name;

    const { data } = await axios.get(ADVICE_ENDPOINT);
    const { slip: { advice } } = data;

    const res = (Math.random() >= 0.5)
      ? advice
      : this.getCustomAdvice();

    return response.send(`${username}, ${res}`);      
  }

  async priceCheck(response, coin = 'ETH', currency = 'AUD') {
    const username = response.message.user.name;
    const { data: { lastPrice } } = await axios.get(`https://api.btcmarkets.net/market/${coin}/${currency}/tick`);    

    return response.send(`${username}, The last price for Ethereum was $${lastPrice} (AUD)`);      
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
      "doesn't look like anything to me",
      "after you drink a can of coke, CRUSH IT!!!",
      "refer to the burn down chart",
    ];

    return advice[Math.floor(Math.random()*advice.length)];
  }

  trimName(input = '') {
    return input.trim().replace('@', '');
  }

  welcomeBack(response) {
    response.send(`It's good to be back`);
  }

  async add(response) {
    const teamId = response.message.room;
    const username = this.trimName(response.match[2]);

    try {
      const addedUser = await this.store.addMemberToTeam(username, teamId);
      response.send(`@${addedUser}, welcome to the club.`);
    } catch (error) {
      response.send(error);
    }
  }

  async remove(response) {
    const teamId = response.message.room;
    const username = this.trimName(response.match[2]);

    try {
      await this.store.removeMemberFromTeam(username, teamId);
      response.send(`@${username}, you're out.`);
    } catch (error) {
      response.send(error);      
    }        
  }

  async list(response) {
    const teamId = response.message.room;

    try {
      const members = await this.store.getTeamMembers(teamId);
      response.reply(members);          
    } catch (error) {
      response.send(error);      
    }     
  }

  async rewind(response) {
    const teamId = response.message.room;

    try {    
      const members = await this.store.getTeamMembers(teamId);
      const lastReviewerName = await this.store.getLastReviewer(teamId);
      const lastReviewerIndex = members.indexOf(lastReviewerName) - 1;

      let nextReviewerIndex = lastReviewerIndex  > -1
        ? lastReviewerIndex
        : members.length - 1;

      this.delegate(response, members[nextReviewerIndex]);  
    } catch (error) {
      response.send(error);      
    }
  }

  async current(response) {
    const teamId = response.message.room;

    try {    
      const lastReviewer = await this.store.getLastReviewer(teamId);
      response.send(`@${lastReviewer}? hurry up` || 'NFI');
    } catch (error) {
      response.send(error);
    }
  }

  async delegate(response, user) {
    const teamId = response.message.room;
    const username = user || this.trimName(response.match[2]);

    try {
      const members = await this.store.getTeamMembers(teamId);  

      if (!members.length) {
        throw new Error('no usernames available!');
      }

      if (username && !members.includes(username)) {
        throw new Error(`I don't know a ${username}!`);
      }

      const lastReviewerName = await this.store.getLastReviewer(teamId);
      const lastRequesterName = await this.store.getLastRequester(teamId);

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

      debug.info({ nextReviewerName });

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

      await this.store.setLastReviewer(nextReviewerName, teamId);
      await this.store.setLastRequester(requesterName, teamId);
      
      response.send(`PR! @${nextReviewerName}, ${random}`);
    } catch (error) {
      response.send(error);
    }
  } 

}
