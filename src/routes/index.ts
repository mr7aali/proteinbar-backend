import { Router } from "express";
import { adminRouter } from "../modules/admin/admin.routes";
import { authRouter } from "../modules/auth/auth.routes";
import { publicRouter } from "../modules/public/public.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/public", publicRouter);
