import express from "express";

import getCommentaryHandler from "./handlers/getCommentary/handler.ts";

const router = express.Router({ mergeParams: true });

router.get("/commentary", getCommentaryHandler);

export default router;
