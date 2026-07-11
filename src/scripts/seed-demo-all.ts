import mongoose from "mongoose";
import { connectDb } from "../config/db";
import {
  CustomPlanCategoryModel,
  CustomPlanFoodItemModel,
  IngredientModel,
  LocationModel,
  MealLibraryItemModel,
  MenuItemModel,
  MonthlyPlanDetailsModel,
  MonthlyPlanModel,
  NotificationModel,
  OrderModel,
  ProductModel,
  PromoCodeModel,
  RestaurantModel,
  SubscriptionModel,
  WebsitePageModel,
} from "../modules/admin/admin.model";
import { AdminRoleModel, UserModel } from "../modules/auth/auth.model";
import {
  CustomerOrderModel,
  CustomerSubscriptionModel,
  MenuCategoryModel,
  PublicLocationModel,
  StoreProductModel,
} from "../modules/public/public.model";

type SeedTask = {
  name: string;
  run: () => Promise<unknown>;
};

function insertOnly<T extends Record<string, unknown>>(
  model: { updateOne: (filter: Record<string, unknown>, update: Record<string, unknown>, options: Record<string, unknown>) => Promise<unknown> },
  filter: Record<string, unknown>,
  document: T,
) {
  return model.updateOne(filter, { $setOnInsert: document }, { upsert: true });
}

async function main() {
  await connectDb();

  const subscriptionId = "SUB-DEMO-ADMIN-001";
  const orderId = "ORD-DEMO-ADMIN-001";
  const today = new Date().toISOString().split("T")[0];

  const selectedMeals = [
    {
      instanceId: "seed-meal-2026-07-13-lunch",
      id: "seed-chicken-burrito-bowl",
      title: "Chicken Burrito Bowl",
      date: "2026-07-13",
      extrasSummary: "Extra chicken",
      calories: 620,
      protein: 48,
      carb: 58,
      fat: 18,
      basePrice: 14,
      totalPrice: 16,
    },
    {
      instanceId: "seed-meal-2026-07-14-lunch",
      id: "seed-salmon-power-box",
      title: "Salmon Power Box",
      date: "2026-07-14",
      extrasSummary: "",
      calories: 540,
      protein: 42,
      carb: 44,
      fat: 20,
      basePrice: 17,
      totalPrice: 17,
    },
  ];

  const tasks: SeedTask[] = [
    {
      name: "admin roles",
      run: () =>
        Promise.all([
          insertOnly(AdminRoleModel, { roleId: "role-super-admin" }, {
            roleId: "role-super-admin",
            name: "Super Admin",
            description: "Full dashboard access and user management.",
            scopes: ["all", "admin-users", "admin-roles"],
            allowedPages: ["/admin"],
            canPublish: true,
            canManageUsers: true,
            isSystem: true,
          }),
          insertOnly(AdminRoleModel, { roleId: "role-admin" }, {
            roleId: "role-admin",
            name: "Admin",
            description: "Operational admin with broad dashboard access.",
            scopes: ["operations", "content"],
            allowedPages: ["/admin", "/admin/orders", "/admin/subscriptions", "/admin/products", "/admin/menu", "/admin/profile"],
            canPublish: true,
            canManageUsers: false,
            isSystem: true,
          }),
        ]),
    },
    {
      name: "demo admin user",
      run: () =>
        insertOnly(UserModel, { email: "demo.admin@proteinbargroup.com" }, {
          email: "demo.admin@proteinbargroup.com",
          role: "admin",
          password: "admin12345",
          fullName: "Demo Admin",
          adminRoleId: "role-admin",
          allowedPages: [],
          canPublish: true,
          canManageUsers: false,
          isActive: true,
        }),
    },
    {
      name: "products and ingredients",
      run: () =>
        Promise.all([
          insertOnly(ProductModel, { sku: "SEED-PRD-CHICKEN-BOWL" }, {
            sku: "SEED-PRD-CHICKEN-BOWL",
            name: "Chicken Burrito Bowl",
            category: "Lunch",
            price: "$11.90",
            kcal: 510,
            protein: "38g",
            carbs: "42g",
            fat: "18g",
            tags: ["high-protein", "balanced"],
            allergens: ["dairy"],
            availability: "Active",
            imageUrl: "/food/food.png",
          }),
          insertOnly(IngredientModel, { ingredientId: "SEED-PROTEIN-CHICKEN-100" }, {
            ingredientId: "SEED-PROTEIN-CHICKEN-100",
            category: "Protein",
            item: "Chicken Breast",
            quantityLabel: "100g",
            kcal: 100,
            protein: 20,
            carbs: 0,
            fat: 0,
          }),
        ]),
    },
    {
      name: "restaurants, locations, and menus",
      run: () =>
        Promise.all([
          insertOnly(RestaurantModel, { restaurantId: "SEED-REST-BOURGOGNE" }, {
            restaurantId: "SEED-REST-BOURGOGNE",
            name: "Proteinbar Bourgogne",
            address: "7 Rue Ibnou Jahir, Casablanca",
            workingDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            openingHours: "09:30 - 00:00",
            status: "Active",
          }),
          insertOnly(LocationModel, { locationId: "SEED-LOC-CFC" }, {
            locationId: "SEED-LOC-CFC",
            name: "CFC Pickup Hub",
            type: "both",
            pickupAddress: "Tower 5, CFC, Casablanca",
            image: "/location_hero.png",
            phone: "0520-206366",
            mapLink: "https://maps.google.com/?q=CFC+Casablanca",
            ratingText: "4.8 stars",
            isActive: true,
            deliveryZone: "CFC + Anfa",
            deliveryFee: "$2.00",
            workingDays: ["Sun", "Mon", "Tue", "Wed", "Thu"],
            cutoffTime: "10:00",
            timeSlots: ["12:00-14:00", "18:00-20:00"],
            supportedOptions: ["daily-delivery", "daily-pickup", "weekly-delivery", "weekly-pickup"],
          }),
          insertOnly(MenuItemModel, { menuId: "SEED-MENU-LUNCH-BOX" }, {
            menuId: "SEED-MENU-LUNCH-BOX",
            title: "High Protein Lunch Box",
            image: "/food/food.png",
            restaurantIds: ["SEED-REST-BOURGOGNE"],
            restaurants: ["Proteinbar Bourgogne"],
            linkedProductSkus: ["SEED-PRD-CHICKEN-BOWL"],
            visibleDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            timeSlots: ["12:00-14:00", "14:00-16:00"],
            mealTypes: ["Lunch"],
            planCompatibility: ["Weight Loss", "Muscle Gain"],
            priority: 1,
            status: "Visible",
          }),
          insertOnly(MenuCategoryModel, { categoryId: "seed-breakfast" }, {
            categoryId: "seed-breakfast",
            name: "BREAKFAST",
            description: "Petits Dejeuners",
            items: [
              {
                id: "seed-leggs-day",
                name: "L'EGGS DAY",
                description: "Omelette, patate douce et salade.",
                priceMad: 45,
                calories: 794,
              },
            ],
          }),
          insertOnly(PublicLocationModel, { locationId: "seed-anfa-casablanca" }, {
            locationId: "seed-anfa-casablanca",
            name: "PROTEINBAR - Bourgogne",
            address: "7 Rue Ibnou Jahir, Casablanca",
            phone: "0520-206366",
            mapUrl: "https://maps.google.com/?q=7+Rue+Ibnou+Jahir+Casablanca",
          }),
        ]),
    },
    {
      name: "monthly plans and meal library",
      run: () =>
        Promise.all([
          insertOnly(MonthlyPlanModel, { planId: "seed-custom-plan" }, {
            planId: "seed-custom-plan",
            name: "Custom Plan",
            basePrice: "From $189/mo",
            members: 124,
            status: "Active",
            description: "Build your own monthly subscription with meals and snacks aligned with your fitness goals.",
            imageUrl: "/food/food.png",
          }),
          insertOnly(MonthlyPlanDetailsModel, { planId: "seed-plan-cut-men" }, {
            planId: "seed-plan-cut-men",
            planKind: "normal",
            status: "published",
            title: "1 Month Cut - Men",
            description: "Demo pre-made monthly plan for admin testing.",
            plan: { durationWeeks: 4, mealsPerDay: 2, daysPerWeek: 3 },
            rules: { allowMealCountEdit: false },
            pricing: { basePrice: 168.75 },
            weekAssignments: [],
          }),
          insertOnly(MealLibraryItemModel, { mealId: "seed-chicken-burrito-bowl" }, {
            mealId: "seed-chicken-burrito-bowl",
            name: "Chicken Burrito Bowl",
            mealType: "Lunch",
            mealTypes: ["Lunch"],
            calories: 620,
            protein: 48,
            carbs: 58,
            fat: 18,
            tags: ["high-protein"],
            addOnOptions: ["Extra chicken"],
            status: "active",
            image: "/food/food.png",
          }),
          insertOnly(CustomPlanCategoryModel, { categoryId: "seed-custom-protein" }, {
            categoryId: "seed-custom-protein",
            planId: "seed-custom-plan",
            name: "Protein",
            slug: "protein",
            code: "PROTEIN",
            displayOrder: 1,
            selectionMode: "single",
            isActive: true,
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
          }),
          insertOnly(CustomPlanFoodItemModel, { foodItemId: "seed-food-chicken-breast" }, {
            foodItemId: "seed-food-chicken-breast",
            planId: "seed-custom-plan",
            categoryId: "seed-custom-protein",
            name: "Chicken Breast",
            imageUrl: "/food/food.png",
            description: "Lean grilled chicken breast.",
            displayOrder: 1,
            isActive: true,
            sizes: [
              {
                id: "seed-size-chicken-100",
                foodItemId: "seed-food-chicken-breast",
                label: "100g",
                unit: "g",
                price: 0,
                calories: 165,
                protein: 31,
                carbs: 0,
                fat: 4,
                displayOrder: 1,
                isActive: true,
              },
            ],
          }),
        ]),
    },
    {
      name: "orders and subscriptions",
      run: () =>
        Promise.all([
          insertOnly(OrderModel, { orderId }, {
            orderId,
            subscriptionId,
            client: "Demo Subscription Client",
            phone: "+212600000001",
            customerEmail: "demo.subscription@proteinbargroup.com",
            customerEmirate: "Casablanca",
            customerArea: "Maarif",
            status: "pending",
            confirmationStatus: "pending",
            plan: "1 Month Cut - Men",
            orderType: "Delivery",
            location: "Maarif",
            deliveryAddress: "Demo address, Maarif, Casablanca",
            pickupLocation: "",
            payment: "paid",
            schedule: "daily-delivery",
            date: today,
            total: "$168.75",
            items: selectedMeals.map((meal) => ({
              name: meal.title,
              qty: 1,
              macros: `K:${meal.calories} P:${meal.protein} C:${meal.carb} F:${meal.fat}`,
            })),
            notes: "Seed demo paid monthly-plan order.",
            subscriptionInfo: "seed-plan-cut-men / daily-delivery",
            subscriptionDetails: { daysPerWeek: 3, durationWeeks: 4, meals: 24 },
            auditLog: [{ at: new Date().toLocaleString("en-US"), by: "Safe seed", action: "Seeded demo order" }],
          }),
          insertOnly(CustomerOrderModel, { orderId }, {
            orderId,
            subscriptionId,
            paymentStatus: "paid",
            paymentMethod: "CMI",
            paymentMeta: { provider: "CMI", seeded: true },
            promoUsageApplied: false,
            rawPayload: { source: "seed-demo-all" },
            customer: {
              firstName: "Demo",
              lastName: "Client",
              email: "demo.subscription@proteinbargroup.com",
              phone: "+212600000001",
              emirate: "Casablanca",
              area: "Maarif",
            },
            delivery: {
              optionId: "daily-delivery",
              address: "Demo address, Maarif, Casablanca",
              pickupLocation: { id: "", name: "", address: "" },
            },
            selectedMeals,
            totals: {
              subtotal: 150,
              giftDiscount: 0,
              vat: 18.75,
              safetyBag: 0,
              grandTotal: 168.75,
            },
          }),
          insertOnly(SubscriptionModel, { subscriptionId }, {
            subscriptionId,
            client: "Demo Subscription Client",
            plan: "1 Month Cut - Men",
            totalWeeks: 4,
            currentWeek: 1,
            dayProgress: "0/3",
            remainingMeals: 24,
            status: "active",
            log: ["Seeded demo subscription for admin testing", "Payment confirmed on seed data"],
          }),
          insertOnly(CustomerSubscriptionModel, { subscriptionId }, {
            subscriptionId,
            rawPayload: { source: "seed-demo-all" },
            customer: {
              firstName: "Demo",
              lastName: "Client",
              email: "demo.subscription@proteinbargroup.com",
              phone: "+212600000001",
              emirate: "Casablanca",
              area: "Maarif",
            },
            plan: { id: "seed-plan-cut-men", title: "1 Month Cut - Men" },
            selection: {
              meals: "2",
              days: "3",
              weeks: "4",
              snacks: "0",
              startDate: "2026-07-13",
              deliveryDays: "Monday,Tuesday,Wednesday",
              planType: "pre-made",
              selectedMeals,
            },
            delivery: {
              optionId: "daily-delivery",
              address: "Demo address, Maarif, Casablanca",
              pickupLocation: { id: "", name: "", address: "" },
            },
            status: "active",
          }),
        ]),
    },
    {
      name: "store, promo, notification, and CMS",
      run: () =>
        Promise.all([
          insertOnly(StoreProductModel, { productId: "seed-keto-avocado-burger" }, {
            productId: "seed-keto-avocado-burger",
            handle: "seed-keto-avocado-burger",
            title: "Keto avocado burger",
            description: "Low-carb burger option for keto-focused diets.",
            priceMad: 90,
            image: "/food/food13.webp",
          }),
          insertOnly(PromoCodeModel, { promoCodeId: "seed-welcome15" }, {
            promoCodeId: "seed-welcome15",
            code: "SEED15",
            description: "15% off seeded demo checkout",
            discountType: "percent",
            discountValue: 15,
            maxDiscount: 120,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            usageLimit: 200,
            usedCount: 0,
            isActive: true,
            appliesToMonthlyPlans: true,
            appliesToDirectOrders: false,
            stackable: false,
            showOnHomepage: false,
            eligibilityNote: "Seed demo promo.",
          }),
          insertOnly(NotificationModel, { notificationId: "seed-notification-order" }, {
            notificationId: "seed-notification-order",
            title: "Demo order received",
            meta: orderId,
            time: "seeded",
            status: "Unread",
          }),
          insertOnly(WebsitePageModel, { pageId: "seed-demo-page" }, {
            pageId: "seed-demo-page",
            slug: "seed-demo-page",
            title: "Seed Demo Page",
            navLabel: "Seed Demo",
            summary: "Safe seeded CMS demo page.",
            kind: "custom",
            status: "draft",
            showInTopNav: false,
            heroEyebrow: "Demo",
            heroTitle: "Seed Demo Page",
            heroSubtitle: "",
            heroBody: "This page was inserted by the safe demo seed script.",
            heroImage: "",
            heroPrimaryCtaLabel: "",
            heroPrimaryCtaLink: "",
            heroSecondaryCtaLabel: "",
            heroSecondaryCtaLink: "",
            seoTitle: "Seed Demo Page",
            seoDescription: "Safe seeded CMS demo page.",
            sections: [],
          }),
        ]),
    },
  ];

  for (const task of tasks) {
    await task.run();
    console.log(`Seeded ${task.name}`);
  }

  console.log("Safe demo seed completed without deleting or overwriting existing data.");
}

main()
  .catch((error) => {
    console.error("Failed to seed all demo data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
