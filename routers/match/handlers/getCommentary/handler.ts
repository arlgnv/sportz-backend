import type { Request, Response } from "express";

import dataManager from "../../../../DataManager.ts";
import { paramsSchema, querySchema } from "./schemas.ts";
import { MAX_LIMIT } from "./constants.ts";

async function handler(req: Request, res: Response) {
  const parseParamsResult = paramsSchema.safeParse(req.params);

  if (!parseParamsResult.success) {
    res.status(400).json({
      success: false,
      error: parseParamsResult.error.issues,
    });

    return;
  }

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
  const commentary = dataManager.getMatchCommentary(
    parseParamsResult.data.id,
    limit,
  );

  res.json({
    success: true,
    data: commentary,
  });
}

export default handler;
