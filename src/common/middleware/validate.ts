import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

export function validate<T>(schema: ZodSchema<T>, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new AppError(400, "Validation failed", result.error.flatten()));
    }

    if (source === "body") req.body = result.data as Request["body"];
    if (source === "query") req.query = result.data as Request["query"];
    if (source === "params") req.params = result.data as Request["params"];

    return next();
  };
}
