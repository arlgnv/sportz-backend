import express from "express";
import matchesRouter from "./routers/matches/router.ts";
import { httpAj } from "./arcjet.ts";

const app = express();

app.use(express.json());
app.use(async (req, res, next) => {
  if (!httpAj) {
    next();

    return;
  }

  const decision = await httpAj.protect(req);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      res.status(429).json({ success: false, error: "Too many requests." });

      return;
    }

    res.status(403).json({ success: false, error: "Forbidden." });

    return;
  }

  next();
});
app.use("/matches", matchesRouter);

export default app;
