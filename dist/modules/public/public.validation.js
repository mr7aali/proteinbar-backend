"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePromoCodeSchema = exports.storeOrderSchema = exports.checkoutSchema = exports.contactSchema = void 0;
const zod_1 = require("zod");
exports.contactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(7),
    email: zod_1.z.string().email(),
    message: zod_1.z.string().min(10)
});
const selectedMealSchema = zod_1.z.object({
    instanceId: zod_1.z.string().optional(),
    id: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    date: zod_1.z.string().optional(),
    extrasSummary: zod_1.z.string().optional(),
    calories: zod_1.z.number().optional(),
    protein: zod_1.z.number().optional(),
    carb: zod_1.z.number().optional(),
    fat: zod_1.z.number().optional(),
    basePrice: zod_1.z.number().optional(),
    totalPrice: zod_1.z.number().optional()
});
exports.checkoutSchema = zod_1.z.object({
    subscription: zod_1.z.object({
        plan: zod_1.z.object({
            id: zod_1.z.string().min(1),
            title: zod_1.z.string().min(1)
        }),
        selection: zod_1.z.object({
            meals: zod_1.z.string().min(1),
            days: zod_1.z.string().min(1),
            weeks: zod_1.z.string().optional(),
            snacks: zod_1.z.string().min(1),
            startDate: zod_1.z.string().min(1),
            deliveryDays: zod_1.z.string().optional(),
            planType: zod_1.z.string().optional(),
            selectedMeals: zod_1.z.array(selectedMealSchema).optional()
        }),
        delivery: zod_1.z.object({
            optionId: zod_1.z.string().min(1),
            address: zod_1.z.string().optional(),
            pickupLocation: zod_1.z
                .object({
                id: zod_1.z.string(),
                name: zod_1.z.string(),
                address: zod_1.z.string()
            })
                .optional()
        })
    }),
    order: zod_1.z.object({
        customer: zod_1.z.object({
            firstName: zod_1.z.string().min(1),
            lastName: zod_1.z.string().min(1),
            email: zod_1.z.string().email(),
            phone: zod_1.z.string().min(7),
            emirate: zod_1.z.string().min(1),
            area: zod_1.z.string().min(1)
        }),
        delivery: zod_1.z.object({
            optionId: zod_1.z.string().min(1),
            address: zod_1.z.string().optional(),
            pickupLocation: zod_1.z
                .object({
                id: zod_1.z.string(),
                name: zod_1.z.string(),
                address: zod_1.z.string()
            })
                .optional()
        }),
        selectedMeals: zod_1.z.array(selectedMealSchema).optional(),
        promoCode: zod_1.z
            .object({
            code: zod_1.z.string().min(1)
        })
            .optional(),
        totals: zod_1.z.object({
            subtotal: zod_1.z.number(),
            giftDiscount: zod_1.z.number(),
            vat: zod_1.z.number(),
            safetyBag: zod_1.z.number(),
            grandTotal: zod_1.z.number()
        })
    })
});
exports.storeOrderSchema = zod_1.z.object({
    customer: zod_1.z.object({
        firstName: zod_1.z.string().min(1),
        lastName: zod_1.z.string().min(1),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string().min(7),
        cityArea: zod_1.z.string().min(1),
        address: zod_1.z.string().min(1)
    }),
    items: zod_1.z.array(zod_1.z.object({
        handle: zod_1.z.string().min(1),
        title: zod_1.z.string().min(1),
        priceMad: zod_1.z.number(),
        quantity: zod_1.z.number().min(1)
    })),
    totals: zod_1.z.object({
        subtotal: zod_1.z.number(),
        vat: zod_1.z.number(),
        total: zod_1.z.number()
    })
});
exports.validatePromoCodeSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    subtotal: zod_1.z.number().positive(),
    scope: zod_1.z.enum(["monthly-plan", "direct-order"]).optional().default("monthly-plan")
});
