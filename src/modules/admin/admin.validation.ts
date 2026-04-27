import { z } from "zod";

const optionalString = z.string().trim().optional();

export const mongoIdParamSchema = z.object({ id: z.string().min(1) });

export const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.string().min(1),
  kcal: z.number().optional().default(0),
  protein: z.string().optional().default("0g"),
  carbs: z.string().optional().default("0g"),
  fat: z.string().optional().default("0g"),
  tags: z.array(z.string()).optional().default([]),
  allergens: z.array(z.string()).optional().default([]),
  availability: z.string().optional().default("Active"),
  imageUrl: z.string().optional().default("")
});

export const menuItemSchema = z.object({
  menuId: z.string().min(1),
  title: z.string().min(1),
  image: z.string().min(1),
  restaurantIds: z.array(z.string()).optional().default([]),
  restaurants: z.array(z.string()).optional().default([]),
  linkedProductSkus: z.array(z.string()).optional().default([]),
  visibleDays: z.array(z.string()).optional().default([]),
  timeSlots: z.array(z.string()).optional().default([]),
  mealTypes: z.array(z.string()).optional().default([]),
  planCompatibility: z.array(z.string()).optional().default([]),
  priority: z.number().optional().default(1),
  status: z.string().optional().default("Visible")
});

export const restaurantSchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(1),
  address: optionalString.default(""),
  workingDays: z.array(z.string()).optional().default([]),
  openingHours: optionalString.default(""),
  status: z.string().optional().default("Active")
});

export const locationSchema = z.object({
  locationId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["pickup", "delivery", "both"]).optional().default("both"),
  pickupAddress: z.string().min(1),
  image: optionalString.default(""),
  phone: optionalString.default(""),
  mapLink: optionalString.default(""),
  ratingText: optionalString.default(""),
  isActive: z.boolean().optional().default(true),
  deliveryZone: optionalString.default("N/A"),
  deliveryFee: optionalString.default("$0.00"),
  workingDays: z.array(z.string()).optional().default([]),
  cutoffTime: optionalString.default("-"),
  timeSlots: z.array(z.string()).optional().default([]),
  supportedOptions: z.array(z.string()).optional().default([])
});

export const monthlyPlanSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1),
  basePrice: z.string().min(1),
  members: z.number().optional().default(0),
  status: z.string().optional().default("Active"),
  isNew: z.boolean().optional().default(false),
  description: optionalString.default(""),
  imageUrl: optionalString.default("")
});

export const ingredientSchema = z.object({
  ingredientId: z.string().min(1),
  category: z.string().min(1),
  item: z.string().min(1),
  quantityLabel: z.string().min(1),
  kcal: z.number().optional().default(0),
  protein: z.number().optional().default(0),
  carbs: z.number().optional().default(0),
  fat: z.number().optional().default(0)
});

export const orderUpdateSchema = z.object({
  status: z.string().optional(),
  confirmationStatus: z.string().optional(),
  notes: z.string().optional(),
  payment: z.string().optional(),
  location: z.string().optional(),
  schedule: z.string().optional()
});

export const subscriptionUpdateSchema = z.object({
  status: z.string().optional(),
  dayProgress: z.string().optional(),
  totalWeeks: z.number().optional(),
  currentWeek: z.number().optional(),
  remainingMeals: z.number().optional(),
  logMessage: z.string().optional()
});

export const promoCodeSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  description: z.string().optional().default(""),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().positive(),
  maxDiscount: z.number().nonnegative().nullable().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional().default(""),
  usageLimit: z.number().int().positive().nullable().optional(),
  usedCount: z.number().int().nonnegative().optional().default(0),
  isActive: z.boolean(),
  appliesToMonthlyPlans: z.boolean(),
  appliesToDirectOrders: z.boolean(),
  stackable: z.boolean(),
  showOnHomepage: z.boolean(),
  eligibilityNote: z.string().optional().default("")
});

export const flowTypeParamSchema = z.object({
  flowType: z.enum(["custom", "preset"])
});

export const planFlowSchema = z.object({
  steps: z
    .array(
      z.object({
        step: z.string().min(1),
        title: z.string().min(1)
      })
    )
    .min(1)
});

export const monthlyPlanAdminFiltersSchema = z.object({
  kind: z.enum(["custom", "normal", "all"]).optional(),
  status: z.enum(["draft", "active", "inactive", "archived", "all"]).optional(),
  search: z.string().optional()
});

export const monthlyPlanDetailsParamSchema = z.object({
  id: z.string().min(1)
});

export const monthlyPlanDetailsUpsertSchema = z.object({
  plan: z
    .object({
      id: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional().default(""),
      planKind: z.enum(["custom", "normal"]).optional(),
      status: z.string().optional()
    })
    .passthrough(),
  rules: z.object({}).passthrough(),
  pricing: z.object({}).passthrough(),
  weekAssignments: z.array(z.unknown()).optional().default([])
});

export const mealLibraryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  tags: z.array(z.string()).optional().default([]),
  addOnOptions: z.array(z.string()).optional().default([]),
  status: z.enum(["active", "inactive"]),
  image: z.string().optional()
});

export const customPlanCategoryListQuerySchema = z.object({
  planId: z.string().min(1)
});

export const customPlanCategorySchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().optional(),
  code: z.string().optional(),
  displayOrder: z.number().optional(),
  selectionMode: z.enum(["single", "multi"]),
  isActive: z.boolean(),
  isRequired: z.boolean(),
  minSelect: z.number().int().min(0),
  maxSelect: z.number().int().min(1).nullable().optional()
});

export const customPlanCategoryReorderSchema = z.object({
  planId: z.string().min(1),
  categoryIds: z.array(z.string().min(1)).default([])
});

export const customPlanFoodItemListQuerySchema = z.object({
  planId: z.string().min(1),
  categoryId: z.string().optional()
});

const customPlanFoodSizeSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  unit: z.string().optional(),
  price: z.number(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional().default(true)
});

export const customPlanFoodItemSchema = z.object({
  planId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(1),
  imageUrl: z.string().min(1),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean(),
  sizes: z.array(customPlanFoodSizeSchema).min(1)
});

export const customPlanFoodItemReorderSchema = z.object({
  planId: z.string().min(1),
  categoryId: z.string().min(1),
  itemIds: z.array(z.string().min(1)).default([])
});

const websiteRepeaterItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional().default(""),
  subtitle: z.string().optional().default(""),
  body: z.string().optional().default(""),
  label: z.string().optional().default(""),
  link: z.string().optional().default(""),
  value: z.string().optional().default(""),
  image: z.string().optional().default("")
});

const websitePageSectionSchema = z.object({
  id: z.string().optional(),
  sectionKey: z.string().min(1),
  sectionType: z.enum([
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
  isVisible: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
  heading: z.string().optional().default(""),
  body: z.string().optional().default(""),
  eyebrow: z.string().optional().default(""),
  image: z.string().optional().default(""),
  buttonLabel: z.string().optional().default(""),
  buttonLink: z.string().optional().default(""),
  items: z.array(websiteRepeaterItemSchema).optional().default([])
});

export const websitePageSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  navLabel: z.string().min(1),
  summary: z.string().min(1),
  kind: z.enum(["system", "custom", "legal"]),
  status: z.enum(["draft", "published"]),
  showInTopNav: z.boolean(),
  heroEyebrow: z.string().optional().default(""),
  heroTitle: z.string().min(1),
  heroSubtitle: z.string().optional().default(""),
  heroBody: z.string().optional().default(""),
  heroImage: z.string().optional().default(""),
  heroPrimaryCtaLabel: z.string().optional().default(""),
  heroPrimaryCtaLink: z.string().optional().default(""),
  heroSecondaryCtaLabel: z.string().optional().default(""),
  heroSecondaryCtaLink: z.string().optional().default(""),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
  sections: z.array(websitePageSectionSchema).optional().default([])
});

export const adminRoleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  scopes: z.array(z.string()).optional().default([]),
  allowedPages: z.array(z.string().min(1)).optional().default([]),
  canPublish: z.boolean().optional().default(false),
  canManageUsers: z.boolean().optional().default(false)
});

export const adminUserSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["super_admin", "admin", "employee"]),
  adminRoleId: z.string().optional().default(""),
  allowedPages: z.array(z.string().min(1)).optional().default([]),
  canPublish: z.boolean().optional().default(false),
  canManageUsers: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true)
});
