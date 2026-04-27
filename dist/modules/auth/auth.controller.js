"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const asyncHandler_1 = require("../../common/utils/asyncHandler");
const env_1 = require("../../config/env");
const auth_service_1 = require("./auth.service");
function setCustomerSessionCookie(res, token, expiresAt) {
    res.cookie(env_1.env.CUSTOMER_SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: env_1.env.NODE_ENV === "production",
        expires: expiresAt,
        path: "/"
    });
}
exports.authController = {
    sendCode: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await auth_service_1.authService.sendCode(req.body.email);
        res.status(201).json({ success: true, data });
    }),
    verifyCode: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await auth_service_1.authService.verifyCode(req.body.email, req.body.code);
        setCustomerSessionCookie(res, data.session.token, data.session.expiresAt);
        res.json({ success: true, data });
    }),
    me: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const token = req.currentCustomerSessionToken ?? "";
        const data = await auth_service_1.authService.getCustomerSession(token);
        res.json({ success: true, data });
    }),
    logout: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const token = req.currentCustomerSessionToken ?? "";
        await auth_service_1.authService.logoutCustomerSession(token);
        res.clearCookie(env_1.env.CUSTOMER_SESSION_COOKIE_NAME, {
            httpOnly: true,
            sameSite: "lax",
            secure: env_1.env.NODE_ENV === "production",
            path: "/"
        });
        res.json({ success: true, data: { loggedOut: true } });
    }),
    adminLogin: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await auth_service_1.authService.adminLogin(req.body.email, req.body.password);
        res.json({ success: true, data });
    }),
    adminMe: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const token = req.currentAdminSessionToken ?? "";
        const data = await auth_service_1.authService.getAdminMe(token);
        res.json({ success: true, data });
    }),
    adminLogout: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const token = req.currentAdminSessionToken ?? "";
        await auth_service_1.authService.logoutAdminSession(token);
        res.json({ success: true, data: { loggedOut: true } });
    }),
    resetPassword: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await auth_service_1.authService.resetPassword(req.body.email, req.body.newPassword);
        res.json({ success: true, data });
    })
};
