import Promise from 'bluebird';
import debugLogger from 'debug-logger';
import _ from 'lodash';
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
        return response.send(`${username}, ${advice}`);
      });
  }

  trimInput(input) {
    return input[2] && input[2].trim().replace('@', '');
  }

  welcomeBack(response) {
    response.send(`It's good to be back`);
  }

  add(response) {
    const teamId = response.message.room;
    const username = this.trimInput(response.match);

    if (!username) {
      return response.send('missing username!');
    };

    return Promise.all(
      username.split(',').map(user => this.store.addMember(user, teamId))
    )
      .then(() => response.send(`@${username}, welcome to the club.`))
      .catch(error => response.send(error));
  }

  remove(response) {
    const teamId = response.message.room;
    const username = this.trimInput(response.match);

    if (!username) {
      return response.send('missing username!');
    };

    return this.store.removeMember(username, teamId)
      .then(() => response.send(`@${username}, you're out.`))
      .catch(error => response.send(error));
  }

  list(response) {
    const teamId = response.message.room;

    return this.store.getMembers(teamId)
      .then(members => response.reply(members));
  }

  set(response) {
    const teamId = response.message.room;
    const username = this.trimInput(response.match);

    if (!username) {
      return response.send('missing username!');
    };

    return this.store.getMembers(teamId)
      .then(members => {
        if (members.indexOf(username) > 0) {
          this.delegate(response, username);
        } else {
          throw new Error(`I don't know a ${username}!`);
        }
      })
      .catch(e => response.send(e.message));
  }

  skip(response) {
    return this.delegate(response);
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

        const indexOfRequester = members.indexOf(requesterName);

        if (indexOfRequester === nextReviewerIndex) {
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

        response.send(`@${nextReviewerName}, ${random}`);

        return {nextReviewerName, requesterName};
      })
      .tap(({ nextReviewerName, requesterName }) => this.store.setLastReviewer(nextReviewerName, teamId))
      .then(({ requesterName }) => this.store.setLastRequester(requesterName, teamId))
      .catch(e => response.send(e.message));
  }
}
