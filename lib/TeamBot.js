import Promise from 'bluebird';
import debugLogger from 'debug-logger';
import _ from 'lodash';

import StorageService from './StorageService';
import redisClient from './RedisClient';

const debug = debugLogger('app:team-bot');

export default class TeamBot {
  constructor(robot) {
    this.robot = robot;
    this.store = new StorageService(redisClient, this._getTeamId());
  }

  _getTeamId() {
    //console.log('Team:', _.get(this.robot, 'adapter.client.team', 'NONE! :('));
    return _.get(this.robot, 'adapter.client.team.id', 'shell');
  }

  version(response) {
    return response.send(process.env.SOURCE_VERSION || 'unknown');
  }

  trimInput(response) {
    return response.match[2] && response.match[2].trim().replace('@', '');
  }

  welcomeBack(response) {
    response.send(`It's good to be back`);
  }

  add(response) {
    const username = this.trimInput(response);

    if (!username) {
      return response.send('missing username!');
    };

    return Promise.all(
      username.split(',').map(user => this.store.addMember(user))
    )
      .then(() => response.send(`@${username}, welcome to the club.`))
      .catch(error => response.send(error));
  }

  remove(response) {
    const username = this.trimInput(response);

    if (!username) {
      return response.send('missing username!');
    };

    return this.store.removeMember(username)
      .then(() => response.send(`@${username}, you're out.`))
      .catch(error => response.send(error));
  }

  list(response) {
    return this.store.getMembers()
      .then(members => response.reply(members));
  }

  set(response) {
    const username = this.trimInput(response);

    if (!username) {
      return response.send('missing username!');
    };

    return this.store.getMembers()
      .then(members => {
        if (members.indexOf(username) > 0) {
          this.delegate(response, { username });
        } else {
          throw new Error(`I don't know a ${username}!`);
        }
      })
      .catch(e => response.send(e.message));
  }

  skip(response) {
    return this.delegate(response, {skip: true});
  }

  rewind(response) {
    return this.delegate(response, {rewind: true});
  }

  current(response) {
    this.store.getLastReviewer()
      .then(username => response.send(`@${username}? hurry up` || 'NFI'))
      .catch(e => response.send(e.message));
  }

  delegate(response, {rewind = false, skip = false, username } = {}) {
    return Promise.all([
      this.store.getMembers(),
      this.store.getLastReviewer(),
      this.store.getLastRequestor(),
    ])
      .then(([members, lastReviewer, lastRequestor]) => {
        if (!members) {
          throw new Error('no usernames available!');
        }

        // get requestor
        const requestor = skip || rewind
          ? lastRequestor
          : response.message.user.name;

        debug.log({ requestor });

        let newIndex;

        if (rewind) {
          debug.log({rewind});
          const previous = members.indexOf(lastReviewer) - 1;
          debug.log({previous});

          newIndex = previous  > -1
            ? previous
            : members.length - 1;

          if (newIndex == 0 && previous == 0) {
            newIndex = members.length - 1;
          }

        } else {
          debug.log(`index of last reviewer: ${members.indexOf(lastReviewer)}, adding 1`);
          newIndex = members.indexOf(lastReviewer) + 1;
        }

        debug.log({ 
          newIndex,
          members: members.length
        });

        if (newIndex > members.length - 1) {
          debug.log('out of bounds, resetting to 0');
          newIndex = 0;
        }

        const indexOfRequestor = members.indexOf(requestor);

        if (indexOfRequestor === newIndex) {
          debug.log('landed on requestor, adding 1');
          newIndex = newIndex + 1;
        }

        debug.log({ indexOfRequestor });

        let reviewer;

        if (username) {
          reviewer = username;
        } else {
          reviewer = newIndex <= members.length - 1
            ? members[newIndex]
            : members[0];
        }

        debug.log({ reviewer });

        const responses = [
          'get to work!',
          'what are you waiting for?',
          `${requestor ? requestor + ` doesn't` : `we don't`} have all day!`,
          `${requestor ? requestor + ' is' : 'we are'} waiting...`,
          'STOP! PR time.',
          'it\'s not going to review itself',
        ];

        const random = responses[Math.floor(Math.random()*responses.length)];

        response.send(`@${reviewer} ${random}`);

        return {reviewer, requestor};
      })
      .tap(({ reviewer, requestor }) => this.store.setLastReviewer(reviewer))
      .then(({ requestor }) => this.store.setLastRequestor(requestor))
      .catch(e => response.send(e.message));
  }
}
