import AgentAPI from "apminsight";

AgentAPI.config();

import http from "node:http";

import app from "./app.ts";
import { wsAj } from "./arcjet.ts";
import webSocketServer from "./webSocketServer.ts";

const server = http.createServer(app);

server.on("upgrade", async (req, socket, head) => {
  if (req.url !== "/ws") {
    socket.destroy();

    return;
  }

  if (wsAj) {
    const decision = await wsAj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        socket.write("HTTP/1.1 429 Too Many Requests\r\n\r\n");
      } else {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      }

      socket.destroy();

      return;
    }
  }

  webSocketServer.handleUpgrade(req, socket, head, (ws) => {
    webSocketServer.emit("connection", ws, req);
  });
});

server.listen(8000);
