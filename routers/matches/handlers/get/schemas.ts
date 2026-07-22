import * as z from "zod";

const querySchema = z.object({
  limit: z.optional(z.coerce.number().int().min(0).max(100)),
});

export { querySchema };
