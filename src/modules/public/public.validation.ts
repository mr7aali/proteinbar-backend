import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email(),
  message: z.string().min(10)
});

const selectedMealSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  date: z.string().optional()
});

export const checkoutSchema = z.object({
  subscription: z.object({
    plan: z.object({
      id: z.string().min(1),
      title: z.string().min(1)
    }),
    selection: z.object({
      meals: z.string().min(1),
      days: z.string().min(1),
      snacks: z.string().min(1),
      startDate: z.string().min(1),
      planType: z.string().optional(),
      selectedMeals: z.array(selectedMealSchema).optional()
    }),
    delivery: z.object({
      optionId: z.string().min(1),
      address: z.string().optional(),
      pickupLocation: z
        .object({
          id: z.string(),
          name: z.string(),
          address: z.string()
        })
        .optional()
    })
  }),
  order: z.object({
    customer: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(7),
      emirate: z.string().min(1),
      area: z.string().min(1)
    }),
    delivery: z.object({
      optionId: z.string().min(1),
      address: z.string().optional(),
      pickupLocation: z
        .object({
          id: z.string(),
          name: z.string(),
          address: z.string()
        })
        .optional()
    }),
    selectedMeals: z.array(selectedMealSchema).optional(),
    totals: z.object({
      subtotal: z.number(),
      giftDiscount: z.number(),
      vat: z.number(),
      safetyBag: z.number(),
      grandTotal: z.number()
    })
  })
});

export const storeOrderSchema = z.object({
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(7),
    cityArea: z.string().min(1),
    address: z.string().min(1)
  }),
  items: z.array(
    z.object({
      handle: z.string().min(1),
      title: z.string().min(1),
      priceMad: z.number(),
      quantity: z.number().min(1)
    })
  ),
  totals: z.object({
    subtotal: z.number(),
    vat: z.number(),
    total: z.number()
  })
});
