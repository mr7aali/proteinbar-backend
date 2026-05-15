import mongoose, { Schema } from "mongoose";

const MenuCategoryItemSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    priceMad: { type: Number, default: 0 },
    calories: { type: Number, default: 0 }
  },
  { _id: false }
);

const MenuCategorySchema = new Schema(
  {
    categoryId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    items: { type: [MenuCategoryItemSchema], default: [] }
  },
  { timestamps: true }
);

const StoreProductSchema = new Schema(
  {
    productId: { type: String, required: true, unique: true, trim: true },
    handle: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    priceMad: { type: Number, default: 0 },
    image: { type: String, default: "" }
  },
  { timestamps: true }
);

const PublicLocationSchema = new Schema(
  {
    locationId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, default: "" },
    mapUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    message: { type: String, required: true }
  },
  { timestamps: true }
);

const CustomerSubscriptionSchema = new Schema(
  {
    subscriptionId: { type: String, required: true, unique: true },
    rawPayload: { type: Schema.Types.Mixed, default: null },
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
  },
  { timestamps: true }
);

const CustomerOrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    subscriptionId: { type: String, required: true },
    paymentStatus: { type: String, default: "pending", index: true },
    paymentMethod: { type: String, default: "CMI" },
    paymentMeta: { type: Schema.Types.Mixed, default: null },
    promoUsageApplied: { type: Boolean, default: false },
    rawPayload: { type: Schema.Types.Mixed, default: null },
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
      id: { type: String, default: "" },
      code: { type: String, default: "" },
      discountAmount: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

const StoreOrderSchema = new Schema(
  {
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
  },
  { timestamps: true }
);

export const MenuCategoryModel = mongoose.model("MenuCategory", MenuCategorySchema);
export const StoreProductModel = mongoose.model("StoreProduct", StoreProductSchema);
export const PublicLocationModel = mongoose.model("PublicLocation", PublicLocationSchema);
export const ContactMessageModel = mongoose.model("ContactMessage", ContactMessageSchema);
export const CustomerSubscriptionModel = mongoose.model("CustomerSubscription", CustomerSubscriptionSchema);
export const CustomerOrderModel = mongoose.model("CustomerOrder", CustomerOrderSchema);
export const StoreOrderModel = mongoose.model("StoreOrder", StoreOrderSchema);
