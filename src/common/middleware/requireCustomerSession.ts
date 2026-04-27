import { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../utils/AppError";
import { authService } from "../../modules/auth/auth.service";

function getCookieValue(cookieHeader: string | undefined, cookieName: string) {
  if (!cookieHeader) return "";

  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  const found = cookies.find((entry) => entry.startsWith(`${cookieName}=`));
  if (!found) return "";

  return decodeURIComponent(found.slice(cookieName.length + 1));
}

export async function requireCustomerSession(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = getCookieValue(
      req.headers.cookie,
      env.CUSTOMER_SESSION_COOKIE_NAME
    );

    if (!token) {
      return next(new AppError(401, "Customer login required"));
    }

    const session = await authService.getCustomerSession(token);
    req.currentCustomer = session.user;
    req.currentCustomerSessionToken = token;
    return next();
  } catch (error) {
    return next(error);
  }
}
