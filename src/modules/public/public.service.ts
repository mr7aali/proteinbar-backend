import { AppError } from "../../common/utils/AppError";
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

        const items = linkedSkus
          .map((sku) => productsBySku.get(String(sku)))
          .filter((product): product is Record<string, unknown> => Boolean(product))
          .map((product) => ({
            id: String(product.sku ?? product.id ?? product._id ?? ""),
            name: String(product.name ?? product.title ?? ""),
            description: buildMenuItemDescription(product),
            priceMad: toPriceNumber(product.priceMad ?? product.price),
            calories: Number(product.kcal ?? 0)
          }));

        return {
          categoryId: String(row.menuId ?? row._id ?? ""),
          name: String(row.title ?? row.menuId ?? "Menu"),
          description: String(row.title ?? ""),
          items
        };
      })
      .filter((category) => category.items.length > 0);
  },

  async listMonthlyPlans() {
    return adminService.listMonthlyPlans();
  },

  async getMonthlyPlanById(planId: string) {
    const normalizedPlanId = planId.trim().toLowerCase();
    const rows = await adminService.listMonthlyPlans();
    const row = rows.find((plan) => {
      const source = plan as Record<string, unknown>;
      return [source.planId, source.id, source._id].some((value) => String(value ?? "").toLowerCase() === normalizedPlanId);
    });

    if (!row) throw new AppError(404, "Monthly plan not found");
    return row;
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

  async listBuilderIngredients() {
    return adminService.listIngredients();
  },

  async createContactMessage(payload: Record<string, unknown>) {
    return ContactMessageModel.create(payload);
  },

  async checkout(payload: Record<string, any>) {
    const subscriptionId = buildId("SUB");
    const orderId = buildId("ORD");

    const subscription = await CustomerSubscriptionModel.create({
      subscriptionId,
      ...payload.subscription
    });

    const order = await CustomerOrderModel.create({
      orderId,
      subscriptionId,
      ...payload.order
    });

    return {
      subscription,
      order
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
