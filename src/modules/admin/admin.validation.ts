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
  linkedProductSkus: z.array(z.string()).optional().default([]),
  visibleDays: z.array(z.string()).optional().default([]),
  timeSlots: z.array(z.string()).optional().default([]),
  mealTypes: z.array(z.string()).optional().default([]),
  planCompatibility: z.array(z.string()).optional().default([]),
  priority: z.number().optional().default(1),
  status: z.string().optional().default("Visible")
});

export const locationSchema = z.object({
  locationId: z.string().min(1),
  name: z.string().min(1),
  pickupAddress: z.string().min(1),
  mapLink: optionalString.default(""),
  deliveryZone: optionalString.default("N/A"),
  deliveryFee: optionalString.default("$0.00"),
  workingDays: z.array(z.string()).optional().default([]),
  cutoffTime: optionalString.default("-"),
  timeSlots: z.array(z.string()).optional().default([])
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
  status: z.enum(["active", "inactive"]),
  image: z.string().optional()
});
