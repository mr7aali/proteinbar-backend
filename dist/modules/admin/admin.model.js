"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsitePageModel = exports.PlanFlowModel = exports.PromoCodeModel = exports.NotificationModel = exports.SubscriptionModel = exports.OrderModel = exports.IngredientModel = exports.CustomPlanFoodItemModel = exports.CustomPlanCategoryModel = exports.MealLibraryItemModel = exports.MonthlyPlanDetailsModel = exports.MonthlyPlanModel = exports.LocationModel = exports.RestaurantModel = exports.MenuItemModel = exports.ProductModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProductSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
const MenuItemSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
const RestaurantSchema = new mongoose_1.Schema({
    restaurantId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "", trim: true },
    workingDays: { type: [String], default: [] },
    openingHours: { type: String, default: "", trim: true },
    status: { type: String, default: "Active", trim: true }
}, { timestamps: true });
const LocationSchema = new mongoose_1.Schema({
    locationId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, default: "both", trim: true },
    pickupAddress: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    phone: { type: String, default: "", trim: true },
    mapLink: { type: String, default: "" },
    ratingText: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    deliveryZone: { type: String, default: "N/A" },
    deliveryFee: { type: String, default: "$0.00" },
    workingDays: { type: [String], default: [] },
    cutoffTime: { type: String, default: "-" },
    timeSlots: { type: [String], default: [] },
    supportedOptions: { type: [String], default: [] }
}, { timestamps: true });
const MonthlyPlanSchema = new mongoose_1.Schema({
    planId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    basePrice: { type: String, required: true, trim: true },
    members: { type: Number, default: 0 },
    status: { type: String, default: "Active" },
    isNew: { type: Boolean, default: false },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" }
}, { timestamps: true, suppressReservedKeysWarning: true });
const MonthlyPlanDetailsSchema = new mongoose_1.Schema({
    planId: { type: String, required: true, unique: true, trim: true },
    planKind: { type: String, default: "normal", trim: true },
    status: { type: String, default: "draft", trim: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    plan: { type: mongoose_1.Schema.Types.Mixed, required: true },
    rules: { type: mongoose_1.Schema.Types.Mixed, required: true },
    pricing: { type: mongoose_1.Schema.Types.Mixed, required: true },
    weekAssignments: { type: [mongoose_1.Schema.Types.Mixed], default: [] }
}, { timestamps: true });
const MealLibraryItemSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
const CustomPlanCategorySchema = new mongoose_1.Schema({
    categoryId: { type: String, required: true, unique: true, trim: true },
    planId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    code: { type: String, default: "", trim: true },
    displayOrder: { type: Number, default: 1 },
    selectionMode: { type: String, default: "single", trim: true },
    isActive: { type: Boolean, default: true },
    isRequired: { type: Boolean, default: true },
    minSelect: { type: Number, default: 1 },
    maxSelect: { type: Number, default: 1 }
}, { timestamps: true });
const CustomPlanFoodSizeSchema = new mongoose_1.Schema({
    id: { type: String, required: true, trim: true },
    foodItemId: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    unit: { type: String, default: "", trim: true },
    price: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    displayOrder: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true }
}, { _id: false });
const CustomPlanFoodItemSchema = new mongoose_1.Schema({
    foodItemId: { type: String, required: true, unique: true, trim: true },
    planId: { type: String, required: true, trim: true, index: true },
    categoryId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    displayOrder: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    sizes: { type: [CustomPlanFoodSizeSchema], default: [] }
}, { timestamps: true });
const IngredientSchema = new mongoose_1.Schema({
    ingredientId: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    item: { type: String, required: true, trim: true },
    quantityLabel: { type: String, required: true, trim: true },
    kcal: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
}, { timestamps: true });
const OrderItemSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    macros: { type: String, required: true }
}, { _id: false });
const OrderAuditSchema = new mongoose_1.Schema({
    at: { type: String, required: true },
    by: { type: String, required: true },
    action: { type: String, required: true }
}, { _id: false });
const OrderSchema = new mongoose_1.Schema({
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
    promoCode: {
        code: { type: String, default: "" },
        discountAmount: { type: Number, default: 0 }
    },
    auditLog: { type: [OrderAuditSchema], default: [] }
}, { timestamps: true });
const SubscriptionSchema = new mongoose_1.Schema({
    subscriptionId: { type: String, required: true, unique: true, trim: true },
    client: { type: String, required: true, trim: true },
    plan: { type: String, required: true, trim: true },
    totalWeeks: { type: Number, required: true },
    currentWeek: { type: Number, required: true },
    dayProgress: { type: String, required: true },
    remainingMeals: { type: Number, required: true },
    status: { type: String, default: "Active" },
    log: { type: [String], default: [] }
}, { timestamps: true });
const NotificationSchema = new mongoose_1.Schema({
    notificationId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    meta: { type: String, default: "" },
    time: { type: String, default: "" },
    status: { type: String, default: "Unread" }
}, { timestamps: true });
const PlanFlowStepSchema = new mongoose_1.Schema({
    step: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true }
}, { _id: false });
const PlanFlowSchema = new mongoose_1.Schema({
    flowType: { type: String, required: true, unique: true, trim: true },
    steps: { type: [PlanFlowStepSchema], default: [] }
}, { timestamps: true });
const PromoCodeSchema = new mongoose_1.Schema({
    promoCodeId: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    description: { type: String, default: "", trim: true },
    discountType: { type: String, default: "percent", trim: true },
    discountValue: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    appliesToMonthlyPlans: { type: Boolean, default: true },
    appliesToDirectOrders: { type: Boolean, default: false },
    stackable: { type: Boolean, default: false },
    showOnHomepage: { type: Boolean, default: false },
    eligibilityNote: { type: String, default: "", trim: true }
}, { timestamps: true });
const WebsitePageSchema = new mongoose_1.Schema({
    pageId: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    navLabel: { type: String, default: "", trim: true },
    summary: { type: String, default: "", trim: true },
    kind: { type: String, default: "system", trim: true },
    status: { type: String, default: "draft", trim: true, index: true },
    showInTopNav: { type: Boolean, default: false },
    heroEyebrow: { type: String, default: "", trim: true },
    heroTitle: { type: String, default: "", trim: true },
    heroSubtitle: { type: String, default: "", trim: true },
    heroBody: { type: String, default: "", trim: true },
    heroImage: { type: String, default: "" },
    heroPrimaryCtaLabel: { type: String, default: "", trim: true },
    heroPrimaryCtaLink: { type: String, default: "", trim: true },
    heroSecondaryCtaLabel: { type: String, default: "", trim: true },
    heroSecondaryCtaLink: { type: String, default: "", trim: true },
    seoTitle: { type: String, default: "", trim: true },
    seoDescription: { type: String, default: "", trim: true },
    sections: { type: [mongoose_1.Schema.Types.Mixed], default: [] }
}, { timestamps: true });
exports.ProductModel = mongoose_1.default.model("Product", ProductSchema);
exports.MenuItemModel = mongoose_1.default.model("MenuItem", MenuItemSchema);
exports.RestaurantModel = mongoose_1.default.model("Restaurant", RestaurantSchema);
exports.LocationModel = mongoose_1.default.model("Location", LocationSchema);
exports.MonthlyPlanModel = mongoose_1.default.model("MonthlyPlan", MonthlyPlanSchema);
exports.MonthlyPlanDetailsModel = mongoose_1.default.model("MonthlyPlanDetails", MonthlyPlanDetailsSchema);
exports.MealLibraryItemModel = mongoose_1.default.model("MealLibraryItem", MealLibraryItemSchema);
exports.CustomPlanCategoryModel = mongoose_1.default.model("CustomPlanCategory", CustomPlanCategorySchema);
exports.CustomPlanFoodItemModel = mongoose_1.default.model("CustomPlanFoodItem", CustomPlanFoodItemSchema);
exports.IngredientModel = mongoose_1.default.model("Ingredient", IngredientSchema);
exports.OrderModel = mongoose_1.default.model("Order", OrderSchema);
exports.SubscriptionModel = mongoose_1.default.model("Subscription", SubscriptionSchema);
exports.NotificationModel = mongoose_1.default.model("Notification", NotificationSchema);
exports.PromoCodeModel = mongoose_1.default.model("PromoCode", PromoCodeSchema);
exports.PlanFlowModel = mongoose_1.default.model("PlanFlow", PlanFlowSchema);
exports.WebsitePageModel = mongoose_1.default.model("WebsitePage", WebsitePageSchema);
