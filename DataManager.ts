import type { CustomWebSocket } from "./webSocketServer.ts";

class DataManager {
  private matches = [];
  private matchIdToCommentary: Record<number, any[] | undefined> = {};
  private matchIdToSubscribers: Map<number, Set<CustomWebSocket>> = new Map();

  constructor() {
    this.startActivity();
  }

  private startActivity() {
    setInterval(() => {
      // todo: replace this with actual match creation logic
      console.log("Match added");
    }, 20_000);
  }

  public getMatches(limit: number) {
    return this.matches.slice(0, limit);
  }

  public getMatchCommentary(matchId: number, limit: number) {
    const commentary = this.matchIdToCommentary[matchId] ?? [];

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
