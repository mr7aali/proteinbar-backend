"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().default(5000),
    MONGODB_URI: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(8),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    FRONTEND_ORIGINS: zod_1.z.string().default("http://localhost:3000,http://localhost:3001"),
    CUSTOMER_SESSION_COOKIE_NAME: zod_1.z.string().default("proteinbar_customer_session"),
    CUSTOMER_SESSION_DAYS: zod_1.z.coerce.number().default(7),
    SMTP_HOST: zod_1.z.string().optional().default(""),
    SMTP_PORT: zod_1.z.coerce.number().default(587),
    SMTP_SECURE: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.string()])
        .optional()
        .transform((value) => value === true || value === "true")
        .default(false),
    SMTP_USER: zod_1.z.string().optional().default(""),
    SMTP_PASS: zod_1.z.string().optional().default(""),
    SMTP_FROM_EMAIL: zod_1.z.string().optional().default(""),
    SMTP_FROM_NAME: zod_1.z.string().optional().default("Proteinbar"),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional().default(""),
    CLOUDINARY_API_KEY: zod_1.z.string().optional().default(""),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional().default(""),
    CLOUDINARY_FOLDER: zod_1.z.string().default("proteinbar")
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = {
    ...parsed.data,
    allowedOrigins: parsed.data.FRONTEND_ORIGINS.split(",").map((x) => x.trim()).filter(Boolean)
};
