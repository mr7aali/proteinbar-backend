"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicService = void 0;
const AppError_1 = require("../../common/utils/AppError");
const cloudinary_1 = require("../../common/utils/cloudinary");
const admin_model_1 = require("../admin/admin.model");
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
function toSafeNumber(value, fallback = 0) {
    const parsed = typeof value === "number"
        ? value
        : typeof value === "string"
            ? Number.parseFloat(value)
            : Number.NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
}
function toOrderType(optionId) {
    const normalized = String(optionId ?? "").toLowerCase();
    return normalized.includes("pickup") ? "Pickup" : "Delivery";
}
function formatMoney(value) {
    return `$${toSafeNumber(value, 0).toFixed(2)}`;
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
function toRestaurantList(value) {
    if (!Array.isArray(value))
        return [];
    const seen = new Set();
    return value.reduce((acc, item) => {
        const normalized = String(item ?? "").trim();
        const key = normalized.toLowerCase();
        if (!normalized || seen.has(key))
            return acc;
        seen.add(key);
        acc.push(normalized);
        return acc;
    }, []);
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
            const categoryImage = (0, cloudinary_1.normalizeImageInput)(row.image);
            const items = linkedSkus
                .map((sku) => productsBySku.get(String(sku)))
                .filter((product) => Boolean(product))
                .map((product) => ({
                id: String(product.sku ?? product.id ?? product._id ?? ""),
                name: String(product.name ?? product.title ?? ""),
                description: buildMenuItemDescription(product),
                priceMad: toPriceNumber(product.priceMad ?? product.price),
                calories: Number(product.kcal ?? 0),
                image: (0, cloudinary_1.normalizeImageInput)(product.image ?? product.imageUrl ?? categoryImage)
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
        const restaurants = await admin_service_1.adminService.listRestaurants();
        return restaurants
            .filter((restaurant) => String(restaurant.status ?? "Active").toLowerCase() !== "inactive")
            .map((restaurant) => {
            const item = restaurant;
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
        const subscriptionPayload = payload.subscription ?? {};
        const orderPayload = payload.order ?? {};
        const customer = orderPayload.customer ?? {};
        const delivery = orderPayload.delivery ?? {};
        const selection = subscriptionPayload.selection ?? {};
        const totals = orderPayload.totals ?? {};
        const selectedMeals = Array.isArray(orderPayload.selectedMeals)
            ? orderPayload.selectedMeals
            : [];
        const mealsPerDay = Math.max(1, toSafeNumber(selection.meals, 1));
        const daysPerWeek = Math.max(1, toSafeNumber(selection.days, 1));
        const totalWeeks = 4;
        const totalPlannedMeals = mealsPerDay * daysPerWeek * totalWeeks;
        const customerName = `${String(customer.firstName ?? "").trim()} ${String(customer.lastName ?? "").trim()}`.trim();
        const locationLabel = String(delivery.pickupLocation?.name ?? "").trim() ||
            String(customer.area ?? "").trim() ||
            String(customer.emirate ?? "").trim() ||
            "N/A";
        // Public-facing records used by checkout success and customer history.
        const subscription = await public_model_1.CustomerSubscriptionModel.create({
            subscriptionId,
            ...subscriptionPayload,
        });
        const order = await public_model_1.CustomerOrderModel.create({
            orderId,
            subscriptionId,
            ...orderPayload,
        });
        // Admin-facing records so checkouts show in Admin Orders/Subscriptions pages.
        await admin_model_1.SubscriptionModel.create({
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
        await admin_model_1.OrderModel.create({
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
            total: formatMoney(totals.grandTotal),
            items: selectedMeals.map((item) => ({
                name: String(item?.title ?? "Meal"),
                qty: 1,
                macros: "-"
            })),
            notes: `Customer email: ${String(customer.email ?? "N/A")}`,
            subscriptionId,
            subscriptionInfo: `${String(subscriptionPayload.plan?.id ?? "")} / ${String(delivery.optionId ?? "")}`,
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
            ]
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
