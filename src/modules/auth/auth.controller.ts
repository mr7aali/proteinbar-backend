import crypto from "crypto";
import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { env } from "../../config/env";
import { authService } from "./auth.service";

function getCookieValue(cookieHeader: string | undefined, cookieName: string) {
  if (!cookieHeader) return "";

  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  const found = cookies.find((entry) => entry.startsWith(`${cookieName}=`));
  if (!found) return "";

  return decodeURIComponent(found.slice(cookieName.length + 1));
}

function setCustomerSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(env.CUSTOMER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  });
}

type AdminAuthResponseData = Awaited<ReturnType<typeof authService.adminLogin>>;

function setAdminRefreshCookie(res: Response, data: AdminAuthResponseData) {
  if (!data.refreshToken) return;

  res.cookie(env.ADMIN_REFRESH_COOKIE_NAME, data.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    ...(env.ADMIN_COOKIE_DOMAIN ? { domain: env.ADMIN_COOKIE_DOMAIN } : {}),
    expires: data.session.refreshExpiresAt,
    path: "/api/v1/auth"
  });
}

function setAdminSessionCookie(res: Response, data: AdminAuthResponseData) {
  const expiresAt = Math.floor(data.session.refreshExpiresAt.getTime() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", env.ADMIN_SESSION_COOKIE_SECRET)
    .update(expiresAt)
    .digest("base64url");

  res.cookie(env.ADMIN_SESSION_COOKIE_NAME, `${expiresAt}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    ...(env.ADMIN_COOKIE_DOMAIN ? { domain: env.ADMIN_COOKIE_DOMAIN } : {}),
    expires: data.session.refreshExpiresAt,
    path: "/"
  });
}

function setAdminAuthCookies(res: Response, data: AdminAuthResponseData) {
  setAdminRefreshCookie(res, data);
  setAdminSessionCookie(res, data);
}

function clearAdminAuthCookies(res: Response) {
  const sharedOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    ...(env.ADMIN_COOKIE_DOMAIN ? { domain: env.ADMIN_COOKIE_DOMAIN } : {})
  };

  res.clearCookie(env.ADMIN_REFRESH_COOKIE_NAME, {
    ...sharedOptions,
    path: "/api/v1/auth"
  });
  res.clearCookie(env.ADMIN_SESSION_COOKIE_NAME, {
    ...sharedOptions,
    path: "/"
  });
}

function withoutAdminRefreshToken(data: AdminAuthResponseData) {
  const safeData = { ...data };
  delete safeData.refreshToken;
  safeData.session = { ...data.session };
  delete safeData.session.refreshToken;
  return safeData;
}

function getBearerToken(headerValue: string | undefined) {
  if (!headerValue) return "";
  const [scheme, token] = headerValue.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return "";
  return token?.trim() ?? "";
}

export const authController = {
  sendCode: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.sendCode(req.body.email);
    res.status(201).json({ success: true, data });
  }),

  verifyCode: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.verifyCode(req.body.email, req.body.code);
    setCustomerSessionCookie(res, data.session.token, data.session.expiresAt);
    res.json({ success: true, data });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const token = req.currentCustomerSessionToken ?? "";
    const data = await authService.getCustomerSession(token);
    res.json({ success: true, data });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token =
      req.currentCustomerSessionToken ??
      getCookieValue(req.headers.cookie, env.CUSTOMER_SESSION_COOKIE_NAME);
    await authService.logoutCustomerSession(token);
    res.clearCookie(env.CUSTOMER_SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/"
    });
    res.json({ success: true, data: { loggedOut: true } });
  }),

  adminLogin: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.adminLogin(req.body.email, req.body.password);
    setAdminAuthCookies(res, data);
    res.json({ success: true, data: withoutAdminRefreshToken(data) });
  }),

  adminMe: asyncHandler(async (req: Request, res: Response) => {
    const token = req.currentAdminSessionToken ?? "";
    const data = await authService.getAdminMe(token);
    setAdminAuthCookies(res, data);
    res.json({ success: true, data: withoutAdminRefreshToken(data) });
  }),

  adminRefresh: asyncHandler(async (req: Request, res: Response) => {
    try {
      const refreshToken = getCookieValue(req.headers.cookie, env.ADMIN_REFRESH_COOKIE_NAME);
      const data = await authService.refreshAdminSession(refreshToken);
      setAdminAuthCookies(res, data);
      res.json({ success: true, data: withoutAdminRefreshToken(data) });
    } catch (error) {
      clearAdminAuthCookies(res);
      throw error;
    }
  }),

  adminLogout: asyncHandler(async (req: Request, res: Response) => {
    const token =
      req.currentAdminSessionToken ||
      getBearerToken(req.headers.authorization) ||
      getCookieValue(req.headers.cookie, env.ADMIN_REFRESH_COOKIE_NAME);
    await authService.logoutAdminSession(token);
    clearAdminAuthCookies(res);
    res.json({ success: true, data: { loggedOut: true } });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.resetPassword(req.body.email, req.body.newPassword);
    res.json({ success: true, data });
  })
};
