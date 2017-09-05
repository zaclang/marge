import debugLogger from "debug-logger";

import StorageService from "./StorageService";
import redisClient from "./RedisClient";
import RESPONSES from "../data/responses";
import { trimName } from "../utils";

const debug = debugLogger("app:team-bot");

const { SOURCE_VERSION = 1 } = process.env;

export default class Marge {
  constructor(robot) {
    this.robot = robot;
    this.store = new StorageService(redisClient);
  }

  version(response) {
    return response.send(`I'm at version ${SOURCE_VERSION}`);
  }

  welcomeBack(response) {
    response.send(`It's good to be back`);
  }

  async add(response) {
    const teamId = response.message.room;
    const username = trimName(response.match[2]);

    try {
      await this.store.addToList(teamId, "members", username);
      response.send(`@${username}, welcome to the club.`);
    } catch (error) {
      response.send(error.message);
    }
  }

  async reset(response) {
    const teamId = response.message.room;

    try {
      await this.store.clear(teamId, "members");
      response.reply("Reset complete.");
    } catch (error) {
      response.send(error.message);
    }
  }

  async remove(response) {
    const teamId = response.message.room;
    const username = trimName(response.match[2]);

    try {
      await this.store.removeFromList(teamId, "members", username);
      response.send(`@${username}, you're out.`);
    } catch (error) {
      response.send(error.message);
    }
  }

  async list(response) {
    const teamId = response.message.room;

    try {
      const members = await this.store.getList(teamId, "members");
      response.reply(members);
    } catch (error) {
      response.send(error.message);
    }
  }

  async rewind(response) {
    const teamId = response.message.room;

    try {
      const [members, lastReviewerName] = await Promise.all([
        this.store.getList(teamId, "members"),
        this.store.get(teamId, "lastReviewer")
      ]);

      const lastReviewerIndex = members.indexOf(lastReviewerName) - 1;

      let nextReviewerIndex =
        lastReviewerIndex > -1 ? lastReviewerIndex : members.length - 1;

      this.assignPullRequest(response, members[nextReviewerIndex]);
    } catch (error) {
      response.send(error.message);
    }
  }

  async current(response) {
    const teamId = response.message.room;

    try {
      const lastReviewer = await this.store.get(teamId, "lastReviewer");
      response.send(`@${lastReviewer}? hurry up` || "NFI");
    } catch (error) {
      response.send(error.message);
    }
  }

  // TODO: this method is huge...

  async assignPullRequest(response, suggestedReviewer) {
    const teamId = response.message.room;

    try {
      const members = await this.store.getList(teamId, "members");

      if (!members.length) {
        throw new Error("no usernames available!");
      }

      if (suggestedReviewer && !members.includes(suggestedReviewer)) {
        throw new Error(`I don't know a ${suggestedReviewer}!`);
      }

      const [lastReviewerName, lastRequesterName] = await Promise.all([
        this.store.get(teamId, "lastReviewer"),
        this.store.get(teamId, "lastRequester")
      ]);

      const requesterName = suggestedReviewer
        ? lastRequesterName
        : response.message.user.name;

      members.splice(members.indexOf(requesterName), 1); // exclude the requester
      let nextReviewerIndex = members.indexOf(lastReviewerName) + 1; // next in the list

      // todo: simplify this
      let nextReviewerName =
        suggestedReviewer ||
        trimName(response.match[2]) ||
        members[nextReviewerIndex] ||
        members[0];

      await Promise.all([
        this.store.set(teamId, "lastReviewer", nextReviewerName),
        this.store.set(teamId, "lastRequester", requesterName)
      ]);

      response.send(
        `Pull Request! @${nextReviewerName}, ${response.random(RESPONSES)}`
      );
    } catch (error) {
      response.send(error.message);
    }
  }
}
