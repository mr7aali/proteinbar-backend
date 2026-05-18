import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import type { Request, Response, NextFunction } from "express";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler, notFound } from "./common/middleware/errorHandler";

export const app = express();
app.set("trust proxy", true);

app.use(helmet());
// app.use(
//   cors({
//     origin(origin, callback) {
//       if (!origin || env.allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       return callback(new Error("CORS origin not allowed"));
//     },
//     credentials: true,
//   }),
// );
app.use(
  cors({
    origin: true, // reflect request origin (allows all)
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Vary", "Origin");
  next();
});
app.use(express.json({ limit: "25mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "OK" });
});

app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(errorHandler);
