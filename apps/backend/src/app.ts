import express, { type ErrorRequestHandler } from "express";
import { prisma } from "./lib/prisma";

export const app = express();

app.use(express.json());

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

app.post("/mentors", async (req, res, next) => {
  try {
    const { name, bio } = req.body ?? {};
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "name is required — expected a non-empty string" });
    }
    if (typeof bio !== "string" || bio.trim() === "") {
      return res.status(400).json({ error: "bio is required — expected a non-empty string" });
    }
    const mentor = await prisma.mentor.create({ data: { name, bio } });
    res.status(201).json({ mentor });
  } catch (err) {
    next(err);
  }
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  const status =
    err && typeof err === "object" && "status" in err && typeof err.status === "number" && err.status >= 400 && err.status < 500
      ? err.status
      : 500;
  res.status(status).json({ error: status < 500 ? "Malformed request body" : "Internal server error" });
};

app.use(errorHandler);
