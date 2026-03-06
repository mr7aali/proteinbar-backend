import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "Route not found"));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details ?? null
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
}
