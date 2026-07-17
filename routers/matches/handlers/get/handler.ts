import type { Request, Response } from "express";

import { querySchema } from "./schemas.ts";
import { MAX_LIMIT } from "./constants.ts";
import dataManager from "../../../../DataManager.ts";

async function handler(req: Request, res: Response) {
  const parsedQuery = querySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    res.status(400).json({
      success: false,
      error: parsedQuery.error.issues,
    });

    return;
  }

  const limit =
    parsedQuery.data.limit !== undefined
      ? Math.min(parsedQuery.data.limit, MAX_LIMIT)
      : MAX_LIMIT;
  const matches = dataManager.getMatches(limit);

  res.json({
    success: true,
    data: matches,
  });
}

export default handler;
