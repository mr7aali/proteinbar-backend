"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSessionModel = exports.CustomerSessionModel = exports.AdminRoleModel = exports.UserModel = exports.AuthCodeModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AuthCodeSchema = new mongoose_1.Schema({
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false }
}, { timestamps: true });
const UserSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, default: "customer" },
    password: { type: String, default: "" },
    fullName: { type: String, default: "", trim: true },
    adminRoleId: { type: String, default: "", trim: true, index: true },
    allowedPages: { type: [String], default: [] },
    canPublish: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
const AdminRoleSchema = new mongoose_1.Schema({
    roleId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    scopes: { type: [String], default: [] },
    allowedPages: { type: [String], default: [] },
    canPublish: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false }
}, { timestamps: true });
const CustomerSessionSchema = new mongoose_1.Schema({
    token: { type: String, required: true, unique: true, trim: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "User", index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true });
const AdminSessionSchema = new mongoose_1.Schema({
    token: { type: String, required: true, unique: true, trim: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "User", index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true });
exports.AuthCodeModel = mongoose_1.default.model("AuthCode", AuthCodeSchema);
exports.UserModel = mongoose_1.default.model("User", UserSchema);
exports.AdminRoleModel = mongoose_1.default.model("AdminRole", AdminRoleSchema);
exports.CustomerSessionModel = mongoose_1.default.model("CustomerSession", CustomerSessionSchema);
exports.AdminSessionModel = mongoose_1.default.model("AdminSession", AdminSessionSchema);
