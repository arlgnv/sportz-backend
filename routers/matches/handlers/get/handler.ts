import type { Request, Response } from "express";

import { querySchema } from "./schemas.ts";
import { MAX_LIMIT } from "./constants.ts";
import dataManager from "../../../../DataManager.ts";

async function handler(req: Request, res: Response) {
  const parseQueryResult = querySchema.safeParse(req.query);

  if (!parseQueryResult.success) {
    res.status(400).json({
      success: false,
      error: parseQueryResult.error.issues,
    });

    return;
  }

  const limit =
    parseQueryResult.data.limit !== undefined
      ? Math.min(parseQueryResult.data.limit, MAX_LIMIT)
      : MAX_LIMIT;
  const matches = dataManager.getMatches(limit);

  res.json({
    success: true,
    data: matches,
  });
}

export default handler;
