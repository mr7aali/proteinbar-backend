import mongoose, { Schema } from "mongoose";

const ProductSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: String, required: true, trim: true },
    kcal: { type: Number, default: 0 },
    protein: { type: String, default: "0g" },
    carbs: { type: String, default: "0g" },
    fat: { type: String, default: "0g" },
    tags: { type: [String], default: [] },
    allergens: { type: [String], default: [] },
    availability: { type: String, default: "Active" },
    imageUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

const MenuItemSchema = new Schema(
  {
    menuId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    restaurantIds: { type: [String], default: [] },
    restaurants: { type: [String], default: [] },
    linkedProductSkus: { type: [String], default: [] },
    visibleDays: { type: [String], default: [] },
    timeSlots: { type: [String], default: [] },
    mealTypes: { type: [String], default: [] },
    planCompatibility: { type: [String], default: [] },
    priority: { type: Number, default: 1 },
    status: { type: String, default: "Visible" }
  },
  { timestamps: true }
);

const RestaurantSchema = new Schema(
  {
    restaurantId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "", trim: true },
    workingDays: { type: [String], default: [] },
    openingHours: { type: String, default: "", trim: true },
    status: { type: String, default: "Active", trim: true }
  },
  { timestamps: true }
);

const LocationSchema = new Schema(
  {
    locationId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    pickupAddress: { type: String, required: true, trim: true },
    mapLink: { type: String, default: "" },
    deliveryZone: { type: String, default: "N/A" },
    deliveryFee: { type: String, default: "$0.00" },
    workingDays: { type: [String], default: [] },
    cutoffTime: { type: String, default: "-" },
    timeSlots: { type: [String], default: [] }
  },
  { timestamps: true }
);

const MonthlyPlanSchema = new Schema(
  {
    planId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    basePrice: { type: String, required: true, trim: true },
    members: { type: Number, default: 0 },
    status: { type: String, default: "Active" },
    isNew: { type: Boolean, default: false },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" }
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

const MonthlyPlanDetailsSchema = new Schema(
  {
    planId: { type: String, required: true, unique: true, trim: true },
    planKind: { type: String, default: "normal", trim: true },
    status: { type: String, default: "draft", trim: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    plan: { type: Schema.Types.Mixed, required: true },
    rules: { type: Schema.Types.Mixed, required: true },
    pricing: { type: Schema.Types.Mixed, required: true },
    weekAssignments: { type: [Schema.Types.Mixed], default: [] }
  },
  { timestamps: true }
);

const MealLibraryItemSchema = new Schema(
  {
    mealId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    mealType: { type: String, required: true, trim: true },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    status: { type: String, default: "active", trim: true },
    image: { type: String, default: "" }
  },
  { timestamps: true }
);

const IngredientSchema = new Schema(
  {
    ingredientId: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    item: { type: String, required: true, trim: true },
    quantityLabel: { type: String, required: true, trim: true },
    kcal: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const OrderItemSchema = new Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    macros: { type: String, required: true }
  },
  { _id: false }
);

const OrderAuditSchema = new Schema(
  {
    at: { type: String, required: true },
    by: { type: String, required: true },
    action: { type: String, required: true }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, trim: true },
    client: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    status: { type: String, default: "Pending" },
    confirmationStatus: { type: String, default: "Pending" },
    plan: { type: String, default: "" },
    orderType: { type: String, default: "Delivery" },
    location: { type: String, default: "" },
    deliveryAddress: { type: String, default: "" },
    pickupLocation: { type: String, default: "" },
    payment: { type: String, default: "Paid" },
    schedule: { type: String, default: "" },
    date: { type: String, default: "" },
    total: { type: String, default: "$0.00" },
    items: { type: [OrderItemSchema], default: [] },
    notes: { type: String, default: "" },
    subscriptionInfo: { type: String, default: "" },
    subscriptionDetails: {
      daysPerWeek: { type: Number, default: 0 },
      durationWeeks: { type: Number, default: 0 },
      meals: { type: Number, default: 0 }
    },
    auditLog: { type: [OrderAuditSchema], default: [] }
  },
  { timestamps: true }
);

const SubscriptionSchema = new Schema(
  {
    subscriptionId: { type: String, required: true, unique: true, trim: true },
    client: { type: String, required: true, trim: true },
    plan: { type: String, required: true, trim: true },
    totalWeeks: { type: Number, required: true },
    currentWeek: { type: Number, required: true },
    dayProgress: { type: String, required: true },
    remainingMeals: { type: Number, required: true },
    status: { type: String, default: "Active" },
    log: { type: [String], default: [] }
  },
  { timestamps: true }
);

const NotificationSchema = new Schema(
  {
    notificationId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    meta: { type: String, default: "" },
    time: { type: String, default: "" },
    status: { type: String, default: "Unread" }
  },
  { timestamps: true }
);

const PlanFlowStepSchema = new Schema(
  {
    step: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const PlanFlowSchema = new Schema(
  {
    flowType: { type: String, required: true, unique: true, trim: true },
    steps: { type: [PlanFlowStepSchema], default: [] }
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model("Product", ProductSchema);
export const MenuItemModel = mongoose.model("MenuItem", MenuItemSchema);
export const RestaurantModel = mongoose.model("Restaurant", RestaurantSchema);
export const LocationModel = mongoose.model("Location", LocationSchema);
export const MonthlyPlanModel = mongoose.model("MonthlyPlan", MonthlyPlanSchema);
export const MonthlyPlanDetailsModel = mongoose.model("MonthlyPlanDetails", MonthlyPlanDetailsSchema);
export const MealLibraryItemModel = mongoose.model("MealLibraryItem", MealLibraryItemSchema);
export const IngredientModel = mongoose.model("Ingredient", IngredientSchema);
export const OrderModel = mongoose.model("Order", OrderSchema);
export const SubscriptionModel = mongoose.model("Subscription", SubscriptionSchema);
export const NotificationModel = mongoose.model("Notification", NotificationSchema);
export const PlanFlowModel = mongoose.model("PlanFlow", PlanFlowSchema);
