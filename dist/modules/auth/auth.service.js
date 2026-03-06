"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const AppError_1 = require("../../common/utils/AppError");
const auth_model_1 = require("./auth.model");
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
exports.authService = {
    async sendCode(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await auth_model_1.AuthCodeModel.create({
            email: normalizedEmail,
            code,
            expiresAt,
            consumed: false
        });
        return {
            email: normalizedEmail,
            code,
            expiresAt
        };
    },
    async verifyCode(email, code) {
        const normalizedEmail = email.trim().toLowerCase();
        const authCode = await auth_model_1.AuthCodeModel.findOne({
            email: normalizedEmail,
            code,
            consumed: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });
        if (!authCode) {
            throw new AppError_1.AppError(400, "Invalid or expired verification code");
        }
        authCode.consumed = true;
        await authCode.save();
        const user = await auth_model_1.UserModel.findOneAndUpdate({ email: normalizedEmail }, { $setOnInsert: { role: "customer", password: "" } }, { upsert: true, new: true });
        return {
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        };
    },
    async adminLogin(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await auth_model_1.UserModel.findOne({ email: normalizedEmail, role: "admin" });
        if (!user || user.password !== password) {
            throw new AppError_1.AppError(401, "Invalid admin credentials");
        }
        return {
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            },
            token: "demo-admin-token"
        };
    },
    async resetPassword(email, newPassword) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await auth_model_1.UserModel.findOneAndUpdate({ email: normalizedEmail }, { role: "admin", password: newPassword }, { upsert: true, new: true });
        return {
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        };
    }
};
