"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicService = void 0;
const AppError_1 = require("../../common/utils/AppError");
const admin_service_1 = require("../admin/admin.service");
const public_model_1 = require("./public.model");
function buildId(prefix) {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${Date.now()}-${random}`;
}
function toSlug(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function toProductHandle(product) {
    const explicitHandle = typeof product.handle === "string" ? product.handle.trim() : "";
    if (explicitHandle)
        return explicitHandle;
    const sku = typeof product.sku === "string" ? product.sku.trim() : "";
    if (sku)
        return toSlug(sku);
    const name = typeof product.name === "string" ? product.name : "";
    return toSlug(name) || "product";
}
function toPriceNumber(value) {
    if (typeof value === "number")
        return value;
    if (typeof value !== "string")
        return 0;
    const normalized = value.replace(/[^0-9.]+/g, "");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}
function buildMenuItemDescription(product) {
    const segments = [];
    const description = typeof product.description === "string" ? product.description.trim() : "";
    if (description) {
        segments.push(description);
    }
    else {
        const category = typeof product.category === "string" ? product.category.trim() : "";
        if (category)
            segments.push(category);
    }
    const macroParts = [];
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
exports.publicService = {
    async listMenuCategories() {
        const [menuItemsRaw, productsRaw] = await Promise.all([admin_service_1.adminService.listMenuItems(), admin_service_1.adminService.listProducts()]);
        const productsBySku = new Map();
        productsRaw.forEach((product) => {
            const sku = String(product.sku ?? "");
            if (sku) {
                productsBySku.set(sku, product);
            }
        });
        return menuItemsRaw
            .filter((menuItem) => String(menuItem.status ?? "Visible").toLowerCase() !== "hidden")
            .sort((a, b) => Number(a.priority ?? 0) - Number(b.priority ?? 0))
            .map((menuItem) => {
            const row = menuItem;
            const linkedSkus = Array.isArray(row.linkedProductSkus) ? row.linkedProductSkus : [];
            const items = linkedSkus
                .map((sku) => productsBySku.get(String(sku)))
                .filter((product) => Boolean(product))
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
        return admin_service_1.adminService.listPublicMonthlyPlans();
    },
    async getMonthlyPlanById(planId) {
        return admin_service_1.adminService.getPublicMonthlyPlanById(planId.trim());
    },
    async listProducts() {
        return admin_service_1.adminService.listProducts();
    },
    async getProductByHandle(handle) {
        const normalizedHandle = handle.trim().toLowerCase();
        const rows = await admin_service_1.adminService.listProducts();
        const row = rows.find((product) => {
            const source = product;
            return toProductHandle(source).toLowerCase() === normalizedHandle;
        });
        if (!row)
            throw new AppError_1.AppError(404, "Product not found");
        return row;
    },
    async listLocations() {
        return admin_service_1.adminService.listLocations();
    },
    async listBuilderIngredients() {
        return admin_service_1.adminService.listIngredients();
    },
    async createContactMessage(payload) {
        return public_model_1.ContactMessageModel.create(payload);
    },
    async checkout(payload) {
        const subscriptionId = buildId("SUB");
        const orderId = buildId("ORD");
        const subscription = await public_model_1.CustomerSubscriptionModel.create({
            subscriptionId,
            ...payload.subscription
        });
        const order = await public_model_1.CustomerOrderModel.create({
            orderId,
            subscriptionId,
            ...payload.order
        });
        return {
            subscription,
            order
        };
    },
    async createStoreOrder(payload) {
        const order = await public_model_1.StoreOrderModel.create({
            orderId: buildId("STORE-ORD"),
            ...payload
        });
        return order;
    }
};
