"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.errorHandler = errorHandler;
const AppError_1 = require("../utils/AppError");
function notFound(_req, _res, next) {
    next(new AppError_1.AppError(404, "Route not found | proteinbar-backend"));
}
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            details: err.details ?? null,
        });
    }
    console.error(err);
    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
}
