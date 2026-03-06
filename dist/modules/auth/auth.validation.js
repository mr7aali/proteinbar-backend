"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.adminLoginSchema = exports.verifyCodeSchema = exports.sendCodeSchema = void 0;
const zod_1 = require("zod");
exports.sendCodeSchema = zod_1.z.object({
    email: zod_1.z.string().email()
});
exports.verifyCodeSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().length(6)
});
exports.adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    newPassword: zod_1.z.string().min(6)
});
