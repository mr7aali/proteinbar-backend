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
    await adminService.deleteMealLibraryAdmin(req.params.id);
    res.status(204).send();
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
  })
};
