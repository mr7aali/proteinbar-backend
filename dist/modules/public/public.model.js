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
exports.StoreOrderModel = exports.CustomerOrderModel = exports.CustomerSubscriptionModel = exports.ContactMessageModel = exports.PublicLocationModel = exports.StoreProductModel = exports.MenuCategoryModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MenuCategoryItemSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    priceMad: { type: Number, default: 0 },
    calories: { type: Number, default: 0 }
}, { _id: false });
const MenuCategorySchema = new mongoose_1.Schema({
    categoryId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    items: { type: [MenuCategoryItemSchema], default: [] }
}, { timestamps: true });
const StoreProductSchema = new mongoose_1.Schema({
    productId: { type: String, required: true, unique: true, trim: true },
    handle: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    priceMad: { type: Number, default: 0 },
    image: { type: String, default: "" }
}, { timestamps: true });
const PublicLocationSchema = new mongoose_1.Schema({
    locationId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, default: "" },
    mapUrl: { type: String, default: "" }
}, { timestamps: true });
const ContactMessageSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    message: { type: String, required: true }
}, { timestamps: true });
const CustomerSubscriptionSchema = new mongoose_1.Schema({
    subscriptionId: { type: String, required: true, unique: true },
    rawPayload: { type: mongoose_1.Schema.Types.Mixed, default: null },
    customer: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        emirate: { type: String, required: true },
        area: { type: String, required: true }
    },
    plan: {
        id: { type: String, required: true },
        title: { type: String, required: true }
    },
    selection: {
        meals: { type: String, required: true },
        days: { type: String, required: true },
        weeks: { type: String, default: "" },
        snacks: { type: String, required: true },
        startDate: { type: String, required: true },
        deliveryDays: { type: String, default: "" },
        planType: { type: String, default: "" },
        selectedMeals: {
            type: [
                {
                    instanceId: { type: String, default: "" },
                    id: { type: String, required: true },
                    title: { type: String, required: true },
                    date: { type: String, default: "" },
                    extrasSummary: { type: String, default: "" },
                    calories: { type: Number, default: 0 },
                    protein: { type: Number, default: 0 },
                    carb: { type: Number, default: 0 },
                    fat: { type: Number, default: 0 },
                    basePrice: { type: Number, default: 0 },
                    totalPrice: { type: Number, default: 0 }
                }
            ],
            default: []
        }
    },
    delivery: {
        optionId: { type: String, required: true },
        address: { type: String, default: "" },
        pickupLocation: {
            id: { type: String, default: "" },
            name: { type: String, default: "" },
            address: { type: String, default: "" }
        }
    },
    status: { type: String, default: "active" }
}, { timestamps: true });
const CustomerOrderSchema = new mongoose_1.Schema({
    orderId: { type: String, required: true, unique: true },
    subscriptionId: { type: String, required: true },
    rawPayload: { type: mongoose_1.Schema.Types.Mixed, default: null },
    customer: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        emirate: { type: String, required: true },
        area: { type: String, required: true }
    },
    delivery: {
        optionId: { type: String, required: true },
        address: { type: String, default: "" },
        pickupLocation: {
            id: { type: String, default: "" },
            name: { type: String, default: "" },
            address: { type: String, default: "" }
        }
    },
    selectedMeals: {
        type: [
            {
                instanceId: { type: String, default: "" },
                id: { type: String, required: true },
                title: { type: String, required: true },
                date: { type: String, default: "" },
                extrasSummary: { type: String, default: "" },
                calories: { type: Number, default: 0 },
                protein: { type: Number, default: 0 },
                carb: { type: Number, default: 0 },
                fat: { type: Number, default: 0 },
                basePrice: { type: Number, default: 0 },
                totalPrice: { type: Number, default: 0 }
            }
        ],
        default: []
    },
    totals: {
        subtotal: { type: Number, required: true },
        giftDiscount: { type: Number, required: true },
        vat: { type: Number, required: true },
        safetyBag: { type: Number, required: true },
        grandTotal: { type: Number, required: true }
    },
    promoCode: {
        code: { type: String, default: "" },
        discountAmount: { type: Number, default: 0 }
    }
}, { timestamps: true });
const StoreOrderSchema = new mongoose_1.Schema({
    orderId: { type: String, required: true, unique: true },
    customer: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        cityArea: { type: String, required: true },
        address: { type: String, required: true }
    },
    items: {
        type: [
            {
                handle: { type: String, required: true },
                title: { type: String, required: true },
                priceMad: { type: Number, required: true },
                quantity: { type: Number, required: true }
            }
        ],
        default: []
    },
    totals: {
        subtotal: { type: Number, required: true },
        vat: { type: Number, required: true },
        total: { type: Number, required: true }
    }
}, { timestamps: true });
exports.MenuCategoryModel = mongoose_1.default.model("MenuCategory", MenuCategorySchema);
exports.StoreProductModel = mongoose_1.default.model("StoreProduct", StoreProductSchema);
exports.PublicLocationModel = mongoose_1.default.model("PublicLocation", PublicLocationSchema);
exports.ContactMessageModel = mongoose_1.default.model("ContactMessage", ContactMessageSchema);
exports.CustomerSubscriptionModel = mongoose_1.default.model("CustomerSubscription", CustomerSubscriptionSchema);
exports.CustomerOrderModel = mongoose_1.default.model("CustomerOrder", CustomerOrderSchema);
exports.StoreOrderModel = mongoose_1.default.model("StoreOrder", StoreOrderSchema);
