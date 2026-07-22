import * as z from "zod";

export const paramsSchema = z.object({
  id: z.coerce.number().int().min(0),
});

const querySchema = z.object({
  limit: z.optional(z.coerce.number().int().min(0).max(100)),
});

export { querySchema };
