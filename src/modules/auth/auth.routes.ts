import { Router } from "express";
import { validate } from "../../common/middleware/validate";
import { requireAdminSession } from "../../common/middleware/requireAdminSession";
import { requireCustomerSession } from "../../common/middleware/requireCustomerSession";
import { authController } from "./auth.controller";
import { adminLoginSchema, adminRefreshSchema, resetPasswordSchema, sendCodeSchema, verifyCodeSchema } from "./auth.validation";

export const authRouter = Router();

authRouter.post("/send-code", validate(sendCodeSchema), authController.sendCode);
authRouter.post("/verify-code", validate(verifyCodeSchema), authController.verifyCode);
authRouter.get("/me", requireCustomerSession, authController.me);
authRouter.post("/logout", authController.logout);
authRouter.post("/admin-login", validate(adminLoginSchema), authController.adminLogin);
authRouter.post("/admin-refresh", validate(adminRefreshSchema), authController.adminRefresh);
authRouter.get("/admin-me", requireAdminSession, authController.adminMe);
authRouter.post("/admin-logout", authController.adminLogout);
authRouter.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);
