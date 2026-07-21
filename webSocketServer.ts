import { WebSocket, WebSocketServer } from "ws";
import * as z from "zod";
import dataManager from "./DataManager.ts";

export interface CustomWebSocket extends WebSocket {
  alive: boolean;
}

type CustomWebSocketConstructor = typeof WebSocket & {
  new (): CustomWebSocket;
};

const dataSchema = z
  .object({
    type: z.union([
      z.literal("subscribe_to_match_commentary"),
      z.literal("unsubscribe_from_match_commentary"),
    ]),
  })
  .catchall(z.unknown());

const webSocketServer = new WebSocketServer<CustomWebSocketConstructor>({
  noServer: true,
  path: "/ws",
  maxPayload: 1024 * 1024,
});

webSocketServer.on("connection", (ws) => {
  ws.alive = true;

  ws.on("pong", () => {
    ws.alive = true;
  });

  ws.on("message", (rawData) => {
    console.log(rawData);

    let data: unknown;

    try {
      data = JSON.parse(rawData.toString());
    } catch (error) {
      ws.send(JSON.stringify({ success: false, error }));

      return;
    }

    const parseDataResult = dataSchema.safeParse(data);

    console.log(parseDataResult);

    if (!parseDataResult.success) {
      ws.send(
        JSON.stringify({ success: false, error: parseDataResult.error.issues }),
      );

      return;
    }

    const message = parseDataResult.data;

    switch (message.type) {
      case "subscribe_to_match_commentary": {
        if (
          typeof message.matchId === "number" &&
          Number.isInteger(message.matchId)
        ) {
          dataManager.subscribeToMatchCommentary(message.matchId, ws);
          ws.send(
            JSON.stringify({
              success: true,
            }),
          );
        }

        return;
      }
      case "unsubscribe_from_match_commentary": {
        if (
          typeof message.matchId === "number" &&
          Number.isInteger(message.matchId)
        ) {
          dataManager.unsubscribeFromMatchCommentary(message.matchId, ws);
          ws.send(
            JSON.stringify({
              success: true,
            }),
          );
        }

        return;
      }
    }
  });

  ws.on("error", console.error);
});

const interval = setInterval(() => {
  webSocketServer.clients.forEach((ws) => {
    if (ws.alive === false) {
      ws.terminate();

      return;
    }

    ws.alive = false;
    ws.ping();
  });
}, 30_000);

webSocketServer.on("close", () => {
  clearInterval(interval);
});

export default webSocketServer;
