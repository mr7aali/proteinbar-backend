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
function normalizeCustomer(customer) {
    return {
        firstName: String(customer.firstName ?? "").trim(),
        lastName: String(customer.lastName ?? "").trim(),
        email: String(customer.email ?? "").trim().toLowerCase(),
        phone: String(customer.phone ?? "").trim(),
        emirate: String(customer.emirate ?? "").trim(),
        area: String(customer.area ?? "").trim()
    };
}
function normalizeDelivery(delivery) {
    const pickupLocation = delivery.pickupLocation && typeof delivery.pickupLocation === "object"
        ? delivery.pickupLocation
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
function normalizeSelectedMeal(item) {
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
const websiteNavigationOrder = {
    home: 0,
    locations: 1,
    menu: 2,
    "about-us": 3,
    contact: 4,
    "meal-prep": 5,
    "terms-and-conditions": 6,
    "privacy-policy": 7,
};
exports.publicService = {
    async listMenuCategories() {
        const [menuItemsRaw, productsRaw] = await Promise.all([
            admin_service_1.adminService.listMenuItems(),
            admin_service_1.adminService.listProducts(),
        ]);
        const productsBySku = new Map();
        productsRaw.forEach((product) => {
            const sku = String(product.sku ?? "");
            if (sku) {
                productsBySku.set(sku, product);
            }
        });
        return menuItemsRaw
            .filter((menuItem) => String(menuItem.status ?? "Visible").toLowerCase() !== "hidden")
            .sort((a, b) => Number(a.priority ?? 0) -
            Number(b.priority ?? 0))
            .map((menuItem) => {
            const row = menuItem;
            const linkedSkus = Array.isArray(row.linkedProductSkus)
                ? row.linkedProductSkus
                : [];
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
                image: (0, cloudinary_1.normalizeImageInput)(product.image ?? product.imageUrl ?? categoryImage),
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
        const restaurants = await admin_service_1.adminService.listRestaurants();
        return restaurants
            .filter((restaurant) => String(restaurant.status ?? "Active").toLowerCase() !== "inactive")
            .map((restaurant) => {
            const item = restaurant;
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
    async getWebsitePage(slug) {
        const page = await admin_service_1.adminService.getWebsitePageBySlug(slug.trim());
        if (page.status !== "published")
            throw new AppError_1.AppError(404, "Website page not found");
        return page;
    },
    async listWebsiteNavigation() {
        const pages = await admin_service_1.adminService.listWebsitePages();
        return pages
            .filter((page) => page.status === "published" && page.showInTopNav)
            .sort((a, b) => {
            const left = websiteNavigationOrder[a.slug] ?? Number.MAX_SAFE_INTEGER;
            const right = websiteNavigationOrder[b.slug] ?? Number.MAX_SAFE_INTEGER;
            if (left !== right)
                return left - right;
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
        return admin_service_1.adminService.listIngredients();
    },
    async validatePromoCode(payload) {
        const code = String(payload.code ?? "");
        const scope = String(payload.scope ?? "monthly-plan") === "direct-order"
            ? "direct-order"
            : "monthly-plan";
        const subtotal = toSafeNumber(payload.subtotal, 0);
        const result = await admin_service_1.adminService.validatePromoCode(code, scope, subtotal);
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
    async createContactMessage(payload) {
        return public_model_1.ContactMessageModel.create(payload);
    },
    async checkout(payload) {
        const subscriptionId = buildId("SUB");
        const orderId = buildId("ORD");
        const subscriptionPayload = payload.subscription && typeof payload.subscription === "object"
            ? payload.subscription
            : {};
        const orderPayload = payload.order && typeof payload.order === "object" ? payload.order : {};
        const selection = subscriptionPayload.selection &&
            typeof subscriptionPayload.selection === "object"
            ? subscriptionPayload.selection
            : {};
        const rawCustomer = orderPayload.customer && typeof orderPayload.customer === "object"
            ? orderPayload.customer
            : {};
        const rawDelivery = orderPayload.delivery && typeof orderPayload.delivery === "object"
            ? orderPayload.delivery
            : subscriptionPayload.delivery &&
                typeof subscriptionPayload.delivery === "object"
                ? subscriptionPayload.delivery
                : {};
        const totals = orderPayload.totals && typeof orderPayload.totals === "object"
            ? orderPayload.totals
            : {};
        const selectedMealsSource = Array.isArray(orderPayload.selectedMeals)
            ? orderPayload.selectedMeals
            : Array.isArray(selection.selectedMeals)
                ? selection.selectedMeals
                : [];
        const customer = normalizeCustomer(rawCustomer);
        const delivery = normalizeDelivery(rawDelivery);
        const selectedMeals = selectedMealsSource
            .filter((item) => Boolean(item) && typeof item === "object")
            .map(normalizeSelectedMeal)
            .filter((item) => item.id && item.title);
        const submittedPromoCode = String(orderPayload.promoCode?.code ?? "").trim();
        const mealsPerDay = Math.max(1, toSafeNumber(selection.meals, 1));
        const daysPerWeek = Math.max(1, toSafeNumber(selection.days, 1));
        const totalWeeks = 4;
        const totalPlannedMeals = mealsPerDay * daysPerWeek * totalWeeks;
        const customerName = `${customer.firstName} ${customer.lastName}`.trim();
        const locationLabel = delivery.pickupLocation.name ||
            customer.area ||
            customer.emirate ||
            "N/A";
        const subtotal = toSafeNumber(totals.subtotal, 0);
        const validatedPromoCode = submittedPromoCode
            ? await admin_service_1.adminService.validatePromoCode(submittedPromoCode, "monthly-plan", subtotal)
            : null;
        const giftDiscount = validatedPromoCode?.discountAmount ?? 0;
        const vat = toSafeNumber(totals.vat, 0);
        const safetyBag = toSafeNumber(totals.safetyBag, 0);
        const grandTotal = Number((subtotal - giftDiscount + vat + safetyBag).toFixed(2));
        // Public-facing records used by checkout success and customer history.
        const subscription = await public_model_1.CustomerSubscriptionModel.create({
            subscriptionId,
            rawPayload: payload,
            customer,
            plan: {
                id: String(subscriptionPayload.plan?.id ?? "").trim(),
                title: String(subscriptionPayload.plan?.title ?? "").trim(),
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
        });
        const order = await public_model_1.CustomerOrderModel.create({
            orderId,
            subscriptionId,
            rawPayload: payload,
            customer,
            delivery,
            selectedMeals,
            promoCode: validatedPromoCode
                ? {
                    code: validatedPromoCode.promoCode.code,
                    discountAmount: giftDiscount,
                }
                : undefined,
            totals: {
                subtotal,
                giftDiscount,
                vat,
                safetyBag,
                grandTotal,
            },
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
            customerEmail: String(customer.email ?? ""),
            customerEmirate: String(customer.emirate ?? ""),
            customerArea: String(customer.area ?? ""),
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
            items: selectedMeals.map((item) => ({
                name: [
                    item.title || "Meal",
                    item.extrasSummary,
                ]
                    .filter(Boolean)
                    .join(" | "),
                qty: 1,
                macros: `K:${item.calories} P:${item.protein} C:${item.carb} F:${item.fat}`,
            })),
            notes: `Customer email: ${customer.email || "N/A"}${validatedPromoCode ? ` | Promo: ${validatedPromoCode.promoCode.code}` : ""}`,
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
                    action: "Order created",
                },
            ],
            promoCode: validatedPromoCode
                ? {
                    code: validatedPromoCode.promoCode.code,
                    discountAmount: giftDiscount,
                }
                : undefined,
        });
        if (validatedPromoCode) {
            await admin_service_1.adminService.incrementPromoCodeUsage(validatedPromoCode.promoCode.id);
        }
        return {
            subscription,
            order,
            appliedPromoCode: validatedPromoCode
                ? {
                    code: validatedPromoCode.promoCode.code,
                    discountAmount: giftDiscount,
                }
                : null,
        };
    },
    async createStoreOrder(payload) {
        const order = await public_model_1.StoreOrderModel.create({
            orderId: buildId("STORE-ORD"),
            ...payload,
        });
        return order;
    },
};
