"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const admin_service_1 = require("./admin.service");
const asyncHandler_1 = require("../../common/utils/asyncHandler");
exports.adminController = {
    getDashboard: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.getDashboard();
        res.json({ success: true, data });
    }),
    listProducts: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.listProducts();
        res.json({ success: true, data });
    }),
    createProduct: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.createProduct(req.body);
        res.status(201).json({ success: true, data });
    }),
    updateProduct: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.updateProduct(req.params.id, req.body);
        res.json({ success: true, data });
    }),
    deleteProduct: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await admin_service_1.adminService.deleteProduct(req.params.id);
        res.status(204).send();
    }),
    listMenuItems: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.listMenuItems();
        res.json({ success: true, data });
    }),
    createMenuItem: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.createMenuItem(req.body);
        res.status(201).json({ success: true, data });
    }),
    updateMenuItem: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.updateMenuItem(req.params.id, req.body);
        res.json({ success: true, data });
    }),
    deleteMenuItem: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await admin_service_1.adminService.deleteMenuItem(req.params.id);
        res.status(204).send();
    }),
    listLocations: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.listLocations();
        res.json({ success: true, data });
    }),
    createLocation: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.createLocation(req.body);
        res.status(201).json({ success: true, data });
    }),
    updateLocation: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.updateLocation(req.params.id, req.body);
        res.json({ success: true, data });
    }),
    deleteLocation: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await admin_service_1.adminService.deleteLocation(req.params.id);
        res.status(204).send();
    }),
    listMonthlyPlans: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.listMonthlyPlans();
        res.json({ success: true, data });
    }),
    createMonthlyPlan: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.createMonthlyPlan(req.body);
        res.status(201).json({ success: true, data });
    }),
    updateMonthlyPlan: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.updateMonthlyPlan(req.params.id, req.body);
        res.json({ success: true, data });
    }),
    deleteMonthlyPlan: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await admin_service_1.adminService.deleteMonthlyPlan(req.params.id);
        res.status(204).send();
    }),
    getMonthlyPlanOverview: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.getMonthlyPlanOverview();
        res.json({ success: true, data });
    }),
    listMonthlyPlanAdmin: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.listMonthlyPlanAdmin(req.query);
        res.json({ success: true, data });
    }),
    getMonthlyPlanDetails: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.getMonthlyPlanDetails(req.params.id);
        res.json({ success: true, data });
    }),
    upsertMonthlyPlanDetails: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (req.body?.plan && typeof req.body.plan === "object") {
            req.body.plan.id = req.params.id;
        }
        const data = await admin_service_1.adminService.upsertMonthlyPlanDetails(req.body);
        res.json({ success: true, data });
    }),
    archiveMonthlyPlan: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.archiveMonthlyPlan(req.params.id);
        res.json({ success: true, data });
    }),
    listMealLibraryAdmin: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.listMealLibraryAdmin();
        res.json({ success: true, data });
    }),
    upsertMealLibraryAdmin: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (req.body && typeof req.body === "object") {
            req.body.id = req.params.id;
        }
        const data = await admin_service_1.adminService.upsertMealLibraryAdmin(req.body);
        res.json({ success: true, data });
    }),
    deleteMealLibraryAdmin: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await admin_service_1.adminService.deleteMealLibraryAdmin(req.params.id);
        res.status(204).send();
    }),
    listPlanFlows: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.listPlanFlows();
        res.json({ success: true, data });
    }),
    updatePlanFlow: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.updatePlanFlow(req.params.flowType, req.body);
        res.json({ success: true, data });
    }),
    listIngredients: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.listIngredients();
        res.json({ success: true, data });
    }),
    createIngredient: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.createIngredient(req.body);
        res.status(201).json({ success: true, data });
    }),
    updateIngredient: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.updateIngredient(req.params.id, req.body);
        res.json({ success: true, data });
    }),
    deleteIngredient: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await admin_service_1.adminService.deleteIngredient(req.params.id);
        res.status(204).send();
    }),
    listOrders: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.listOrders(req.query);
        res.json({ success: true, data });
    }),
    updateOrder: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.updateOrder(req.params.id, req.body);
        res.json({ success: true, data });
    }),
    listSubscriptions: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.listSubscriptions();
        res.json({ success: true, data });
    }),
    updateSubscription: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await admin_service_1.adminService.updateSubscription(req.params.id, req.body);
        res.json({ success: true, data });
    }),
    listOrdersOfDay: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.listOrdersOfDay();
        res.json({ success: true, data });
    }),
    listPrintableOrders: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.listPrintableOrders();
        res.json({ success: true, data });
    }),
    listNotifications: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await admin_service_1.adminService.listNotifications();
        res.json({ success: true, data });
    }),
    deleteNotification: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await admin_service_1.adminService.deleteNotification(req.params.id);
        res.status(204).send();
    })
};
