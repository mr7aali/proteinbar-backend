import { Router } from "express";
import { validate } from "../../common/middleware/validate";
import { requireCustomerSession } from "../../common/middleware/requireCustomerSession";
import { publicController } from "./public.controller";
import { checkoutSchema, contactSchema, storeOrderSchema, validatePromoCodeSchema } from "./public.validation";

export const publicRouter = Router();

publicRouter.get("/menu-categories", publicController.listMenuCategories);
publicRouter.get("/public/restaurants", publicController.listRestaurants);
publicRouter.get("/restaurants", publicController.listRestaurants);
publicRouter.get("/public/monthly-plan/plans", publicController.listMonthlyPlans);
publicRouter.get("/public/monthly-plan/plans/:planId", publicController.getMonthlyPlanById);
publicRouter.get("/monthly-plans/:planId", publicController.getMonthlyPlanById);
publicRouter.get("/website-navigation", publicController.listWebsiteNavigation);
publicRouter.get("/website-pages/:slug", publicController.getWebsitePage);
publicRouter.post("/promo-codes/validate", validate(validatePromoCodeSchema), publicController.validatePromoCode);
publicRouter.get("/products/:handle", publicController.getProductByHandle);
publicRouter.post("/contact", validate(contactSchema), publicController.createContactMessage);
publicRouter.post("/checkout", requireCustomerSession, validate(checkoutSchema), publicController.checkout);
publicRouter.post("/store-orders", validate(storeOrderSchema), publicController.createStoreOrder);
