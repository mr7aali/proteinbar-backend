import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler, notFound } from "./common/middleware/errorHandler";

export const app = express();

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
app.use(express.json({ limit: "2mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "OK" });
});

app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(errorHandler);
