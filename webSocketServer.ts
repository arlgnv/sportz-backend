import { WebSocket, WebSocketServer } from "ws";

const matchSubscribers = new Map();

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

function handleMessage(socket, data) {
  let message;

  try {
    message = JSON.parse(data.toString());
  } catch (error) {
    sendJson(socket, { type: "error", message: "Invalid JSON" });
    return;
  }

  if (message.type === "subscribe" && Number.isInteger(message.matchId)) {
    subscribe(message.matchId, socket);
    socket.subscriptions.add(message.matchId);
    sendJson(socket, { type: "subscribed", matchId: message.matchId });

    return;
  }

  if (message.type === "unsubscribe" && Number.isInteger(message.matchId)) {
    unsubscribe(message.matchId, socket);
    socket.subscriptions.delete(message.matchId);
    sendJson(socket, { type: "unsubscribed", matchId: message.matchId });
  }
}

const webSocketServer = new WebSocketServer({
  noServer: true,
  path: "/ws",
  maxPayload: 1024 * 1024,
});

webSocketServer.on("connection", async (socket, req) => {
  socket.isAlive = true;
  socket.on("pong", () => {
    socket.isAlive = true;
  });

  socket.subscriptions = new Set();

  sendJson(socket, { type: "welcome" });

  socket.on("message", (data) => {
    handleMessage(socket, data);
  });

  socket.on("error", () => {
    socket.terminate();
  });

  socket.on("close", () => {
    cleanupSubscriptions(socket);
  });

  socket.on("error", console.error);
});

const interval = setInterval(() => {
  webSocketServer.clients.forEach((client) => {
    if (client.isAlive === false) {
      client.terminate();

      return;
    }

    client.isAlive = false;
    client.ping();
  });
}, 30_000);

webSocketServer.on("close", () => clearInterval(interval));

export default webSocketServer;
