import type { Request, Response } from "express";

import dataManager from "../../../../DataManager.ts";
import { paramsSchema, querySchema } from "./schemas.ts";
import { MAX_LIMIT } from "./constants.ts";

async function handler(req: Request, res: Response) {
  const parsedParams = paramsSchema.safeParse(req.params);

  if (!parsedParams.success) {
    res.status(400).json({
      success: false,
      error: parsedParams.error.issues,
    });

    return;
  }

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
  const commentary = dataManager.getMatchCommentary(
    parsedParams.data.id,
    limit,
  );

  res.json({
    success: true,
    data: commentary,
  });
}

export default handler;
