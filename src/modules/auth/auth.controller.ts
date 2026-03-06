import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { authService } from "./auth.service";

export const authController = {
  sendCode: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.sendCode(req.body.email);
    res.status(201).json({ success: true, data });
  }),

  verifyCode: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.verifyCode(req.body.email, req.body.code);
    res.json({ success: true, data });
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
