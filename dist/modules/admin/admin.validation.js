"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planFlowSchema = exports.flowTypeParamSchema = exports.subscriptionUpdateSchema = exports.orderUpdateSchema = exports.ingredientSchema = exports.monthlyPlanSchema = exports.locationSchema = exports.menuItemSchema = exports.productSchema = exports.mongoIdParamSchema = void 0;
const zod_1 = require("zod");
const optionalString = zod_1.z.string().trim().optional();
exports.mongoIdParamSchema = zod_1.z.object({ id: zod_1.z.string().min(1) });
exports.productSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    price: zod_1.z.string().min(1),
    kcal: zod_1.z.number().optional().default(0),
    protein: zod_1.z.string().optional().default("0g"),
    carbs: zod_1.z.string().optional().default("0g"),
    fat: zod_1.z.string().optional().default("0g"),
    tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
    allergens: zod_1.z.array(zod_1.z.string()).optional().default([]),
    availability: zod_1.z.string().optional().default("Active"),
    imageUrl: zod_1.z.string().optional().default("")
});
exports.menuItemSchema = zod_1.z.object({
    menuId: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    linkedProductSkus: zod_1.z.array(zod_1.z.string()).optional().default([]),
    visibleDays: zod_1.z.array(zod_1.z.string()).optional().default([]),
    timeSlots: zod_1.z.array(zod_1.z.string()).optional().default([]),
    mealTypes: zod_1.z.array(zod_1.z.string()).optional().default([]),
    planCompatibility: zod_1.z.array(zod_1.z.string()).optional().default([]),
    priority: zod_1.z.number().optional().default(1),
    status: zod_1.z.string().optional().default("Visible")
});
exports.locationSchema = zod_1.z.object({
    locationId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    pickupAddress: zod_1.z.string().min(1),
    mapLink: optionalString.default(""),
    deliveryZone: optionalString.default("N/A"),
    deliveryFee: optionalString.default("$0.00"),
    workingDays: zod_1.z.array(zod_1.z.string()).optional().default([]),
    cutoffTime: optionalString.default("-"),
    timeSlots: zod_1.z.array(zod_1.z.string()).optional().default([])
});
exports.monthlyPlanSchema = zod_1.z.object({
    planId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    basePrice: zod_1.z.string().min(1),
    members: zod_1.z.number().optional().default(0),
    status: zod_1.z.string().optional().default("Active"),
    isNew: zod_1.z.boolean().optional().default(false),
    description: optionalString.default(""),
    imageUrl: optionalString.default("")
});
exports.ingredientSchema = zod_1.z.object({
    ingredientId: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    item: zod_1.z.string().min(1),
    quantityLabel: zod_1.z.string().min(1),
    kcal: zod_1.z.number().optional().default(0),
    protein: zod_1.z.number().optional().default(0),
    carbs: zod_1.z.number().optional().default(0),
    fat: zod_1.z.number().optional().default(0)
});
exports.orderUpdateSchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    confirmationStatus: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    payment: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    schedule: zod_1.z.string().optional()
});
exports.subscriptionUpdateSchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    dayProgress: zod_1.z.string().optional(),
    totalWeeks: zod_1.z.number().optional(),
    currentWeek: zod_1.z.number().optional(),
    remainingMeals: zod_1.z.number().optional(),
    logMessage: zod_1.z.string().optional()
});
exports.flowTypeParamSchema = zod_1.z.object({
    flowType: zod_1.z.enum(["custom", "preset"])
});
exports.planFlowSchema = zod_1.z.object({
    steps: zod_1.z
        .array(zod_1.z.object({
        step: zod_1.z.string().min(1),
        title: zod_1.z.string().min(1)
    }))
        .min(1)
});
