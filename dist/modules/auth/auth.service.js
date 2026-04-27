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
const ADMIN_SESSION_DAYS = 7;
const ADMIN_ROLES = new Set(["super_admin", "admin", "employee"]);
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function generateSessionToken() {
    return crypto_1.default.randomBytes(32).toString("hex");
}
async function buildAdminUserPayload(user) {
    const adminRoleId = user.adminRoleId?.trim() ?? "";
    const linkedRole = adminRoleId ? await auth_model_1.AdminRoleModel.findOne({ roleId: adminRoleId }).lean() : null;
    const allowedPages = Array.from(new Set([
        ...(Array.isArray(linkedRole?.allowedPages) ? linkedRole.allowedPages : []),
        ...(Array.isArray(user.allowedPages) ? user.allowedPages : [])
    ]));
    return {
        id: String(user._id),
        email: user.email,
        role: user.role,
        fullName: user.fullName?.trim() ?? "",
        adminRoleId,
        roleName: linkedRole?.name ?? "",
        allowedPages,
        canPublish: Boolean(linkedRole?.canPublish || user.canPublish),
        canManageUsers: Boolean(linkedRole?.canManageUsers || user.canManageUsers)
    };
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
        const user = await auth_model_1.UserModel.findOne({ email: normalizedEmail });
        if (!user || !ADMIN_ROLES.has(user.role) || !user.isActive || user.password !== password) {
            throw new AppError_1.AppError(401, "Invalid admin credentials");
        }
        await auth_model_1.AdminSessionModel.deleteMany({
            email: normalizedEmail
        });
        const expiresAt = new Date(Date.now() + ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000);
        const token = generateSessionToken();
        await auth_model_1.AdminSessionModel.create({
            token,
            userId: user._id,
            email: normalizedEmail,
            expiresAt
        });
        const adminUser = await buildAdminUserPayload(user);
        return {
            user: adminUser,
            token,
            session: {
                token,
                expiresAt
            }
        };
    },
    async getAdminSession(token) {
        const normalizedToken = token.trim();
        if (!normalizedToken) {
            throw new AppError_1.AppError(401, "Authentication required");
        }
        const session = await auth_model_1.AdminSessionModel.findOne({
            token: normalizedToken,
            expiresAt: { $gt: new Date() }
        }).lean();
        if (!session) {
            throw new AppError_1.AppError(401, "Authentication required");
        }
        const user = await auth_model_1.UserModel.findById(session.userId).lean();
        if (!user || !ADMIN_ROLES.has(user.role) || !user.isActive) {
            throw new AppError_1.AppError(401, "Authentication required");
        }
        return {
            user: await buildAdminUserPayload(user),
            session: {
                token: normalizedToken,
                expiresAt: session.expiresAt
            }
        };
    },
    async logoutAdminSession(token) {
        const normalizedToken = token.trim();
        if (!normalizedToken)
            return;
        await auth_model_1.AdminSessionModel.deleteOne({ token: normalizedToken });
    },
    async getAdminMe(token) {
        return this.getAdminSession(token);
    },
    async resetPassword(email, newPassword) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await auth_model_1.UserModel.findOne({ email: normalizedEmail });
        const nextRole = existing && ADMIN_ROLES.has(existing.role) ? existing.role : "admin";
        const user = await auth_model_1.UserModel.findOneAndUpdate({ email: normalizedEmail }, { $set: { role: nextRole, password: newPassword, isActive: true } }, { upsert: true, new: true });
        return {
            user: await buildAdminUserPayload(user)
        };
    },
};
