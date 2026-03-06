import { AppError } from "../../common/utils/AppError";
import {
  ContactMessageModel,
  CustomerOrderModel,
  CustomerSubscriptionModel,
  MenuCategoryModel,
  PublicLocationModel,
  StoreOrderModel,
  StoreProductModel
} from "./public.model";

function buildId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

export const publicService = {
  async listMenuCategories() {
    return MenuCategoryModel.find().sort({ createdAt: 1 }).lean();
  },

  async listMonthlyPlans() {
    return (await import("../admin/admin.model")).MonthlyPlanModel.find().sort({ createdAt: 1 }).lean();
  },

  async getMonthlyPlanById(planId: string) {
    const row = await (await import("../admin/admin.model")).MonthlyPlanModel.findOne({ planId }).lean();
    if (!row) throw new AppError(404, "Monthly plan not found");
    return row;
  },

  async listProducts() {
    return StoreProductModel.find().sort({ createdAt: 1 }).lean();
  },

  async getProductByHandle(handle: string) {
    const row = await StoreProductModel.findOne({ handle }).lean();
    if (!row) throw new AppError(404, "Product not found");
    return row;
  },

  async listLocations() {
    return PublicLocationModel.find().sort({ createdAt: 1 }).lean();
  },

  async listBuilderIngredients() {
    const ingredients = await (await import("../admin/admin.model")).IngredientModel.find().sort({ category: 1 }).lean();
    return ingredients;
  },

  async createContactMessage(payload: Record<string, unknown>) {
    return ContactMessageModel.create(payload);
  },

  async checkout(payload: Record<string, any>) {
    const subscriptionId = buildId("SUB");
    const orderId = buildId("ORD");

    const subscription = await CustomerSubscriptionModel.create({
      subscriptionId,
      ...payload.subscription
    });

    const order = await CustomerOrderModel.create({
      orderId,
      subscriptionId,
      ...payload.order
    });

    return {
      subscription,
      order
    };
  },

  async createStoreOrder(payload: Record<string, unknown>) {
    const order = await StoreOrderModel.create({
      orderId: buildId("STORE-ORD"),
      ...payload
    });

    return order;
  }
};
