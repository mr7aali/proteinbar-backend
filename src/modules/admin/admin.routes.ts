import { Router } from "express";
import { validate } from "../../common/middleware/validate";
import { adminController } from "./admin.controller";
import {
  flowTypeParamSchema,
  ingredientSchema,
  locationSchema,
  mealLibraryItemSchema,
  menuItemSchema,
  mongoIdParamSchema,
  restaurantSchema,
  monthlyPlanAdminFiltersSchema,
  monthlyPlanDetailsParamSchema,
  monthlyPlanDetailsUpsertSchema,
  monthlyPlanSchema,
  orderUpdateSchema,
  planFlowSchema,
  productSchema,
  subscriptionUpdateSchema
} from "./admin.validation";

export const adminRouter = Router();

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
adminRouter.get("/admin/monthly-plan/meals", adminController.listMealLibraryAdmin);
adminRouter.put(
  "/admin/monthly-plan/meals/:id",
  validate(monthlyPlanDetailsParamSchema, "params"),
  validate(mealLibraryItemSchema),
  adminController.upsertMealLibraryAdmin
);
adminRouter.delete("/admin/monthly-plan/meals/:id", validate(monthlyPlanDetailsParamSchema, "params"), adminController.deleteMealLibraryAdmin);

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
