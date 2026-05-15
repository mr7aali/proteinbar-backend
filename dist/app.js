"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const routes_1 = require("./routes");
const errorHandler_1 = require("./common/middleware/errorHandler");
exports.app = (0, express_1.default)();
exports.app.set("trust proxy", true);
exports.app.use((0, helmet_1.default)());
// app.use(
//   cors({
//     origin(origin, callback) {
//       if (!origin || env.allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       return callback(new Error("CORS origin not allowed"));
//     },
//     credentials: true,
//   }),
// );
exports.app.use((0, cors_1.default)({
    origin: true, // reflect request origin (allows all)
    credentials: true,
}));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((req, res, next) => {
    res.header("Vary", "Origin");
    next();
});
exports.app.use(express_1.default.json({ limit: "25mb" }));
exports.app.use((0, morgan_1.default)(env_1.env.NODE_ENV === "production" ? "combined" : "dev"));
exports.app.get("/health", (_req, res) => {
    res.json({ success: true, message: "OK" });
});
exports.app.use("/api/v1", routes_1.apiRouter);
exports.app.use(errorHandler_1.notFound);
exports.app.use(errorHandler_1.errorHandler);
