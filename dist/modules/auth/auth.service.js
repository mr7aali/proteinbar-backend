"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const AppError_1 = require("../../common/utils/AppError");
const env_1 = require("../../config/env");
const mailer_1 = require("../../common/utils/mailer");
const auth_model_1 = require("./auth.model");
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function generateSessionToken() {
    return crypto_1.default.randomBytes(32).toString("hex");
}
exports.authService = {
    async sendCode(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await auth_model_1.AuthCodeModel.updateMany({ email: normalizedEmail, consumed: false }, { $set: { consumed: true } });
        await auth_model_1.AuthCodeModel.create({
            email: normalizedEmail,
            code,
            expiresAt,
            consumed: false
        });
        await (0, mailer_1.sendLoginCodeEmail)({
            email: normalizedEmail,
            code
        });
        return {
            email: normalizedEmail,
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
        await auth_model_1.CustomerSessionModel.deleteMany({
            email: normalizedEmail
        });
        const expiresAt = new Date(Date.now() + env_1.env.CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000);
        const token = generateSessionToken();
        await auth_model_1.CustomerSessionModel.create({
            token,
            userId: user._id,
            email: normalizedEmail,
            expiresAt
        });
        return {
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            },
            session: {
                token,
                expiresAt
            }
        };
    },
    async getCustomerSession(token) {
        const normalizedToken = token.trim();
        if (!normalizedToken) {
            throw new AppError_1.AppError(401, "Authentication required");
        }
        const session = await auth_model_1.CustomerSessionModel.findOne({
            token: normalizedToken,
            expiresAt: { $gt: new Date() }
        }).lean();
        if (!session) {
            throw new AppError_1.AppError(401, "Authentication required");
        }
        const user = await auth_model_1.UserModel.findById(session.userId).lean();
        if (!user) {
            throw new AppError_1.AppError(401, "Authentication required");
        }
        return {
            user: {
                id: String(user._id),
                email: user.email,
                role: user.role
            },
            session: {
                token: normalizedToken,
                expiresAt: session.expiresAt
            }
        };
    },
    async logoutCustomerSession(token) {
        const normalizedToken = token.trim();
        if (!normalizedToken)
            return;
        await auth_model_1.CustomerSessionModel.deleteOne({ token: normalizedToken });
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
