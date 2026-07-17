class DataManager {
  private matches = [];
  private matchIdToCommentary: Record<number, any[] | undefined> = {};
  private matchIdToObservers: Record<number, any[] | undefined> = {};

  constructor() {
    this.startEventsEmitting();
  }

  private startEventsEmitting() {
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

  public getMatchObservers(matchId: number) {
    return this.matchIdToObservers[matchId] ?? [];
  }
}

const dataManager = new DataManager();

export default dataManager;
