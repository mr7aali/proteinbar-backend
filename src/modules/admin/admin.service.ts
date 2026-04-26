import { FilterQuery, isValidObjectId } from "mongoose";
import { AppError } from "../../common/utils/AppError";
import { normalizeImageInput, uploadImageIfNeeded } from "../../common/utils/cloudinary";
import {
  CustomPlanCategoryModel,
  CustomPlanFoodItemModel,
  MealLibraryItemModel,
  IngredientModel,
  LocationModel,
  MenuItemModel,
  MonthlyPlanDetailsModel,
  MonthlyPlanModel,
  NotificationModel,
  OrderModel,
  PlanFlowModel,
  PromoCodeModel,
  ProductModel,
  RestaurantModel,
  SubscriptionModel,
  WebsitePageModel
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

type SelectionMode = "single" | "multi";

type CustomPlanCategoryPayload = {
  id?: string;
  planId: string;
  name: string;
  slug?: string;
  code?: string;
  displayOrder?: number;
  selectionMode: SelectionMode;
  isActive: boolean;
  isRequired: boolean;
  minSelect: number;
  maxSelect?: number | null;
};

type CustomPlanFoodSizePayload = {
  id?: string;
  label: string;
  unit?: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  displayOrder?: number;
  isActive?: boolean;
};

type CustomPlanFoodItemPayload = {
  id?: string;
  planId: string;
  categoryId: string;
  name: string;
  imageUrl: string;
  description?: string;
  displayOrder?: number;
  isActive: boolean;
  sizes: CustomPlanFoodSizePayload[];
};

type WebsiteSectionType =
  | "richText"
  | "imageText"
  | "cards"
  | "stats"
  | "testimonials"
  | "faq"
  | "ctaBanner"
  | "contactInfo"
  | "dynamicEmbed";

type WebsiteRepeaterItemPayload = {
  id?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  label?: string;
  link?: string;
  value?: string;
  image?: string;
};

type WebsitePageSectionPayload = {
  id?: string;
  sectionKey: string;
  sectionType: WebsiteSectionType;
  isVisible?: boolean;
  sortOrder?: number;
  heading?: string;
  body?: string;
  eyebrow?: string;
  image?: string;
  buttonLabel?: string;
  buttonLink?: string;
  items?: WebsiteRepeaterItemPayload[];
};

type WebsitePagePayload = {
  id: string;
  slug: string;
  title: string;
  navLabel: string;
  summary: string;
  kind: "system" | "custom" | "legal";
  status: "draft" | "published";
  showInTopNav: boolean;
  heroEyebrow?: string;
  heroTitle: string;
  heroSubtitle?: string;
  heroBody?: string;
  heroImage?: string;
  heroPrimaryCtaLabel?: string;
  heroPrimaryCtaLink?: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaLink?: string;
  seoTitle: string;
  seoDescription: string;
  sections: WebsitePageSectionPayload[];
  updatedAt?: string;
};

type PromoCodePayload = {
  id?: string;
  code: string;
  description?: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxDiscount?: number | null;
  startDate: string;
  endDate?: string;
  usageLimit?: number | null;
  usedCount?: number;
  isActive: boolean;
  appliesToMonthlyPlans: boolean;
  appliesToDirectOrders: boolean;
  stackable: boolean;
  showOnHomepage: boolean;
  eligibilityNote?: string;
};

function toLocation(row: Record<string, unknown>) {
  const rawDeliveryFee = row.deliveryFee;
  const normalizedDeliveryFee =
    typeof rawDeliveryFee === "number"
      ? String(rawDeliveryFee)
      : String(rawDeliveryFee ?? "").trim() || "$0.00";

  return {
    id: String(row.locationId ?? row.id ?? ""),
    locationId: String(row.locationId ?? row.id ?? ""),
    name: String(row.name ?? ""),
    type:
      String(row.type ?? "").trim().toLowerCase() === "pickup" ||
      String(row.type ?? "").trim().toLowerCase() === "delivery"
        ? String(row.type).trim().toLowerCase()
        : "both",
    address: String(row.address ?? row.pickupAddress ?? ""),
    pickupAddress: String(row.pickupAddress ?? row.address ?? ""),
    image: normalizeImageInput(row.image ?? row.imageUrl ?? ""),
    phone: String(row.phone ?? ""),
    googleMapsUrl: String(row.googleMapsUrl ?? row.mapLink ?? ""),
    mapLink: String(row.mapLink ?? row.googleMapsUrl ?? ""),
    ratingText: String(row.ratingText ?? ""),
    isActive: Boolean(row.isActive ?? true),
    deliveryZone: String(row.deliveryZone ?? "N/A"),
    deliveryFee: normalizedDeliveryFee,
    workingDays: normalizeStringList(row.workingDays),
    cutoffTime: String(row.cutoffTime ?? "-"),
    timeSlots: normalizeStringList(row.timeSlots),
    supportedOptions: normalizeStringList(row.supportedOptions)
  };
}

function normalizeMealImage(value: unknown) {
  return normalizeImageInput(value);
}

function toSelectionMode(value: unknown): SelectionMode {
  return String(value ?? "").trim().toLowerCase() === "multi" ? "multi" : "single";
}

function toCustomPlanCategory(row: Record<string, unknown>) {
  const rawMaxSelect = row.maxSelect;
  return {
    id: String(row.categoryId ?? row.id ?? ""),
    planId: String(row.planId ?? ""),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    code: String(row.code ?? "").trim() || undefined,
    displayOrder: Number(row.displayOrder ?? 1),
    selectionMode: toSelectionMode(row.selectionMode),
    isActive: Boolean(row.isActive ?? true),
    isRequired: Boolean(row.isRequired ?? true),
    minSelect: Number(row.minSelect ?? 0),
    maxSelect:
      rawMaxSelect === null || rawMaxSelect === undefined || rawMaxSelect === ""
        ? null
        : Number(rawMaxSelect)
  };
}

function toCustomPlanFoodItem(row: Record<string, unknown>) {
  const foodItemId = String(row.foodItemId ?? row.id ?? "");
  const rawSizes = Array.isArray(row.sizes) ? row.sizes : [];

  return {
    id: foodItemId,
    planId: String(row.planId ?? ""),
    categoryId: String(row.categoryId ?? ""),
    name: String(row.name ?? ""),
    imageUrl: normalizeImageInput(row.imageUrl ?? row.image),
    description: String(row.description ?? ""),
    displayOrder: Number(row.displayOrder ?? 1),
    isActive: Boolean(row.isActive ?? true),
    sizes: rawSizes
      .map((size) => {
        const sizeRow = size as Record<string, unknown>;
        return {
          id: String(sizeRow.id ?? ""),
          foodItemId,
          label: String(sizeRow.label ?? ""),
          unit: String(sizeRow.unit ?? "").trim() || undefined,
          price: Number(sizeRow.price ?? 0),
          calories: Number(sizeRow.calories ?? 0),
          protein: Number(sizeRow.protein ?? 0),
          carbs: Number(sizeRow.carbs ?? 0),
          fat: Number(sizeRow.fat ?? 0),
          displayOrder: Number(sizeRow.displayOrder ?? 1),
          isActive: Boolean(sizeRow.isActive ?? true)
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder)
  };
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.reduce<string[]>((acc, item) => {
    const normalized = String(item ?? "").trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) return acc;
    seen.add(key);
    acc.push(normalized);
    return acc;
  }, []);
}

function findRestaurantIdByName(
  restaurantIdByName: Map<string, string>,
  names: string[]
) {
  return names.reduce<string[]>((acc, name) => {
    const restaurantId = restaurantIdByName.get(name.toLowerCase());
    if (restaurantId && !acc.includes(restaurantId)) {
      acc.push(restaurantId);
    }
    return acc;
  }, []);
}

async function getRestaurantNamesByIds(restaurantIds: string[]) {
  if (restaurantIds.length === 0) {
    return [];
  }

  const restaurants = await RestaurantModel.find(
    { restaurantId: { $in: restaurantIds } },
    { restaurantId: 1, name: 1 }
  ).lean();
  const restaurantNameById = new Map(
    restaurants.map((restaurant) => [
      String((restaurant as Record<string, unknown>).restaurantId ?? ""),
      String((restaurant as Record<string, unknown>).name ?? "")
    ])
  );

  return restaurantIds
    .map((restaurantId) => restaurantNameById.get(restaurantId) ?? "")
    .filter(Boolean);
}

async function uploadImageField(
  payload: Record<string, unknown>,
  options: { sourceKey: string; fallbackKey?: string; targetKey: string; folder: string }
) {
  const imageSource =
    payload[options.sourceKey] ??
    (options.fallbackKey ? payload[options.fallbackKey] : undefined);

  if (imageSource === undefined) return payload;

  return {
    ...payload,
    [options.targetKey]: await uploadImageIfNeeded(imageSource, { folder: options.folder })
  };
}

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
    ...(Object.prototype.hasOwnProperty.call(payload.plan, "image")
      ? { image: normalizeImageInput(payload.plan.image) }
      : {}),
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
  const plan = ((row.plan as MonthlyPlanDetailsPayload["plan"]) ?? { id: String(row.planId ?? "") }) as MonthlyPlanDetailsPayload["plan"];

  return {
    plan: {
      ...plan,
      ...(Object.prototype.hasOwnProperty.call(plan, "image")
        ? { image: normalizeImageInput(plan.image) }
        : {})
    },
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
    image: normalizeMealImage(row.image)
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
  const image = normalizeImageInput(raw.imageUrl ?? raw.image ?? "");
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

function buildPromoCodeId() {
  return `promo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizePromoCodeDate(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || "";
}

function normalizePromoCodePayload(payload: PromoCodePayload): PromoCodePayload {
  const code = String(payload.code ?? "").trim().toUpperCase();
  if (!code) {
    throw new AppError(400, "Promo code is required");
  }

  const discountValue = Number(payload.discountValue ?? 0);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new AppError(400, "Promo code discount value must be greater than 0");
  }

  const maxDiscountRaw = payload.maxDiscount;
  const usageLimitRaw = payload.usageLimit;

  return {
    ...payload,
    id: String(payload.id ?? "").trim() || buildPromoCodeId(),
    code,
    description: String(payload.description ?? "").trim(),
    discountType: payload.discountType === "fixed" ? "fixed" : "percent",
    discountValue,
    maxDiscount:
      maxDiscountRaw === null || maxDiscountRaw === undefined
        ? null
        : Number(maxDiscountRaw),
    startDate: normalizePromoCodeDate(payload.startDate),
    endDate: normalizePromoCodeDate(payload.endDate),
    usageLimit:
      usageLimitRaw === null || usageLimitRaw === undefined
        ? null
        : Number(usageLimitRaw),
    usedCount: Number(payload.usedCount ?? 0),
    eligibilityNote: String(payload.eligibilityNote ?? "").trim()
  };
}

function toPromoCodeRecord(row: Record<string, unknown>) {
  const maxDiscountRaw = row.maxDiscount;
  const usageLimitRaw = row.usageLimit;

  return {
    id: String(row.promoCodeId ?? row.id ?? ""),
    code: String(row.code ?? ""),
    description: String(row.description ?? ""),
    discountType: String(row.discountType ?? "percent") === "fixed" ? "fixed" : "percent",
    discountValue: Number(row.discountValue ?? 0),
    maxDiscount:
      maxDiscountRaw === null || maxDiscountRaw === undefined || maxDiscountRaw === ""
        ? null
        : Number(maxDiscountRaw),
    startDate: String(row.startDate ?? ""),
    endDate: String(row.endDate ?? ""),
    usageLimit:
      usageLimitRaw === null || usageLimitRaw === undefined || usageLimitRaw === ""
        ? null
        : Number(usageLimitRaw),
    usedCount: Number(row.usedCount ?? 0),
    isActive: Boolean(row.isActive ?? true),
    appliesToMonthlyPlans: Boolean(row.appliesToMonthlyPlans ?? true),
    appliesToDirectOrders: Boolean(row.appliesToDirectOrders ?? false),
    stackable: Boolean(row.stackable ?? false),
    showOnHomepage: Boolean(row.showOnHomepage ?? false),
    eligibilityNote: String(row.eligibilityNote ?? ""),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt ?? new Date().toISOString())
  };
}

function getNowDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function calculatePromoDiscount(
  promoCode: ReturnType<typeof toPromoCodeRecord>,
  subtotal: number
) {
  const rawDiscount =
    promoCode.discountType === "fixed"
      ? promoCode.discountValue
      : (subtotal * promoCode.discountValue) / 100;
  const cappedDiscount =
    promoCode.maxDiscount === null
      ? rawDiscount
      : Math.min(rawDiscount, promoCode.maxDiscount);

  return Number(Math.max(0, Math.min(cappedDiscount, subtotal)).toFixed(2));
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
    image: normalizeImageInput(raw.image ?? raw.imageUrl ?? "")
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

function createWebsiteSection(section: WebsitePageSectionPayload): WebsitePageSectionPayload {
  return {
    isVisible: true,
    sortOrder: 0,
    heading: "",
    body: "",
    eyebrow: "",
    image: "",
    buttonLabel: "",
    buttonLink: "",
    items: [],
    ...section
  };
}

const legalSlugAliases: Record<string, string> = {
  terms: "terms-and-conditions",
  privacy: "privacy-policy"
};

const legalPageIds = new Set(["terms", "privacy"]);

function resolveWebsitePageSlug(slug: string) {
  const normalizedSlug = toSlug(slug);
  return legalSlugAliases[normalizedSlug] ?? normalizedSlug;
}

function getDefaultWebsitePages(): WebsitePagePayload[] {
  return [
    {
      id: "home",
      slug: "home",
      title: "Home",
      navLabel: "Home",
      summary: "Homepage hero, trust-building content, and conversion sections.",
      kind: "system",
      status: "published",
      showInTopNav: true,
      heroEyebrow: "Since 2018",
      heroTitle: "The Real Food Revolution",
      heroSubtitle: "Fresh ingredients. No oil. No trans fat. Casablanca's favorite healthy restaurant since 2018.",
      heroBody: "Manage homepage text, images, CTAs, and every major section from the admin dashboard.",
      heroImage: "/hero.png",
      heroPrimaryCtaLabel: "See Our Menu",
      heroPrimaryCtaLink: "/pages/menu",
      heroSecondaryCtaLabel: "Start A Monthly Plan",
      heroSecondaryCtaLink: "/plans",
      seoTitle: "Proteinbar | Healthy Meals & Meal Plans",
      seoDescription: "Fresh meals, flexible plans, and delivery that fits your week.",
      sections: [
        createWebsiteSection({
          id: "home-intro",
          sectionKey: "intro-statement",
          sectionType: "richText",
          heading: "Intro Statement",
          body:
            "Founded in 2018, Proteinbar is dedicated to offering a wide array of wholesome and nutritious meals. Our restaurant prides itself on crafting delicious dishes that prioritize health and well-being, catering to a diverse clientele seeking flavorful options that support a balanced lifestyle.",
          buttonLabel: "See Our Menu",
          buttonLink: "/pages/menu"
        }),
        createWebsiteSection({
          id: "home-locations-preview",
          sectionKey: "locations-preview",
          sectionType: "dynamicEmbed",
          heading: "Our Locations",
          body: "Manage this heading and support text here while the actual location cards stay synced from the Locations module."
        }),
        createWebsiteSection({
          id: "home-mission",
          sectionKey: "mission",
          sectionType: "cards",
          heading: "Our Mission",
          body:
            "Proteinbar's core vision and mission is not just about providing delicious healthy meals to its customers, but also providing and promoting good health and make it accessible to whoever, wherever.",
          items: [
            { id: "mission-1", title: "Delicious & Healthy", body: "Provide delicious healthy meals to customers." },
            { id: "mission-2", title: "Promote good health", body: "Encourage well-being and fitness." },
            { id: "mission-3", title: "Accessibility", body: "Make health accessible to everyone, everywhere." }
          ]
        }),
        createWebsiteSection({
          id: "home-experience",
          sectionKey: "experience",
          sectionType: "cards",
          heading: "THE PROTEINBAR EXPERIENCE",
          items: [
            { id: "experience-1", title: "See Our Menu", label: "see Menu", link: "/pages/menu", image: "/location-2.png" },
            { id: "experience-2", title: "Need A Meal Plan", label: "Contact Us", link: "/pages/contact", image: "/location-1.png" },
            { id: "experience-3", title: "Catering Experiences", label: "Contact Us", link: "/pages/contact", image: "/hero.png" }
          ]
        }),
        createWebsiteSection({
          id: "home-brand-values",
          sectionKey: "brand-values",
          sectionType: "cards",
          heading: "PROTEINBAR",
          body: "Brand values and promises.",
          items: [
            { id: "value-1", title: "HONEST BUSINESS", body: "Fair trade practices and full transparency to earn your trust every step of the way.", image: "/icon/icon-1.webp" },
            { id: "value-2", title: "FRESH & HEALTHY FOOD", body: "Experience the goodness of our fresh, locally sourced ingredients promoting a healthier lifestyle.", image: "/icon/icon-2.webp" },
            { id: "value-3", title: "NO OIL", body: "Our meals are light, clean, and perfect for a balanced diet.", image: "/icon/icon-3.webp" },
            { id: "value-4", title: "COST-EFFECTIVE", body: "Get nutritious meals that do not break the bank to suit every budget & preference.", image: "/icon/icon-4.webp" },
            { id: "value-5", title: "MADE WITH LOVE", body: "Prepared with care and passion, every meal reflects our dedication to quality.", image: "/icon/icon-5.webp" },
            { id: "value-6", title: "NO TRANS FAT", body: "Our meals are oil-free, healthy, and full of flavor.", image: "/icon/icon-6.webp" }
          ]
        }),
        createWebsiteSection({
          id: "home-healthy-customers",
          sectionKey: "healthy-customers",
          sectionType: "cards",
          heading: "6 Years Of Happy Healthy Customers And Counting...",
          items: [
            { id: "healthy-1", image: "/healthy/image-1.png" },
            { id: "healthy-2", image: "/healthy/image-2.png" },
            { id: "healthy-3", image: "/healthy/image-3.png" },
            { id: "healthy-4", image: "/healthy/image-4.png" },
            { id: "healthy-5", image: "/healthy/image-5.png" },
            { id: "healthy-6", image: "/healthy/image-6.png" },
            { id: "healthy-7", image: "/healthy/image-7.png" },
            { id: "healthy-8", image: "/healthy/image-5.png" },
            { id: "healthy-9", image: "/healthy/image-4.png" },
            { id: "healthy-10", image: "/healthy/image-1.png" },
            { id: "healthy-11", image: "/healthy/image-6.png" },
            { id: "healthy-12", image: "/healthy/image-2.png" }
          ]
        }),
        createWebsiteSection({
          id: "home-testimonials",
          sectionKey: "testimonials",
          sectionType: "testimonials",
          heading: "Google Reviews",
          body: "Google Reviews *****",
          items: [
            { id: "testimonial-1", title: "Perfect place. Love the concept.", body: "Perfect place. Love the concept. Love the food. Friendly employees also.", subtitle: "Jememar" },
            { id: "testimonial-2", title: "Great experience I loved it there..", body: "Great experience I loved it there.. The menu comes with different dishes and calories count.. perfect for athletes.. it also says that it is made from athletes to athletes.. The cheesecake there is a real piece of art .. so delicious and perfectly baked..", subtitle: "Chaimaa Boutjim" },
            { id: "testimonial-3", title: "Amazing quality and super clean place.", body: "I always find fresh options and the staff are very friendly. The portions are good and the service is fast.", subtitle: "Salma R." },
            { id: "testimonial-4", title: "Best healthy food spot in town.", body: "Great atmosphere and delicious meals. It is one of my favorite places after workouts.", subtitle: "Karim N." }
          ]
        })
      ]
    },
    {
      id: "menu",
      slug: "menu",
      title: "Menu",
      navLabel: "Menu",
      summary: "Hero and supporting CMS content around the menu.",
      kind: "system",
      status: "published",
      showInTopNav: true,
      heroTitle: "Browse our menu",
      heroBody: "Manage the menu page hero and supporting copy from the admin dashboard.",
      seoTitle: "Proteinbar Menu",
      seoDescription: "Browse menu categories and featured meals.",
      sections: []
    },
    {
      id: "locations",
      slug: "locations",
      title: "Locations",
      navLabel: "Locations",
      summary: "Hero and support copy for the locations page.",
      kind: "system",
      status: "published",
      showInTopNav: true,
      heroTitle: "Our Locations",
      heroBody: "Manage the locations page hero while the location cards stay data-driven.",
      seoTitle: "Proteinbar Locations",
      seoDescription: "Pickup points, delivery zones, and branch guidance.",
      sections: [
        createWebsiteSection({
          id: "locations-delivery-overview",
          sectionKey: "delivery-overview",
          sectionType: "stats",
          heading: "2 Locations & Delivery All Over Casablanca",
          body:
            "Besides Our 2 Locations, We Focus Bringing Healthy, Delicious Meals Right To Your Doorstep, Wherever You Are In Casablanca.",
          image: "/healthy/image-7.png",
          items: [
            { id: "delivery-stat-1", title: "Staff Members", value: "14", subtitle: "+", body: "users" },
            { id: "delivery-stat-2", title: "Opens everyday", value: "7", subtitle: "/7", body: "calendar" },
            { id: "delivery-stat-3", title: "Positive Reviews", value: "411", subtitle: "+", body: "thumbs-up" }
          ]
        })
      ]
    },
    {
      id: "meal-prep",
      slug: "meal-prep",
      title: "Meal Prep",
      navLabel: "Meal Prep",
      summary: "Meal prep landing page content.",
      kind: "system",
      status: "published",
      showInTopNav: true,
      heroTitle: "Meal Prep",
      heroBody: "Page-level content for your meal prep flow.",
      seoTitle: "Proteinbar Meal Prep",
      seoDescription: "Meal prep subscriptions and onboarding content.",
      sections: []
    },
    {
      id: "terms",
      slug: "terms-and-conditions",
      title: "Terms & Conditions",
      navLabel: "Terms",
      summary: "Legal terms for website use, ordering, delivery, and subscriptions.",
      kind: "legal",
      status: "published",
      showInTopNav: false,
      heroTitle: "Terms & Conditions",
      heroBody: "Control the legal text shown across the public website.",
      seoTitle: "Proteinbar Terms & Conditions",
      seoDescription: "Read the ordering, delivery, and subscription terms.",
      sections: [
        createWebsiteSection({
          id: "terms-section-0",
          sectionKey: "use-of-website",
          sectionType: "richText",
          heading: "Use Of Website",
          body:
            "By using the Proteinbar website, you agree to use it only for lawful purposes and in a way that does not interfere with the experience, security, or availability of the platform for other users."
        }),
        createWebsiteSection({
          id: "terms-section-1",
          sectionKey: "orders-and-availability",
          sectionType: "richText",
          heading: "Orders And Availability",
          body:
            "All orders are subject to availability, operational capacity, and confirmation. We reserve the right to update menu items, meal plan options, pricing, and availability without prior notice."
        }),
        createWebsiteSection({
          id: "terms-section-2",
          sectionKey: "pricing",
          sectionType: "richText",
          heading: "Pricing",
          body:
            "Prices displayed on the website are provided in good faith and may change when required. Taxes, delivery fees, or applicable service charges may be added depending on the order type and delivery zone."
        }),
        createWebsiteSection({
          id: "terms-section-3",
          sectionKey: "meal-plans-and-custom-selections",
          sectionType: "richText",
          heading: "Meal Plans And Custom Selections",
          body:
            "Meal plan and custom meal selections are based on the options available at the time of purchase. Product composition, macros, and ingredients may vary when supply or operational needs require substitutions."
        }),
        createWebsiteSection({
          id: "terms-section-4",
          sectionKey: "cancellations-and-changes",
          sectionType: "richText",
          heading: "Cancellations And Changes",
          body:
            "Requests to change or cancel an order are handled based on preparation status, delivery scheduling, and operational feasibility. Once preparation has started, changes may be limited or unavailable."
        }),
        createWebsiteSection({
          id: "terms-section-5",
          sectionKey: "allergies-and-dietary-responsibility",
          sectionType: "richText",
          heading: "Allergies And Dietary Responsibility",
          body:
            "Customers are responsible for reviewing ingredient and nutrition information before ordering. If you have allergies, intolerances, or specific dietary restrictions, please contact us before completing your purchase."
        }),
        createWebsiteSection({
          id: "terms-section-6",
          sectionKey: "liability",
          sectionType: "richText",
          heading: "Liability",
          body:
            "Proteinbar is not liable for indirect, incidental, or consequential damages resulting from use of the website, order delays, third-party service interruptions, or circumstances outside our reasonable control."
        }),
        createWebsiteSection({
          id: "terms-section-7",
          sectionKey: "changes-to-these-terms",
          sectionType: "richText",
          heading: "Changes To These Terms",
          body:
            "We may revise these Terms & Conditions from time to time. Continued use of the website or services after updates means you agree to the revised terms."
        })
      ]
    },
    {
      id: "privacy",
      slug: "privacy-policy",
      title: "Privacy Policy",
      navLabel: "Privacy",
      summary: "Privacy disclosures for customer accounts, contact data, and order history.",
      kind: "legal",
      status: "published",
      showInTopNav: false,
      heroTitle: "Privacy Policy",
      heroBody: "Manage customer-data policy copy and compliance text here.",
      seoTitle: "Proteinbar Privacy Policy",
      seoDescription: "Understand how Proteinbar stores and uses customer data.",
      sections: [
        createWebsiteSection({
          id: "privacy-section-1",
          sectionKey: "information-we-collect",
          sectionType: "richText",
          heading: "Information We Collect",
          body:
            "We may collect information you provide directly when you place an order, create a meal plan, contact us, or subscribe to updates. This can include your name, email address, phone number, delivery details, and order preferences."
        }),
        createWebsiteSection({
          id: "privacy-section-2",
          sectionKey: "how-we-use-your-information",
          sectionType: "richText",
          heading: "How We Use Your Information",
          body:
            "We use your information to process orders, manage deliveries, support your account experience, respond to inquiries, and improve our menu, meal plans, and customer service experience."
        }),
        createWebsiteSection({
          id: "privacy-section-3",
          sectionKey: "payments-and-orders",
          sectionType: "richText",
          heading: "Payments And Orders",
          body:
            "Payment and order information may be used to complete transactions, confirm bookings, prevent fraud, and maintain internal business records related to your purchases."
        }),
        createWebsiteSection({
          id: "privacy-section-4",
          sectionKey: "sharing-of-information",
          sectionType: "richText",
          heading: "Sharing Of Information",
          body:
            "We do not sell your personal information. We may share limited information with service providers or operational partners only when needed to process orders, deliver meals, provide support, or comply with legal obligations."
        }),
        createWebsiteSection({
          id: "privacy-section-5",
          sectionKey: "data-security",
          sectionType: "richText",
          heading: "Data Security",
          body:
            "We take reasonable steps to protect personal information using appropriate technical and organizational measures. However, no online system can guarantee absolute security."
        }),
        createWebsiteSection({
          id: "privacy-section-6",
          sectionKey: "your-choices",
          sectionType: "richText",
          heading: "Your Choices",
          body:
            "You may contact us to request updates or corrections to the personal information you have shared with us. You may also ask questions about how your information is handled."
        }),
        createWebsiteSection({
          id: "privacy-section-7",
          sectionKey: "policy-updates",
          sectionType: "richText",
          heading: "Policy Updates",
          body:
            "We may update this Privacy Policy from time to time to reflect operational, legal, or service changes. Continued use of our website or services after updates means you accept the revised policy."
        })
      ]
    },
    {
      id: "about-us",
      slug: "about-us",
      title: "About Us",
      navLabel: "About Us",
      summary: "Brand story and trust-building content.",
      kind: "system",
      status: "published",
      showInTopNav: true,
      heroTitle: "About Us",
      heroBody: "Control brand story and trust-building copy.",
      seoTitle: "About Proteinbar",
      seoDescription: "Learn more about Proteinbar.",
      sections: []
    },
    {
      id: "contact",
      slug: "contact",
      title: "Contact",
      navLabel: "Contact",
      summary: "Support and contact page content.",
      kind: "system",
      status: "published",
      showInTopNav: true,
      heroTitle: "Contact",
      heroBody: "Control support messaging and contact content.",
      seoTitle: "Contact Proteinbar",
      seoDescription: "Reach Proteinbar for support or questions.",
      sections: []
    }
  ];
}

async function ensureWebsitePagesSeeded() {
  const defaults = getDefaultWebsitePages();
  const existing = await WebsitePageModel.find({}, { pageId: 1, slug: 1 }).lean();
  const existingIds = new Set(existing.map((row) => String((row as Record<string, unknown>).pageId ?? "")));
  const existingSlugs = new Set(existing.map((row) => String((row as Record<string, unknown>).slug ?? "")));
  const missingPages = defaults.filter((page) => !existingIds.has(page.id));

  if (missingPages.length > 0) {
    await WebsitePageModel.insertMany(
      missingPages.map((page) => ({
        pageId: page.id,
        slug: page.slug,
        title: page.title,
        navLabel: page.navLabel,
        summary: page.summary,
        kind: page.kind,
        status: page.status,
        showInTopNav: page.showInTopNav,
        heroEyebrow: page.heroEyebrow ?? "",
        heroTitle: page.heroTitle,
        heroSubtitle: page.heroSubtitle ?? "",
        heroBody: page.heroBody ?? "",
        heroImage: page.heroImage ?? "",
        heroPrimaryCtaLabel: page.heroPrimaryCtaLabel ?? "",
        heroPrimaryCtaLink: page.heroPrimaryCtaLink ?? "",
        heroSecondaryCtaLabel: page.heroSecondaryCtaLabel ?? "",
        heroSecondaryCtaLink: page.heroSecondaryCtaLink ?? "",
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        sections: page.sections
      }))
    );
  }

  await Promise.all(
    defaults.map(async (page) => {
      if (!legalPageIds.has(page.id)) {
        return;
      }

      const legacySlug =
        page.slug === "terms-and-conditions"
          ? "terms"
          : page.slug === "privacy-policy"
            ? "privacy"
            : "";

      const conflictingRecord =
        legacySlug && !existingSlugs.has(page.slug)
          ? await WebsitePageModel.findOne({ slug: legacySlug }).lean()
          : null;

      if (conflictingRecord) {
        await WebsitePageModel.updateOne(
          { _id: conflictingRecord._id },
          {
            $set: {
              pageId: page.id,
              slug: page.slug,
              title: page.title,
              navLabel: page.navLabel,
              summary: page.summary,
              kind: page.kind,
              status: page.status,
              showInTopNav: page.showInTopNav,
              heroEyebrow: page.heroEyebrow ?? "",
              heroTitle: page.heroTitle,
              heroSubtitle: page.heroSubtitle ?? "",
              heroBody: page.heroBody ?? "",
              heroImage: page.heroImage ?? "",
              heroPrimaryCtaLabel: page.heroPrimaryCtaLabel ?? "",
              heroPrimaryCtaLink: page.heroPrimaryCtaLink ?? "",
              heroSecondaryCtaLabel: page.heroSecondaryCtaLabel ?? "",
              heroSecondaryCtaLink: page.heroSecondaryCtaLink ?? "",
              seoTitle: page.seoTitle,
              seoDescription: page.seoDescription,
              sections: page.sections
            }
          }
        );
        return;
      }

      await WebsitePageModel.updateOne(
        { pageId: page.id },
        {
          $set: {
            slug: page.slug,
            kind: "legal"
          }
        }
      );

      const currentLegalPage = await WebsitePageModel.findOne({ pageId: page.id }, { sections: 1 }).lean();
      const currentSections = Array.isArray(currentLegalPage?.sections) ? currentLegalPage.sections : [];

      if (currentSections.length > 0 && currentSections.length < page.sections.length) {
        await WebsitePageModel.updateOne(
          { pageId: page.id },
          {
            $set: {
              sections: page.sections
            }
          }
        );
      }
    })
  );
}

async function normalizeWebsiteRepeaterItem(item: WebsiteRepeaterItemPayload, index: number): Promise<WebsiteRepeaterItemPayload> {
  return {
    id: item.id?.trim() || `item-${Date.now()}-${index}`,
    title: String(item.title ?? "").trim(),
    subtitle: String(item.subtitle ?? "").trim(),
    body: String(item.body ?? "").trim(),
    label: String(item.label ?? "").trim(),
    link: String(item.link ?? "").trim(),
    value: String(item.value ?? "").trim(),
    image: await uploadImageIfNeeded(normalizeImageInput(item.image ?? ""), { folder: "proteinbar/website-pages/items" })
  };
}

async function normalizeWebsiteSection(
  section: WebsitePageSectionPayload,
  index: number
): Promise<WebsitePageSectionPayload> {
  return {
    id: section.id?.trim() || `section-${Date.now()}-${index}`,
    sectionKey: toSlug(section.sectionKey || section.heading || `section-${index + 1}`),
    sectionType: section.sectionType ?? "richText",
    isVisible: section.isVisible ?? true,
    sortOrder: Number.isFinite(section.sortOrder) ? Number(section.sortOrder) : index,
    heading: String(section.heading ?? "").trim(),
    body: String(section.body ?? "").trim(),
    eyebrow: String(section.eyebrow ?? "").trim(),
    image: await uploadImageIfNeeded(normalizeImageInput(section.image ?? ""), { folder: "proteinbar/website-pages/sections" }),
    buttonLabel: String(section.buttonLabel ?? "").trim(),
    buttonLink: String(section.buttonLink ?? "").trim(),
    items: await Promise.all((section.items ?? []).map((item, itemIndex) => normalizeWebsiteRepeaterItem(item, itemIndex)))
  };
}

async function normalizeWebsitePagePayload(payload: WebsitePagePayload): Promise<WebsitePagePayload> {
  const normalizedId = payload.id.trim();
  const normalizedSlug = toSlug(payload.slug || payload.title) || normalizedId;

  return {
    ...payload,
    id: normalizedId,
    slug: normalizedSlug,
    title: payload.title.trim(),
    navLabel: payload.navLabel.trim() || payload.title.trim(),
    summary: payload.summary.trim(),
    heroEyebrow: String(payload.heroEyebrow ?? "").trim(),
    heroTitle: payload.heroTitle.trim(),
    heroSubtitle: String(payload.heroSubtitle ?? "").trim(),
    heroBody: String(payload.heroBody ?? "").trim(),
    heroImage: await uploadImageIfNeeded(normalizeImageInput(payload.heroImage ?? ""), { folder: "proteinbar/website-pages/heroes" }),
    heroPrimaryCtaLabel: String(payload.heroPrimaryCtaLabel ?? "").trim(),
    heroPrimaryCtaLink: String(payload.heroPrimaryCtaLink ?? "").trim(),
    heroSecondaryCtaLabel: String(payload.heroSecondaryCtaLabel ?? "").trim(),
    heroSecondaryCtaLink: String(payload.heroSecondaryCtaLink ?? "").trim(),
    seoTitle: payload.seoTitle.trim(),
    seoDescription: payload.seoDescription.trim(),
    sections: await Promise.all((payload.sections ?? []).map((section, index) => normalizeWebsiteSection(section, index)))
  };
}

function toWebsitePageRecord(row: Record<string, unknown>): WebsitePagePayload {
  const sections = Array.isArray(row.sections) ? row.sections : [];

  return {
    id: String(row.pageId ?? row.id ?? ""),
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    navLabel: String(row.navLabel ?? row.title ?? ""),
    summary: String(row.summary ?? ""),
    kind: String(row.kind ?? "system") === "legal" ? "legal" : String(row.kind ?? "system") === "custom" ? "custom" : "system",
    status: String(row.status ?? "draft") === "published" ? "published" : "draft",
    showInTopNav: Boolean(row.showInTopNav),
    heroEyebrow: String(row.heroEyebrow ?? ""),
    heroTitle: String(row.heroTitle ?? ""),
    heroSubtitle: String(row.heroSubtitle ?? ""),
    heroBody: String(row.heroBody ?? ""),
    heroImage: normalizeImageInput(row.heroImage ?? ""),
    heroPrimaryCtaLabel: String(row.heroPrimaryCtaLabel ?? ""),
    heroPrimaryCtaLink: String(row.heroPrimaryCtaLink ?? ""),
    heroSecondaryCtaLabel: String(row.heroSecondaryCtaLabel ?? ""),
    heroSecondaryCtaLink: String(row.heroSecondaryCtaLink ?? ""),
    seoTitle: String(row.seoTitle ?? ""),
    seoDescription: String(row.seoDescription ?? ""),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt ?? new Date().toISOString()),
    sections: sections
      .map((section, index) => {
        const item = section as Record<string, unknown>;
        return {
          id: String(item.id ?? `section-${index}`),
          sectionKey: String(item.sectionKey ?? `section-${index + 1}`),
          sectionType: item.sectionType as WebsiteSectionType,
          isVisible: Boolean(item.isVisible ?? true),
          sortOrder: Number(item.sortOrder ?? index),
          heading: String(item.heading ?? ""),
          body: String(item.body ?? ""),
          eyebrow: String(item.eyebrow ?? ""),
          image: normalizeImageInput(item.image ?? ""),
          buttonLabel: String(item.buttonLabel ?? ""),
          buttonLink: String(item.buttonLink ?? ""),
          items: Array.isArray(item.items)
            ? item.items.map((child, childIndex) => {
                const childRow = child as Record<string, unknown>;
                return {
                  id: String(childRow.id ?? `item-${index}-${childIndex}`),
                  title: String(childRow.title ?? ""),
                  subtitle: String(childRow.subtitle ?? ""),
                  body: String(childRow.body ?? ""),
                  label: String(childRow.label ?? ""),
                  link: String(childRow.link ?? ""),
                  value: String(childRow.value ?? ""),
                  image: normalizeImageInput(childRow.image ?? "")
                };
              })
            : []
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
  };
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
    const normalizedPayload = await uploadImageField(payload, {
      sourceKey: "imageUrl",
      fallbackKey: "image",
      targetKey: "imageUrl",
      folder: "proteinbar/products"
    });
    const row = await ProductModel.create(normalizedPayload);
    return formatProduct(row.toObject() as Record<string, unknown>);
  },
  async updateProduct(id: string, payload: Record<string, unknown>) {
    const normalizedPayload = await uploadImageField(payload, {
      sourceKey: "imageUrl",
      fallbackKey: "image",
      targetKey: "imageUrl",
      folder: "proteinbar/products"
    });
    const row = await ProductModel.findByIdAndUpdate(id, normalizedPayload, { new: true });
    if (!row) throw new AppError(404, "Product not found");
    return formatProduct(row.toObject() as Record<string, unknown>);
  },
  async deleteProduct(id: string) {
    const row = await ProductModel.findByIdAndDelete(id);
    if (!row) throw new AppError(404, "Product not found");
  },

  async listMenuItems() {
    const [rows, restaurants] = await Promise.all([
      MenuItemModel.find().sort({ priority: 1, createdAt: -1 }).lean(),
      RestaurantModel.find({}, { restaurantId: 1, name: 1 }).lean()
    ]);
    const restaurantNameById = new Map(
      restaurants.map((restaurant) => [
        String((restaurant as Record<string, unknown>).restaurantId ?? ""),
        String((restaurant as Record<string, unknown>).name ?? "")
      ])
    );
    const restaurantIdByName = new Map(
      restaurants.map((restaurant) => [
        String((restaurant as Record<string, unknown>).name ?? "").trim().toLowerCase(),
        String((restaurant as Record<string, unknown>).restaurantId ?? "")
      ])
    );

    return rows.map((row) => {
      const item = row as unknown as Record<string, unknown>;
      const legacyRestaurantNames = normalizeStringList(item.restaurants);
      const restaurantIds = normalizeStringList(item.restaurantIds);
      const resolvedRestaurantIds =
        restaurantIds.length > 0
          ? restaurantIds
          : findRestaurantIdByName(restaurantIdByName, legacyRestaurantNames);
      const restaurants = resolvedRestaurantIds
        .map((restaurantId) => restaurantNameById.get(restaurantId) ?? restaurantId)
        .filter(Boolean);

      return {
        ...item,
        image: normalizeImageInput(item.image),
        restaurantIds: resolvedRestaurantIds,
        restaurants: restaurants.length > 0 ? restaurants : legacyRestaurantNames
      };
    });
  },
  async listRestaurants() {
    return RestaurantModel.find().sort({ createdAt: -1 }).lean();
  },
  async createRestaurant(payload: Record<string, unknown>) {
    return RestaurantModel.create(payload);
  },
  async updateRestaurant(id: string, payload: Record<string, unknown>) {
    const row = await RestaurantModel.findByIdAndUpdate(id, payload, { new: true });
    if (!row) throw new AppError(404, "Restaurant not found");
    return row;
  },
  async deleteRestaurant(id: string) {
    const row = await RestaurantModel.findByIdAndDelete(id);
    if (!row) throw new AppError(404, "Restaurant not found");
  },
  async createMenuItem(payload: Record<string, unknown>) {
    const normalizedPayload = await uploadImageField(payload, {
      sourceKey: "image",
      targetKey: "image",
      folder: "proteinbar/menu-items"
    });
    const restaurantIds = normalizeStringList(normalizedPayload.restaurantIds);
    return MenuItemModel.create({
      ...normalizedPayload,
      restaurantIds,
      restaurants: await getRestaurantNamesByIds(restaurantIds)
    });
  },
  async updateMenuItem(id: string, payload: Record<string, unknown>) {
    const normalizedPayload = await uploadImageField(payload, {
      sourceKey: "image",
      targetKey: "image",
      folder: "proteinbar/menu-items"
    });
    const restaurantIds = normalizeStringList(normalizedPayload.restaurantIds);
    const row = await MenuItemModel.findByIdAndUpdate(
      id,
      {
        ...normalizedPayload,
        restaurantIds,
        restaurants: await getRestaurantNamesByIds(restaurantIds)
      },
      { new: true }
    );
    if (!row) throw new AppError(404, "Menu item not found");
    return row;
  },
  async deleteMenuItem(id: string) {
    const row = await MenuItemModel.findByIdAndDelete(id);
    if (!row) throw new AppError(404, "Menu item not found");
  },

  async listLocations() {
    const rows = await LocationModel.find().sort({ createdAt: -1 }).lean();
    return rows.map((row) => toLocation(row as unknown as Record<string, unknown>));
  },
  async createLocation(payload: Record<string, unknown>) {
    const uploadedImage = await uploadImageIfNeeded(
      normalizeImageInput(payload.image ?? payload.imageUrl ?? ""),
      { folder: "proteinbar/locations" }
    );
    const normalizedPayload = {
      locationId: String(payload.locationId ?? payload.id ?? "").trim(),
      name: String(payload.name ?? "").trim(),
      type: String(payload.type ?? "both").trim() || "both",
      pickupAddress: String(payload.pickupAddress ?? payload.address ?? "").trim(),
      image: uploadedImage,
      phone: String(payload.phone ?? "").trim(),
      mapLink: String(payload.mapLink ?? payload.googleMapsUrl ?? "").trim(),
      ratingText: String(payload.ratingText ?? "").trim(),
      isActive: Boolean(payload.isActive ?? true),
      deliveryZone: String(payload.deliveryZone ?? "N/A").trim() || "N/A",
      deliveryFee: String(payload.deliveryFee ?? "$0.00").trim() || "$0.00",
      workingDays: normalizeStringList(payload.workingDays),
      cutoffTime: String(payload.cutoffTime ?? "-").trim() || "-",
      timeSlots: normalizeStringList(payload.timeSlots),
      supportedOptions: normalizeStringList(payload.supportedOptions)
    };
    const row = await LocationModel.create(normalizedPayload);
    return toLocation(row.toObject() as Record<string, unknown>);
  },
  async updateLocation(id: string, payload: Record<string, unknown>) {
    const updatePayload: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(payload, "locationId") || Object.prototype.hasOwnProperty.call(payload, "id")) {
      updatePayload.locationId = String(payload.locationId ?? payload.id ?? "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(payload, "name")) {
      updatePayload.name = String(payload.name ?? "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(payload, "type")) {
      updatePayload.type = String(payload.type ?? "both").trim() || "both";
    }
    if (Object.prototype.hasOwnProperty.call(payload, "pickupAddress") || Object.prototype.hasOwnProperty.call(payload, "address")) {
      updatePayload.pickupAddress = String(payload.pickupAddress ?? payload.address ?? "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(payload, "image") || Object.prototype.hasOwnProperty.call(payload, "imageUrl")) {
      updatePayload.image = await uploadImageIfNeeded(
        normalizeImageInput(payload.image ?? payload.imageUrl ?? ""),
        { folder: "proteinbar/locations" }
      );
    }
    if (Object.prototype.hasOwnProperty.call(payload, "phone")) {
      updatePayload.phone = String(payload.phone ?? "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(payload, "mapLink") || Object.prototype.hasOwnProperty.call(payload, "googleMapsUrl")) {
      updatePayload.mapLink = String(payload.mapLink ?? payload.googleMapsUrl ?? "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(payload, "ratingText")) {
      updatePayload.ratingText = String(payload.ratingText ?? "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(payload, "isActive")) {
      updatePayload.isActive = Boolean(payload.isActive);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "deliveryZone")) {
      updatePayload.deliveryZone = String(payload.deliveryZone ?? "N/A").trim() || "N/A";
    }
    if (Object.prototype.hasOwnProperty.call(payload, "deliveryFee")) {
      updatePayload.deliveryFee = String(payload.deliveryFee ?? "$0.00").trim() || "$0.00";
    }
    if (Object.prototype.hasOwnProperty.call(payload, "workingDays")) {
      updatePayload.workingDays = normalizeStringList(payload.workingDays);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "cutoffTime")) {
      updatePayload.cutoffTime = String(payload.cutoffTime ?? "-").trim() || "-";
    }
    if (Object.prototype.hasOwnProperty.call(payload, "timeSlots")) {
      updatePayload.timeSlots = normalizeStringList(payload.timeSlots);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "supportedOptions")) {
      updatePayload.supportedOptions = normalizeStringList(payload.supportedOptions);
    }

    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { locationId: id }] }
      : { locationId: id };
    const row = await LocationModel.findOneAndUpdate(query, updatePayload, { new: true });
    if (!row) throw new AppError(404, "Location not found");
    return toLocation(row.toObject() as Record<string, unknown>);
  },
  async deleteLocation(id: string) {
    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { locationId: id }] }
      : { locationId: id };
    const row = await LocationModel.findOneAndDelete(query);
    if (!row) throw new AppError(404, "Location not found");
  },

  async listMonthlyPlans() {
    const rows = await MonthlyPlanModel.find().sort({ createdAt: -1 }).lean();
    return rows.map((row) => {
      const item = row as unknown as Record<string, unknown>;
      return {
        ...item,
        imageUrl: normalizeImageInput(item.imageUrl)
      };
    });
  },
  async createMonthlyPlan(payload: Record<string, unknown>) {
    const normalizedPayload = await uploadImageField(payload, {
      sourceKey: "imageUrl",
      fallbackKey: "image",
      targetKey: "imageUrl",
      folder: "proteinbar/monthly-plans"
    });
    return MonthlyPlanModel.create(normalizedPayload);
  },
  async updateMonthlyPlan(id: string, payload: Record<string, unknown>) {
    const normalizedPayload = await uploadImageField(payload, {
      sourceKey: "imageUrl",
      fallbackKey: "image",
      targetKey: "imageUrl",
      folder: "proteinbar/monthly-plans"
    });
    const row = await MonthlyPlanModel.findByIdAndUpdate(id, normalizedPayload, { new: true });
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

    const hasPlanImage = Object.prototype.hasOwnProperty.call(normalized.plan, "image");
    if (hasPlanImage) {
      normalized.plan = {
        ...normalized.plan,
        image: await uploadImageIfNeeded(normalized.plan.image, { folder: "proteinbar/monthly-plans" })
      };
    }

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
    const hasImage = payload.image !== undefined;
    const normalizedImage = hasImage
      ? await uploadImageIfNeeded(normalizeMealImage(payload.image), { folder: "proteinbar/meals" })
      : undefined;
    const updatePayload: Record<string, unknown> = {
      mealId: payload.id,
      name: payload.name.trim(),
      mealType: payload.mealType,
      calories: Number(payload.calories),
      protein: Number(payload.protein),
      carbs: Number(payload.carbs),
      fat: Number(payload.fat),
      tags: payload.tags ?? [],
      status: payload.status
    };
    if (hasImage) {
      updatePayload.image = normalizedImage;
    }
    const row = await MealLibraryItemModel.findOneAndUpdate(
      { mealId: payload.id },
      updatePayload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return toMealLibraryItem(row as unknown as Record<string, unknown>);
  },

  async deleteMealLibraryAdmin(id: string) {
    const row = await MealLibraryItemModel.findOneAndDelete({ mealId: id });
    if (!row) throw new AppError(404, "Meal not found");
  },

  async listCustomPlanCategoriesAdmin(planId: string) {
    const rows = await CustomPlanCategoryModel.find({ planId }).sort({ displayOrder: 1, createdAt: 1 }).lean();
    return rows.map((row) => toCustomPlanCategory(row as unknown as Record<string, unknown>));
  },

  async upsertCustomPlanCategoryAdmin(payload: CustomPlanCategoryPayload) {
    const planId = payload.planId.trim();
    const name = payload.name.trim();
    if (!planId) throw new AppError(400, "Plan is required for category.");
    if (!name) throw new AppError(400, "Category name is required.");
    if (payload.minSelect < 0) throw new AppError(400, "Minimum selection cannot be negative.");

    const selectionMode = toSelectionMode(payload.selectionMode);
    const maxSelect = selectionMode === "single" ? 1 : payload.maxSelect ?? null;
    if (maxSelect !== null && payload.minSelect > maxSelect) {
      throw new AppError(400, "Minimum selection cannot be greater than maximum selection.");
    }

    const existing = payload.id
      ? await CustomPlanCategoryModel.findOne({ categoryId: payload.id }).lean()
      : null;
    const siblingCount = await CustomPlanCategoryModel.countDocuments({
      planId,
      ...(payload.id ? { categoryId: { $ne: payload.id } } : {})
    });

    const categoryId = payload.id || `custom-category-${Date.now()}`;
    const row = await CustomPlanCategoryModel.findOneAndUpdate(
      { categoryId },
      {
        categoryId,
        planId,
        name,
        slug: payload.slug?.trim() || toSlug(name) || categoryId,
        code: payload.code?.trim() || "",
        displayOrder: payload.displayOrder ?? Number((existing as Record<string, unknown> | null)?.displayOrder ?? siblingCount + 1),
        selectionMode,
        isActive: payload.isActive,
        isRequired: payload.isRequired,
        minSelect: payload.minSelect,
        maxSelect
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return toCustomPlanCategory(row as unknown as Record<string, unknown>);
  },

  async deleteCustomPlanCategoryAdmin(id: string) {
    const row = await CustomPlanCategoryModel.findOneAndDelete({ categoryId: id }).lean();
    if (!row) throw new AppError(404, "Custom plan category not found");
    await CustomPlanFoodItemModel.deleteMany({ categoryId: id });
    return { id };
  },

  async reorderCustomPlanCategoriesAdmin(planId: string, categoryIds: string[]) {
    await Promise.all(
      categoryIds.map((categoryId, index) =>
        CustomPlanCategoryModel.findOneAndUpdate(
          { categoryId, planId },
          { displayOrder: index + 1 }
        )
      )
    );
    return this.listCustomPlanCategoriesAdmin(planId);
  },

  async listCustomPlanFoodItemsAdmin(planId: string, categoryId?: string) {
    const rows = await CustomPlanFoodItemModel.find({
      planId,
      ...(categoryId ? { categoryId } : {})
    })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();
    return rows.map((row) => toCustomPlanFoodItem(row as unknown as Record<string, unknown>));
  },

  async upsertCustomPlanFoodItemAdmin(payload: CustomPlanFoodItemPayload) {
    const planId = payload.planId.trim();
    const categoryId = payload.categoryId.trim();
    const name = payload.name.trim();
    if (!planId) throw new AppError(400, "Plan is required for food item.");
    if (!categoryId) throw new AppError(400, "Category is required for food item.");
    if (!name) throw new AppError(400, "Food item name is required.");
    if (!payload.sizes.length) throw new AppError(400, "At least one size is required.");

    const category = await CustomPlanCategoryModel.findOne({ categoryId, planId }).lean();
    if (!category) throw new AppError(400, "Selected category does not exist.");

    payload.sizes.forEach((size) => {
      if (!size.label.trim()) throw new AppError(400, "Size label is required.");
      if ([size.price, size.calories, size.protein, size.carbs, size.fat].some((value) => Number(value) < 0)) {
        throw new AppError(400, "Size values cannot be negative.");
      }
    });

    const existing = payload.id
      ? await CustomPlanFoodItemModel.findOne({ foodItemId: payload.id }).lean()
      : null;
    const siblingCount = await CustomPlanFoodItemModel.countDocuments({
      planId,
      categoryId,
      ...(payload.id ? { foodItemId: { $ne: payload.id } } : {})
    });
    const foodItemId = payload.id || `custom-food-${Date.now()}`;
    const uploadedImageUrl = await uploadImageIfNeeded(payload.imageUrl, {
      folder: "proteinbar/custom-plan-items"
    });

    const row = await CustomPlanFoodItemModel.findOneAndUpdate(
      { foodItemId },
      {
        foodItemId,
        planId,
        categoryId,
        name,
        imageUrl: uploadedImageUrl,
        description: payload.description?.trim() || "",
        displayOrder: payload.displayOrder ?? Number((existing as Record<string, unknown> | null)?.displayOrder ?? siblingCount + 1),
        isActive: payload.isActive,
        sizes: payload.sizes.map((size, index) => ({
          id: size.id || `custom-size-${Date.now()}-${index}`,
          foodItemId,
          label: size.label.trim(),
          unit: size.unit?.trim() || "",
          price: Number(size.price),
          calories: Number(size.calories),
          protein: Number(size.protein),
          carbs: Number(size.carbs),
          fat: Number(size.fat),
          displayOrder: size.displayOrder ?? index + 1,
          isActive: size.isActive ?? true
        }))
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return toCustomPlanFoodItem(row as unknown as Record<string, unknown>);
  },

  async deleteCustomPlanFoodItemAdmin(id: string) {
    const row = await CustomPlanFoodItemModel.findOneAndDelete({ foodItemId: id }).lean();
    if (!row) throw new AppError(404, "Custom plan food item not found");
    return { id };
  },

  async reorderCustomPlanFoodItemsAdmin(planId: string, categoryId: string, itemIds: string[]) {
    await Promise.all(
      itemIds.map((foodItemId, index) =>
        CustomPlanFoodItemModel.findOneAndUpdate(
          { foodItemId, planId },
          {
            categoryId,
            displayOrder: index + 1
          }
        )
      )
    );
    return this.listCustomPlanFoodItemsAdmin(planId, categoryId);
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

    const [mealRows, customCategoryRows, customFoodRows] = await Promise.all([
      MealLibraryItemModel.find({ status: "active" }).lean(),
      CustomPlanCategoryModel.find({ planId, isActive: true }).sort({ displayOrder: 1, createdAt: 1 }).lean(),
      CustomPlanFoodItemModel.find({ planId, isActive: true }).sort({ displayOrder: 1, createdAt: 1 }).lean()
    ]);

    return {
      ...details,
      mealLibrary: mealRows.map((item) => toMealLibraryItem(item as unknown as Record<string, unknown>)),
      customPlanBuilder: {
        categories: customCategoryRows.map((item) => toCustomPlanCategory(item as unknown as Record<string, unknown>)),
        foodItems: customFoodRows
          .map((item) => toCustomPlanFoodItem(item as unknown as Record<string, unknown>))
          .map((item) => ({
            ...item,
            sizes: item.sizes.filter((size) => size.isActive)
          }))
          .filter((item) => item.sizes.length > 0)
      }
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
  async getOrderById(id: string) {
    const order = await OrderModel.findById(id).lean();
    if (!order) throw new AppError(404, "Order not found");
    return order;
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
  async getSubscriptionById(id: string) {
    const subscription = await SubscriptionModel.findById(id).lean();
    if (!subscription) throw new AppError(404, "Subscription not found");
    return subscription;
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
  },

  async listPromoCodes() {
    const rows = await PromoCodeModel.find().sort({ createdAt: -1 }).lean();
    return rows.map((row) => toPromoCodeRecord(row as unknown as Record<string, unknown>));
  },

  async getPromoCodeById(id: string) {
    const row = await PromoCodeModel.findOne({ promoCodeId: id }).lean();
    if (!row) throw new AppError(404, "Promo code not found");
    return toPromoCodeRecord(row as unknown as Record<string, unknown>);
  },

  async upsertPromoCode(payload: PromoCodePayload) {
    const normalized = normalizePromoCodePayload(payload);

    const existingByCode = await PromoCodeModel.findOne({
      code: normalized.code,
      promoCodeId: { $ne: normalized.id }
    }).lean();

    if (existingByCode) {
      throw new AppError(409, "Promo code already exists");
    }

    const row = await PromoCodeModel.findOneAndUpdate(
      { promoCodeId: normalized.id },
      {
        promoCodeId: normalized.id,
        code: normalized.code,
        description: normalized.description ?? "",
        discountType: normalized.discountType,
        discountValue: normalized.discountValue,
        maxDiscount: normalized.maxDiscount ?? null,
        startDate: normalized.startDate,
        endDate: normalized.endDate ?? "",
        usageLimit: normalized.usageLimit ?? null,
        usedCount: Number(normalized.usedCount ?? 0),
        isActive: normalized.isActive,
        appliesToMonthlyPlans: normalized.appliesToMonthlyPlans,
        appliesToDirectOrders: normalized.appliesToDirectOrders,
        stackable: normalized.stackable,
        showOnHomepage: normalized.showOnHomepage,
        eligibilityNote: normalized.eligibilityNote ?? ""
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return toPromoCodeRecord(row as unknown as Record<string, unknown>);
  },

  async deletePromoCode(id: string) {
    const row = await PromoCodeModel.findOneAndDelete({ promoCodeId: id }).lean();
    if (!row) throw new AppError(404, "Promo code not found");
    return { id };
  },

  async validatePromoCode(
    code: string,
    scope: "monthly-plan" | "direct-order",
    subtotal: number
  ) {
    const normalizedCode = String(code ?? "").trim().toUpperCase();
    if (!normalizedCode) {
      throw new AppError(400, "Promo code is required");
    }

    const numericSubtotal = Number(subtotal ?? 0);
    if (!Number.isFinite(numericSubtotal) || numericSubtotal <= 0) {
      throw new AppError(400, "Subtotal must be greater than 0");
    }

    const row = await PromoCodeModel.findOne({ code: normalizedCode }).lean();
    if (!row) throw new AppError(404, "Promo code not found");

    const promoCode = toPromoCodeRecord(row as unknown as Record<string, unknown>);
    const today = getNowDateOnly();

    if (!promoCode.isActive) {
      throw new AppError(400, "Promo code is inactive");
    }
    if (promoCode.startDate && promoCode.startDate > today) {
      throw new AppError(400, "Promo code is not active yet");
    }
    if (promoCode.endDate && promoCode.endDate < today) {
      throw new AppError(400, "Promo code has expired");
    }
    if (promoCode.usageLimit !== null && promoCode.usedCount >= promoCode.usageLimit) {
      throw new AppError(400, "Promo code usage limit reached");
    }
    if (scope === "monthly-plan" && !promoCode.appliesToMonthlyPlans) {
      throw new AppError(400, "Promo code is not valid for meal plans");
    }
    if (scope === "direct-order" && !promoCode.appliesToDirectOrders) {
      throw new AppError(400, "Promo code is not valid for direct orders");
    }

    return {
      promoCode,
      discountAmount: calculatePromoDiscount(promoCode, numericSubtotal)
    };
  },

  async incrementPromoCodeUsage(id: string) {
    await PromoCodeModel.updateOne({ promoCodeId: id }, { $inc: { usedCount: 1 } });
  },

  async listWebsitePages() {
    await ensureWebsitePagesSeeded();
    const rows = await WebsitePageModel.find().sort({ title: 1 }).lean();
    return rows.map((row) => toWebsitePageRecord(row as unknown as Record<string, unknown>));
  },

  async listLegalPages() {
    await ensureWebsitePagesSeeded();
    const rows = await WebsitePageModel.find({ kind: "legal" }).sort({ title: 1 }).lean();
    return rows.map((row) => toWebsitePageRecord(row as unknown as Record<string, unknown>));
  },

  async getWebsitePageBySlug(slug: string) {
    await ensureWebsitePagesSeeded();
    const normalizedSlug = resolveWebsitePageSlug(slug.trim());
    const row = await WebsitePageModel.findOne({ slug: normalizedSlug }).lean();
    if (!row) throw new AppError(404, "Website page not found");
    return toWebsitePageRecord(row as unknown as Record<string, unknown>);
  },

  async getLegalPageBySlug(slug: string) {
    const page = await this.getWebsitePageBySlug(slug);
    if (page.kind !== "legal") {
      throw new AppError(404, "Legal page not found");
    }
    return page;
  },

  async upsertWebsitePage(payload: WebsitePagePayload) {
    await ensureWebsitePagesSeeded();
    const normalized = await normalizeWebsitePagePayload(payload);

    const row = await WebsitePageModel.findOneAndUpdate(
      { pageId: normalized.id },
      {
        pageId: normalized.id,
        slug: normalized.slug,
        title: normalized.title,
        navLabel: normalized.navLabel,
        summary: normalized.summary,
        kind: normalized.kind,
        status: normalized.status,
        showInTopNav: normalized.showInTopNav,
        heroEyebrow: normalized.heroEyebrow ?? "",
        heroTitle: normalized.heroTitle,
        heroSubtitle: normalized.heroSubtitle ?? "",
        heroBody: normalized.heroBody ?? "",
        heroImage: normalized.heroImage ?? "",
        heroPrimaryCtaLabel: normalized.heroPrimaryCtaLabel ?? "",
        heroPrimaryCtaLink: normalized.heroPrimaryCtaLink ?? "",
        heroSecondaryCtaLabel: normalized.heroSecondaryCtaLabel ?? "",
        heroSecondaryCtaLink: normalized.heroSecondaryCtaLink ?? "",
        seoTitle: normalized.seoTitle,
        seoDescription: normalized.seoDescription,
        sections: normalized.sections
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return toWebsitePageRecord(row as unknown as Record<string, unknown>);
  },

  async upsertLegalPage(slug: string, payload: WebsitePagePayload) {
    const existingPage = await this.getLegalPageBySlug(slug);
    return this.upsertWebsitePage({
      ...payload,
      id: existingPage.id,
      slug: resolveWebsitePageSlug(slug),
      kind: "legal",
      showInTopNav: false
    });
  },

  async deleteWebsitePage(id: string) {
    const row = await WebsitePageModel.findOneAndDelete({ pageId: id }).lean();
    if (!row) throw new AppError(404, "Website page not found");
    return { id };
  }
};
