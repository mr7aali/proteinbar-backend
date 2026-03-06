import { AppError } from "../../common/utils/AppError";
import { AuthCodeModel, UserModel } from "./auth.model";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authService = {
  async sendCode(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await AuthCodeModel.create({
      email: normalizedEmail,
      code,
      expiresAt,
      consumed: false
    });

    return {
      email: normalizedEmail,
      code,
      expiresAt
    };
  },

  async verifyCode(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const authCode = await AuthCodeModel.findOne({
      email: normalizedEmail,
      code,
      consumed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!authCode) {
      throw new AppError(400, "Invalid or expired verification code");
    }

    authCode.consumed = true;
    await authCode.save();

    const user = await UserModel.findOneAndUpdate(
      { email: normalizedEmail },
      { $setOnInsert: { role: "customer", password: "" } },
      { upsert: true, new: true }
    );

    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    };
  },

  async adminLogin(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail, role: "admin" });
    if (!user || user.password !== password) {
      throw new AppError(401, "Invalid admin credentials");
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

  async resetPassword(email: string, newPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOneAndUpdate(
      { email: normalizedEmail },
      { role: "admin", password: newPassword },
      { upsert: true, new: true }
    );

    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    };
  }
};
