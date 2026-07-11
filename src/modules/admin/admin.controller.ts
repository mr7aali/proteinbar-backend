import { Request, Response } from "express";
import { adminService } from "./admin.service";
import { asyncHandler } from "../../common/utils/asyncHandler";

export const adminController = {
  getDashboard: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.getDashboard();
    res.json({ success: true, data });
  }),

  listProducts: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listProducts();
    res.json({ success: true, data });
  }),
  createProduct: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.createProduct(req.body);
    res.status(201).json({ success: true, data });
  }),
  updateProduct: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateProduct(req.params.id, req.body);
    res.json({ success: true, data });
  }),
  deleteProduct: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteProduct(req.params.id);
    res.status(204).send();
  }),

  listMenuItems: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listMenuItems();
    res.json({ success: true, data });
  }),
  createMenuItem: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.createMenuItem(req.body);
    res.status(201).json({ success: true, data });
  }),
  updateMenuItem: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateMenuItem(req.params.id, req.body);
    res.json({ success: true, data });
  }),
  deleteMenuItem: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteMenuItem(req.params.id);
    res.status(204).send();
  }),

  listRestaurants: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listRestaurants();
    res.json({ success: true, data });
  }),
  createRestaurant: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.createRestaurant(req.body);
    res.status(201).json({ success: true, data });
  }),
  updateRestaurant: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateRestaurant(req.params.id, req.body);
    res.json({ success: true, data });
  }),
  deleteRestaurant: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteRestaurant(req.params.id);
    res.status(204).send();
  }),

  listLocations: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listLocations();
    res.json({ success: true, data });
  }),
  createLocation: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.createLocation(req.body);
    res.status(201).json({ success: true, data });
  }),
  updateLocation: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateLocation(req.params.id, req.body);
    res.json({ success: true, data });
  }),
  deleteLocation: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteLocation(req.params.id);
    res.status(204).send();
  }),

  listMonthlyPlans: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listMonthlyPlans();
    res.json({ success: true, data });
  }),
  createMonthlyPlan: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.createMonthlyPlan(req.body);
    res.status(201).json({ success: true, data });
  }),
  updateMonthlyPlan: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateMonthlyPlan(req.params.id, req.body);
    res.json({ success: true, data });
  }),
  deleteMonthlyPlan: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteMonthlyPlan(req.params.id);
    res.status(204).send();
  }),

  getMonthlyPlanOverview: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.getMonthlyPlanOverview();
    res.json({ success: true, data });
  }),
  listMonthlyPlanAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.listMonthlyPlanAdmin(req.query as Record<string, string | undefined>);
    res.json({ success: true, data });
  }),
  getMonthlyPlanDetails: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.getMonthlyPlanDetails(req.params.id);
    res.json({ success: true, data });
  }),
  upsertMonthlyPlanDetails: asyncHandler(async (req: Request, res: Response) => {
    if (req.body?.plan && typeof req.body.plan === "object") {
      req.body.plan.id = req.params.id;
    }
    const data = await adminService.upsertMonthlyPlanDetails(req.body);
    res.json({ success: true, data });
  }),
  archiveMonthlyPlan: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.archiveMonthlyPlan(req.params.id);
    res.json({ success: true, data });
  }),
  deleteMonthlyPlanAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.deleteMonthlyPlanAdmin(req.params.id);
    res.json({ success: true, data });
  }),
  listMonthlyPlanSubscriptionsAdmin: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listMonthlyPlanSubscriptionsAdmin();
    res.json({ success: true, data });
  }),
  updateMonthlyPlanSubscriptionAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateMonthlyPlanSubscriptionAdmin(req.params.id, req.body);
    res.json({ success: true, data });
  }),
  listMonthlyPlanOrdersAdmin: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listMonthlyPlanOrdersAdmin();
    res.json({ success: true, data });
  }),
  listArchivedMonthlyPlanOrdersAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.listArchivedMonthlyPlanOrdersAdmin(req.query as Record<string, string | undefined>);
    res.json({ success: true, data });
  }),
  bulkArchiveMonthlyPlanOrdersAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.bulkArchiveMonthlyPlanOrdersAdmin(req.body);
    res.json({ success: true, data, message: data.message });
  }),
  updateMonthlyPlanOrderAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateMonthlyPlanOrderAdmin(req.params.id, req.body);
    res.json({ success: true, data });
  }),
  listMonthlyPlanClientsAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.listMonthlyPlanClientsAdmin(req.query as Record<string, string | undefined>);
    res.json({ success: true, data });
  }),
  getMonthlyPlanClientDetailsAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.getMonthlyPlanClientDetailsAdmin(req.params.clientKey);
    res.json({ success: true, data });
  }),
  updateMonthlyPlanClientAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateMonthlyPlanClientAdmin(req.params.clientKey, req.body);
    res.json({ success: true, data, message: "Client info updated" });
  }),

  listMealLibraryAdmin: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listMealLibraryAdmin();
    res.json({ success: true, data });
  }),
  upsertMealLibraryAdmin: asyncHandler(async (req: Request, res: Response) => {
    if (req.body && typeof req.body === "object") {
      req.body.id = req.params.id;
    }
    const data = await adminService.upsertMealLibraryAdmin(req.body);
    res.json({ success: true, data });
  }),
  deleteMealLibraryAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.deleteMealLibraryAdmin(req.params.id);
    res.json({ success: true, data, message: data.message });
  }),

  listCustomPlanCategoriesAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.listCustomPlanCategoriesAdmin(String(req.query.planId ?? ""));
    res.json({ success: true, data });
  }),
  createCustomPlanCategoryAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.upsertCustomPlanCategoryAdmin(req.body);
    res.status(201).json({ success: true, data });
  }),
  updateCustomPlanCategoryAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.upsertCustomPlanCategoryAdmin({
      ...req.body,
      id: req.params.id
    });
    res.json({ success: true, data });
  }),
  deleteCustomPlanCategoryAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.deleteCustomPlanCategoryAdmin(req.params.id);
    res.json({ success: true, data });
  }),
  reorderCustomPlanCategoriesAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.reorderCustomPlanCategoriesAdmin(req.body.planId, req.body.categoryIds);
    res.json({ success: true, data });
  }),

  listCustomPlanFoodItemsAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.listCustomPlanFoodItemsAdmin(
      String(req.query.planId ?? ""),
      typeof req.query.categoryId === "string" ? req.query.categoryId : undefined
    );
    res.json({ success: true, data });
  }),
  createCustomPlanFoodItemAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.upsertCustomPlanFoodItemAdmin(req.body);
    res.status(201).json({ success: true, data });
  }),
  updateCustomPlanFoodItemAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.upsertCustomPlanFoodItemAdmin({
      ...req.body,
      id: req.params.id
    });
    res.json({ success: true, data });
  }),
  deleteCustomPlanFoodItemAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.deleteCustomPlanFoodItemAdmin(req.params.id);
    res.json({ success: true, data });
  }),
  reorderCustomPlanFoodItemsAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.reorderCustomPlanFoodItemsAdmin(
      req.body.planId,
      req.body.categoryId,
      req.body.itemIds
    );
    res.json({ success: true, data });
  }),

  listPlanFlows: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listPlanFlows();
    res.json({ success: true, data });
  }),
  updatePlanFlow: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updatePlanFlow(req.params.flowType as "custom" | "preset", req.body);
    res.json({ success: true, data });
  }),

  listIngredients: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listIngredients();
    res.json({ success: true, data });
  }),
  createIngredient: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.createIngredient(req.body);
    res.status(201).json({ success: true, data });
  }),
  updateIngredient: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateIngredient(req.params.id, req.body);
    res.json({ success: true, data });
  }),
  deleteIngredient: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteIngredient(req.params.id);
    res.status(204).send();
  }),

  listOrders: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.listOrders(req.query as Record<string, string | undefined>);
    res.json({ success: true, data });
  }),
  getOrderById: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.getOrderById(req.params.id);
    res.json({ success: true, data });
  }),
  updateOrder: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateOrder(req.params.id, req.body);
    res.json({ success: true, data });
  }),

  listSubscriptions: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listSubscriptions();
    res.json({ success: true, data });
  }),
  getSubscriptionById: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.getSubscriptionById(req.params.id);
    res.json({ success: true, data });
  }),
  updateSubscription: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateSubscription(req.params.id, req.body);
    res.json({ success: true, data });
  }),

  listOrdersOfDay: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listOrdersOfDay();
    res.json({ success: true, data });
  }),
  listPrintableOrders: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listPrintableOrders();
    res.json({ success: true, data });
  }),

  listNotifications: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listNotifications();
    res.json({ success: true, data });
  }),
  deleteNotification: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteNotification(req.params.id);
    res.status(204).send();
  }),

  listPromoCodes: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listPromoCodes();
    res.json({ success: true, data });
  }),
  getPromoCodeById: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.getPromoCodeById(req.params.id);
    res.json({ success: true, data });
  }),
  createPromoCode: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.upsertPromoCode(req.body);
    res.status(201).json({ success: true, data });
  }),
  updatePromoCode: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.upsertPromoCode({
      ...req.body,
      id: req.params.id
    });
    res.json({ success: true, data });
  }),
  deletePromoCode: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.deletePromoCode(req.params.id);
    res.json({ success: true, data });
  }),

  listWebsitePages: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listWebsitePages();
    res.json({ success: true, data });
  }),
  listLegalPages: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listLegalPages();
    res.json({ success: true, data });
  }),
  getWebsitePageBySlug: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.getWebsitePageBySlug(req.params.slug);
    res.json({ success: true, data });
  }),
  getLegalPageBySlug: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.getLegalPageBySlug(req.params.slug);
    res.json({ success: true, data });
  }),
  upsertWebsitePage: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.upsertWebsitePage(req.body);
    res.json({ success: true, data });
  }),
  upsertLegalPage: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.upsertLegalPage(req.params.slug, req.body);
    res.json({ success: true, data });
  }),
  deleteWebsitePage: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.deleteWebsitePage(req.params.id);
    res.json({ success: true, data });
  }),

  listAdminRoles: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listAdminRoles();
    res.json({ success: true, data });
  }),
  upsertAdminRole: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.upsertAdminRole(req.body);
    res.json({ success: true, data });
  }),
  deleteAdminRole: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.deleteAdminRole(req.params.id);
    res.json({ success: true, data });
  }),

  listAdminUsers: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.listAdminUsers();
    res.json({ success: true, data });
  }),
  upsertAdminUser: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.upsertAdminUser({
      ...req.body,
      ...(req.params.id ? { id: req.params.id } : {})
    });
    res.json({ success: true, data });
  }),
  deleteAdminUser: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.deleteAdminUser(req.params.id);
    res.json({ success: true, data });
  })
};
