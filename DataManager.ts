import getRandomArrayElement from "./utils/getRandomArrayElement.ts";
import type { CustomWebSocket } from "./webSocketServer.ts";
import webSocketServer from "./webSocketServer.ts";

type MatchSports = "football" | "basketball" | "tennis";
type MatchStatus = "scheduled" | "live" | "finished";

interface Match {
  id: number;
  sports: MatchSports;
  status: MatchStatus;
  teamA: {
    name: string;
    score: number;
  };
  teamB: {
    name: string;
    score: number;
  };
}

const MATCH_SPORTS: MatchSports[] = ["football", "basketball", "tennis"];
const MATCH_STATUSES: MatchStatus[] = ["scheduled", "live", "finished"];

interface Commentary {
  id: number;
  matchId: number;
  text: string;
}

class DataManager {
  private matches: Match[] = [];
  private matchIdToCommentary: Map<number, Commentary[]> = new Map();
  private matchIdToSubscribers: Map<number, Set<CustomWebSocket>> = new Map();

  constructor() {
    this.startActivity();
  }

  private startActivity() {
    // Create a new match every minute
    setInterval(() => {
      const createdMatch: Match = {
        id: this.matches.length === 0 ? 1 : this.matches.at(-1)!.id + 1,
        sports: getRandomArrayElement(MATCH_SPORTS),
        status: getRandomArrayElement(MATCH_STATUSES),
        teamA: {
          name: "Artem's team",
          score: 0,
        },
        teamB: {
          name: "Claude's team",
          score: 0,
        },
      };

      this.matches.push(createdMatch);

      webSocketServer.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) {
          return;
        }

        client.send(
          JSON.stringify({
            type: "match_created",
            data: createdMatch,
          }),
        );
      });
    }, 60_000);
  }

  public getMatches(limit: number) {
    return this.matches.slice(0, limit);
  }

  public getMatchCommentary(matchId: number, limit: number) {
    const commentary = this.matchIdToCommentary.get(matchId);

    if (!commentary) {
      return;
    }

    return commentary.slice(0, limit);
  }

  public subscribeToMatchCommentary(matchId: number, ws: CustomWebSocket) {
    const subscribers = this.matchIdToSubscribers.get(matchId);

    if (!subscribers) {
      this.matchIdToSubscribers.set(matchId, new Set([ws]));

      return;
    }

    subscribers.add(ws);
  }

  public unsubscribeFromMatchCommentary(matchId: number, ws: CustomWebSocket) {
    const subscribers = this.matchIdToSubscribers.get(matchId);

    if (!subscribers) {
      return;
    }

    subscribers.delete(ws);

    if (subscribers.size === 0) {
      this.matchIdToSubscribers.delete(matchId);
    }
  }

  public getMatchSubscribers(matchId: number) {
    return this.matchIdToSubscribers.get(matchId);
  }
}

const dataManager = new DataManager();

export default dataManager;
