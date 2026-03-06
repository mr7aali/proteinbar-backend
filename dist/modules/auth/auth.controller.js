"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const asyncHandler_1 = require("../../common/utils/asyncHandler");
const auth_service_1 = require("./auth.service");
exports.authController = {
    sendCode: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await auth_service_1.authService.sendCode(req.body.email);
        res.status(201).json({ success: true, data });
    }),
    verifyCode: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await auth_service_1.authService.verifyCode(req.body.email, req.body.code);
        res.json({ success: true, data });
    }),
    adminLogin: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await auth_service_1.authService.adminLogin(req.body.email, req.body.password);
        res.json({ success: true, data });
    }),
    resetPassword: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await auth_service_1.authService.resetPassword(req.body.email, req.body.newPassword);
        res.json({ success: true, data });
    })
};
