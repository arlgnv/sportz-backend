import { WebSocket, WebSocketServer } from "ws";

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

  ws.on("message", (data) => {
    let message;

    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      sendJson(ws, { type: "error", message: "Invalid JSON" });
      return;
    }

    if (message.type === "subscribe" && Number.isInteger(message.matchId)) {
      subscribe(message.matchId, ws);
      ws.subscriptions.add(message.matchId);
      sendJson(ws, { type: "subscribed", matchId: message.matchId });

      return;
    }

    if (message.type === "unsubscribe" && Number.isInteger(message.matchId)) {
      unsubscribe(message.matchId, ws);
      ws.subscriptions.delete(message.matchId);
      sendJson(ws, { type: "unsubscribed", matchId: message.matchId });
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
