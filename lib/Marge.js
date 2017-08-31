import debugLogger from "debug-logger";

import StorageService from "./StorageService";
import redisClient from "./RedisClient";
import ADVICE from "../data/advice";
import RESPONSES from "../data/responses";

const debug = debugLogger("app:team-bot");
const ADVICE_ENDPOINT = "http://api.adviceslip.com/advice";

const { SOURCE_VERSION } = process.env;

export default class Marge {
  constructor(robot) {
    this.robot = robot;
    this.store = new StorageService(redisClient);
  }

  version(response) {
    return response.reply(
      `I'm at version ${SOURCE_VERSION || "1"} - the best yet.`
    );
  }

  // TODO: advice module
  async advice(response) {
    const username = response.message.user.name;
    const target = this.trimName(response.match[3]); // TODO: verify targets are in the channel

    const { data } = await axios.get(ADVICE_ENDPOINT);
    const { slip: { advice } } = data;

    const res = Math.random() >= 0.5 ? advice : response.random(ADVICE);

    return response.send(`${target || username}, ${res}`);
  }

  trimName(input = "") {
    return input.trim().replace("@", "");
  }

  welcomeBack(response) {
    response.send(`It's good to be back`);
  }

  async add(response) {
    const teamId = response.message.room;
    const username = this.trimName(response.match[2]);

    try {
      await this.store.addMemberToTeam(username, teamId);
      response.send(`@${username}, welcome to the club.`);
    } catch (error) {
      response.send(error);
    }
  }

  async reset(response) {
    const teamId = response.message.room;

    try {
      await this.store.removeAllMembersFromTeam(teamId);
      response.reply("Reset complete.");
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
      const [members, lastReviewerName] = await Promise.all([
        this.store.getTeamMembers(teamId),
        this.store.getLastReviewer(teamId)
      ]);

      const lastReviewerIndex = members.indexOf(lastReviewerName) - 1;

      let nextReviewerIndex =
        lastReviewerIndex > -1 ? lastReviewerIndex : members.length - 1;

      this.assignPullRequest(response, members[nextReviewerIndex]);
    } catch (error) {
      response.send(error);
    }
  }

  async current(response) {
    const teamId = response.message.room;

    try {
      const lastReviewer = await this.store.getLastReviewer(teamId);
      response.send(`@${lastReviewer}? hurry up` || "NFI");
    } catch (error) {
      response.send(error);
    }
  }

  // TODO: this method is huge...

  async assignPullRequest(response, suggestedReviewer) {
    const teamId = response.message.room;

    try {
      const members = await this.store.getTeamMembers(teamId);

      if (!members.length) {
        throw new Error("no usernames available!");
      }

      if (suggestedReviewer && !members.includes(suggestedReviewer)) {
        throw new Error(`I don't know a ${suggestedReviewer}!`);
      }

      const [lastReviewerName, lastRequesterName] = await Promise.all([
        this.store.getLastReviewer(teamId),
        this.store.getLastRequester(teamId)
      ]);

      const requesterName = suggestedReviewer
        ? lastRequesterName
        : response.message.user.name;

      let nextReviewerIndex =
        !suggestedReviewer && members.indexOf(lastReviewerName) + 1; // next in the list

      if (nextReviewerIndex > members.length - 1) {
        // out of bounds, reset to 0
        nextReviewerIndex = 0;
      }

      if (members.indexOf(requesterName) === nextReviewerIndex) {
        nextReviewerIndex = nextReviewerIndex + 1;
      }

      // todo: simplify this
      let nextReviewerName =
        suggestedReviewer ||
        this.trimName(response.match[2]) ||
        members[nextReviewerIndex];

      await Promise.all([
        this.store.setLastReviewer(nextReviewerName, teamId),
        this.store.setLastRequester(requesterName, teamId)
      ]);

      response.send(
        `Pull Request! @${nextReviewerName}, ${response.random(RESPONSES)}`
      );
    } catch (error) {
      response.send(error);
    }
  }
}
