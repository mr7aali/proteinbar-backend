import { z } from "zod";

export const sendCodeSchema = z.object({
  email: z.string().email()
});

export const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const adminRefreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6)
});
