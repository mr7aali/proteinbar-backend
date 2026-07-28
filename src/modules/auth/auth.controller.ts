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
const ADMIN_ACCESS_COOKIE_NAME = "accessToken";
const ADMIN_REFRESH_COOKIE_NAME = "refreshToken";
const LEGACY_ADMIN_REFRESH_COOKIE_NAME = "proteinbar_admin_refresh";
const LEGACY_ADMIN_SESSION_COOKIE_NAME = "proteinbar_admin_session";

function getAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    ...(env.NODE_ENV === "production" && env.ADMIN_COOKIE_DOMAIN
      ? { domain: env.ADMIN_COOKIE_DOMAIN }
      : {})
  };
}

function setAdminAuthCookies(res: Response, data: AdminAuthResponseData) {
  const sharedOptions = getAdminCookieOptions();
  res.clearCookie(LEGACY_ADMIN_REFRESH_COOKIE_NAME, {
    ...sharedOptions,
    path: "/api/v1/auth"
  });
  res.clearCookie(LEGACY_ADMIN_SESSION_COOKIE_NAME, {
    ...sharedOptions,
    path: "/"
  });
  res.cookie(ADMIN_ACCESS_COOKIE_NAME, data.accessToken, {
    ...sharedOptions,
    expires: data.session.expiresAt,
    path: "/"
  });
  if (data.refreshToken) {
    res.cookie(ADMIN_REFRESH_COOKIE_NAME, data.refreshToken, {
      ...sharedOptions,
      expires: data.session.refreshExpiresAt,
      path: "/"
    });
  }
}

function clearAdminAuthCookies(res: Response) {
  const sharedOptions = getAdminCookieOptions();
  res.clearCookie(ADMIN_ACCESS_COOKIE_NAME, {
    ...sharedOptions,
    path: "/"
  });
  res.clearCookie(ADMIN_REFRESH_COOKIE_NAME, {
    ...sharedOptions,
    path: "/"
  });
  res.clearCookie(LEGACY_ADMIN_REFRESH_COOKIE_NAME, {
    ...sharedOptions,
    path: "/api/v1/auth"
  });
  res.clearCookie(LEGACY_ADMIN_SESSION_COOKIE_NAME, {
    ...sharedOptions,
    path: "/"
  });
}

function withoutAdminTokens(data: AdminAuthResponseData) {
  const safeData = { ...data };
  delete (safeData as Partial<AdminAuthResponseData>).token;
  delete (safeData as Partial<AdminAuthResponseData>).accessToken;
  delete safeData.refreshToken;
  safeData.session = { ...data.session };
  delete (safeData.session as Partial<AdminAuthResponseData["session"]>).token;
  delete (safeData.session as Partial<AdminAuthResponseData["session"]>).accessToken;
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
    res.json({ success: true, data: withoutAdminTokens(data) });
  }),

  adminMe: asyncHandler(async (req: Request, res: Response) => {
    const token = req.currentAdminSessionToken ?? "";
    const data = await authService.getAdminMe(token);
    setAdminAuthCookies(res, data);
    res.json({ success: true, data: withoutAdminTokens(data) });
  }),

  adminRefresh: asyncHandler(async (req: Request, res: Response) => {
    try {
      const refreshToken = getCookieValue(req.headers.cookie, ADMIN_REFRESH_COOKIE_NAME);
      const data = await authService.refreshAdminSession(refreshToken);
      setAdminAuthCookies(res, data);
      res.json({ success: true, data: withoutAdminTokens(data) });
    } catch (error) {
      clearAdminAuthCookies(res);
      throw error;
    }
  }),

  adminLogout: asyncHandler(async (req: Request, res: Response) => {
    const token =
      req.currentAdminSessionToken ||
      getBearerToken(req.headers.authorization) ||
      getCookieValue(req.headers.cookie, ADMIN_ACCESS_COOKIE_NAME) ||
      getCookieValue(req.headers.cookie, ADMIN_REFRESH_COOKIE_NAME);
    await authService.logoutAdminSession(token);
    clearAdminAuthCookies(res);
    res.json({ success: true, data: { loggedOut: true } });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.resetPassword(req.body.email, req.body.newPassword);
    res.json({ success: true, data });
  })
};
