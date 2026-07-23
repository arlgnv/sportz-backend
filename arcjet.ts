import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;

const httpAj = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: "LIVE" }),
        detectBot({
          mode: "LIVE",
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: "LIVE", interval: "10s", max: 50 }),
      ],
    })
  : null;

const wsAj = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: "LIVE" }),
        detectBot({
          mode: "LIVE",
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: "LIVE", interval: "2s", max: 5 }),
      ],
    })
  : null;

export { httpAj, wsAj };
