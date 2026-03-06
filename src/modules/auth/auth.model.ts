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
    password: { type: String, default: "" }
  },
  { timestamps: true }
);

export const AuthCodeModel = mongoose.model("AuthCode", AuthCodeSchema);
export const UserModel = mongoose.model("User", UserSchema);
