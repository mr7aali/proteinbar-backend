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

const CustomerSessionSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, trim: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

export const AuthCodeModel = mongoose.model("AuthCode", AuthCodeSchema);
export const UserModel = mongoose.model("User", UserSchema);
export const CustomerSessionModel = mongoose.model("CustomerSession", CustomerSessionSchema);
