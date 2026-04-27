"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserSchema = exports.adminRoleSchema = exports.websitePageSchema = exports.customPlanFoodItemReorderSchema = exports.customPlanFoodItemSchema = exports.customPlanFoodItemListQuerySchema = exports.customPlanCategoryReorderSchema = exports.customPlanCategorySchema = exports.customPlanCategoryListQuerySchema = exports.mealLibraryItemSchema = exports.monthlyPlanDetailsUpsertSchema = exports.monthlyPlanDetailsParamSchema = exports.monthlyPlanAdminFiltersSchema = exports.planFlowSchema = exports.flowTypeParamSchema = exports.promoCodeSchema = exports.subscriptionUpdateSchema = exports.orderUpdateSchema = exports.ingredientSchema = exports.monthlyPlanSchema = exports.locationSchema = exports.restaurantSchema = exports.menuItemSchema = exports.productSchema = exports.mongoIdParamSchema = void 0;
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
    image: zod_1.z.string().min(1),
    restaurantIds: zod_1.z.array(zod_1.z.string()).optional().default([]),
    restaurants: zod_1.z.array(zod_1.z.string()).optional().default([]),
    linkedProductSkus: zod_1.z.array(zod_1.z.string()).optional().default([]),
    visibleDays: zod_1.z.array(zod_1.z.string()).optional().default([]),
    timeSlots: zod_1.z.array(zod_1.z.string()).optional().default([]),
    mealTypes: zod_1.z.array(zod_1.z.string()).optional().default([]),
    planCompatibility: zod_1.z.array(zod_1.z.string()).optional().default([]),
    priority: zod_1.z.number().optional().default(1),
    status: zod_1.z.string().optional().default("Visible")
});
exports.restaurantSchema = zod_1.z.object({
    restaurantId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    address: optionalString.default(""),
    workingDays: zod_1.z.array(zod_1.z.string()).optional().default([]),
    openingHours: optionalString.default(""),
    status: zod_1.z.string().optional().default("Active")
});
exports.locationSchema = zod_1.z.object({
    locationId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    type: zod_1.z.enum(["pickup", "delivery", "both"]).optional().default("both"),
    pickupAddress: zod_1.z.string().min(1),
    image: optionalString.default(""),
    phone: optionalString.default(""),
    mapLink: optionalString.default(""),
    ratingText: optionalString.default(""),
    isActive: zod_1.z.boolean().optional().default(true),
    deliveryZone: optionalString.default("N/A"),
    deliveryFee: optionalString.default("$0.00"),
    workingDays: zod_1.z.array(zod_1.z.string()).optional().default([]),
    cutoffTime: optionalString.default("-"),
    timeSlots: zod_1.z.array(zod_1.z.string()).optional().default([]),
    supportedOptions: zod_1.z.array(zod_1.z.string()).optional().default([])
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
exports.promoCodeSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    code: zod_1.z.string().min(1),
    description: zod_1.z.string().optional().default(""),
    discountType: zod_1.z.enum(["percent", "fixed"]),
    discountValue: zod_1.z.number().positive(),
    maxDiscount: zod_1.z.number().nonnegative().nullable().optional(),
    startDate: zod_1.z.string().min(1),
    endDate: zod_1.z.string().optional().default(""),
    usageLimit: zod_1.z.number().int().positive().nullable().optional(),
    usedCount: zod_1.z.number().int().nonnegative().optional().default(0),
    isActive: zod_1.z.boolean(),
    appliesToMonthlyPlans: zod_1.z.boolean(),
    appliesToDirectOrders: zod_1.z.boolean(),
    stackable: zod_1.z.boolean(),
    showOnHomepage: zod_1.z.boolean(),
    eligibilityNote: zod_1.z.string().optional().default("")
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
exports.monthlyPlanAdminFiltersSchema = zod_1.z.object({
    kind: zod_1.z.enum(["custom", "normal", "all"]).optional(),
    status: zod_1.z.enum(["draft", "active", "inactive", "archived", "all"]).optional(),
    search: zod_1.z.string().optional()
});
exports.monthlyPlanDetailsParamSchema = zod_1.z.object({
    id: zod_1.z.string().min(1)
});
exports.monthlyPlanDetailsUpsertSchema = zod_1.z.object({
    plan: zod_1.z
        .object({
        id: zod_1.z.string().min(1),
        title: zod_1.z.string().min(1),
        description: zod_1.z.string().optional().default(""),
        planKind: zod_1.z.enum(["custom", "normal"]).optional(),
        status: zod_1.z.string().optional()
    })
        .passthrough(),
    rules: zod_1.z.object({}).passthrough(),
    pricing: zod_1.z.object({}).passthrough(),
    weekAssignments: zod_1.z.array(zod_1.z.unknown()).optional().default([])
});
exports.mealLibraryItemSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    mealType: zod_1.z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
    calories: zod_1.z.number(),
    protein: zod_1.z.number(),
    carbs: zod_1.z.number(),
    fat: zod_1.z.number(),
    tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
    addOnOptions: zod_1.z.array(zod_1.z.string()).optional().default([]),
    status: zod_1.z.enum(["active", "inactive"]),
    image: zod_1.z.string().optional()
});
exports.customPlanCategoryListQuerySchema = zod_1.z.object({
    planId: zod_1.z.string().min(1)
});
exports.customPlanCategorySchema = zod_1.z.object({
    planId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    slug: zod_1.z.string().optional(),
    code: zod_1.z.string().optional(),
    displayOrder: zod_1.z.number().optional(),
    selectionMode: zod_1.z.enum(["single", "multi"]),
    isActive: zod_1.z.boolean(),
    isRequired: zod_1.z.boolean(),
    minSelect: zod_1.z.number().int().min(0),
    maxSelect: zod_1.z.number().int().min(1).nullable().optional()
});
exports.customPlanCategoryReorderSchema = zod_1.z.object({
    planId: zod_1.z.string().min(1),
    categoryIds: zod_1.z.array(zod_1.z.string().min(1)).default([])
});
exports.customPlanFoodItemListQuerySchema = zod_1.z.object({
    planId: zod_1.z.string().min(1),
    categoryId: zod_1.z.string().optional()
});
const customPlanFoodSizeSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    label: zod_1.z.string().min(1),
    unit: zod_1.z.string().optional(),
    price: zod_1.z.number(),
    calories: zod_1.z.number(),
    protein: zod_1.z.number(),
    carbs: zod_1.z.number(),
    fat: zod_1.z.number(),
    displayOrder: zod_1.z.number().optional(),
    isActive: zod_1.z.boolean().optional().default(true)
});
exports.customPlanFoodItemSchema = zod_1.z.object({
    planId: zod_1.z.string().min(1),
    categoryId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    imageUrl: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    displayOrder: zod_1.z.number().optional(),
    isActive: zod_1.z.boolean(),
    sizes: zod_1.z.array(customPlanFoodSizeSchema).min(1)
});
exports.customPlanFoodItemReorderSchema = zod_1.z.object({
    planId: zod_1.z.string().min(1),
    categoryId: zod_1.z.string().min(1),
    itemIds: zod_1.z.array(zod_1.z.string().min(1)).default([])
});
const websiteRepeaterItemSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    title: zod_1.z.string().optional().default(""),
    subtitle: zod_1.z.string().optional().default(""),
    body: zod_1.z.string().optional().default(""),
    label: zod_1.z.string().optional().default(""),
    link: zod_1.z.string().optional().default(""),
    value: zod_1.z.string().optional().default(""),
    image: zod_1.z.string().optional().default("")
});
const websitePageSectionSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    sectionKey: zod_1.z.string().min(1),
    sectionType: zod_1.z.enum([
        "richText",
        "imageText",
        "cards",
        "stats",
        "testimonials",
        "faq",
        "ctaBanner",
        "contactInfo",
        "dynamicEmbed"
    ]),
    isVisible: zod_1.z.boolean().optional().default(true),
    sortOrder: zod_1.z.number().optional().default(0),
    heading: zod_1.z.string().optional().default(""),
    body: zod_1.z.string().optional().default(""),
    eyebrow: zod_1.z.string().optional().default(""),
    image: zod_1.z.string().optional().default(""),
    buttonLabel: zod_1.z.string().optional().default(""),
    buttonLink: zod_1.z.string().optional().default(""),
    items: zod_1.z.array(websiteRepeaterItemSchema).optional().default([])
});
exports.websitePageSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    navLabel: zod_1.z.string().min(1),
    summary: zod_1.z.string().min(1),
    kind: zod_1.z.enum(["system", "custom", "legal"]),
    status: zod_1.z.enum(["draft", "published"]),
    showInTopNav: zod_1.z.boolean(),
    heroEyebrow: zod_1.z.string().optional().default(""),
    heroTitle: zod_1.z.string().min(1),
    heroSubtitle: zod_1.z.string().optional().default(""),
    heroBody: zod_1.z.string().optional().default(""),
    heroImage: zod_1.z.string().optional().default(""),
    heroPrimaryCtaLabel: zod_1.z.string().optional().default(""),
    heroPrimaryCtaLink: zod_1.z.string().optional().default(""),
    heroSecondaryCtaLabel: zod_1.z.string().optional().default(""),
    heroSecondaryCtaLink: zod_1.z.string().optional().default(""),
    seoTitle: zod_1.z.string().min(1),
    seoDescription: zod_1.z.string().min(1),
    sections: zod_1.z.array(websitePageSectionSchema).optional().default([])
});
exports.adminRoleSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional().default(""),
    scopes: zod_1.z.array(zod_1.z.string()).optional().default([]),
    allowedPages: zod_1.z.array(zod_1.z.string().min(1)).optional().default([]),
    canPublish: zod_1.z.boolean().optional().default(false),
    canManageUsers: zod_1.z.boolean().optional().default(false)
});
exports.adminUserSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    fullName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6).optional(),
    role: zod_1.z.enum(["super_admin", "admin", "employee"]),
    adminRoleId: zod_1.z.string().optional().default(""),
    allowedPages: zod_1.z.array(zod_1.z.string().min(1)).optional().default([]),
    canPublish: zod_1.z.boolean().optional().default(false),
    canManageUsers: zod_1.z.boolean().optional().default(false),
    isActive: zod_1.z.boolean().optional().default(true)
});
