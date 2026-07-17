import express from "express";
import matchesRouter from "./routers/matches/router.ts";

const app = express();

app.use(express.json());
app.use("/matches", matchesRouter);

export default app;
