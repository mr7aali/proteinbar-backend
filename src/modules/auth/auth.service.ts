import crypto from "crypto";
import { AppError } from "../../common/utils/AppError";
import { env } from "../../config/env";
import { sendLoginCodeEmail } from "../../common/utils/mailer";
import { AuthCodeModel, CustomerSessionModel, UserModel } from "./auth.model";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export const authService = {
  async sendCode(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await AuthCodeModel.updateMany(
      { email: normalizedEmail, consumed: false },
      { $set: { consumed: true } }
    );

    await AuthCodeModel.create({
      email: normalizedEmail,
      code,
      expiresAt,
      consumed: false
    });

    await sendLoginCodeEmail({
      email: normalizedEmail,
      code
    });

    return {
      email: normalizedEmail,
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

    await CustomerSessionModel.deleteMany({
      email: normalizedEmail
    });

    const expiresAt = new Date(
      Date.now() + env.CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000
    );
    const token = generateSessionToken();

    await CustomerSessionModel.create({
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

  async getCustomerSession(token: string) {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      throw new AppError(401, "Authentication required");
    }

    const session = await CustomerSessionModel.findOne({
      token: normalizedToken,
      expiresAt: { $gt: new Date() }
    }).lean();

    if (!session) {
      throw new AppError(401, "Authentication required");
    }

    const user = await UserModel.findById(session.userId).lean();
    if (!user) {
      throw new AppError(401, "Authentication required");
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

  async logoutCustomerSession(token: string) {
    const normalizedToken = token.trim();
    if (!normalizedToken) return;

    await CustomerSessionModel.deleteOne({ token: normalizedToken });
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
