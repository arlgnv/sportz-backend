import express from "express";

import matchRouter from "../match/router.ts";
import getHandler from "./handlers/get/handler.ts";

const router = express.Router();

router.get("/", getHandler);

router.use("/:id", matchRouter);

export default router;
