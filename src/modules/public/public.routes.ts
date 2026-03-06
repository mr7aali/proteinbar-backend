import { Router } from "express";
import { validate } from "../../common/middleware/validate";
import { publicController } from "./public.controller";
import { checkoutSchema, contactSchema, storeOrderSchema } from "./public.validation";

export const publicRouter = Router();

publicRouter.get("/menu-categories", publicController.listMenuCategories);
publicRouter.get("/monthly-plans", publicController.listMonthlyPlans);
publicRouter.get("/monthly-plans/:planId", publicController.getMonthlyPlanById);
publicRouter.get("/products", publicController.listProducts);
publicRouter.get("/products/:handle", publicController.getProductByHandle);
publicRouter.get("/locations", publicController.listLocations);
publicRouter.get("/builder-ingredients", publicController.listBuilderIngredients);
publicRouter.post("/contact", validate(contactSchema), publicController.createContactMessage);
publicRouter.post("/checkout", validate(checkoutSchema), publicController.checkout);
publicRouter.post("/store-orders", validate(storeOrderSchema), publicController.createStoreOrder);
