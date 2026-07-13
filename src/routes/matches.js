import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { matches } from "../db/schema.js";
import { db } from "../db/db.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";

const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get("/", async (request, response) => {
  const parsed = listMatchesQuerySchema.safeParse(request.query);

  if (!parsed.success) {
    return response.status(400).json({
      error: "Invalid query",
      details: parsed.error.issues,
    });
  }

  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    response.json(data);
  } catch (error) {
    response.status(500).json({
      error: "Failed to list matches",
    });
  }
});

matchRouter.post("/", async (request, response) => {
  const parsed = createMatchSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      error: "Invalid payload",
      details: parsed.error.issues,
    });
  }

  const {
    data: { startTime, endTime, homeScore, awayScore },
  } = parsed;

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();

    if (response.locals.broadcastMatchCreated) {
      response.locals.broadcastMatchCreated(event);
    }

    response.status(201).json({ data: event });
  } catch (error) {
    response.status(500).json({
      error: "Failed to create match",
    });
  }
});

export default matchRouter;
