import { FilterQuery } from "mongoose";
import { AppError } from "../../common/utils/AppError";
import {
  IngredientModel,
  LocationModel,
  MenuItemModel,
  MonthlyPlanModel,
  NotificationModel,
  OrderModel,
  PlanFlowModel,
  ProductModel,
  SubscriptionModel
} from "./admin.model";

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
] as const;

const planFlowOrder: Record<string, number> = {
  custom: 0,
  preset: 1
};

async function ensurePlanFlowsSeeded() {
  const existing = await PlanFlowModel.find({}, { flowType: 1 }).lean();
  const existingTypes = new Set(existing.map((row) => String(row.flowType)));

  const missing = defaultPlanFlows.filter((flow) => !existingTypes.has(flow.flowType));
  if (missing.length > 0) {
    await PlanFlowModel.insertMany(missing);
  }
}

export const adminService = {
  async getDashboard() {
    const [ordersCount, productsCount, menuCount, subscribers] = await Promise.all([
      OrderModel.countDocuments(),
      ProductModel.countDocuments(),
      MenuItemModel.countDocuments({ status: "Visible" }),
      SubscriptionModel.countDocuments({ status: "Active" })
    ]);

    const latestOrdersRaw = await OrderModel.find().sort({ createdAt: -1 }).limit(5).lean();
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
    const rows = await ProductModel.find().sort({ createdAt: -1 }).lean();
    return rows.map((r) => ({ ...r, id: r._id, sku: r.sku }));
  },
  async createProduct(payload: Record<string, unknown>) {
    return ProductModel.create(payload);
  },
  async updateProduct(id: string, payload: Record<string, unknown>) {
    const row = await ProductModel.findByIdAndUpdate(id, payload, { new: true });
    if (!row) throw new AppError(404, "Product not found");
    return row;
  },
  async deleteProduct(id: string) {
    const row = await ProductModel.findByIdAndDelete(id);
    if (!row) throw new AppError(404, "Product not found");
  },

  async listMenuItems() {
    return MenuItemModel.find().sort({ priority: 1, createdAt: -1 }).lean();
  },
  async createMenuItem(payload: Record<string, unknown>) {
    return MenuItemModel.create(payload);
  },
  async updateMenuItem(id: string, payload: Record<string, unknown>) {
    const row = await MenuItemModel.findByIdAndUpdate(id, payload, { new: true });
    if (!row) throw new AppError(404, "Menu item not found");
    return row;
  },
  async deleteMenuItem(id: string) {
    const row = await MenuItemModel.findByIdAndDelete(id);
    if (!row) throw new AppError(404, "Menu item not found");
  },

  async listLocations() {
    return LocationModel.find().sort({ createdAt: -1 }).lean();
  },
  async createLocation(payload: Record<string, unknown>) {
    return LocationModel.create(payload);
  },
  async updateLocation(id: string, payload: Record<string, unknown>) {
    const row = await LocationModel.findByIdAndUpdate(id, payload, { new: true });
    if (!row) throw new AppError(404, "Location not found");
    return row;
  },
  async deleteLocation(id: string) {
    const row = await LocationModel.findByIdAndDelete(id);
    if (!row) throw new AppError(404, "Location not found");
  },

  async listMonthlyPlans() {
    return MonthlyPlanModel.find().sort({ createdAt: -1 }).lean();
  },
  async createMonthlyPlan(payload: Record<string, unknown>) {
    return MonthlyPlanModel.create(payload);
  },
  async updateMonthlyPlan(id: string, payload: Record<string, unknown>) {
    const row = await MonthlyPlanModel.findByIdAndUpdate(id, payload, { new: true });
    if (!row) throw new AppError(404, "Plan not found");
    return row;
  },
  async deleteMonthlyPlan(id: string) {
    const row = await MonthlyPlanModel.findByIdAndDelete(id);
    if (!row) throw new AppError(404, "Plan not found");
  },

  async listPlanFlows() {
    await ensurePlanFlowsSeeded();
    const rows = await PlanFlowModel.find().lean();
    return rows.sort((a, b) => (planFlowOrder[String(a.flowType)] ?? 9) - (planFlowOrder[String(b.flowType)] ?? 9));
  },

  async updatePlanFlow(flowType: "custom" | "preset", payload: { steps: Array<{ step: string; title: string }> }) {
    const normalizedSteps = payload.steps.map((step, index) => ({
      step: step.step?.trim() || `Step ${index + 1}`,
      title: step.title.trim()
    }));

    const row = await PlanFlowModel.findOneAndUpdate(
      { flowType },
      { flowType, steps: normalizedSteps },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return row;
  },

  async listIngredients() {
    return IngredientModel.find().sort({ category: 1, createdAt: -1 }).lean();
  },
  async createIngredient(payload: Record<string, unknown>) {
    return IngredientModel.create(payload);
  },
  async updateIngredient(id: string, payload: Record<string, unknown>) {
    const row = await IngredientModel.findByIdAndUpdate(id, payload, { new: true });
    if (!row) throw new AppError(404, "Ingredient not found");
    return row;
  },
  async deleteIngredient(id: string) {
    const row = await IngredientModel.findByIdAndDelete(id);
    if (!row) throw new AppError(404, "Ingredient not found");
  },

  async listOrders(filters: Record<string, string | undefined>) {
    const query: FilterQuery<typeof OrderModel> = {};

    if (filters.status) query.status = filters.status;
    if (filters.payment) query.payment = filters.payment;
    if (filters.mode) query.orderType = filters.mode;
    if (filters.client) query.client = { $regex: filters.client, $options: "i" };
    if (filters.location) query.location = { $regex: filters.location, $options: "i" };
    if (filters.plan) query.plan = { $regex: filters.plan, $options: "i" };
    if (filters.date) query.date = { $regex: filters.date, $options: "i" };

    return OrderModel.find(query).sort({ createdAt: -1 }).lean();
  },
  async updateOrder(id: string, patch: Record<string, unknown>) {
    const order = await OrderModel.findById(id);
    if (!order) throw new AppError(404, "Order not found");

    const updated = await OrderModel.findByIdAndUpdate(
      id,
      {
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
      },
      { new: true }
    );

    return updated;
  },

  async listSubscriptions() {
    return SubscriptionModel.find().sort({ createdAt: -1 }).lean();
  },
  async updateSubscription(id: string, patch: Record<string, unknown>) {
    const subscription = await SubscriptionModel.findById(id);
    if (!subscription) throw new AppError(404, "Subscription not found");

    const logMessage = String(patch.logMessage || "Updated by admin");
    delete patch.logMessage;

    return SubscriptionModel.findByIdAndUpdate(
      id,
      {
        ...patch,
        $push: { log: { $each: [logMessage], $position: 0 } }
      },
      { new: true }
    );
  },

  async listOrdersOfDay() {
    return OrderModel.find().sort({ createdAt: -1 }).limit(20).lean();
  },

  async listPrintableOrders() {
    const rows = await OrderModel.find().sort({ createdAt: -1 }).limit(50).lean();
    return rows.flatMap((order) =>
      order.items.map((item: { name: string; macros: string }) => ({
        orderId: order.orderId,
        client: order.client,
        date: order.date,
        meal: item.name,
        macros: item.macros,
        bestBefore: order.date
      }))
    );
  },

  async listNotifications() {
    return NotificationModel.find().sort({ createdAt: -1 }).lean();
  },
  async deleteNotification(id: string) {
    const row = await NotificationModel.findByIdAndDelete(id);
    if (!row) throw new AppError(404, "Notification not found");
  }
};
