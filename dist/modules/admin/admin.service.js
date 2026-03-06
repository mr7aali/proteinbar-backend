"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
const AppError_1 = require("../../common/utils/AppError");
const admin_model_1 = require("./admin.model");
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
        return rows.map((r) => ({ ...r, id: r._id, sku: r.sku }));
    },
    async createProduct(payload) {
        return admin_model_1.ProductModel.create(payload);
    },
    async updateProduct(id, payload) {
        const row = await admin_model_1.ProductModel.findByIdAndUpdate(id, payload, { new: true });
        if (!row)
            throw new AppError_1.AppError(404, "Product not found");
        return row;
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
