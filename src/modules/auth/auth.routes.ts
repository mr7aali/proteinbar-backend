import { Router } from "express";
import { validate } from "../../common/middleware/validate";
import { authController } from "./auth.controller";
import { adminLoginSchema, resetPasswordSchema, sendCodeSchema, verifyCodeSchema } from "./auth.validation";

export const authRouter = Router();

authRouter.post("/send-code", validate(sendCodeSchema), authController.sendCode);
authRouter.post("/verify-code", validate(verifyCodeSchema), authController.verifyCode);
authRouter.post("/admin-login", validate(adminLoginSchema), authController.adminLogin);
authRouter.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);
