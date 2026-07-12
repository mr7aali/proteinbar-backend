import { Router } from "express";
import { requireAdminSession } from "../../common/middleware/requireAdminSession";
import { requireAdminUserManagement } from "../../common/middleware/requireAdminUserManagement";
import { validate } from "../../common/middleware/validate";
import { adminController } from "./admin.controller";
import {
  adminRoleSchema,
  adminUserSchema,
  customPlanCategoryListQuerySchema,
  customPlanCategoryReorderSchema,
  customPlanCategorySchema,
  customPlanFoodItemListQuerySchema,
  customPlanFoodItemReorderSchema,
  customPlanFoodItemSchema,
  flowTypeParamSchema,
  ingredientSchema,
  locationSchema,
  mealLibraryItemSchema,
  menuItemSchema,
  mongoIdParamSchema,
  restaurantSchema,
  monthlyPlanAdminFiltersSchema,
  monthlyPlanClientFiltersSchema,
  monthlyPlanClientUpdateSchema,
  monthlyPlanDetailsParamSchema,
  monthlyPlanDetailsUpsertSchema,
  monthlyPlanOrderBulkArchiveSchema,
  monthlyPlanOrderArchiveFiltersSchema,
  monthlyPlanSchema,
  orderUpdateSchema,
  planFlowSchema,
  promoCodeSchema,
  productSchema,
  subscriptionUpdateSchema,
  websitePageSchema
} from "./admin.validation";

export const adminRouter = Router();

adminRouter.use(requireAdminSession);

adminRouter.get("/dashboard", adminController.getDashboard);

adminRouter.get("/products", adminController.listProducts);
adminRouter.post("/products", validate(productSchema), adminController.createProduct);
adminRouter.patch("/products/:id", validate(productSchema.partial()), adminController.updateProduct);
adminRouter.delete("/products/:id", adminController.deleteProduct);

adminRouter.get("/menu-items", adminController.listMenuItems);
adminRouter.post("/menu-items", validate(menuItemSchema), adminController.createMenuItem);
adminRouter.patch("/menu-items/:id", validate(menuItemSchema), adminController.updateMenuItem);
adminRouter.delete("/menu-items/:id", adminController.deleteMenuItem);

adminRouter.get("/restaurants", adminController.listRestaurants);
adminRouter.post("/restaurants", validate(restaurantSchema), adminController.createRestaurant);
adminRouter.patch("/restaurants/:id", validate(restaurantSchema.partial()), adminController.updateRestaurant);
adminRouter.delete("/restaurants/:id", adminController.deleteRestaurant);

adminRouter.get("/locations", adminController.listLocations);
adminRouter.post("/locations", validate(locationSchema), adminController.createLocation);
adminRouter.patch("/locations/:id", validate(locationSchema.partial()), adminController.updateLocation);
adminRouter.delete("/locations/:id", adminController.deleteLocation);

adminRouter.get("/monthly-plans", adminController.listMonthlyPlans);
adminRouter.post("/monthly-plans", validate(monthlyPlanSchema), adminController.createMonthlyPlan);
adminRouter.patch("/monthly-plans/:id", validate(monthlyPlanSchema.partial()), adminController.updateMonthlyPlan);
adminRouter.delete("/monthly-plans/:id", adminController.deleteMonthlyPlan);

adminRouter.get("/admin/monthly-plan/overview", adminController.getMonthlyPlanOverview);
adminRouter.get("/admin/monthly-plan/plans", validate(monthlyPlanAdminFiltersSchema, "query"), adminController.listMonthlyPlanAdmin);
adminRouter.get("/admin/monthly-plan/plans/:id", validate(monthlyPlanDetailsParamSchema, "params"), adminController.getMonthlyPlanDetails);
adminRouter.put(
  "/admin/monthly-plan/plans/:id",
  validate(monthlyPlanDetailsParamSchema, "params"),
  validate(monthlyPlanDetailsUpsertSchema),
  adminController.upsertMonthlyPlanDetails
);
adminRouter.patch("/admin/monthly-plan/plans/:id/archive", validate(monthlyPlanDetailsParamSchema, "params"), adminController.archiveMonthlyPlan);
adminRouter.delete("/admin/monthly-plan/plans/:id", validate(monthlyPlanDetailsParamSchema, "params"), adminController.deleteMonthlyPlanAdmin);
adminRouter.get("/admin/monthly-plan/subscriptions", adminController.listMonthlyPlanSubscriptionsAdmin);
adminRouter.patch("/admin/monthly-plan/subscriptions/:id", validate(monthlyPlanDetailsParamSchema, "params"), adminController.updateMonthlyPlanSubscriptionAdmin);
adminRouter.get("/admin/monthly-plan/orders", adminController.listMonthlyPlanOrdersAdmin);
adminRouter.get("/admin/monthly-plan/orders/archived", validate(monthlyPlanOrderArchiveFiltersSchema, "query"), adminController.listArchivedMonthlyPlanOrdersAdmin);
adminRouter.patch("/admin/monthly-plan/orders/bulk-archive", validate(monthlyPlanOrderBulkArchiveSchema), adminController.bulkArchiveMonthlyPlanOrdersAdmin);
adminRouter.patch("/admin/monthly-plan/orders/:id", validate(monthlyPlanDetailsParamSchema, "params"), adminController.updateMonthlyPlanOrderAdmin);
adminRouter.get("/admin/monthly-plan/clients", validate(monthlyPlanClientFiltersSchema, "query"), adminController.listMonthlyPlanClientsAdmin);
adminRouter.get("/admin/monthly-plan/clients/:clientKey", adminController.getMonthlyPlanClientDetailsAdmin);
adminRouter.patch("/admin/monthly-plan/clients/:clientKey", validate(monthlyPlanClientUpdateSchema), adminController.updateMonthlyPlanClientAdmin);
adminRouter.get("/admin/monthly-plan/meals", adminController.listMealLibraryAdmin);
adminRouter.put(
  "/admin/monthly-plan/meals/:id",
  validate(monthlyPlanDetailsParamSchema, "params"),
  validate(mealLibraryItemSchema),
  adminController.upsertMealLibraryAdmin
);
adminRouter.delete(
  "/admin/monthly-plan/meals/:id/force",
  validate(monthlyPlanDetailsParamSchema, "params"),
  adminController.forceDeleteMealLibraryAdmin
);
adminRouter.delete("/admin/monthly-plan/meals/:id", validate(monthlyPlanDetailsParamSchema, "params"), adminController.deleteMealLibraryAdmin);
adminRouter.get(
  "/admin/monthly-plan/custom-categories",
  validate(customPlanCategoryListQuerySchema, "query"),
  adminController.listCustomPlanCategoriesAdmin
);
adminRouter.post(
  "/admin/monthly-plan/custom-categories",
  validate(customPlanCategorySchema),
  adminController.createCustomPlanCategoryAdmin
);
adminRouter.post(
  "/admin/monthly-plan/custom-categories/reorder",
  validate(customPlanCategoryReorderSchema),
  adminController.reorderCustomPlanCategoriesAdmin
);
adminRouter.patch(
  "/admin/monthly-plan/custom-categories/:id",
  validate(monthlyPlanDetailsParamSchema, "params"),
  validate(customPlanCategorySchema),
  adminController.updateCustomPlanCategoryAdmin
);
adminRouter.delete(
  "/admin/monthly-plan/custom-categories/:id",
  validate(monthlyPlanDetailsParamSchema, "params"),
  adminController.deleteCustomPlanCategoryAdmin
);
adminRouter.get(
  "/admin/monthly-plan/custom-food-items",
  validate(customPlanFoodItemListQuerySchema, "query"),
  adminController.listCustomPlanFoodItemsAdmin
);
adminRouter.post(
  "/admin/monthly-plan/custom-food-items",
  validate(customPlanFoodItemSchema),
  adminController.createCustomPlanFoodItemAdmin
);
adminRouter.post(
  "/admin/monthly-plan/custom-food-items/reorder",
  validate(customPlanFoodItemReorderSchema),
  adminController.reorderCustomPlanFoodItemsAdmin
);
adminRouter.patch(
  "/admin/monthly-plan/custom-food-items/:id",
  validate(monthlyPlanDetailsParamSchema, "params"),
  validate(customPlanFoodItemSchema),
  adminController.updateCustomPlanFoodItemAdmin
);
adminRouter.delete(
  "/admin/monthly-plan/custom-food-items/:id",
  validate(monthlyPlanDetailsParamSchema, "params"),
  adminController.deleteCustomPlanFoodItemAdmin
);

adminRouter.get("/plan-flows", adminController.listPlanFlows);
adminRouter.put("/plan-flows/:flowType", validate(flowTypeParamSchema, "params"), validate(planFlowSchema), adminController.updatePlanFlow);

adminRouter.get("/ingredients", adminController.listIngredients);
adminRouter.post("/ingredients", validate(ingredientSchema), adminController.createIngredient);
adminRouter.patch("/ingredients/:id", validate(ingredientSchema.partial()), adminController.updateIngredient);
adminRouter.delete("/ingredients/:id", adminController.deleteIngredient);

adminRouter.get("/orders", adminController.listOrders);
adminRouter.get("/orders/:id", validate(mongoIdParamSchema, "params"), adminController.getOrderById);
adminRouter.patch("/orders/:id", validate(orderUpdateSchema), adminController.updateOrder);
adminRouter.get("/orders-of-day", adminController.listOrdersOfDay);
adminRouter.get("/printing", adminController.listPrintableOrders);

adminRouter.get("/subscriptions", adminController.listSubscriptions);
adminRouter.get("/subscriptions/:id", validate(mongoIdParamSchema, "params"), adminController.getSubscriptionById);
adminRouter.patch("/subscriptions/:id", validate(subscriptionUpdateSchema), adminController.updateSubscription);

adminRouter.get("/notifications", adminController.listNotifications);
adminRouter.delete("/notifications/:id", adminController.deleteNotification);

adminRouter.get("/promo-codes", adminController.listPromoCodes);
adminRouter.get("/promo-codes/:id", validate(monthlyPlanDetailsParamSchema, "params"), adminController.getPromoCodeById);
adminRouter.post("/promo-codes", validate(promoCodeSchema), adminController.createPromoCode);
adminRouter.patch("/promo-codes/:id", validate(monthlyPlanDetailsParamSchema, "params"), validate(promoCodeSchema), adminController.updatePromoCode);
adminRouter.delete("/promo-codes/:id", validate(monthlyPlanDetailsParamSchema, "params"), adminController.deletePromoCode);

adminRouter.get("/website-pages", adminController.listWebsitePages);
adminRouter.get("/website-pages/:slug", adminController.getWebsitePageBySlug);
adminRouter.post("/website-pages/upsert", validate(websitePageSchema), adminController.upsertWebsitePage);
adminRouter.delete("/website-pages/:id", adminController.deleteWebsitePage);
adminRouter.get("/legal-pages", adminController.listLegalPages);
adminRouter.get("/legal-pages/:slug", adminController.getLegalPageBySlug);
adminRouter.put("/legal-pages/:slug", validate(websitePageSchema), adminController.upsertLegalPage);

adminRouter.get("/admin-roles", requireAdminUserManagement, adminController.listAdminRoles);
adminRouter.post("/admin-roles/upsert", requireAdminUserManagement, validate(adminRoleSchema), adminController.upsertAdminRole);
adminRouter.delete("/admin-roles/:id", requireAdminUserManagement, validate(monthlyPlanDetailsParamSchema, "params"), adminController.deleteAdminRole);

adminRouter.get("/admin-users", requireAdminUserManagement, adminController.listAdminUsers);
adminRouter.post("/admin-users", requireAdminUserManagement, validate(adminUserSchema), adminController.upsertAdminUser);
adminRouter.patch("/admin-users/:id", requireAdminUserManagement, validate(monthlyPlanDetailsParamSchema, "params"), validate(adminUserSchema), adminController.upsertAdminUser);
adminRouter.delete("/admin-users/:id", requireAdminUserManagement, validate(monthlyPlanDetailsParamSchema, "params"), adminController.deleteAdminUser);
