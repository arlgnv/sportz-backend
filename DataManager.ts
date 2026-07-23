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

interface Comment {
  id: number;
  matchId: number;
  text: string;
}

const comments = [
  "Great attack!",
  "Shot on target!",
  "Amazing save!",
  "Corner kick.",
  "Dangerous moment!",
];

class DataManager {
  private matches: Match[] = [];
  private comments: Comment[] = [];
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
          name: "Gotham elite",
          score: 0,
        },
        teamB: {
          name: "Joker's gang",
          score: 0,
        },
      };

      this.matches.push(createdMatch);

      webSocketServer.clients.forEach((ws) => {
        if (ws.readyState !== WebSocket.OPEN) {
          return;
        }

        ws.send(
          JSON.stringify({
            type: "match_created",
            data: createdMatch,
          }),
        );
      });
    }, 60_000);

    // Create comment every 5 seconds
    setInterval(() => {
      const liveMatches = this.matches.filter(
        ({ status }) => status === "live",
      );

      liveMatches.forEach((match) => {
        const createdComment: Comment = {
          id: this.comments.length === 0 ? 1 : this.comments.at(-1)!.id + 1,
          matchId: match.id,
          text: getRandomArrayElement(comments),
        };

        this.comments.push(createdComment);

        const subscribers = this.matchIdToSubscribers.get(match.id);

        if (!subscribers) {
          return;
        }

        subscribers.forEach((ws) => {
          if (ws.readyState !== WebSocket.OPEN) {
            return;
          }

          ws.send(
            JSON.stringify({
              type: "comment_created",
              data: createdComment,
            }),
          );
        });
      });
    }, 5_000);
  }

  public getMatches(limit: number) {
    return this.matches.slice(0, limit);
  }

  public getMatchCommentary(matchId: number, limit: number) {
    const commentary = this.comments.filter(
      (comment) => comment.matchId === matchId,
    );

    return commentary.toReversed().slice(0, limit);
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
