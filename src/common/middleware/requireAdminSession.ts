import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { authService } from "../../modules/auth/auth.service";

const ADMIN_ACCESS_COOKIE_NAME = "accessToken";

function getBearerToken(headerValue: string | undefined) {
  if (!headerValue) return "";
  const [scheme, token] = headerValue.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return "";
  return token?.trim() ?? "";
}

function getCookieValue(cookieHeader: string | undefined, cookieName: string) {
  if (!cookieHeader) return "";
  const found = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${cookieName}=`));
  return found ? decodeURIComponent(found.slice(cookieName.length + 1)) : "";
}

export async function requireAdminSession(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token =
      getCookieValue(req.headers.cookie, ADMIN_ACCESS_COOKIE_NAME) ||
      getBearerToken(req.headers.authorization);

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

