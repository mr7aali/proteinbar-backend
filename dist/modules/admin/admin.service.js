"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
const AppError_1 = require("../../common/utils/AppError");
const admin_model_1 = require("./admin.model");
function normalizePlanDetailsPayload(payload) {
    const now = new Date().toISOString();
    const weekAssignments = Array.isArray(payload.weekAssignments) ? payload.weekAssignments : [];
    const planKind = payload.plan.planKind === "custom" ? "custom" : "normal";
    const normalizedPlan = {
        ...payload.plan,
        id: payload.plan.id,
        planKind,
        status: payload.plan.status ?? "draft",
        title: String(payload.plan.title ?? ""),
        description: String(payload.plan.description ?? ""),
        updatedAt: now,
        createdAt: String(payload.plan.createdAt ?? now),
        weekAssignmentIds: weekAssignments
            .map((item) => String(item.id ?? ""))
            .filter(Boolean)
    };
    return {
        plan: normalizedPlan,
        rules: payload.rules,
        pricing: payload.pricing,
        weekAssignments
    };
}
function toMonthlyPlanDetailsPayload(row) {
    return {
        plan: row.plan ?? { id: String(row.planId ?? "") },
        rules: row.rules ?? {},
        pricing: row.pricing ?? {},
        weekAssignments: row.weekAssignments ?? []
    };
}
function toMealLibraryItem(row) {
    return {
        id: String(row.mealId ?? row.id ?? ""),
        name: String(row.name ?? ""),
        mealType: String(row.mealType ?? ""),
        calories: Number(row.calories ?? 0),
        protein: Number(row.protein ?? 0),
        carbs: Number(row.carbs ?? 0),
        fat: Number(row.fat ?? 0),
        tags: Array.isArray(row.tags) ? row.tags.map((item) => String(item)) : [],
        status: String(row.status ?? "active") === "inactive" ? "inactive" : "active",
        image: String(row.image ?? "")
    };
}
function toPlanStatus(value) {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (normalized === "active" || normalized === "inactive" || normalized === "archived" || normalized === "draft") {
        return normalized;
    }
    return "draft";
}
function buildDefaultMonthlyPlanDetails(raw) {
    const id = String(raw.planId ?? raw.id ?? "");
    const title = String(raw.name ?? raw.title ?? "Monthly Plan");
    const description = String(raw.description ?? "");
    const image = String(raw.imageUrl ?? raw.image ?? "");
    const isCustom = String(raw.type ?? "").trim().toLowerCase() === "custom" ||
        id.toLowerCase().includes("custom") ||
        title.toLowerCase().includes("custom");
    const planKind = isCustom ? "custom" : "normal";
    const createdAt = String(raw.createdAt ?? new Date().toISOString());
    const updatedAt = String(raw.updatedAt ?? createdAt);
    const ruleConfigId = `rule-${id}`;
    const pricingConfigId = `pricing-${id}`;
    return {
        plan: {
            id,
            slug: toSlug(title) || id,
            title,
            description,
            image,
            badge: Boolean(raw.isNew) ? "NEW" : "",
            status: toPlanStatus(raw.status),
            planKind,
            createdAt,
            updatedAt,
            ruleConfigId,
            pricingConfigId,
            content: {
                heroTitle: title,
                heroSubtitle: description,
                selectMealsText: "Select meals for your plan.",
                checkoutText: "Review your selection and complete checkout."
            },
            weekAssignmentIds: []
        },
        rules: {
            id: ruleConfigId,
            planId: id,
            allowedMealsPerDay: [1, 2, 3],
            allowedDays: [3, 4, 5, 6],
            allowedSnacks: [0, 1, 2],
            planTypeOptions: planKind === "custom" ? ["lose-weight", "gain-weight"] : [],
            deliveryDaysRule: {
                min: 2,
                max: 6,
                allowedWeekDays: [0, 1, 2, 3, 4, 5, 6]
            },
            defaults: {
                meals: 3,
                days: 5,
                snacks: 0,
                planType: planKind === "custom" ? "lose-weight" : undefined,
                deliveryDays: [1, 3, 5]
            },
            deliveryOptionConfigs: [
                { option: "daily-delivery", enabled: true, label: "Daily Delivery", serviceFee: 0, minDays: 2, maxDays: 7 },
                { option: "daily-pickup", enabled: true, label: "Daily Pickup", serviceFee: 0, minDays: 2, maxDays: 7 },
                { option: "weekly-delivery", enabled: true, label: "Weekly Delivery", serviceFee: 0, minDays: 2, maxDays: 7 },
                { option: "weekly-pickup", enabled: true, label: "Weekly Pickup", serviceFee: 0, minDays: 2, maxDays: 7 }
            ]
        },
        pricing: {
            id: pricingConfigId,
            planId: id,
            basePriceFormula: {
                baseFee: 100,
                pricePerMeal: 5,
                dayMultiplier: 1
            },
            snacksAddonPrice: 2,
            vatPercent: 15,
            safetyBagFee: 2,
            giftCodeRule: {
                type: "percent",
                value: 10,
                maxDiscount: 20,
                enabled: true
            }
        },
        weekAssignments: []
    };
}
async function ensureMonthlyPlanDetails(planId) {
    const existing = await admin_model_1.MonthlyPlanDetailsModel.findOne({ planId }).lean();
    if (existing)
        return existing;
    const legacy = await admin_model_1.MonthlyPlanModel.findOne({
        $or: [{ planId }, { _id: planId }]
    }).lean();
    if (!legacy)
        return null;
    const payload = buildDefaultMonthlyPlanDetails(legacy);
    const normalized = normalizePlanDetailsPayload(payload);
    const created = await admin_model_1.MonthlyPlanDetailsModel.create({
        planId: normalized.plan.id,
        planKind: normalized.plan.planKind,
        status: normalized.plan.status,
        title: normalized.plan.title,
        description: normalized.plan.description,
        plan: normalized.plan,
        rules: normalized.rules,
        pricing: normalized.pricing,
        weekAssignments: normalized.weekAssignments
    });
    return created.toObject();
}
const defaultPlanFlows = [
    {
        flowType: "custom",
        steps: [
            { step: "Step 1", title: "Set number of meals" },
            { step: "Step 2", title: "Set number of days" },
            { step: "Step 3", title: "Set number of snacks" },
            { step: "Step 4", title: "Pick start date" },
            { step: "Step 5", title: "Choose delivery or pickup days" },
            { step: "Step 6", title: "Select meals for each slot" },
            { step: "Step 7", title: "Optional: Build a fully custom meal and add to plan" }
        ]
    },
    {
        flowType: "preset",
        steps: [
            { step: "Step 1", title: "Pick preset plan type" },
            { step: "Step 2", title: "Review included meal structure (breakfast/lunch/dinner)" },
            { step: "Step 3", title: "Select available meals from that preset plan" },
            { step: "Step 4", title: "Pick start date and delivery or pickup days" },
            { step: "Step 5", title: "Proceed to checkout" }
        ]
    }
];
const planFlowOrder = {
    custom: 0,
    preset: 1
};
function toSlug(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
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
function formatProduct(raw) {
    const sku = String(raw.sku ?? "");
    const name = String(raw.name ?? "");
    return {
        ...raw,
        id: String(raw._id ?? raw.id ?? ""),
        sku,
        handle: toSlug(sku || name) || "product",
        title: name,
        description: String(raw.description ?? raw.category ?? ""),
        priceMad: toPriceNumber(raw.priceMad ?? raw.price),
        image: String(raw.image ?? raw.imageUrl ?? "")
    };
}
async function ensurePlanFlowsSeeded() {
    const existing = await admin_model_1.PlanFlowModel.find({}, { flowType: 1 }).lean();
    const existingTypes = new Set(existing.map((row) => String(row.flowType)));
    const missing = defaultPlanFlows.filter((flow) => !existingTypes.has(flow.flowType));
    if (missing.length > 0) {
        await admin_model_1.PlanFlowModel.insertMany(missing);
    }
}
exports.adminService = {
    async getDashboard() {
        const [ordersCount, productsCount, menuCount, subscribers] = await Promise.all([
            admin_model_1.OrderModel.countDocuments(),
            admin_model_1.ProductModel.countDocuments(),
            admin_model_1.MenuItemModel.countDocuments({ status: "Visible" }),
            admin_model_1.SubscriptionModel.countDocuments({ status: "Active" })
        ]);
        const latestOrdersRaw = await admin_model_1.OrderModel.find().sort({ createdAt: -1 }).limit(5).lean();
        const latestOrders = latestOrdersRaw.map((o) => ({
            id: o.orderId,
            customer: o.client,
            amount: o.total,
            status: o.status,
            date: o.date
        }));
        return {
            dashboardStats: [
                { title: "Today Orders", value: String(ordersCount) },
                { title: "Daily Production", value: `${ordersCount * 1.5} Meals` },
                { title: "Active Menu Cards", value: String(menuCount) },
                { title: "Active Subscribers", value: String(subscribers) }
            ],
            latestOrders
        };
    },
    async listProducts() {
        const rows = await admin_model_1.ProductModel.find().sort({ createdAt: -1 }).lean();
        return rows.map((row) => formatProduct(row));
    },
    async createProduct(payload) {
        const row = await admin_model_1.ProductModel.create(payload);
        return formatProduct(row.toObject());
    },
    async updateProduct(id, payload) {
        const row = await admin_model_1.ProductModel.findByIdAndUpdate(id, payload, { new: true });
        if (!row)
            throw new AppError_1.AppError(404, "Product not found");
        return formatProduct(row.toObject());
    },
    async deleteProduct(id) {
        const row = await admin_model_1.ProductModel.findByIdAndDelete(id);
        if (!row)
            throw new AppError_1.AppError(404, "Product not found");
    },
    async listMenuItems() {
        return admin_model_1.MenuItemModel.find().sort({ priority: 1, createdAt: -1 }).lean();
    },
    async createMenuItem(payload) {
        return admin_model_1.MenuItemModel.create(payload);
    },
    async updateMenuItem(id, payload) {
        const row = await admin_model_1.MenuItemModel.findByIdAndUpdate(id, payload, { new: true });
        if (!row)
            throw new AppError_1.AppError(404, "Menu item not found");
        return row;
    },
    async deleteMenuItem(id) {
        const row = await admin_model_1.MenuItemModel.findByIdAndDelete(id);
        if (!row)
            throw new AppError_1.AppError(404, "Menu item not found");
    },
    async listLocations() {
        return admin_model_1.LocationModel.find().sort({ createdAt: -1 }).lean();
    },
    async createLocation(payload) {
        return admin_model_1.LocationModel.create(payload);
    },
    async updateLocation(id, payload) {
        const row = await admin_model_1.LocationModel.findByIdAndUpdate(id, payload, { new: true });
        if (!row)
            throw new AppError_1.AppError(404, "Location not found");
        return row;
    },
    async deleteLocation(id) {
        const row = await admin_model_1.LocationModel.findByIdAndDelete(id);
        if (!row)
            throw new AppError_1.AppError(404, "Location not found");
    },
    async listMonthlyPlans() {
        return admin_model_1.MonthlyPlanModel.find().sort({ createdAt: -1 }).lean();
    },
    async createMonthlyPlan(payload) {
        return admin_model_1.MonthlyPlanModel.create(payload);
    },
    async updateMonthlyPlan(id, payload) {
        const row = await admin_model_1.MonthlyPlanModel.findByIdAndUpdate(id, payload, { new: true });
        if (!row)
            throw new AppError_1.AppError(404, "Plan not found");
        return row;
    },
    async deleteMonthlyPlan(id) {
        const row = await admin_model_1.MonthlyPlanModel.findByIdAndDelete(id);
        if (!row)
            throw new AppError_1.AppError(404, "Plan not found");
    },
    async getMonthlyPlanOverview() {
        const [plans, subscriptionsRaw, ordersRaw, activeMeals] = await Promise.all([
            admin_model_1.MonthlyPlanDetailsModel.find().lean(),
            admin_model_1.SubscriptionModel.find({}, { status: 1 }).lean(),
            admin_model_1.OrderModel.find({}, { status: 1 }).lean(),
            admin_model_1.MealLibraryItemModel.countDocuments({ status: "active" })
        ]);
        const activePlans = plans.filter((plan) => String(plan.status ?? "").toLowerCase() === "active").length;
        const customPlans = plans.filter((plan) => String(plan.planKind ?? "").toLowerCase() === "custom").length;
        const normalPlans = plans.filter((plan) => String(plan.planKind ?? "").toLowerCase() === "normal").length;
        const activeSubscriptions = subscriptionsRaw.filter((item) => String(item.status ?? "").toLowerCase() === "active").length;
        const pendingOrders = ordersRaw.filter((item) => String(item.status ?? "").toLowerCase() === "pending").length;
        return {
            activePlans,
            customPlans,
            normalPlans,
            activeSubscriptions,
            pendingOrders,
            activeMeals
        };
    },
    async listMonthlyPlanAdmin(filters) {
        const query = {};
        if (filters.kind && filters.kind !== "all")
            query.planKind = filters.kind;
        if (filters.status && filters.status !== "all")
            query.status = filters.status;
        const search = String(filters.search ?? "").trim();
        if (search) {
            query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
        }
        const rows = await admin_model_1.MonthlyPlanDetailsModel.find(query).sort({ updatedAt: -1 }).lean();
        if (rows.length > 0) {
            return rows.map((row) => toMonthlyPlanDetailsPayload(row).plan);
        }
        const legacyRows = await admin_model_1.MonthlyPlanModel.find().sort({ createdAt: -1 }).lean();
        const migrated = [];
        for (const legacyRow of legacyRows) {
            const legacyRecord = legacyRow;
            const legacyPlanId = String(legacyRecord.planId ?? legacyRecord.id ?? "");
            if (!legacyPlanId)
                continue;
            const detailsRow = await ensureMonthlyPlanDetails(legacyPlanId);
            if (detailsRow) {
                migrated.push(toMonthlyPlanDetailsPayload(detailsRow).plan);
            }
        }
        return migrated.filter((plan) => {
            const kind = String(plan.planKind ?? "");
            const status = String(plan.status ?? "");
            const text = `${String(plan.title ?? "")} ${String(plan.description ?? "")}`.toLowerCase();
            const matchKind = !filters.kind || filters.kind === "all" || kind === filters.kind;
            const matchStatus = !filters.status || filters.status === "all" || status === filters.status;
            const matchSearch = !search || text.includes(search.toLowerCase());
            return matchKind && matchStatus && matchSearch;
        });
    },
    async getMonthlyPlanDetails(planId) {
        const row = (await ensureMonthlyPlanDetails(planId)) ?? (await admin_model_1.MonthlyPlanDetailsModel.findOne({ planId }).lean());
        if (!row)
            throw new AppError_1.AppError(404, "Plan not found");
        return toMonthlyPlanDetailsPayload(row);
    },
    async upsertMonthlyPlanDetails(payload) {
        const normalized = normalizePlanDetailsPayload(payload);
        const planId = normalized.plan.id;
        if (!planId)
            throw new AppError_1.AppError(400, "Plan id is required");
        const row = await admin_model_1.MonthlyPlanDetailsModel.findOneAndUpdate({ planId }, {
            planId,
            planKind: normalized.plan.planKind,
            status: normalized.plan.status,
            title: normalized.plan.title,
            description: normalized.plan.description,
            plan: normalized.plan,
            rules: normalized.rules,
            pricing: normalized.pricing,
            weekAssignments: normalized.weekAssignments
        }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
        await admin_model_1.MonthlyPlanModel.findOneAndUpdate({ planId }, {
            planId,
            name: normalized.plan.title,
            basePrice: String(normalized.pricing.basePriceFormula?.baseFee ?? "0"),
            status: String(normalized.plan.status ?? "Active"),
            description: normalized.plan.description,
            imageUrl: String(normalized.plan.image ?? ""),
            isNew: Boolean(normalized.plan.badge)
        }, { upsert: true, setDefaultsOnInsert: true });
        return toMonthlyPlanDetailsPayload(row);
    },
    async archiveMonthlyPlan(planId) {
        const row = await admin_model_1.MonthlyPlanDetailsModel.findOneAndUpdate({ planId }, {
            status: "archived",
            "plan.status": "archived",
            "plan.updatedAt": new Date().toISOString()
        }, { new: true }).lean();
        if (!row)
            throw new AppError_1.AppError(404, "Plan not found");
        await admin_model_1.MonthlyPlanModel.findOneAndUpdate({ planId }, { status: "Archived" });
        return {
            id: planId,
            status: "archived"
        };
    },
    async listMealLibraryAdmin() {
        const rows = await admin_model_1.MealLibraryItemModel.find().sort({ name: 1 }).lean();
        return rows.map((row) => toMealLibraryItem(row));
    },
    async upsertMealLibraryAdmin(payload) {
        const row = await admin_model_1.MealLibraryItemModel.findOneAndUpdate({ mealId: payload.id }, {
            mealId: payload.id,
            name: payload.name.trim(),
            mealType: payload.mealType,
            calories: Number(payload.calories),
            protein: Number(payload.protein),
            carbs: Number(payload.carbs),
            fat: Number(payload.fat),
            tags: payload.tags ?? [],
            status: payload.status,
            image: payload.image ?? ""
        }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
        return toMealLibraryItem(row);
    },
    async deleteMealLibraryAdmin(id) {
        const row = await admin_model_1.MealLibraryItemModel.findOneAndDelete({ mealId: id });
        if (!row)
            throw new AppError_1.AppError(404, "Meal not found");
    },
    async listPublicMonthlyPlans() {
        const rows = await admin_model_1.MonthlyPlanDetailsModel.find({ status: "active" }).sort({ updatedAt: -1 }).lean();
        if (rows.length > 0) {
            return rows.map((row) => toMonthlyPlanDetailsPayload(row).plan);
        }
        const legacyRows = await admin_model_1.MonthlyPlanModel.find().sort({ createdAt: -1 }).lean();
        const plans = [];
        for (const legacyRow of legacyRows) {
            const legacyRecord = legacyRow;
            const legacyPlanId = String(legacyRecord.planId ?? legacyRecord.id ?? "");
            if (!legacyPlanId)
                continue;
            const migrated = await ensureMonthlyPlanDetails(legacyPlanId);
            if (!migrated)
                continue;
            const plan = toMonthlyPlanDetailsPayload(migrated).plan;
            if (String(plan.status ?? "") === "active") {
                plans.push(plan);
            }
        }
        return plans;
    },
    async getPublicMonthlyPlanById(planId) {
        const row = (await ensureMonthlyPlanDetails(planId)) ?? (await admin_model_1.MonthlyPlanDetailsModel.findOne({ planId }).lean());
        if (!row)
            throw new AppError_1.AppError(404, "Monthly plan not found");
        const details = toMonthlyPlanDetailsPayload(row);
        if (String(details.plan.status ?? "") !== "active") {
            throw new AppError_1.AppError(404, "Monthly plan not found");
        }
        const mealRows = await admin_model_1.MealLibraryItemModel.find({ status: "active" }).lean();
        return {
            ...details,
            mealLibrary: mealRows.map((item) => toMealLibraryItem(item))
        };
    },
    async listPlanFlows() {
        await ensurePlanFlowsSeeded();
        const rows = await admin_model_1.PlanFlowModel.find().lean();
        return rows.sort((a, b) => (planFlowOrder[String(a.flowType)] ?? 9) - (planFlowOrder[String(b.flowType)] ?? 9));
    },
    async updatePlanFlow(flowType, payload) {
        const normalizedSteps = payload.steps.map((step, index) => ({
            step: step.step?.trim() || `Step ${index + 1}`,
            title: step.title.trim()
        }));
        const row = await admin_model_1.PlanFlowModel.findOneAndUpdate({ flowType }, { flowType, steps: normalizedSteps }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
        return row;
    },
    async listIngredients() {
        return admin_model_1.IngredientModel.find().sort({ category: 1, createdAt: -1 }).lean();
    },
    async createIngredient(payload) {
        return admin_model_1.IngredientModel.create(payload);
    },
    async updateIngredient(id, payload) {
        const row = await admin_model_1.IngredientModel.findByIdAndUpdate(id, payload, { new: true });
        if (!row)
            throw new AppError_1.AppError(404, "Ingredient not found");
        return row;
    },
    async deleteIngredient(id) {
        const row = await admin_model_1.IngredientModel.findByIdAndDelete(id);
        if (!row)
            throw new AppError_1.AppError(404, "Ingredient not found");
    },
    async listOrders(filters) {
        const query = {};
        if (filters.status)
            query.status = filters.status;
        if (filters.payment)
            query.payment = filters.payment;
        if (filters.mode)
            query.orderType = filters.mode;
        if (filters.client)
            query.client = { $regex: filters.client, $options: "i" };
        if (filters.location)
            query.location = { $regex: filters.location, $options: "i" };
        if (filters.plan)
            query.plan = { $regex: filters.plan, $options: "i" };
        if (filters.date)
            query.date = { $regex: filters.date, $options: "i" };
        return admin_model_1.OrderModel.find(query).sort({ createdAt: -1 }).lean();
    },
    async updateOrder(id, patch) {
        const order = await admin_model_1.OrderModel.findById(id);
        if (!order)
            throw new AppError_1.AppError(404, "Order not found");
        const updated = await admin_model_1.OrderModel.findByIdAndUpdate(id, {
            ...patch,
            $push: {
                auditLog: {
                    $each: [
                        {
                            at: new Date().toLocaleString("en-US"),
                            by: "API",
                            action: "Order updated"
                        }
                    ],
                    $position: 0
                }
            }
        }, { new: true });
        return updated;
    },
    async listSubscriptions() {
        return admin_model_1.SubscriptionModel.find().sort({ createdAt: -1 }).lean();
    },
    async updateSubscription(id, patch) {
        const subscription = await admin_model_1.SubscriptionModel.findById(id);
        if (!subscription)
            throw new AppError_1.AppError(404, "Subscription not found");
        const logMessage = String(patch.logMessage || "Updated by admin");
        delete patch.logMessage;
        return admin_model_1.SubscriptionModel.findByIdAndUpdate(id, {
            ...patch,
            $push: { log: { $each: [logMessage], $position: 0 } }
        }, { new: true });
    },
    async listOrdersOfDay() {
        return admin_model_1.OrderModel.find().sort({ createdAt: -1 }).limit(20).lean();
    },
    async listPrintableOrders() {
        const rows = await admin_model_1.OrderModel.find().sort({ createdAt: -1 }).limit(50).lean();
        return rows.flatMap((order) => order.items.map((item) => ({
            orderId: order.orderId,
            client: order.client,
            date: order.date,
            meal: item.name,
            macros: item.macros,
            bestBefore: order.date
        })));
    },
    async listNotifications() {
        return admin_model_1.NotificationModel.find().sort({ createdAt: -1 }).lean();
    },
    async deleteNotification(id) {
        const row = await admin_model_1.NotificationModel.findByIdAndDelete(id);
        if (!row)
            throw new AppError_1.AppError(404, "Notification not found");
    }
};
