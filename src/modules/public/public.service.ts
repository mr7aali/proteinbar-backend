import type { Request } from "express";
import crypto from "crypto";
import { AppError } from "../../common/utils/AppError";
import {
  buildCmiPaymentFields,
  isCmiApprovedResponse,
  verifyCmiResponseHash,
} from "../../common/utils/cmi";
import { normalizeImageInput } from "../../common/utils/cloudinary";
import {
  sendAdminNewOrderNotificationEmail,
  sendCustomerOrderConfirmationEmail,
} from "../../common/utils/mailer";
import { env } from "../../config/env";
import { MonthlyPlanDetailsModel, OrderModel, SubscriptionModel } from "../admin/admin.model";
import { adminService } from "../admin/admin.service";
import {
  ContactMessageModel,
  CustomerOrderModel,
  CustomerSubscriptionModel,
  StoreOrderModel,
} from "./public.model";

function buildId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toProductHandle(product: Record<string, unknown>) {
  const explicitHandle =
    typeof product.handle === "string" ? product.handle.trim() : "";
  if (explicitHandle) return explicitHandle;

  const sku = typeof product.sku === "string" ? product.sku.trim() : "";
  if (sku) return toSlug(sku);

  const name = typeof product.name === "string" ? product.name : "";
  return toSlug(name) || "product";
}

function toPriceNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  const normalized = value.replace(/[^0-9.]+/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toSafeNumber(value: unknown, fallback = 0) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOrderType(optionId: unknown) {
  const normalized = String(optionId ?? "").toLowerCase();
  return normalized.includes("pickup") ? "Pickup" : "Delivery";
}

function formatMoney(value: unknown) {
  return `MAD ${toSafeNumber(value, 0).toFixed(2)}`;
}

function formatCount(value: unknown, singular: string, plural = `${singular}s`) {
  const count = toSafeNumber(value, 0);
  if (!count) return "";
  return `${count} ${count === 1 ? singular : plural}`;
}

function humanizeToken(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildOrderDetail(label: string, value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized ? { label, value: normalized } : null;
}

function hasTimestamp(value: unknown) {
  return Boolean(value);
}

function normalizeCustomer(customer: Record<string, unknown>) {
  return {
    firstName: String(customer.firstName ?? "").trim(),
    lastName: String(customer.lastName ?? "").trim(),
    email: String(customer.email ?? "").trim().toLowerCase(),
    phone: String(customer.phone ?? "").trim(),
    emirate: String(customer.emirate ?? "").trim(),
    area: String(customer.area ?? "").trim()
  };
}

function normalizeDelivery(delivery: Record<string, unknown>) {
  const pickupLocation =
    delivery.pickupLocation && typeof delivery.pickupLocation === "object"
      ? (delivery.pickupLocation as Record<string, unknown>)
      : {};

  return {
    optionId: String(delivery.optionId ?? "").trim(),
    address: String(delivery.address ?? "").trim(),
    pickupLocation: {
      id: String(pickupLocation.id ?? "").trim(),
      name: String(pickupLocation.name ?? "").trim(),
      address: String(pickupLocation.address ?? "").trim()
    }
  };
}

function normalizeSelectedMeal(item: Record<string, unknown>) {
  return {
    instanceId: String(item.instanceId ?? "").trim(),
    id: String(item.id ?? "").trim(),
    title: String(item.title ?? "").trim(),
    date: String(item.date ?? "").trim(),
    extrasSummary: String(item.extrasSummary ?? "").trim(),
    calories: toSafeNumber(item.calories, 0),
    protein: toSafeNumber(item.protein, 0),
    carb: toSafeNumber(item.carb, 0),
    fat: toSafeNumber(item.fat, 0),
    basePrice: toSafeNumber(item.basePrice, 0),
    totalPrice: toSafeNumber(item.totalPrice, 0)
  };
}

function buildMenuItemDescription(product: Record<string, unknown>) {
  const segments: string[] = [];

  const description =
    typeof product.description === "string" ? product.description.trim() : "";
  if (description) {
    segments.push(description);
  } else {
    const category =
      typeof product.category === "string" ? product.category.trim() : "";
    if (category) segments.push(category);
  }

  const macroParts: string[] = [];
  if (typeof product.protein === "string" && product.protein.trim())
    macroParts.push(`Proteins: ${product.protein.trim()}`);
  if (typeof product.carbs === "string" && product.carbs.trim())
    macroParts.push(`Carbs: ${product.carbs.trim()}`);
  if (typeof product.fat === "string" && product.fat.trim())
    macroParts.push(`Fat: ${product.fat.trim()}`);

  if (macroParts.length > 0) {
    segments.push(macroParts.join(" | "));
  }

  return segments.join(" | ");
}

function toRestaurantList(value: unknown) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.reduce<string[]>((acc, item) => {
    const normalized = String(item ?? "").trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) return acc;
    seen.add(key);
    acc.push(normalized);
    return acc;
  }, []);
}

const websiteNavigationOrder: Record<string, number> = {
  home: 0,
  locations: 1,
  menu: 2,
  "about-us": 3,
  contact: 4,
  "meal-prep": 5,
  "terms-and-conditions": 6,
  "privacy-policy": 7,
};

const TRANSACTIONAL_EMAIL_LOCK_MS = 10 * 60 * 1000;

type SelectedMealRecord = ReturnType<typeof normalizeSelectedMeal>;
type CustomerRecord = ReturnType<typeof normalizeCustomer>;
type DeliveryRecord = ReturnType<typeof normalizeDelivery>;
type PromoValidationResult = Awaited<ReturnType<typeof adminService.validatePromoCode>>;

type PreparedCheckout = {
  customer: CustomerRecord;
  customerName: string;
  daysPerWeek: number;
  delivery: DeliveryRecord;
  giftDiscount: number;
  grandTotal: number;
  locationLabel: string;
  mealsPerDay: number;
  orderId: string;
  orderPayload: Record<string, any>;
  payload: Record<string, any>;
  planId: string;
  planTitle: string;
  safetyBag: number;
  selectedMeals: SelectedMealRecord[];
  selection: Record<string, any>;
  subtotal: number;
  subscriptionId: string;
  subscriptionPayload: Record<string, any>;
  totalPlannedMeals: number;
  totalWeeks: number;
  validatedPromoCode: PromoValidationResult | null;
  vat: number;
};

const CMI_RETRY_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

function getObjectRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, any>)
    : {};
}

function getRequestBaseUrl(req: Request) {
  const configuredBaseUrl = safeOrigin(env.BACKEND_BASE_URL);
  if (configuredBaseUrl) {
    return toCmiPublicOrigin(configuredBaseUrl);
  }

  const forwardedProto = req
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = req
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProto || req.protocol || "http";
  const host = forwardedHost || req.get("host");

  if (!host) {
    throw new AppError(500, "Unable to resolve backend URL for CMI.");
  }

  return toCmiPublicOrigin(`${protocol}://${host}`);
}

function safeOrigin(value: string | undefined) {
  if (!value) return "";

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function toCmiPublicOrigin(value: string) {
  const origin = safeOrigin(value);
  if (!origin) return "";

  const url = new URL(origin);
  const hostname = url.hostname.toLowerCase();
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost");

  if (!isLocal) {
    url.protocol = "https:";
  }

  return url.origin;
}

function forceHttpsForPublicOrigin(value: string) {
  return toCmiPublicOrigin(value);
}

function getCmiBackendBaseUrl(req: Request) {
  const configuredCmiUrl = safeOrigin(env.CMI_PUBLIC_BASE_URL);
  if (configuredCmiUrl) {
    return toCmiPublicOrigin(configuredCmiUrl);
  }

  return getRequestBaseUrl(req);
}

function getFrontendBaseUrl(req: Request) {
  const configuredFrontendUrl = safeOrigin(env.FRONTEND_PUBLIC_URL);
  if (configuredFrontendUrl) {
    return forceHttpsForPublicOrigin(configuredFrontendUrl);
  }

  const candidates = [
    safeOrigin(req.get("origin") ?? undefined),
    safeOrigin(req.get("referer") ?? undefined),
  ].filter(Boolean);

  const trustedOrigin = candidates.find((candidate) =>
    env.allowedOrigins.includes(candidate),
  );
  if (trustedOrigin) return forceHttpsForPublicOrigin(trustedOrigin);

  return forceHttpsForPublicOrigin(env.allowedOrigins[0] || getRequestBaseUrl(req));
}

function normalizeGatewayPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      Array.isArray(value) ? String(value[0] ?? "") : String(value ?? ""),
    ]),
  );
}

function buildAuditEntry(action: string) {
  return {
    at: new Date().toLocaleString("en-US"),
    by: "CMI payment",
    action,
  };
}

function getCmiSuccessCallbackReply() {
  return env.CMI_TRAN_TYPE.trim().toLowerCase() === "preauth"
    ? "ACTION=POSTAUTH"
    : "APPROVED";
}

function mergePaymentMeta(
  existing: unknown,
  patch: Record<string, unknown>,
) {
  const current =
    existing && typeof existing === "object"
      ? (existing as Record<string, unknown>)
      : {};

  return {
    ...current,
    ...patch,
  };
}

async function resolveCheckoutMealCount(planId: string, submittedMeals: unknown) {
  const submittedMealCount = Math.max(1, toSafeNumber(submittedMeals, 1));
  const planDetails = planId
    ? await MonthlyPlanDetailsModel.findOne(
        { planId },
        { planKind: 1, rules: 1 },
      ).lean()
    : null;
  const planKind = String(planDetails?.planKind ?? "normal").trim().toLowerCase();

  if (planKind === "custom") {
    return submittedMealCount;
  }

  const rules = getObjectRecord(planDetails?.rules);
  const defaults = getObjectRecord(rules.defaults);
  const defaultMeals = toSafeNumber(defaults.meals, 0);
  if (defaultMeals > 0) {
    return defaultMeals;
  }

  const allowedMeals = Array.isArray(rules.allowedMealsPerDay)
    ? rules.allowedMealsPerDay
        .map((value) => toSafeNumber(value, 0))
        .filter((value) => value > 0)
    : [];

  return allowedMeals[0] ?? 3;
}

function getCmiRetrySigningKey() {
  return env.CMI_STORE_KEY || env.JWT_SECRET;
}

function signCmiRetryToken(orderId: string, subscriptionId: string, issuedAt: number) {
  return crypto
    .createHmac("sha256", getCmiRetrySigningKey())
    .update(`${orderId}|${subscriptionId}|${issuedAt}`)
    .digest("hex");
}

function createCmiRetryToken(orderId: string, subscriptionId: string) {
  const issuedAt = Date.now();
  const signature = signCmiRetryToken(orderId, subscriptionId, issuedAt);
  return `${issuedAt}.${signature}`;
}

function verifyCmiRetryToken(token: unknown, orderId: string, subscriptionId: string) {
  const [issuedAtRaw, receivedSignature] = String(token ?? "").split(".");
  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt) || !receivedSignature) return false;
  if (Date.now() - issuedAt > CMI_RETRY_TOKEN_TTL_MS) return false;

  const expectedSignature = signCmiRetryToken(orderId, subscriptionId, issuedAt);
  const received = Buffer.from(receivedSignature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function getFriendlyCmiFailureMessage(rawMessage: string, hashVerified: boolean) {
  if (!hashVerified) {
    return "We could not verify the payment response. You were not charged. Please try again or contact support if the issue continues.";
  }

  const normalized = rawMessage.toLowerCase();
  if (
    normalized.includes("transient") ||
    normalized.includes("system failure") ||
    normalized.includes("acs") ||
    normalized.includes("3d")
  ) {
    return "The bank authentication service was temporarily unavailable. You were not charged. Please try the payment again.";
  }

  return "The payment was not approved. You were not charged. Please try again or use another card.";
}

function toEmailErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error ?? "Unknown email error");
}

function buildMonthlyOrderEmailPayload(orderRow: Record<string, unknown>) {
  const customer = normalizeCustomer(getObjectRecord(orderRow.customer));
  const delivery = normalizeDelivery(getObjectRecord(orderRow.delivery));
  const totals = getObjectRecord(orderRow.totals);
  const payload = getObjectRecord(orderRow.rawPayload);
  const subscriptionPayload = getObjectRecord(payload.subscription);
  const selection = getObjectRecord(subscriptionPayload.selection);
  const plan = getObjectRecord(subscriptionPayload.plan);
  const selectedMealsSource = Array.isArray(orderRow.selectedMeals)
    ? orderRow.selectedMeals
    : Array.isArray(selection.selectedMeals)
      ? selection.selectedMeals
      : [];
  const customerName = `${customer.firstName} ${customer.lastName}`.trim() || "Customer";
  const deliverySummary =
    delivery.pickupLocation.name ||
    delivery.address ||
    customer.area ||
    customer.emirate ||
    "N/A";
  const mealsPerDay = Math.max(1, toSafeNumber(selection.meals, 1));
  const daysPerWeek = Math.max(1, toSafeNumber(selection.days, 1));
  const totalWeeks = Math.max(1, toSafeNumber(selection.weeks, 4));
  const totalPlannedMeals = mealsPerDay * daysPerWeek * totalWeeks;
  const deliveryDays = String(selection.deliveryDays ?? "").trim();
  const startDate = String(selection.startDate ?? "").trim();
  const planType = humanizeToken(selection.planType);
  const orderDetails = [
    buildOrderDetail("Meals per day", formatCount(mealsPerDay, "meal")),
    buildOrderDetail("Days per week", formatCount(daysPerWeek, "day")),
    buildOrderDetail("Duration", formatCount(totalWeeks, "week")),
    buildOrderDetail("Total planned meals", formatCount(totalPlannedMeals, "meal")),
    buildOrderDetail("Start date", startDate),
    buildOrderDetail("Delivery days", deliveryDays),
    buildOrderDetail("Delivery method", toOrderType(delivery.optionId)),
    buildOrderDetail("Plan type", planType),
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail));

  return {
    orderId: String(orderRow.orderId ?? ""),
    orderType: "monthly-plan" as const,
    customerName,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    planTitle: String(plan.title ?? "").trim() || "Monthly Plan",
    deliverySummary,
    paymentStatus: "Paid by CMI",
    orderDetails,
    items: selectedMealsSource
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => {
        const meal = normalizeSelectedMeal(item);
        return {
          title: meal.title || "Meal",
          quantity: 1,
          lineTotal: meal.totalPrice || meal.basePrice || undefined,
          note: [meal.date, meal.extrasSummary].filter(Boolean).join(" | "),
        };
      }),
    totals: {
      subtotal: toSafeNumber(totals.subtotal, 0),
      discount: toSafeNumber(totals.giftDiscount, 0),
      vat: toSafeNumber(totals.vat, 0),
      safetyBag: toSafeNumber(totals.safetyBag, 0),
      total: toSafeNumber(totals.grandTotal, 0),
    },
  };
}

function buildStoreOrderEmailPayload(orderRow: Record<string, unknown>) {
  const customer = getObjectRecord(orderRow.customer);
  const totals = getObjectRecord(orderRow.totals);
  const items = Array.isArray(orderRow.items) ? orderRow.items : [];
  const customerName = `${String(customer.firstName ?? "").trim()} ${String(customer.lastName ?? "").trim()}`.trim() || "Customer";
  const address = String(customer.address ?? "").trim();
  const cityArea = String(customer.cityArea ?? "").trim();

  return {
    orderId: String(orderRow.orderId ?? ""),
    orderType: "store-order" as const,
    customerName,
    customerEmail: String(customer.email ?? "").trim().toLowerCase(),
    customerPhone: String(customer.phone ?? "").trim(),
    deliverySummary: [address, cityArea].filter(Boolean).join(", ") || "N/A",
    paymentStatus: "Order received",
    items: items
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => {
        const quantity = Math.max(1, toSafeNumber(item.quantity, 1));
        const price = toSafeNumber(item.priceMad, 0);
        return {
          title: String(item.title ?? "Item"),
          quantity,
          price,
          lineTotal: price * quantity,
        };
      }),
    totals: {
      subtotal: toSafeNumber(totals.subtotal, 0),
      vat: toSafeNumber(totals.vat, 0),
      total: toSafeNumber(totals.total, 0),
    },
  };
}

async function sendCustomerOrderTransactionalEmailsOnce(orderId: string) {
  const now = new Date();
  const staleStartedBefore = new Date(now.getTime() - TRANSACTIONAL_EMAIL_LOCK_MS);
  const claimedOrder = await CustomerOrderModel.findOneAndUpdate(
    {
      orderId,
      paymentStatus: "paid",
      $and: [
        {
          $or: [
            { "transactionalEmails.customerConfirmationSentAt": null },
            { "transactionalEmails.customerConfirmationSentAt": { $exists: false } },
            { "transactionalEmails.adminNotificationSentAt": null },
            { "transactionalEmails.adminNotificationSentAt": { $exists: false } },
          ],
        },
        {
          $or: [
            { "transactionalEmails.startedAt": null },
            { "transactionalEmails.startedAt": { $exists: false } },
            { "transactionalEmails.startedAt": { $lte: staleStartedBefore } },
            {
              $and: [
                { "transactionalEmails.failedAt": { $exists: true } },
                { "transactionalEmails.failedAt": { $ne: null } },
              ],
            },
          ],
        },
      ],
    },
    {
      $set: {
        "transactionalEmails.startedAt": now,
        "transactionalEmails.failedAt": null,
        "transactionalEmails.error": "",
      },
    },
    { new: true },
  ).lean();

  if (!claimedOrder) return;

  const emailPayload = buildMonthlyOrderEmailPayload(claimedOrder as unknown as Record<string, unknown>);
  const transactionalEmails = getObjectRecord(
    (claimedOrder as unknown as Record<string, unknown>).transactionalEmails,
  );
  const customerConfirmationAlreadySent = hasTimestamp(
    transactionalEmails.customerConfirmationSentAt,
  );
  const adminNotificationAlreadySent = hasTimestamp(
    transactionalEmails.adminNotificationSentAt,
  );
  const emailFailures: string[] = [];

  if (!customerConfirmationAlreadySent && emailPayload.customerEmail) {
    try {
      await sendCustomerOrderConfirmationEmail(emailPayload);
      await CustomerOrderModel.updateOne(
        { orderId },
        { $set: { "transactionalEmails.customerConfirmationSentAt": new Date() } },
      );
    } catch (error) {
      const message = toEmailErrorMessage(error);
      emailFailures.push(`Customer confirmation: ${message}`);
      console.error(`Customer order confirmation email failed for ${orderId}:`, error);
    }
  } else if (!customerConfirmationAlreadySent) {
    await CustomerOrderModel.updateOne(
      { orderId },
      { $set: { "transactionalEmails.customerConfirmationSentAt": new Date() } },
    );
  }

  if (!adminNotificationAlreadySent) {
    try {
      await sendAdminNewOrderNotificationEmail(emailPayload);
      await CustomerOrderModel.updateOne(
        { orderId },
        { $set: { "transactionalEmails.adminNotificationSentAt": new Date() } },
      );
    } catch (error) {
      const message = toEmailErrorMessage(error);
      emailFailures.push(`Admin notification: ${message}`);
      console.error(`Admin order notification email failed for ${orderId}:`, error);
    }
  }

  if (emailFailures.length) {
    await CustomerOrderModel.updateOne(
      { orderId },
      {
        $set: {
          "transactionalEmails.failedAt": new Date(),
          "transactionalEmails.error": emailFailures.join(" | "),
        },
      },
    );
    return;
  }

  await CustomerOrderModel.updateOne(
    { orderId },
    {
      $set: {
        "transactionalEmails.failedAt": null,
        "transactionalEmails.error": "",
      },
    },
  );
}

async function sendStoreOrderTransactionalEmailsOnce(orderId: string) {
  const now = new Date();
  const staleStartedBefore = new Date(now.getTime() - TRANSACTIONAL_EMAIL_LOCK_MS);
  const claimedOrder = await StoreOrderModel.findOneAndUpdate(
    {
      orderId,
      $and: [
        {
          $or: [
            { "transactionalEmails.customerConfirmationSentAt": null },
            { "transactionalEmails.customerConfirmationSentAt": { $exists: false } },
            { "transactionalEmails.adminNotificationSentAt": null },
            { "transactionalEmails.adminNotificationSentAt": { $exists: false } },
          ],
        },
        {
          $or: [
            { "transactionalEmails.startedAt": null },
            { "transactionalEmails.startedAt": { $exists: false } },
            { "transactionalEmails.startedAt": { $lte: staleStartedBefore } },
            {
              $and: [
                { "transactionalEmails.failedAt": { $exists: true } },
                { "transactionalEmails.failedAt": { $ne: null } },
              ],
            },
          ],
        },
      ],
    },
    {
      $set: {
        "transactionalEmails.startedAt": now,
        "transactionalEmails.failedAt": null,
        "transactionalEmails.error": "",
      },
    },
    { new: true },
  ).lean();

  if (!claimedOrder) return;

  const emailPayload = buildStoreOrderEmailPayload(claimedOrder as unknown as Record<string, unknown>);
  const transactionalEmails = getObjectRecord(
    (claimedOrder as unknown as Record<string, unknown>).transactionalEmails,
  );
  const customerConfirmationAlreadySent = hasTimestamp(
    transactionalEmails.customerConfirmationSentAt,
  );
  const adminNotificationAlreadySent = hasTimestamp(
    transactionalEmails.adminNotificationSentAt,
  );
  const emailFailures: string[] = [];

  if (!customerConfirmationAlreadySent && emailPayload.customerEmail) {
    try {
      await sendCustomerOrderConfirmationEmail(emailPayload);
      await StoreOrderModel.updateOne(
        { orderId },
        { $set: { "transactionalEmails.customerConfirmationSentAt": new Date() } },
      );
    } catch (error) {
      const message = toEmailErrorMessage(error);
      emailFailures.push(`Customer confirmation: ${message}`);
      console.error(`Store order customer confirmation email failed for ${orderId}:`, error);
    }
  } else if (!customerConfirmationAlreadySent) {
    await StoreOrderModel.updateOne(
      { orderId },
      { $set: { "transactionalEmails.customerConfirmationSentAt": new Date() } },
    );
  }

  if (!adminNotificationAlreadySent) {
    try {
      await sendAdminNewOrderNotificationEmail(emailPayload);
      await StoreOrderModel.updateOne(
        { orderId },
        { $set: { "transactionalEmails.adminNotificationSentAt": new Date() } },
      );
    } catch (error) {
      const message = toEmailErrorMessage(error);
      emailFailures.push(`Admin notification: ${message}`);
      console.error(`Store order admin notification email failed for ${orderId}:`, error);
    }
  }

  if (emailFailures.length) {
    await StoreOrderModel.updateOne(
      { orderId },
      {
        $set: {
          "transactionalEmails.failedAt": new Date(),
          "transactionalEmails.error": emailFailures.join(" | "),
        },
      },
    );
    return;
  }

  await StoreOrderModel.updateOne(
    { orderId },
    {
      $set: {
        "transactionalEmails.failedAt": null,
        "transactionalEmails.error": "",
      },
    },
  );
}

function scheduleTransactionalEmailDelivery(label: string, task: () => Promise<void>) {
  setImmediate(() => {
    void task().catch((error) => {
      console.error(`${label} transactional email delivery failed:`, error);
    });
  });
}

async function prepareCheckoutPayload(
  payload: Record<string, any>,
  ids?: { orderId?: string; subscriptionId?: string },
): Promise<PreparedCheckout> {
  const subscriptionId = ids?.subscriptionId || buildId("SUB");
  const orderId = ids?.orderId || buildId("ORD");

  const subscriptionPayload = getObjectRecord(payload.subscription);
  const orderPayload = getObjectRecord(payload.order);
  const selection = getObjectRecord(subscriptionPayload.selection);
  const rawCustomer = getObjectRecord(orderPayload.customer);
  const rawDelivery = Object.keys(getObjectRecord(orderPayload.delivery)).length
    ? getObjectRecord(orderPayload.delivery)
    : getObjectRecord(subscriptionPayload.delivery);
  const totals = getObjectRecord(orderPayload.totals);
  const selectedMealsSource = Array.isArray(orderPayload.selectedMeals)
    ? orderPayload.selectedMeals
    : Array.isArray(selection.selectedMeals)
      ? selection.selectedMeals
      : [];
  const customer = normalizeCustomer(rawCustomer);
  const delivery = normalizeDelivery(rawDelivery);
  const selectedMeals: SelectedMealRecord[] = selectedMealsSource
    .filter(
      (item: unknown): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map(normalizeSelectedMeal)
    .filter((item) => item.id && item.title);
  const submittedPromoCode = String(orderPayload.promoCode?.code ?? "").trim();
  const plan = getObjectRecord(subscriptionPayload.plan);
  const planId = String(plan.id ?? "").trim();
  const planTitle = String(plan.title ?? "").trim() || "Monthly Plan";
  const mealsPerDay = await resolveCheckoutMealCount(planId, selection.meals);
  selection.meals = String(mealsPerDay);
  const daysPerWeek = Math.max(1, toSafeNumber(selection.days, 1));
  const totalWeeks = Math.max(1, toSafeNumber(selection.weeks, 4));
  const totalPlannedMeals = mealsPerDay * daysPerWeek * totalWeeks;
  const customerName = `${customer.firstName} ${customer.lastName}`.trim();
  const locationLabel =
    delivery.pickupLocation.name ||
    customer.area ||
    customer.emirate ||
    "N/A";
  const subtotal = toSafeNumber(totals.subtotal, 0);
  const validatedPromoCode = submittedPromoCode
    ? await adminService.validatePromoCode(
        submittedPromoCode,
        "monthly-plan",
        subtotal,
      )
    : null;
  const giftDiscount = validatedPromoCode?.discountAmount ?? 0;
  const vat = toSafeNumber(totals.vat, 0);
  const safetyBag = toSafeNumber(totals.safetyBag, 0);
  const grandTotal = Number(
    (subtotal - giftDiscount + vat + safetyBag).toFixed(2),
  );

  return {
    customer,
    customerName,
    daysPerWeek,
    delivery,
    giftDiscount,
    grandTotal,
    locationLabel,
    mealsPerDay,
    orderId,
    orderPayload,
    payload,
    planId,
    planTitle,
    safetyBag,
    selectedMeals,
    selection,
    subtotal,
    subscriptionId,
    subscriptionPayload,
    totalPlannedMeals,
    totalWeeks,
    validatedPromoCode,
    vat,
  };
}

function buildCmiPaymentForOrder(orderRow: Record<string, unknown>, req: Request) {
  if (!env.CMI_CLIENT_ID || !env.CMI_STORE_KEY) {
    throw new AppError(
      500,
      "CMI is not configured. Please set CMI_CLIENT_ID and CMI_STORE_KEY.",
    );
  }

  const orderId = String(orderRow.orderId ?? "").trim();
  const subscriptionId = String(orderRow.subscriptionId ?? "").trim();
  const customer = normalizeCustomer(getObjectRecord(orderRow.customer));
  const delivery = normalizeDelivery(getObjectRecord(orderRow.delivery));
  const totals = getObjectRecord(orderRow.totals);
  const grandTotal = Number(toSafeNumber(totals.grandTotal, 0).toFixed(2));
  const customerName = `${customer.firstName} ${customer.lastName}`.trim();
  const backendBaseUrl = getCmiBackendBaseUrl(req);
  const returnUrl = new URL("/api/v1/payments/cmi/return", backendBaseUrl);
  returnUrl.searchParams.set("oid", orderId);
  const callbackUrl = `${backendBaseUrl}/api/v1/payments/cmi/callback`;
  const paymentFields = buildCmiPaymentFields({
    amount: grandTotal,
    callbackUrl,
    clientId: env.CMI_CLIENT_ID,
    currency: env.CMI_CURRENCY,
    failUrl: returnUrl.toString(),
    lang: env.CMI_LANG,
    okUrl: returnUrl.toString(),
    orderId,
    refreshTime: env.CMI_REFRESH_TIME,
    storeKey: env.CMI_STORE_KEY,
    storeType: env.CMI_STORE_TYPE,
    tranType: env.CMI_TRAN_TYPE,
    billingName: customerName,
    billingStreet1:
      delivery.address ||
      delivery.pickupLocation.address ||
      customer.area,
    billingCity: customer.area,
    billingStateProv: customer.emirate,
    billingCountry: "Morocco",
    email: customer.email,
    phone: customer.phone,
  });

  return {
    orderId,
    subscriptionId,
    amount: grandTotal,
    request: {
      amount: paymentFields.amount,
      callbackUrl,
      clientid: paymentFields.clientid,
      currency: paymentFields.currency,
      failUrl: paymentFields.failUrl,
      hashAlgorithm: paymentFields.hashAlgorithm,
      lang: paymentFields.lang,
      oid: paymentFields.oid,
      okUrl: paymentFields.okUrl,
      rnd: paymentFields.rnd,
      storetype: paymentFields.storetype,
      TranType: paymentFields.TranType,
      BillToName: paymentFields.BillToName,
      BillToStreet1: paymentFields.BillToStreet1,
      BillToCity: paymentFields.BillToCity,
      BillToStateProv: paymentFields.BillToStateProv,
      BillToCountry: paymentFields.BillToCountry,
      email: paymentFields.email,
      tel: paymentFields.tel,
    },
    payment: {
      provider: "CMI" as const,
      gatewayUrl: env.CMI_GATEWAY_URL,
      method: "POST" as const,
      fields: paymentFields,
    },
  };
}

async function ensureSuccessfulCheckoutArtifacts(
  orderRow: Record<string, unknown>,
  gatewayPayload?: Record<string, unknown>,
) {
  const payload = getObjectRecord(orderRow.rawPayload);
  const subscriptionPayload = getObjectRecord(payload.subscription);
  const selection = getObjectRecord(subscriptionPayload.selection);
  const customer = normalizeCustomer(getObjectRecord(orderRow.customer));
  const delivery = normalizeDelivery(getObjectRecord(orderRow.delivery));
  const selectedMealsSource = Array.isArray(orderRow.selectedMeals)
    ? orderRow.selectedMeals
    : Array.isArray(selection.selectedMeals)
      ? selection.selectedMeals
      : [];
  const selectedMeals: SelectedMealRecord[] = selectedMealsSource
    .filter(
      (item: unknown): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map(normalizeSelectedMeal)
    .filter((item) => item.id && item.title);
  const plan = getObjectRecord(subscriptionPayload.plan);
  const planId = String(plan.id ?? "").trim();
  const planTitle = String(plan.title ?? "").trim() || "Monthly Plan";
  const subscriptionId = String(orderRow.subscriptionId ?? "").trim();
  const orderId = String(orderRow.orderId ?? "").trim();
  const mealsPerDay = Math.max(1, toSafeNumber(selection.meals, 1));
  const daysPerWeek = Math.max(1, toSafeNumber(selection.days, 1));
  const totalWeeks = Math.max(1, toSafeNumber(selection.weeks, 4));
  const totalPlannedMeals = mealsPerDay * daysPerWeek * totalWeeks;
  const customerName = `${customer.firstName} ${customer.lastName}`.trim() || "Customer";
  const totals = getObjectRecord(orderRow.totals);

  await CustomerSubscriptionModel.findOneAndUpdate(
    { subscriptionId },
    {
      $setOnInsert: {
        subscriptionId,
        rawPayload: payload,
        customer,
        plan: {
          id: planId,
          title: planTitle,
        },
        selection: {
          meals: String(selection.meals ?? "").trim(),
          days: String(selection.days ?? "").trim(),
          weeks: String(selection.weeks ?? "").trim(),
          snacks: String(selection.snacks ?? "").trim(),
          startDate: String(selection.startDate ?? "").trim(),
          deliveryDays: String(selection.deliveryDays ?? "").trim(),
          planType: String(selection.planType ?? "").trim(),
          selectedMeals,
        },
        delivery,
        status: "active",
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  await SubscriptionModel.findOneAndUpdate(
    { subscriptionId },
    {
      $setOnInsert: {
        subscriptionId,
        client: customerName,
        plan: planTitle,
        totalWeeks,
        currentWeek: 1,
        dayProgress: `0/${daysPerWeek}`,
        remainingMeals: totalPlannedMeals,
        status: "active",
        log: [
          `Payment confirmed on ${new Date().toLocaleString("en-US")}`,
          `Delivery option: ${String(delivery.optionId ?? "n/a")}`,
        ],
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  await OrderModel.updateOne(
    { orderId, payment: { $ne: "paid" } },
    {
      $set: {
        payment: "paid",
      },
      $push: {
        auditLog: {
          $each: [
            buildAuditEntry(
              `Payment confirmed${gatewayPayload?.HostRefNum ? ` (${String(gatewayPayload.HostRefNum)})` : ""}`,
            ),
          ],
          $position: 0,
        },
      },
    },
  );

  const promoUsageRow = await CustomerOrderModel.findOneAndUpdate(
    {
      orderId,
      promoUsageApplied: false,
      "promoCode.id": { $exists: true, $ne: "" },
    },
    { $set: { promoUsageApplied: true } },
    { new: false },
  ).lean();
  const promoCodeRecord = getObjectRecord(
    (promoUsageRow as Record<string, unknown> | null)?.promoCode,
  );
  const promoCodeId = String(promoCodeRecord.id ?? "").trim();

  if (promoCodeId) {
    await adminService.incrementPromoCodeUsage(promoCodeId);
  }

  return {
    orderId,
    subscriptionId,
    totals: {
      subtotal: Number(totals.subtotal ?? 0),
      giftDiscount: Number(totals.giftDiscount ?? 0),
      vat: Number(totals.vat ?? 0),
      safetyBag: Number(totals.safetyBag ?? 0),
      grandTotal: Number(totals.grandTotal ?? 0),
    },
  };
}

export const publicService = {
  async listMenuCategories() {
    const [menuItemsRaw, productsRaw] = await Promise.all([
      adminService.listMenuItems(),
      adminService.listProducts(),
    ]);

    const productsBySku = new Map<string, Record<string, unknown>>();
    productsRaw.forEach((product) => {
      const sku = String((product as Record<string, unknown>).sku ?? "");
      if (sku) {
        productsBySku.set(sku, product as Record<string, unknown>);
      }
    });

    return menuItemsRaw
      .filter(
        (menuItem) =>
          String(
            (menuItem as Record<string, unknown>).status ?? "Visible",
          ).toLowerCase() !== "hidden",
      )
      .sort(
        (a, b) =>
          Number((a as Record<string, unknown>).priority ?? 0) -
          Number((b as Record<string, unknown>).priority ?? 0),
      )
      .map((menuItem) => {
        const row = menuItem as Record<string, unknown>;
        const linkedSkus = Array.isArray(row.linkedProductSkus)
          ? row.linkedProductSkus
          : [];
        const categoryImage = normalizeImageInput(row.image);

        const items = linkedSkus
          .map((sku) => productsBySku.get(String(sku)))
          .filter((product): product is Record<string, unknown> =>
            Boolean(product),
          )
          .map((product) => ({
            id: String(product.sku ?? product.id ?? product._id ?? ""),
            name: String(product.name ?? product.title ?? ""),
            description: buildMenuItemDescription(product),
            priceMad: toPriceNumber(product.priceMad ?? product.price),
            calories: Number(product.kcal ?? 0),
            image: normalizeImageInput(
              product.image ?? product.imageUrl ?? categoryImage,
            ),
          }));

        return {
          categoryId: String(row.menuId ?? row._id ?? ""),
          name: String(row.title ?? row.menuId ?? "Menu"),
          description: String(row.title ?? ""),
          image: categoryImage,
          restaurants: toRestaurantList(row.restaurants),
          items,
        };
      })
      .filter((category) => category.items.length > 0);
  },

  async listRestaurants() {
    const restaurants = await adminService.listRestaurants();

    return restaurants
      .filter(
        (restaurant) =>
          String(
            (restaurant as Record<string, unknown>).status ?? "Active",
          ).toLowerCase() !== "inactive",
      )
      .map((restaurant) => {
        const item = restaurant as Record<string, unknown>;
        return {
          restaurantId: String(item.restaurantId ?? item._id ?? ""),
          name: String(item.name ?? ""),
          address: String(item.address ?? ""),
          workingDays: Array.isArray(item.workingDays)
            ? item.workingDays.map((day) => String(day))
            : [],
          openingHours: String(item.openingHours ?? ""),
          status: String(item.status ?? "Active"),
        };
      });
  },

  async listMonthlyPlans() {
    return adminService.listPublicMonthlyPlans();
  },

  async getMonthlyPlanById(planId: string) {
    return adminService.getPublicMonthlyPlanById(planId.trim());
  },

  async listProducts() {
    return adminService.listProducts();
  },

  async getProductByHandle(handle: string) {
    const normalizedHandle = handle.trim().toLowerCase();
    const rows = await adminService.listProducts();
    const row = rows.find((product) => {
      const source = product as Record<string, unknown>;
      return toProductHandle(source).toLowerCase() === normalizedHandle;
    });

    if (!row) throw new AppError(404, "Product not found");
    return row;
  },

  async listLocations() {
    return adminService.listLocations();
  },

  async getWebsitePage(slug: string) {
    const page = await adminService.getWebsitePageBySlug(slug.trim());
    if (page.status !== "published")
      throw new AppError(404, "Website page not found");
    return page;
  },

  async listWebsiteNavigation() {
    const pages = await adminService.listWebsitePages();

    return pages
      .filter((page) => page.status === "published" && page.showInTopNav)
      .sort((a, b) => {
        const left = websiteNavigationOrder[a.slug] ?? Number.MAX_SAFE_INTEGER;
        const right = websiteNavigationOrder[b.slug] ?? Number.MAX_SAFE_INTEGER;
        if (left !== right) return left - right;
        return a.title.localeCompare(b.title);
      })
      .map((page) => ({
        id: page.id,
        slug: page.slug,
        title: page.title,
        navLabel: page.navLabel,
        kind: page.kind,
      }));
  },

  async listBuilderIngredients() {
    return adminService.listIngredients();
  },

  async validatePromoCode(payload: Record<string, unknown>) {
    const code = String(payload.code ?? "");
    const scope =
      String(payload.scope ?? "monthly-plan") === "direct-order"
        ? "direct-order"
        : "monthly-plan";
    const subtotal = toSafeNumber(payload.subtotal, 0);

    const result = await adminService.validatePromoCode(code, scope, subtotal);

    return {
      code: result.promoCode.code,
      description: result.promoCode.description,
      discountType: result.promoCode.discountType,
      discountValue: result.promoCode.discountValue,
      discountAmount: result.discountAmount,
      maxDiscount: result.promoCode.maxDiscount,
      eligibilityNote: result.promoCode.eligibilityNote,
    };
  },

  async createContactMessage(payload: Record<string, unknown>) {
    return ContactMessageModel.create(payload);
  },

  async checkout(payload: Record<string, any>, req: Request) {
    if (!env.CMI_CLIENT_ID || !env.CMI_STORE_KEY) {
      throw new AppError(
        500,
        "CMI is not configured. Please set CMI_CLIENT_ID and CMI_STORE_KEY.",
      );
    }

    const prepared = await prepareCheckoutPayload(payload);
    const backendBaseUrl = getCmiBackendBaseUrl(req);
    const returnUrl = new URL("/api/v1/payments/cmi/return", backendBaseUrl);
    returnUrl.searchParams.set("oid", prepared.orderId);
    const callbackUrl = `${backendBaseUrl}/api/v1/payments/cmi/callback`;
    const paymentFields = buildCmiPaymentFields({
      amount: prepared.grandTotal,
      callbackUrl,
      clientId: env.CMI_CLIENT_ID,
      currency: env.CMI_CURRENCY,
      failUrl: returnUrl.toString(),
      lang: env.CMI_LANG,
      okUrl: returnUrl.toString(),
      orderId: prepared.orderId,
      refreshTime: env.CMI_REFRESH_TIME,
      storeKey: env.CMI_STORE_KEY,
      storeType: env.CMI_STORE_TYPE,
      tranType: env.CMI_TRAN_TYPE,
      billingName: prepared.customerName,
      billingStreet1:
        prepared.delivery.address ||
        prepared.delivery.pickupLocation.address ||
        prepared.customer.area,
      billingCity: prepared.customer.area,
      billingStateProv: prepared.customer.emirate,
      billingCountry: "Morocco",
      email: prepared.customer.email,
      phone: prepared.customer.phone,
    });

    const paymentMeta = {
      provider: "CMI",
      gatewayUrl: env.CMI_GATEWAY_URL,
      initiatedAt: new Date().toISOString(),
      request: {
        amount: paymentFields.amount,
        callbackUrl,
        clientid: paymentFields.clientid,
        currency: paymentFields.currency,
        failUrl: paymentFields.failUrl,
        hashAlgorithm: paymentFields.hashAlgorithm,
        lang: paymentFields.lang,
        oid: paymentFields.oid,
        okUrl: paymentFields.okUrl,
        rnd: paymentFields.rnd,
        storetype: paymentFields.storetype,
        TranType: paymentFields.TranType,
        BillToName: paymentFields.BillToName,
        BillToStreet1: paymentFields.BillToStreet1,
        BillToCity: paymentFields.BillToCity,
        BillToStateProv: paymentFields.BillToStateProv,
        BillToCountry: paymentFields.BillToCountry,
        email: paymentFields.email,
        tel: paymentFields.tel,
      },
    };

    const order = await CustomerOrderModel.create({
      orderId: prepared.orderId,
      subscriptionId: prepared.subscriptionId,
      paymentStatus: "pending",
      paymentMethod: "CMI",
      currency: "MAD",
      paymentMeta,
      rawPayload: payload,
      customer: prepared.customer,
      delivery: prepared.delivery,
      selectedMeals: prepared.selectedMeals,
      promoCode: prepared.validatedPromoCode
        ? {
            id: prepared.validatedPromoCode.promoCode.id,
            code: prepared.validatedPromoCode.promoCode.code,
            discountAmount: prepared.giftDiscount,
          }
        : undefined,
      totals: {
        subtotal: prepared.subtotal,
        giftDiscount: prepared.giftDiscount,
        vat: prepared.vat,
        safetyBag: prepared.safetyBag,
        grandTotal: prepared.grandTotal,
      },
    });

    await OrderModel.create({
      orderId: prepared.orderId,
      client: prepared.customerName || "Customer",
      phone: String(prepared.customer.phone ?? "N/A"),
      customerEmail: String(prepared.customer.email ?? ""),
      customerEmirate: String(prepared.customer.emirate ?? ""),
      customerArea: String(prepared.customer.area ?? ""),
      status: "pending",
      confirmationStatus: "pending",
      plan: prepared.planTitle,
      orderType: toOrderType(prepared.delivery.optionId),
      location: prepared.locationLabel,
      deliveryAddress: String(prepared.delivery.address ?? ""),
      pickupLocation: String(prepared.delivery.pickupLocation?.name ?? ""),
      payment: "unpaid",
      currency: "MAD",
      schedule: String(prepared.delivery.optionId ?? ""),
      date: new Date().toISOString().split("T")[0],
      total: formatMoney(prepared.grandTotal),
      items: prepared.selectedMeals.map((item) => ({
        name: [item.title || "Meal", item.extrasSummary]
          .filter(Boolean)
          .join(" | "),
        qty: 1,
        macros: `K:${item.calories} P:${item.protein} C:${item.carb} F:${item.fat}`,
      })),
      notes: `Customer email: ${prepared.customer.email || "N/A"} | Payment: CMI pending${prepared.validatedPromoCode ? ` | Promo: ${prepared.validatedPromoCode.promoCode.code}` : ""}`,
      subscriptionId: prepared.subscriptionId,
      subscriptionInfo: `${prepared.planId} / ${String(prepared.delivery.optionId ?? "")}`,
      subscriptionDetails: {
        daysPerWeek: prepared.daysPerWeek,
        durationWeeks: prepared.totalWeeks,
        meals: prepared.totalPlannedMeals,
      },
      auditLog: [
        {
          at: new Date().toLocaleString("en-US"),
          by: "Checkout API",
          action: "Pending CMI payment created",
        },
      ],
      promoCode: prepared.validatedPromoCode
        ? {
            code: prepared.validatedPromoCode.promoCode.code,
            discountAmount: prepared.giftDiscount,
          }
        : undefined,
    });

    return {
      order,
      payment: {
        provider: "CMI",
        gatewayUrl: env.CMI_GATEWAY_URL,
        method: "POST",
        fields: paymentFields,
      },
    };
  },

  async handleCmiReturn(payload: Record<string, unknown>, req: Request) {
    const result = await this.processCmiPaymentResult(payload);
    const frontendUrl = new URL("/payment/cmi-return", getFrontendBaseUrl(req));
    const amount = String(payload.amount ?? payload.Amount ?? "").trim();

    frontendUrl.searchParams.set("status", result.status);
    if (result.orderId) {
      frontendUrl.searchParams.set("orderId", result.orderId);
    }
    if (result.subscriptionId) {
      frontendUrl.searchParams.set("subscriptionId", result.subscriptionId);
    }
    if ("amount" in result && typeof result.amount === "number") {
      frontendUrl.searchParams.set("amount", result.amount.toFixed(2));
    }
    if (result.message) {
      frontendUrl.searchParams.set("message", result.message);
    }
    if (result.status !== "success" && result.retryToken) {
      frontendUrl.searchParams.set("retryToken", result.retryToken);
    }
    if (amount) {
      frontendUrl.searchParams.set("amount", amount);
    }

    return {
      redirectUrl: frontendUrl.toString(),
      ...result,
    };
  },

  async handleCmiCallback(payload: Record<string, unknown>) {
    const result = await this.processCmiPaymentResult(payload);
    return {
      responseText: result.callbackResponse,
      ...result,
    };
  },

  async retryCmiPayment(payload: Record<string, unknown>, req: Request) {
    const orderId = String(payload.orderId ?? "").trim();
    const order =
      (await CustomerOrderModel.findOne({ orderId }).lean()) as
        | Record<string, unknown>
        | null;

    if (!order) {
      throw new AppError(404, "Order not found for payment retry.");
    }

    const subscriptionId = String(order.subscriptionId ?? "").trim();
    if (!verifyCmiRetryToken(payload.retryToken, orderId, subscriptionId)) {
      throw new AppError(403, "Payment retry link has expired. Please restart checkout.");
    }

    const paymentStatus = String(order.paymentStatus ?? "pending").trim().toLowerCase();
    if (paymentStatus === "paid") {
      throw new AppError(409, "This order has already been paid.");
    }

    const paymentBundle = buildCmiPaymentForOrder(order, req);
    const currentMeta = getObjectRecord(order.paymentMeta);
    const retryMeta = getObjectRecord(currentMeta.retry);
    const retryAttempts = Math.max(0, toSafeNumber(retryMeta.attempts, 0)) + 1;
    const nextPaymentMeta = mergePaymentMeta(order.paymentMeta, {
      approved: false,
      retry: {
        ...retryMeta,
        attempts: retryAttempts,
        lastRetriedAt: new Date().toISOString(),
      },
      request: paymentBundle.request,
    });

    await CustomerOrderModel.updateOne(
      { orderId, paymentStatus: { $ne: "paid" } },
      {
        $set: {
          paymentStatus: "pending",
          paymentMeta: nextPaymentMeta,
        },
      },
    );

    await OrderModel.updateOne(
      { orderId, payment: { $ne: "paid" } },
      {
        $set: {
          payment: "unpaid",
        },
        $push: {
          auditLog: {
            $each: [buildAuditEntry("Customer retried CMI payment")],
            $position: 0,
          },
        },
      },
    );

    return {
      order: {
        orderId,
        subscriptionId,
      },
      payment: paymentBundle.payment,
      message: "Redirecting to CMI for another secure payment attempt.",
    };
  },

  async processCmiPaymentResult(payload: Record<string, unknown>) {
    const responsePayload = normalizeGatewayPayload(payload);
    const orderId = String(
      responsePayload.ReturnOid || responsePayload.oid || "",
    ).trim();

    if (!orderId) {
      return {
        status: "failed" as const,
        message: "CMI did not return an order reference.",
        orderId: "",
        subscriptionId: "",
        callbackResponse: "FAILURE" as const,
      };
    }

    const existingOrder =
      (await CustomerOrderModel.findOne({ orderId }).lean()) as
        | Record<string, unknown>
        | null;

    if (!existingOrder) {
      return {
        status: "failed" as const,
        message: "Order not found for this CMI response.",
        orderId,
        subscriptionId: "",
        callbackResponse: "FAILURE" as const,
      };
    }

    const subscriptionId = String(existingOrder.subscriptionId ?? "").trim();
    const retryToken = createCmiRetryToken(orderId, subscriptionId);
    const paymentStatus = String(existingOrder.paymentStatus ?? "pending").trim();
    const storedTotals = getObjectRecord(existingOrder.totals);
    const displayAmount = Number(toSafeNumber(storedTotals.grandTotal, 0).toFixed(2));
    const hashVerified = verifyCmiResponseHash(responsePayload, env.CMI_STORE_KEY);
    const approved = hashVerified && isCmiApprovedResponse(responsePayload);
    const receivedAmount = toSafeNumber(responsePayload.amount, Number.NaN);
    const storedAmount = toSafeNumber(storedTotals.grandTotal, Number.NaN);
    const amountMatches =
      Number.isFinite(receivedAmount) &&
      Number.isFinite(storedAmount) &&
      receivedAmount.toFixed(2) === storedAmount.toFixed(2);
    const failureMessage = String(
      responsePayload.ErrMsg ||
        responsePayload.mdErrorMsg ||
        responsePayload.Response ||
        "Payment was not approved.",
    ).trim();
    const callbackResponse = hashVerified
      ? approved && amountMatches
        ? getCmiSuccessCallbackReply()
        : amountMatches
          ? "APPROVED"
          : "FAILURE"
      : "FAILURE";

    if (!amountMatches && paymentStatus !== "paid") {
      const mismatchMeta = mergePaymentMeta(existingOrder.paymentMeta, {
        approved: false,
        finalizedAt: new Date().toISOString(),
        hashVerified,
        response: responsePayload,
        amountMismatch: {
          expected: Number.isFinite(storedAmount) ? storedAmount : null,
          received: Number.isFinite(receivedAmount) ? receivedAmount : null,
        },
      });

      await CustomerOrderModel.updateOne(
        { orderId, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "failed",
            paymentMeta: mismatchMeta,
          },
        },
      );

      await OrderModel.updateOne(
        { orderId, payment: { $ne: "paid" } },
        {
          $set: {
            payment: "unpaid",
          },
          $push: {
            auditLog: {
              $each: [
                buildAuditEntry(
                  `Payment amount mismatch. Expected ${storedAmount.toFixed(2)}, received ${Number.isFinite(receivedAmount) ? receivedAmount.toFixed(2) : "N/A"}`,
                ),
              ],
              $position: 0,
            },
          },
        },
      );

      return {
        status: "failed" as const,
        message: "Payment amount did not match the order total. You were not charged. Please try the payment again.",
        orderId,
        subscriptionId,
        amount: displayAmount,
        retryToken,
        callbackResponse,
      };
    }

    if (approved) {
      const paidMeta = mergePaymentMeta(existingOrder.paymentMeta, {
        approved: true,
        finalizedAt: new Date().toISOString(),
        hashVerified: true,
        response: responsePayload,
      });

      await CustomerOrderModel.updateOne(
        { orderId },
        {
          $set: {
            paymentStatus: "paid",
            paymentMeta: paidMeta,
          },
        },
      );

      const latestOrder =
        ((await CustomerOrderModel.findOne({ orderId }).lean()) as
          | Record<string, unknown>
          | null) ?? existingOrder;

      await ensureSuccessfulCheckoutArtifacts(latestOrder, responsePayload);
      scheduleTransactionalEmailDelivery(`Customer order ${orderId}`, () =>
        sendCustomerOrderTransactionalEmailsOnce(orderId)
      );

      return {
        status: "success" as const,
        message: "Payment confirmed successfully.",
        orderId,
        subscriptionId,
        amount: displayAmount,
        callbackResponse,
      };
    }

    if (paymentStatus !== "paid") {
      const failedMeta = mergePaymentMeta(existingOrder.paymentMeta, {
        approved: false,
        finalizedAt: new Date().toISOString(),
        hashVerified,
        response: responsePayload,
      });

      await CustomerOrderModel.updateOne(
        { orderId, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "failed",
            paymentMeta: failedMeta,
          },
        },
      );

      await OrderModel.updateOne(
        { orderId, payment: { $ne: "paid" } },
        {
          $set: {
            payment: "unpaid",
          },
          $push: {
            auditLog: {
              $each: [
                buildAuditEntry(
                  hashVerified
                    ? `Payment failed: ${failureMessage || "declined"}`
                    : "Payment response failed hash verification",
                ),
              ],
              $position: 0,
            },
          },
        },
      );
    } else {
      await ensureSuccessfulCheckoutArtifacts(existingOrder, responsePayload);
      scheduleTransactionalEmailDelivery(`Customer order ${orderId}`, () =>
        sendCustomerOrderTransactionalEmailsOnce(orderId)
      );
      return {
        status: "success" as const,
        message: "Payment had already been confirmed earlier.",
        orderId,
        subscriptionId,
        amount: displayAmount,
        callbackResponse,
      };
    }

    return {
      status: "failed" as const,
      message: getFriendlyCmiFailureMessage(failureMessage, hashVerified),
      orderId,
      subscriptionId,
      amount: displayAmount,
      retryToken,
      callbackResponse,
    };
  },

  async createStoreOrder(payload: Record<string, unknown>) {
    const order = await StoreOrderModel.create({
      orderId: buildId("STORE-ORD"),
      ...payload,
      currency: "MAD",
    });

    scheduleTransactionalEmailDelivery(`Store order ${order.orderId}`, () =>
      sendStoreOrderTransactionalEmailsOnce(order.orderId)
    );

    return order;
  },
};
