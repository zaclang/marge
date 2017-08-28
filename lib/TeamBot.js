import Promise from 'bluebird';
import debugLogger from 'debug-logger';
import axios from 'axios';

import StorageService from './StorageService';
import redisClient from './RedisClient';
import ADVICE from '../data/advice';
import RESPONSES from '../data/responses';

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
      : response.random(ADVICE);

    return response.send(`${username}, ${res}`);      
  }

  async priceCheck(response, coin = 'ETH', currency = 'AUD') {
    const username = response.message.user.name;
    const { data: { lastPrice } } = await axios.get(`https://api.btcmarkets.net/market/${coin}/${currency}/tick`);    

    return response.send(`${username}, The last price for Ethereum was $${lastPrice} (AUD)`);      
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

      if (!username) { // skip
        nextReviewerIndex = members.indexOf(lastReviewerName) + 1;
      }

      if (nextReviewerIndex > members.length - 1) {
        nextReviewerIndex = 0;
      }

      if (members.indexOf(requesterName) === nextReviewerIndex) {
        debug.info('landed on requesterName, adding 1');
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

      await this.store.setLastReviewer(nextReviewerName, teamId);
      await this.store.setLastRequester(requesterName, teamId);
      
      response.send(`PR! @${nextReviewerName}, ${response.random(RESPONSES)}`);
    } catch (error) {
      response.send(error);
    }
  } 
}
