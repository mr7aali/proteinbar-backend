import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { env } from "../../config/env";
import { authService } from "./auth.service";

function setCustomerSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(env.CUSTOMER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  });
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
    const token = req.currentCustomerSessionToken ?? "";
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
    res.json({ success: true, data });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.resetPassword(req.body.email, req.body.newPassword);
    res.json({ success: true, data });
  })
};
