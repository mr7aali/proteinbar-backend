import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { publicService } from "./public.service";

export const publicController = {
  listMenuCategories: asyncHandler(async (_req: Request, res: Response) => {
    const data = await publicService.listMenuCategories();
    res.json({ success: true, data });
  }),
  listRestaurants: asyncHandler(async (_req: Request, res: Response) => {
    const data = await publicService.listRestaurants();
    res.json({ success: true, data });
  }),
  listMonthlyPlans: asyncHandler(async (_req: Request, res: Response) => {
    const data = await publicService.listMonthlyPlans();
    res.json({ success: true, data });
  }),
  getMonthlyPlanById: asyncHandler(async (req: Request, res: Response) => {
    const data = await publicService.getMonthlyPlanById(req.params.planId);
    res.json({ success: true, data });
  }),
  listProducts: asyncHandler(async (_req: Request, res: Response) => {
    const data = await publicService.listProducts();
    res.json({ success: true, data });
  }),
  getProductByHandle: asyncHandler(async (req: Request, res: Response) => {
    const data = await publicService.getProductByHandle(req.params.handle);
    res.json({ success: true, data });
  }),
  listLocations: asyncHandler(async (_req: Request, res: Response) => {
    const data = await publicService.listLocations();
    res.json({ success: true, data });
  }),
  getWebsitePage: asyncHandler(async (req: Request, res: Response) => {
    if (req.params.slug.trim().toLowerCase() === "footer") {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
    }
    const data = await publicService.getWebsitePage(req.params.slug);
    res.json({ success: true, data });
  }),
  listWebsiteNavigation: asyncHandler(async (_req: Request, res: Response) => {
    const data = await publicService.listWebsiteNavigation();
    res.json({ success: true, data });
  }),
  validatePromoCode: asyncHandler(async (req: Request, res: Response) => {
    const data = await publicService.validatePromoCode(req.body);
    res.json({ success: true, data });
  }),
  listBuilderIngredients: asyncHandler(async (_req: Request, res: Response) => {
    const data = await publicService.listBuilderIngredients();
    res.json({ success: true, data });
  }),
  createContactMessage: asyncHandler(async (req: Request, res: Response) => {
    const data = await publicService.createContactMessage(req.body);
    res.status(201).json({ success: true, data });
  }),
  checkout: asyncHandler(async (req: Request, res: Response) => {
    const data = await publicService.checkout(req.body, req);
    res.status(201).json({ success: true, data });
  }),
  handleCmiReturn: asyncHandler(async (req: Request, res: Response) => {
    const source = {
      ...(req.query as Record<string, unknown>),
      ...(req.body as Record<string, unknown>),
    };
    const data = await publicService.handleCmiReturn(source, req);
    res.redirect(302, data.redirectUrl);
  }),
  handleCmiCallback: asyncHandler(async (req: Request, res: Response) => {
    const source = {
      ...(req.query as Record<string, unknown>),
      ...(req.body as Record<string, unknown>),
    };
    const data = await publicService.handleCmiCallback(source);
    res.status(200).send(data.responseText);
  }),
  retryCmiPayment: asyncHandler(async (req: Request, res: Response) => {
    const data = await publicService.retryCmiPayment(req.body, req);
    res.json({ success: true, data });
  }),
  createStoreOrder: asyncHandler(async (req: Request, res: Response) => {
    const data = await publicService.createStoreOrder(req.body);
    res.status(201).json({ success: true, data });
  }),
};
