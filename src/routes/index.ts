import { Router } from "express";
import { adminRouter } from "../modules/admin/admin.routes";
import { authRouter } from "../modules/auth/auth.routes";
import { publicRouter } from "../modules/public/public.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/", publicRouter);
apiRouter.use((req, res, next) => {
  if (req.path === "/auth" || req.path.startsWith("/auth/")) {
    return next();
  }

  return adminRouter(req, res, next);
});
