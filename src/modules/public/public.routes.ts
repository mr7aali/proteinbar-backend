import { Router } from "express";
import { validate } from "../../common/middleware/validate";
import { requireCustomerSession } from "../../common/middleware/requireCustomerSession";
import { publicController } from "./public.controller";
import { checkoutSchema, contactSchema, storeOrderSchema, validatePromoCodeSchema } from "./public.validation";

export const publicRouter = Router();

publicRouter.get("/menu-categories", publicController.listMenuCategories);
publicRouter.get("/public/restaurants", publicController.listRestaurants);
publicRouter.get("/public/monthly-plan/plans", publicController.listMonthlyPlans);
publicRouter.get("/public/monthly-plan/plans/:planId", publicController.getMonthlyPlanById);
publicRouter.get("/public/products", publicController.listProducts);
publicRouter.get("/public/products/:handle", publicController.getProductByHandle);
publicRouter.get("/public/locations", publicController.listLocations);
publicRouter.get("/public/ingredients", publicController.listBuilderIngredients);
publicRouter.get("/public/website-navigation", publicController.listWebsiteNavigation);
publicRouter.get("/public/website-pages/:slug", publicController.getWebsitePage);
publicRouter.post("/public/promo-codes/validate", validate(validatePromoCodeSchema), publicController.validatePromoCode);
publicRouter.post("/contact", validate(contactSchema), publicController.createContactMessage);
publicRouter.get("/payments/cmi/return", publicController.handleCmiReturn);
publicRouter.post("/payments/cmi/return", publicController.handleCmiReturn);
publicRouter.post("/payments/cmi/callback", publicController.handleCmiCallback);
publicRouter.post("/checkout", requireCustomerSession, validate(checkoutSchema), publicController.checkout);
publicRouter.post("/store-orders", validate(storeOrderSchema), publicController.createStoreOrder);
