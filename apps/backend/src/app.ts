import express, { type ErrorRequestHandler } from "express";
import { prisma } from "./lib/prisma";

export const app = express();

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/mentors", async (_req, res, next) => {
  try {
    const mentors = await prisma.mentor.findMany();
    res.json({ mentors });
  } catch (err) {
    next(err);
  }
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);
