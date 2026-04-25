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
    const data = await publicService.getWebsitePage(req.params.slug);
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
    const data = await publicService.checkout(req.body);
    res.status(201).json({ success: true, data });
  }),
  createStoreOrder: asyncHandler(async (req: Request, res: Response) => {
    const data = await publicService.createStoreOrder(req.body);
    res.status(201).json({ success: true, data });
  })
};
