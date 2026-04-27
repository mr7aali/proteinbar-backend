import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { authService } from "../../modules/auth/auth.service";

function getBearerToken(headerValue: string | undefined) {
  if (!headerValue) return "";
  const [scheme, token] = headerValue.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return "";
  return token?.trim() ?? "";
}

export async function requireAdminSession(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      return next(new AppError(401, "Admin login required"));
    }

    const session = await authService.getAdminSession(token);
    req.currentAdmin = session.user;
    req.currentAdminSessionToken = token;
    return next();
  } catch (error) {
    return next(error);
  }
}

