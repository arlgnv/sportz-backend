import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) {
  throw new Error("ARCJET_KEY environment variable is missing");
}

export const httpArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: arcjetMode, interval: "10s", max: 50 }),
      ],
    })
  : null;

export const wsArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: arcjetMode }),
        detectBot({
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: arcjetMode, interval: "2s", max: 5 }),
      ],
    })
  : null;

export function securityMiddleware() {
  return async function (request, response, next) {
    if (!httpArcjet) {
      return next();
    }

    try {
      const decision = await httpArcjet.protect(request);

      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return response.status(429).json({ error: "Too many requests" });
        }

        return response.status(403).json({ error: "Forbidden" });
      }
    } catch (error) {
      console.error("Arcjet middleware error", error);

      return response.status(503).json({ error: "Server is unavailable" });
    }

    next();
  };
}
