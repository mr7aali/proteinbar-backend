import mongoose, { Schema } from "mongoose";

const AuthCodeSchema = new Schema(
  {
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, default: "customer" },
    password: { type: String, default: "" },
    fullName: { type: String, default: "", trim: true },
    adminRoleId: { type: String, default: "", trim: true, index: true },
    allowedPages: { type: [String], default: [] },
    canPublish: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const AdminRoleSchema = new Schema(
  {
    roleId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    scopes: { type: [String], default: [] },
    allowedPages: { type: [String], default: [] },
    canPublish: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const CustomerSessionSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, trim: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

const AdminSessionSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, trim: true, index: true },
    refreshToken: { type: String, default: "", trim: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    refreshExpiresAt: { type: Date, index: true }
  },
  { timestamps: true }
);

export const AuthCodeModel = mongoose.model("AuthCode", AuthCodeSchema);
export const UserModel = mongoose.model("User", UserSchema);
export const AdminRoleModel = mongoose.model("AdminRole", AdminRoleSchema);
export const CustomerSessionModel = mongoose.model("CustomerSession", CustomerSessionSchema);
export const AdminSessionModel = mongoose.model("AdminSession", AdminSessionSchema);
