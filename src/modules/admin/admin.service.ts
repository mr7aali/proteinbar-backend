import { FilterQuery, isValidObjectId } from "mongoose";
import { AppError } from "../../common/utils/AppError";
import {
  MealLibraryItemModel,
  IngredientModel,
  LocationModel,
  MenuItemModel,
  MonthlyPlanDetailsModel,
  MonthlyPlanModel,
  NotificationModel,
  OrderModel,
  PlanFlowModel,
  ProductModel,
  SubscriptionModel
} from "./admin.model";

type PlanKind = "custom" | "normal";
type PlanStatus = "draft" | "active" | "inactive" | "archived";

type MonthlyPlanDetailsPayload = {
  plan: Record<string, unknown> & { id: string; planKind?: PlanKind; status?: PlanStatus; title?: string; description?: string };
  rules: Record<string, unknown>;
  pricing: Record<string, unknown>;
  weekAssignments: Array<Record<string, unknown>>;
};

type MealLibraryItemPayload = {
  id: string;
  name: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  status: "active" | "inactive";
  image?: string;
};

function normalizePlanDetailsPayload(payload: MonthlyPlanDetailsPayload): MonthlyPlanDetailsPayload {
  const now = new Date().toISOString();
  const weekAssignments = Array.isArray(payload.weekAssignments) ? payload.weekAssignments : [];
  const planKind: PlanKind = payload.plan.planKind === "custom" ? "custom" : "normal";

  const normalizedPlan = {
    ...payload.plan,
    id: payload.plan.id,
    planKind,
    status: (payload.plan.status as PlanStatus | undefined) ?? "draft",
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

function toMonthlyPlanDetailsPayload(row: Record<string, unknown>): MonthlyPlanDetailsPayload {
  return {
    plan: (row.plan as MonthlyPlanDetailsPayload["plan"]) ?? { id: String(row.planId ?? "") },
    rules: (row.rules as Record<string, unknown>) ?? {},
    pricing: (row.pricing as Record<string, unknown>) ?? {},
    weekAssignments: (row.weekAssignments as Array<Record<string, unknown>>) ?? []
  };
}

function toMealLibraryItem(row: Record<string, unknown>): MealLibraryItemPayload {
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

function toPlanStatus(value: unknown): PlanStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "active" || normalized === "inactive" || normalized === "archived" || normalized === "draft") {
    return normalized;
  }
  return "draft";
}

function buildDefaultMonthlyPlanDetails(raw: Record<string, unknown>): MonthlyPlanDetailsPayload {
  const id = String(raw.planId ?? raw.id ?? "");
  const title = String(raw.name ?? raw.title ?? "Monthly Plan");
  const description = String(raw.description ?? "");
  const image = String(raw.imageUrl ?? raw.image ?? "");
  const isCustom =
    String(raw.type ?? "").trim().toLowerCase() === "custom" ||
    id.toLowerCase().includes("custom") ||
    title.toLowerCase().includes("custom");
  const planKind: PlanKind = isCustom ? "custom" : "normal";
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

async function ensureMonthlyPlanDetails(planId: string) {
  const existing = await MonthlyPlanDetailsModel.findOne({ planId }).lean();
  if (existing) return existing as unknown as Record<string, unknown>;

  const legacy = isValidObjectId(planId)
    ? await MonthlyPlanModel.findOne({
        $or: [{ planId }, { _id: planId }]
      }).lean()
    : await MonthlyPlanModel.findOne({ planId }).lean();

  if (!legacy) return null;

  const payload = buildDefaultMonthlyPlanDetails(legacy as unknown as Record<string, unknown>);
  const normalized = normalizePlanDetailsPayload(payload);

  const created = await MonthlyPlanDetailsModel.create({
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

  return created.toObject() as Record<string, unknown>;
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
] as const;

const planFlowOrder: Record<string, number> = {
  custom: 0,
  preset: 1
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toPriceNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  const normalized = value.replace(/[^0-9.]+/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatProduct(raw: Record<string, unknown>) {
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
    return rows.map((row) => formatProduct(row as unknown as Record<string, unknown>));
  },
  async createProduct(payload: Record<string, unknown>) {
    const row = await ProductModel.create(payload);
    return formatProduct(row.toObject() as Record<string, unknown>);
  },
  async updateProduct(id: string, payload: Record<string, unknown>) {
    const row = await ProductModel.findByIdAndUpdate(id, payload, { new: true });
    if (!row) throw new AppError(404, "Product not found");
    return formatProduct(row.toObject() as Record<string, unknown>);
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

  async getMonthlyPlanOverview() {
    const [plans, subscriptionsRaw, ordersRaw, activeMeals] = await Promise.all([
      MonthlyPlanDetailsModel.find().lean(),
      SubscriptionModel.find({}, { status: 1 }).lean(),
      OrderModel.find({}, { status: 1 }).lean(),
      MealLibraryItemModel.countDocuments({ status: "active" })
    ]);

    const activePlans = plans.filter((plan) => String((plan as Record<string, unknown>).status ?? "").toLowerCase() === "active").length;
    const customPlans = plans.filter((plan) => String((plan as Record<string, unknown>).planKind ?? "").toLowerCase() === "custom").length;
    const normalPlans = plans.filter((plan) => String((plan as Record<string, unknown>).planKind ?? "").toLowerCase() === "normal").length;

    const activeSubscriptions = subscriptionsRaw.filter(
      (item) => String((item as Record<string, unknown>).status ?? "").toLowerCase() === "active"
    ).length;
    const pendingOrders = ordersRaw.filter((item) => String((item as Record<string, unknown>).status ?? "").toLowerCase() === "pending").length;

    return {
      activePlans,
      customPlans,
      normalPlans,
      activeSubscriptions,
      pendingOrders,
      activeMeals
    };
  },

  async listMonthlyPlanAdmin(filters: Record<string, string | undefined>) {
    const query: FilterQuery<typeof MonthlyPlanDetailsModel> = {};
    if (filters.kind && filters.kind !== "all") query.planKind = filters.kind;
    if (filters.status && filters.status !== "all") query.status = filters.status;

    const search = String(filters.search ?? "").trim();
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
    }

    const rows = await MonthlyPlanDetailsModel.find(query).sort({ updatedAt: -1 }).lean();
    if (rows.length > 0) {
      return rows.map((row) => toMonthlyPlanDetailsPayload(row as unknown as Record<string, unknown>).plan);
    }

    const legacyRows = await MonthlyPlanModel.find().sort({ createdAt: -1 }).lean();
    const migrated: Array<Record<string, unknown>> = [];

    for (const legacyRow of legacyRows) {
      const legacyRecord = legacyRow as unknown as Record<string, unknown>;
      const legacyPlanId = String(legacyRecord.planId ?? legacyRecord.id ?? "");
      if (!legacyPlanId) continue;
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

  async getMonthlyPlanDetails(planId: string) {
    const row = (await ensureMonthlyPlanDetails(planId)) ?? (await MonthlyPlanDetailsModel.findOne({ planId }).lean());
    if (!row) throw new AppError(404, "Plan not found");
    return toMonthlyPlanDetailsPayload(row as unknown as Record<string, unknown>);
  },

  async upsertMonthlyPlanDetails(payload: MonthlyPlanDetailsPayload) {
    const normalized = normalizePlanDetailsPayload(payload);
    const planId = normalized.plan.id;

    if (!planId) throw new AppError(400, "Plan id is required");

    const row = await MonthlyPlanDetailsModel.findOneAndUpdate(
      { planId },
      {
        planId,
        planKind: normalized.plan.planKind,
        status: normalized.plan.status,
        title: normalized.plan.title,
        description: normalized.plan.description,
        plan: normalized.plan,
        rules: normalized.rules,
        pricing: normalized.pricing,
        weekAssignments: normalized.weekAssignments
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    await MonthlyPlanModel.findOneAndUpdate(
      { planId },
      {
        planId,
        name: normalized.plan.title,
        basePrice: String((normalized.pricing.basePriceFormula as Record<string, unknown> | undefined)?.baseFee ?? "0"),
        status: String(normalized.plan.status ?? "Active"),
        description: normalized.plan.description,
        imageUrl: String(normalized.plan.image ?? ""),
        isNew: Boolean(normalized.plan.badge)
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    return toMonthlyPlanDetailsPayload(row as unknown as Record<string, unknown>);
  },

  async archiveMonthlyPlan(planId: string) {
    const row = await MonthlyPlanDetailsModel.findOneAndUpdate(
      { planId },
      {
        status: "archived",
        "plan.status": "archived",
        "plan.updatedAt": new Date().toISOString()
      },
      { new: true }
    ).lean();

    if (!row) throw new AppError(404, "Plan not found");

    await MonthlyPlanModel.findOneAndUpdate({ planId }, { status: "Archived" });

    return {
      id: planId,
      status: "archived"
    };
  },

  async deleteMonthlyPlanAdmin(planId: string) {
    const deletedDetails = await MonthlyPlanDetailsModel.findOneAndDelete({ planId });
    const deletedLegacyByPlanId = await MonthlyPlanModel.findOneAndDelete({ planId });

    let deletedLegacyById = null;
    if (!deletedLegacyByPlanId && isValidObjectId(planId)) {
      deletedLegacyById = await MonthlyPlanModel.findByIdAndDelete(planId);
    }

    if (!deletedDetails && !deletedLegacyByPlanId && !deletedLegacyById) {
      throw new AppError(404, "Plan not found");
    }

    return { id: planId };
  },

  async listMealLibraryAdmin() {
    const rows = await MealLibraryItemModel.find().sort({ name: 1 }).lean();
    return rows.map((row) => toMealLibraryItem(row as unknown as Record<string, unknown>));
  },

  async upsertMealLibraryAdmin(payload: MealLibraryItemPayload) {
    const row = await MealLibraryItemModel.findOneAndUpdate(
      { mealId: payload.id },
      {
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
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return toMealLibraryItem(row as unknown as Record<string, unknown>);
  },

  async deleteMealLibraryAdmin(id: string) {
    const row = await MealLibraryItemModel.findOneAndDelete({ mealId: id });
    if (!row) throw new AppError(404, "Meal not found");
  },

  async listPublicMonthlyPlans() {
    const rows = await MonthlyPlanDetailsModel.find({ status: { $ne: "archived" } }).sort({ updatedAt: -1 }).lean();
    if (rows.length > 0) {
      return rows.map((row) => toMonthlyPlanDetailsPayload(row as unknown as Record<string, unknown>).plan);
    }

    const legacyRows = await MonthlyPlanModel.find().sort({ createdAt: -1 }).lean();
    const plans: Array<Record<string, unknown>> = [];

    for (const legacyRow of legacyRows) {
      const legacyRecord = legacyRow as unknown as Record<string, unknown>;
      const legacyPlanId = String(legacyRecord.planId ?? legacyRecord.id ?? "");
      if (!legacyPlanId) continue;
      const migrated = await ensureMonthlyPlanDetails(legacyPlanId);
      if (!migrated) continue;

      const plan = toMonthlyPlanDetailsPayload(migrated).plan;
      if (String(plan.status ?? "") !== "archived") {
        plans.push(plan);
      }
    }

    return plans;
  },

  async getPublicMonthlyPlanById(planId: string) {
    const row = (await ensureMonthlyPlanDetails(planId)) ?? (await MonthlyPlanDetailsModel.findOne({ planId }).lean());
    if (!row) throw new AppError(404, "Monthly plan not found");

    const details = toMonthlyPlanDetailsPayload(row as unknown as Record<string, unknown>);
    if (String(details.plan.status ?? "") === "archived") {
      throw new AppError(404, "Monthly plan not found");
    }

    const mealRows = await MealLibraryItemModel.find({ status: "active" }).lean();

    return {
      ...details,
      mealLibrary: mealRows.map((item) => toMealLibraryItem(item as unknown as Record<string, unknown>))
    };
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
