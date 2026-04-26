import { AppError } from "../../common/utils/AppError";
import { normalizeImageInput } from "../../common/utils/cloudinary";
import { OrderModel, SubscriptionModel } from "../admin/admin.model";
import { adminService } from "../admin/admin.service";
import {
  ContactMessageModel,
  CustomerOrderModel,
  CustomerSubscriptionModel,
  StoreOrderModel
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
  const explicitHandle = typeof product.handle === "string" ? product.handle.trim() : "";
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
  return `$${toSafeNumber(value, 0).toFixed(2)}`;
}

function buildMenuItemDescription(product: Record<string, unknown>) {
  const segments: string[] = [];

  const description = typeof product.description === "string" ? product.description.trim() : "";
  if (description) {
    segments.push(description);
  } else {
    const category = typeof product.category === "string" ? product.category.trim() : "";
    if (category) segments.push(category);
  }

  const macroParts: string[] = [];
  if (typeof product.protein === "string" && product.protein.trim()) macroParts.push(`Proteins: ${product.protein.trim()}`);
  if (typeof product.carbs === "string" && product.carbs.trim()) macroParts.push(`Carbs: ${product.carbs.trim()}`);
  if (typeof product.fat === "string" && product.fat.trim()) macroParts.push(`Fat: ${product.fat.trim()}`);

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
  "privacy-policy": 7
};

export const publicService = {
  async listMenuCategories() {
    const [menuItemsRaw, productsRaw] = await Promise.all([adminService.listMenuItems(), adminService.listProducts()]);

    const productsBySku = new Map<string, Record<string, unknown>>();
    productsRaw.forEach((product) => {
      const sku = String((product as Record<string, unknown>).sku ?? "");
      if (sku) {
        productsBySku.set(sku, product as Record<string, unknown>);
      }
    });

    return menuItemsRaw
      .filter((menuItem) => String((menuItem as Record<string, unknown>).status ?? "Visible").toLowerCase() !== "hidden")
      .sort((a, b) => Number((a as Record<string, unknown>).priority ?? 0) - Number((b as Record<string, unknown>).priority ?? 0))
      .map((menuItem) => {
        const row = menuItem as Record<string, unknown>;
        const linkedSkus = Array.isArray(row.linkedProductSkus) ? row.linkedProductSkus : [];
        const categoryImage = normalizeImageInput(row.image);

        const items = linkedSkus
          .map((sku) => productsBySku.get(String(sku)))
          .filter((product): product is Record<string, unknown> => Boolean(product))
          .map((product) => ({
            id: String(product.sku ?? product.id ?? product._id ?? ""),
            name: String(product.name ?? product.title ?? ""),
            description: buildMenuItemDescription(product),
            priceMad: toPriceNumber(product.priceMad ?? product.price),
            calories: Number(product.kcal ?? 0),
            image: normalizeImageInput(product.image ?? product.imageUrl ?? categoryImage)
          }));

        return {
          categoryId: String(row.menuId ?? row._id ?? ""),
          name: String(row.title ?? row.menuId ?? "Menu"),
          description: String(row.title ?? ""),
          image: categoryImage,
          restaurants: toRestaurantList(row.restaurants),
          items
        };
      })
      .filter((category) => category.items.length > 0);
  },

  async listRestaurants() {
    const restaurants = await adminService.listRestaurants();

    return restaurants
      .filter((restaurant) => String((restaurant as Record<string, unknown>).status ?? "Active").toLowerCase() !== "inactive")
      .map((restaurant) => {
        const item = restaurant as Record<string, unknown>;
        return {
          restaurantId: String(item.restaurantId ?? item._id ?? ""),
          name: String(item.name ?? ""),
          address: String(item.address ?? ""),
          workingDays: Array.isArray(item.workingDays) ? item.workingDays.map((day) => String(day)) : [],
          openingHours: String(item.openingHours ?? ""),
          status: String(item.status ?? "Active")
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
    if (page.status !== "published") throw new AppError(404, "Website page not found");
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
        kind: page.kind
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
      eligibilityNote: result.promoCode.eligibilityNote
    };
  },

  async createContactMessage(payload: Record<string, unknown>) {
    return ContactMessageModel.create(payload);
  },

  async checkout(payload: Record<string, any>) {
    const subscriptionId = buildId("SUB");
    const orderId = buildId("ORD");

    const subscriptionPayload = payload.subscription ?? {};
    const orderPayload = payload.order ?? {};
    const customer = orderPayload.customer ?? {};
    const delivery = orderPayload.delivery ?? {};
    const selection = subscriptionPayload.selection ?? {};
    const totals = orderPayload.totals ?? {};
    const selectedMeals = Array.isArray(orderPayload.selectedMeals)
      ? orderPayload.selectedMeals
      : [];
    const submittedPromoCode = String(orderPayload.promoCode?.code ?? "").trim();

    const mealsPerDay = Math.max(1, toSafeNumber(selection.meals, 1));
    const daysPerWeek = Math.max(1, toSafeNumber(selection.days, 1));
    const totalWeeks = 4;
    const totalPlannedMeals = mealsPerDay * daysPerWeek * totalWeeks;
    const customerName = `${String(customer.firstName ?? "").trim()} ${String(
      customer.lastName ?? "",
    ).trim()}`.trim();
    const locationLabel =
      String(delivery.pickupLocation?.name ?? "").trim() ||
      String(customer.area ?? "").trim() ||
      String(customer.emirate ?? "").trim() ||
      "N/A";
    const subtotal = toSafeNumber(totals.subtotal, 0);
    const validatedPromoCode = submittedPromoCode
      ? await adminService.validatePromoCode(submittedPromoCode, "monthly-plan", subtotal)
      : null;
    const giftDiscount = validatedPromoCode?.discountAmount ?? 0;
    const vat = toSafeNumber(totals.vat, 0);
    const safetyBag = toSafeNumber(totals.safetyBag, 0);
    const grandTotal = Number((subtotal - giftDiscount + vat + safetyBag).toFixed(2));

    // Public-facing records used by checkout success and customer history.
    const subscription = await CustomerSubscriptionModel.create({
      subscriptionId,
      ...subscriptionPayload,
    });

    const order = await CustomerOrderModel.create({
      orderId,
      subscriptionId,
      ...orderPayload,
      promoCode: validatedPromoCode
        ? {
            code: validatedPromoCode.promoCode.code,
            discountAmount: giftDiscount
          }
        : undefined,
      totals: {
        subtotal,
        giftDiscount,
        vat,
        safetyBag,
        grandTotal
      }
    });

    // Admin-facing records so checkouts show in Admin Orders/Subscriptions pages.
    await SubscriptionModel.create({
      subscriptionId,
      client: customerName || "Customer",
      plan: String(subscriptionPayload.plan?.title ?? "Monthly Plan"),
      totalWeeks,
      currentWeek: 1,
      dayProgress: `0/${daysPerWeek}`,
      remainingMeals: totalPlannedMeals,
      status: "active",
      log: [
        `Checkout created on ${new Date().toLocaleString("en-US")}`,
        `Delivery option: ${String(delivery.optionId ?? "n/a")}`,
      ],
    });

    await OrderModel.create({
      orderId,
      client: customerName || "Customer",
      phone: String(customer.phone ?? "N/A"),
      status: "pending",
      confirmationStatus: "pending",
      plan: String(subscriptionPayload.plan?.title ?? "Monthly Plan"),
      orderType: toOrderType(delivery.optionId),
      location: locationLabel,
      deliveryAddress: String(delivery.address ?? ""),
      pickupLocation: String(delivery.pickupLocation?.name ?? ""),
      payment: "paid",
      schedule: String(delivery.optionId ?? ""),
      date: new Date().toISOString().split("T")[0],
      total: formatMoney(grandTotal),
      items: selectedMeals.map((item: Record<string, unknown>) => ({
        name: [String(item?.title ?? "Meal"), String(item?.extrasSummary ?? "").trim()]
          .filter(Boolean)
          .join(" | "),
        qty: 1,
        macros: `K:${toSafeNumber(item?.calories, 0)} P:${toSafeNumber(item?.protein, 0)} C:${toSafeNumber(item?.carb, 0)} F:${toSafeNumber(item?.fat, 0)}`
      })),
      notes: `Customer email: ${String(customer.email ?? "N/A")}${validatedPromoCode ? ` | Promo: ${validatedPromoCode.promoCode.code}` : ""}`,
      subscriptionId,
      subscriptionInfo: `${String(subscriptionPayload.plan?.id ?? "")} / ${String(
        delivery.optionId ?? "",
      )}`,
      subscriptionDetails: {
        daysPerWeek,
        durationWeeks: totalWeeks,
        meals: totalPlannedMeals,
      },
      auditLog: [
        {
          at: new Date().toLocaleString("en-US"),
          by: "Checkout API",
          action: "Order created"
        }
      ],
      promoCode: validatedPromoCode
        ? {
            code: validatedPromoCode.promoCode.code,
            discountAmount: giftDiscount
          }
        : undefined
    });

    if (validatedPromoCode) {
      await adminService.incrementPromoCodeUsage(validatedPromoCode.promoCode.id);
    }

    return {
      subscription,
      order,
      appliedPromoCode: validatedPromoCode
        ? {
            code: validatedPromoCode.promoCode.code,
            discountAmount: giftDiscount
          }
        : null
    };
  },

  async createStoreOrder(payload: Record<string, unknown>) {
    const order = await StoreOrderModel.create({
      orderId: buildId("STORE-ORD"),
      ...payload
    });

    return order;
  }
};
