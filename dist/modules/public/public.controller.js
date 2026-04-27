"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicController = void 0;
const asyncHandler_1 = require("../../common/utils/asyncHandler");
const public_service_1 = require("./public.service");
exports.publicController = {
    listMenuCategories: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await public_service_1.publicService.listMenuCategories();
        res.json({ success: true, data });
    }),
    listRestaurants: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await public_service_1.publicService.listRestaurants();
        res.json({ success: true, data });
    }),
    listMonthlyPlans: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await public_service_1.publicService.listMonthlyPlans();
        res.json({ success: true, data });
    }),
    getMonthlyPlanById: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await public_service_1.publicService.getMonthlyPlanById(req.params.planId);
        res.json({ success: true, data });
    }),
    listProducts: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await public_service_1.publicService.listProducts();
        res.json({ success: true, data });
    }),
    getProductByHandle: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await public_service_1.publicService.getProductByHandle(req.params.handle);
        res.json({ success: true, data });
    }),
    listLocations: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await public_service_1.publicService.listLocations();
        res.json({ success: true, data });
    }),
    getWebsitePage: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await public_service_1.publicService.getWebsitePage(req.params.slug);
        res.json({ success: true, data });
    }),
    listWebsiteNavigation: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await public_service_1.publicService.listWebsiteNavigation();
        res.json({ success: true, data });
    }),
    validatePromoCode: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await public_service_1.publicService.validatePromoCode(req.body);
        res.json({ success: true, data });
    }),
    listBuilderIngredients: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await public_service_1.publicService.listBuilderIngredients();
        res.json({ success: true, data });
    }),
    createContactMessage: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await public_service_1.publicService.createContactMessage(req.body);
        res.status(201).json({ success: true, data });
    }),
    checkout: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await public_service_1.publicService.checkout(req.body);
        res.status(201).json({ success: true, data });
    }),
    createStoreOrder: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await public_service_1.publicService.createStoreOrder(req.body);
        res.status(201).json({ success: true, data });
    }),
};
