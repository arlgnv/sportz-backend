import * as z from "zod";

const querySchema = z.object({
  limit: z.optional(z.coerce.number().int().gte(0).lte(100)),
});

export { querySchema };
