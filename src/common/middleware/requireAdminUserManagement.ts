import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export function requireAdminUserManagement(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.currentAdmin) {
    return next(new AppError(401, "Admin login required"));
  }

  if (req.currentAdmin.role !== "super_admin" && !req.currentAdmin.canManageUsers) {
    return next(new AppError(403, "Only super admin or user managers can manage admins."));
  }

  return next();
}

