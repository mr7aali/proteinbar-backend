import crypto from "crypto";
import { AppError } from "../../common/utils/AppError";
import { env } from "../../config/env";
import { sendLoginCodeEmail } from "../../common/utils/mailer";
import {
  AdminRoleModel,
  AdminSessionModel,
  AuthCodeModel,
  CustomerSessionModel,
  UserModel
} from "./auth.model";

const ADMIN_ACCESS_TOKEN_MINUTES = 15;
const ADMIN_REFRESH_TOKEN_DAYS = 7;
const ADMIN_ROLES = new Set(["super_admin", "admin", "employee"]);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function buildAdminAuthResponse(user: Awaited<ReturnType<typeof buildAdminUserPayload>>, token: string, refreshToken: string, expiresAt: Date, refreshExpiresAt: Date) {
  return {
    user,
    token,
    accessToken: token,
    refreshToken,
    session: {
      token,
      accessToken: token,
      refreshToken,
      expiresAt,
      refreshExpiresAt
    }
  };
}

type AdminLikeUser = {
  _id: unknown;
  email: string;
  role: string;
  fullName?: string;
  adminRoleId?: string;
  allowedPages?: string[];
  canPublish?: boolean;
  canManageUsers?: boolean;
  isActive?: boolean;
};

async function buildAdminUserPayload(user: AdminLikeUser) {
  const adminRoleId = user.adminRoleId?.trim() ?? "";
  const linkedRole = adminRoleId ? await AdminRoleModel.findOne({ roleId: adminRoleId }).lean() : null;

  const allowedPages = Array.from(
    new Set([
      ...(Array.isArray(linkedRole?.allowedPages) ? linkedRole.allowedPages : []),
      ...(Array.isArray(user.allowedPages) ? user.allowedPages : [])
    ])
  );

  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    fullName: user.fullName?.trim() ?? "",
    adminRoleId,
    roleName: linkedRole?.name ?? "",
    allowedPages,
    canPublish: Boolean(linkedRole?.canPublish || user.canPublish),
    canManageUsers: Boolean(linkedRole?.canManageUsers || user.canManageUsers)
  };
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
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user || !ADMIN_ROLES.has(user.role) || !user.isActive || user.password !== password) {
      throw new AppError(401, "Invalid admin credentials");
    }

    await AdminSessionModel.deleteMany({
      email: normalizedEmail
    });

    const expiresAt = new Date(Date.now() + ADMIN_ACCESS_TOKEN_MINUTES * 60 * 1000);
    const refreshExpiresAt = new Date(Date.now() + ADMIN_REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    const token = generateSessionToken();
    const refreshToken = generateSessionToken();

    await AdminSessionModel.create({
      token,
      refreshToken,
      userId: user._id,
      email: normalizedEmail,
      expiresAt,
      refreshExpiresAt
    });

    const adminUser = await buildAdminUserPayload(user);
    return buildAdminAuthResponse(adminUser, token, refreshToken, expiresAt, refreshExpiresAt);
  },

  async getAdminSession(token: string) {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      throw new AppError(401, "Authentication required");
    }

    const session = await AdminSessionModel.findOne({
      token: normalizedToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      throw new AppError(401, "Authentication required");
    }

    const user = await UserModel.findById(session.userId);
    if (!user || !ADMIN_ROLES.has(user.role) || !user.isActive) {
      throw new AppError(401, "Authentication required");
    }

    if (!session.refreshToken) {
      session.refreshToken = generateSessionToken();
      session.refreshExpiresAt = new Date(Date.now() + ADMIN_REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
      await session.save();
    }

    const refreshExpiresAt = session.refreshExpiresAt ?? new Date(Date.now() + ADMIN_REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    const adminUser = await buildAdminUserPayload(user);
    return buildAdminAuthResponse(adminUser, normalizedToken, session.refreshToken, session.expiresAt, refreshExpiresAt);
  },

  async logoutAdminSession(token: string) {
    const normalizedToken = token.trim();
    if (!normalizedToken) return;

    await AdminSessionModel.deleteOne({
      $or: [{ token: normalizedToken }, { refreshToken: normalizedToken }]
    });
  },

  async getAdminMe(token: string) {
    return this.getAdminSession(token);
  },

  async refreshAdminSession(refreshToken: string) {
    const normalizedToken = refreshToken.trim();
    if (!normalizedToken) {
      throw new AppError(401, "Refresh token required");
    }

    const session = await AdminSessionModel.findOne({
      refreshToken: normalizedToken,
      refreshExpiresAt: { $gt: new Date() }
    });

    if (!session) {
      throw new AppError(401, "Invalid or expired refresh token");
    }

    const user = await UserModel.findById(session.userId);
    if (!user || !ADMIN_ROLES.has(user.role) || !user.isActive) {
      await AdminSessionModel.deleteOne({ _id: session._id });
      throw new AppError(401, "Authentication required");
    }

    const nextAccessToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + ADMIN_ACCESS_TOKEN_MINUTES * 60 * 1000);
    const refreshExpiresAt = session.refreshExpiresAt ?? new Date(Date.now() + ADMIN_REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    session.token = nextAccessToken;
    session.expiresAt = expiresAt;
    if (!session.refreshExpiresAt) {
      session.refreshExpiresAt = refreshExpiresAt;
    }
    await session.save();

    const adminUser = await buildAdminUserPayload(user);
    return buildAdminAuthResponse(adminUser, nextAccessToken, normalizedToken, expiresAt, refreshExpiresAt);
  },

  async resetPassword(email: string, newPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: normalizedEmail });

    const nextRole = existing && ADMIN_ROLES.has(existing.role) ? existing.role : "admin";
    const user = await UserModel.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { role: nextRole, password: newPassword, isActive: true } },
      { upsert: true, new: true }
    );

    return {
      user: await buildAdminUserPayload(user)
    };
  },
};
