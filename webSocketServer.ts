import { WebSocket, WebSocketServer } from "ws";
import * as z from "zod";

function subscribe(matchId, socket) {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }

  matchSubscribers.get(matchId).add(socket);
}

function unsubscribe(matchId, socket) {
  const subscribers = matchSubscribers.get(matchId);

  if (!subscribers) {
    return;
  }

  subscribers.delete(socket);

  if (subscribers.size === 0) {
    matchSubscribers.delete(matchId);
  }
}

function cleanupSubscriptions(socket) {
  for (const matchId of socket.subscriptions) {
    unsubscribe(matchId, socket);
  }
}

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss, payload) {
  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) {
      return;
    }

    client.send(JSON.stringify(payload));
  });
}

function broadcastToMatch(matchId, payload) {
  const subscribers = matchSubscribers.get(matchId);

  if (!subscribers || subscribers.size === 0) {
    return;
  }

  subscribers.forEach((subscriber) => {
    sendJson(subscriber, payload);
  });
}

interface CustomWebSocket extends WebSocket {
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
        if (Number.isInteger(message.matchId)) {
          ws.send(
            JSON.stringify({
              success: true,
            }),
          );
        }

        return;
      }
      case "unsubscribe_from_match_commentary": {
        if (Number.isInteger(message.matchId)) {
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
