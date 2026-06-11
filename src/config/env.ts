import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001"),
  FRONTEND_PUBLIC_URL: z.string().optional().default(""),
  BACKEND_BASE_URL: z.string().optional().default(""),
  CMI_PUBLIC_BASE_URL: z.string().optional().default(""),
  CUSTOMER_SESSION_COOKIE_NAME: z.string().default("proteinbar_customer_session"),
  CUSTOMER_SESSION_DAYS: z.coerce.number().default(7),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === "true")
    .default(false),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM_EMAIL: z.string().optional().default(""),
  SMTP_FROM_NAME: z.string().optional().default("Proteinbar"),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  CLOUDINARY_FOLDER: z.string().default("proteinbar"),
  CMI_GATEWAY_URL: z.string().default("https://test-lanacash.cmi.co.ma/fim/est3dgate"),
  CMI_CLIENT_ID: z.string().optional().default(""),
  CMI_STORE_KEY: z.string().optional().default(""),
  CMI_CURRENCY: z.string().default("504"),
  CMI_LANG: z.string().default("fr"),
  CMI_STORE_TYPE: z.string().default("3D_PAY_HOSTING"),
  CMI_TRAN_TYPE: z.string().default("PreAuth"),
  CMI_REFRESH_TIME: z.string().default("5")
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  allowedOrigins: parsed.data.FRONTEND_ORIGINS.split(",").map((x) => x.trim()).filter(Boolean)
};
