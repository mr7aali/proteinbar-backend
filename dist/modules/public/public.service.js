"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicService = void 0;
const AppError_1 = require("../../common/utils/AppError");
const public_model_1 = require("./public.model");
function buildId(prefix) {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${Date.now()}-${random}`;
}
exports.publicService = {
    async listMenuCategories() {
        return public_model_1.MenuCategoryModel.find().sort({ createdAt: 1 }).lean();
    },
    async listMonthlyPlans() {
        return (await Promise.resolve().then(() => __importStar(require("../admin/admin.model")))).MonthlyPlanModel.find().sort({ createdAt: 1 }).lean();
    },
    async getMonthlyPlanById(planId) {
        const row = await (await Promise.resolve().then(() => __importStar(require("../admin/admin.model")))).MonthlyPlanModel.findOne({ planId }).lean();
        if (!row)
            throw new AppError_1.AppError(404, "Monthly plan not found");
        return row;
    },
    async listProducts() {
        return public_model_1.StoreProductModel.find().sort({ createdAt: 1 }).lean();
    },
    async getProductByHandle(handle) {
        const row = await public_model_1.StoreProductModel.findOne({ handle }).lean();
        if (!row)
            throw new AppError_1.AppError(404, "Product not found");
        return row;
    },
    async listLocations() {
        return public_model_1.PublicLocationModel.find().sort({ createdAt: 1 }).lean();
    },
    async listBuilderIngredients() {
        const ingredients = await (await Promise.resolve().then(() => __importStar(require("../admin/admin.model")))).IngredientModel.find().sort({ category: 1 }).lean();
        return ingredients;
    },
    async createContactMessage(payload) {
        return public_model_1.ContactMessageModel.create(payload);
    },
    async checkout(payload) {
        const subscriptionId = buildId("SUB");
        const orderId = buildId("ORD");
        const subscription = await public_model_1.CustomerSubscriptionModel.create({
            subscriptionId,
            ...payload.subscription
        });
        const order = await public_model_1.CustomerOrderModel.create({
            orderId,
            subscriptionId,
            ...payload.order
        });
        return {
            subscription,
            order
        };
    },
    async createStoreOrder(payload) {
        const order = await public_model_1.StoreOrderModel.create({
            orderId: buildId("STORE-ORD"),
            ...payload
        });
        return order;
    }
};
