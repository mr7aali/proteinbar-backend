import { connectDb } from "../config/db";
import {
  IngredientModel,
  LocationModel,
  MenuItemModel,
  MonthlyPlanModel,
  NotificationModel,
  OrderModel,
  PromoCodeModel,
  ProductModel,
  SubscriptionModel,
  WebsitePageModel
} from "../modules/admin/admin.model";
import { AdminRoleModel, UserModel } from "../modules/auth/auth.model";
import { MenuCategoryModel, PublicLocationModel, StoreProductModel } from "../modules/public/public.model";

async function seed() {
  await connectDb();

  await Promise.all([
    ProductModel.deleteMany({}),
    MenuItemModel.deleteMany({}),
    LocationModel.deleteMany({}),
    MonthlyPlanModel.deleteMany({}),
    IngredientModel.deleteMany({}),
    OrderModel.deleteMany({}),
    SubscriptionModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    PromoCodeModel.deleteMany({}),
    AdminRoleModel.deleteMany({}),
    WebsitePageModel.deleteMany({}),
    MenuCategoryModel.deleteMany({}),
    StoreProductModel.deleteMany({}),
    PublicLocationModel.deleteMany({})
  ]);

  await ProductModel.insertMany([
    {
      sku: "PRD-101",
      name: "Chicken Burrito Bowl",
      category: "Lunch",
      price: "$11.90",
      kcal: 510,
      protein: "38g",
      carbs: "42g",
      fat: "18g",
      tags: ["high-protein", "balanced"],
      allergens: ["dairy"],
      availability: "Active"
    },
    {
      sku: "PRD-102",
      name: "Steak Protein Wrap",
      category: "Lunch",
      price: "$10.50",
      kcal: 470,
      protein: "34g",
      carbs: "39g",
      fat: "16g",
      tags: ["muscle-gain"],
      allergens: ["gluten"],
      availability: "Active"
    }
  ]);

  await MenuItemModel.insertMany([
    {
      menuId: "MENU-901",
      title: "High Protein Lunch Box",
      image: "/food/food.png",
      restaurantIds: ["REST-1"],
      restaurants: ["Proteinbar Bourgogne"],
      linkedProductSkus: ["PRD-101"],
      visibleDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      timeSlots: ["12:00-14:00", "14:00-16:00"],
      mealTypes: ["Lunch"],
      planCompatibility: ["Weight Loss", "Muscle Gain"],
      priority: 1,
      status: "Visible"
    }
  ]);

  await LocationModel.insertMany([
    {
      locationId: "LOC-1",
      name: "CFC Pickup Hub",
      pickupAddress: "Tower 5, CFC, Casablanca",
      mapLink: "https://maps.google.com/?q=CFC+Casablanca",
      deliveryZone: "CFC + Anfa",
      deliveryFee: "$2.00",
      workingDays: ["Sun", "Mon", "Tue", "Wed", "Thu"],
      cutoffTime: "10:00",
      timeSlots: ["12:00-14:00", "18:00-20:00"]
    }
  ]);

  await MonthlyPlanModel.insertMany([
    {
      planId: "custom-plan",
      name: "Custom Plan",
      basePrice: "From $189/mo",
      members: 124,
      status: "Active",
      description: "Build your own monthly subscription with meals and snacks aligned with your fitness goals.",
      imageUrl: "/food/food.png"
    },
    {
      planId: "super-saver",
      name: "Super Saver Subscription",
      basePrice: "$209/mo",
      members: 188,
      status: "Active",
      isNew: true,
      description: "A balanced monthly plan focused on daily consistency.",
      imageUrl: "/food/food11.webp"
    }
  ]);

  await IngredientModel.insertMany([
    {
      ingredientId: "PROTEIN-CHICKEN-100",
      category: "Protein",
      item: "Chicken Breast",
      quantityLabel: "100g",
      kcal: 100,
      protein: 20,
      carbs: 0,
      fat: 0
    },
    {
      ingredientId: "CARB-BASMATI-100",
      category: "Carb",
      item: "Basmati Rice",
      quantityLabel: "100g",
      kcal: 100,
      protein: 0,
      carbs: 25,
      fat: 0
    }
  ]);

  await OrderModel.insertMany([
    {
      orderId: "ORD-2082",
      client: "Sara Benali",
      phone: "+212 600 000 111",
      status: "Pending",
      confirmationStatus: "Pending",
      plan: "Weight Loss",
      orderType: "Delivery",
      location: "CFC Pickup Hub",
      deliveryAddress: "Apartment 12B, Street 8, CFC, Casablanca",
      payment: "Paid",
      schedule: "Mon, Wed, Fri - 12:00-14:00",
      date: "Mar 03, 2026",
      total: "$17.00",
      items: [
        { name: "Chicken Burrito Bowl", qty: 1, macros: "510 kcal | P38 C42 F18" }
      ],
      notes: "Ring bell once.",
      subscriptionInfo: "3 days/week for 4 weeks",
      subscriptionDetails: { daysPerWeek: 3, durationWeeks: 4, meals: 24 },
      auditLog: [{ at: "Mar 03, 2026 09:12", by: "Agent Jannat", action: "Created order" }]
    }
  ]);

  await SubscriptionModel.insertMany([
    {
      subscriptionId: "SUB-9201",
      client: "Sara Benali",
      plan: "3 days/week",
      totalWeeks: 4,
      currentWeek: 2,
      dayProgress: "3/3",
      remainingMeals: 6,
      status: "Active",
      log: ["Subscription initialized"]
    }
  ]);

  await NotificationModel.insertMany([
    {
      notificationId: "NOTIF-1",
      title: "New order received",
      meta: "ORD-2092 from Casablanca",
      time: "2 min ago",
      status: "Unread"
    }
  ]);

  await AdminRoleModel.insertMany([
    {
      roleId: "role-super-admin",
      name: "Super Admin",
      description: "Full dashboard access and user management.",
      scopes: ["all", "admin-users", "admin-roles"],
      allowedPages: ["/admin"],
      canPublish: true,
      canManageUsers: true,
      isSystem: true
    },
    {
      roleId: "role-admin",
      name: "Admin",
      description: "Operational admin with broad dashboard access.",
      scopes: ["operations", "content"],
      allowedPages: ["/admin", "/admin/orders", "/admin/subscriptions", "/admin/products", "/admin/menu", "/admin/profile"],
      canPublish: true,
      canManageUsers: false,
      isSystem: true
    },
    {
      roleId: "role-employee",
      name: "Employee",
      description: "Limited day-to-day access.",
      scopes: ["orders"],
      allowedPages: ["/admin", "/admin/orders", "/admin/profile"],
      canPublish: false,
      canManageUsers: false,
      isSystem: true
    }
  ]);

  await PromoCodeModel.insertMany([
    {
      promoCodeId: "promo-welcome15",
      code: "WELCOME15",
      description: "15% off meal plan checkout",
      discountType: "percent",
      discountValue: 15,
      maxDiscount: 120,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      usageLimit: 200,
      usedCount: 0,
      isActive: true,
      appliesToMonthlyPlans: true,
      appliesToDirectOrders: false,
      stackable: false,
      showOnHomepage: true,
      eligibilityNote: "Applies to monthly plan checkout only."
    },
    {
      promoCodeId: "promo-fixed50",
      code: "MEAL50",
      description: "50 MAD off meal plan checkout",
      discountType: "fixed",
      discountValue: 50,
      maxDiscount: 50,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
      appliesToMonthlyPlans: true,
      appliesToDirectOrders: false,
      stackable: false,
      showOnHomepage: false,
      eligibilityNote: "Flat 50 MAD off eligible meal plan checkouts."
    }
  ]);

  await WebsitePageModel.insertMany([
    {
      pageId: "home",
      slug: "home",
      title: "Home",
      navLabel: "Home",
      summary: "Homepage hero, trust-building content, and conversion sections.",
      kind: "system",
      status: "published",
      showInTopNav: true,
      heroEyebrow: "Since 2018",
      heroTitle: "The Real Food Revolution",
      heroSubtitle:
        "Fresh ingredients. No oil. No trans fat. Casablanca's favorite healthy restaurant since 2018.",
      heroBody: "Manage homepage text, images, CTAs, and every major section from the admin dashboard.",
      heroImage: "/hero.png",
      heroPrimaryCtaLabel: "See Our Menu",
      heroPrimaryCtaLink: "/pages/menu",
      heroSecondaryCtaLabel: "Start A Monthly Plan",
      heroSecondaryCtaLink: "/plans",
      seoTitle: "Proteinbar | Healthy Meals & Meal Plans",
      seoDescription: "Fresh meals, flexible plans, and delivery that fits your week.",
      sections: []
    },
    {
      pageId: "menu",
      slug: "menu",
      title: "Menu",
      navLabel: "Menu",
      summary: "Hero and supporting CMS content around the menu.",
      kind: "system",
      status: "published",
      showInTopNav: true,
      heroEyebrow: "Discover",
      heroTitle: "Menu",
      heroSubtitle: "",
      heroBody: "",
      heroImage: "/location_hero.png",
      heroPrimaryCtaLabel: "",
      heroPrimaryCtaLink: "",
      heroSecondaryCtaLabel: "",
      heroSecondaryCtaLink: "",
      seoTitle: "Proteinbar Menu",
      seoDescription: "Browse menu categories and featured meals.",
      sections: []
    },
    {
      pageId: "terms",
      slug: "terms-and-conditions",
      title: "Terms & Conditions",
      navLabel: "Terms",
      summary: "Legal terms for website use, ordering, delivery, and subscriptions.",
      kind: "legal",
      status: "published",
      showInTopNav: false,
      heroEyebrow: "Legal",
      heroTitle: "Terms & Conditions",
      heroSubtitle: "",
      heroBody: "Control the legal text shown across the public website.",
      heroImage: "",
      heroPrimaryCtaLabel: "",
      heroPrimaryCtaLink: "",
      heroSecondaryCtaLabel: "",
      heroSecondaryCtaLink: "",
      seoTitle: "Proteinbar Terms & Conditions",
      seoDescription: "Read the ordering, delivery, and subscription terms.",
      sections: [
        {
          id: "terms-section-0",
          sectionKey: "use-of-website",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 0,
          heading: "Use Of Website",
          body:
            "By using the Proteinbar website, you agree to use it only for lawful purposes and in a way that does not interfere with the experience, security, or availability of the platform for other users.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "terms-section-1",
          sectionKey: "orders-and-availability",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 1,
          heading: "Orders And Availability",
          body:
            "All orders are subject to availability, operational capacity, and confirmation. We reserve the right to update menu items, meal plan options, pricing, and availability without prior notice.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "terms-section-2",
          sectionKey: "pricing",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 2,
          heading: "Pricing",
          body:
            "Prices displayed on the website are provided in good faith and may change when required. Taxes, delivery fees, or applicable service charges may be added depending on the order type and delivery zone.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "terms-section-3",
          sectionKey: "meal-plans-and-custom-selections",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 3,
          heading: "Meal Plans And Custom Selections",
          body:
            "Meal plan and custom meal selections are based on the options available at the time of purchase. Product composition, macros, and ingredients may vary when supply or operational needs require substitutions.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "terms-section-4",
          sectionKey: "cancellations-and-changes",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 4,
          heading: "Cancellations And Changes",
          body:
            "Requests to change or cancel an order are handled based on preparation status, delivery scheduling, and operational feasibility. Once preparation has started, changes may be limited or unavailable.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "terms-section-5",
          sectionKey: "allergies-and-dietary-responsibility",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 5,
          heading: "Allergies And Dietary Responsibility",
          body:
            "Customers are responsible for reviewing ingredient and nutrition information before ordering. If you have allergies, intolerances, or specific dietary restrictions, please contact us before completing your purchase.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "terms-section-6",
          sectionKey: "liability",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 6,
          heading: "Liability",
          body:
            "Proteinbar is not liable for indirect, incidental, or consequential damages resulting from use of the website, order delays, third-party service interruptions, or circumstances outside our reasonable control.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "terms-section-7",
          sectionKey: "changes-to-these-terms",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 7,
          heading: "Changes To These Terms",
          body:
            "We may revise these Terms & Conditions from time to time. Continued use of the website or services after updates means you agree to the revised terms.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        }
      ]
    },
    {
      pageId: "privacy",
      slug: "privacy-policy",
      title: "Privacy Policy",
      navLabel: "Privacy",
      summary: "Privacy disclosures for customer accounts, contact data, and order history.",
      kind: "legal",
      status: "published",
      showInTopNav: false,
      heroEyebrow: "Legal",
      heroTitle: "Privacy Policy",
      heroSubtitle: "",
      heroBody: "Manage customer-data policy copy and compliance text here.",
      heroImage: "",
      heroPrimaryCtaLabel: "",
      heroPrimaryCtaLink: "",
      heroSecondaryCtaLabel: "",
      heroSecondaryCtaLink: "",
      seoTitle: "Proteinbar Privacy Policy",
      seoDescription: "Understand how Proteinbar stores and uses customer data.",
      sections: [
        {
          id: "privacy-section-1",
          sectionKey: "information-we-collect",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 0,
          heading: "Information We Collect",
          body:
            "We may collect information you provide directly when you place an order, create a meal plan, contact us, or subscribe to updates. This can include your name, email address, phone number, delivery details, and order preferences.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "privacy-section-2",
          sectionKey: "how-we-use-your-information",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 1,
          heading: "How We Use Your Information",
          body:
            "We use your information to process orders, manage deliveries, support your account experience, respond to inquiries, and improve our menu, meal plans, and customer service experience.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "privacy-section-3",
          sectionKey: "payments-and-orders",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 2,
          heading: "Payments And Orders",
          body:
            "Payment and order information may be used to complete transactions, confirm bookings, prevent fraud, and maintain internal business records related to your purchases.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "privacy-section-4",
          sectionKey: "sharing-of-information",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 3,
          heading: "Sharing Of Information",
          body:
            "We do not sell your personal information. We may share limited information with service providers or operational partners only when needed to process orders, deliver meals, provide support, or comply with legal obligations.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "privacy-section-5",
          sectionKey: "data-security",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 4,
          heading: "Data Security",
          body:
            "We take reasonable steps to protect personal information using appropriate technical and organizational measures. However, no online system can guarantee absolute security.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "privacy-section-6",
          sectionKey: "your-choices",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 5,
          heading: "Your Choices",
          body:
            "You may contact us to request updates or corrections to the personal information you have shared with us. You may also ask questions about how your information is handled.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        },
        {
          id: "privacy-section-7",
          sectionKey: "policy-updates",
          sectionType: "richText",
          isVisible: true,
          sortOrder: 6,
          heading: "Policy Updates",
          body:
            "We may update this Privacy Policy from time to time to reflect operational, legal, or service changes. Continued use of our website or services after updates means you accept the revised policy.",
          eyebrow: "",
          image: "",
          buttonLabel: "",
          buttonLink: "",
          items: []
        }
      ]
    },
    {
      pageId: "about-us",
      slug: "about-us",
      title: "About Us",
      navLabel: "About Us",
      summary: "Brand story and trust-building content.",
      kind: "system",
      status: "published",
      showInTopNav: true,
      heroEyebrow: "Our Story",
      heroTitle: "About us",
      heroSubtitle: "",
      heroBody: "",
      heroImage: "/hero.png",
      heroPrimaryCtaLabel: "",
      heroPrimaryCtaLink: "",
      heroSecondaryCtaLabel: "",
      heroSecondaryCtaLink: "",
      seoTitle: "About Proteinbar",
      seoDescription: "Learn more about Proteinbar.",
      sections: []
    },
    {
      pageId: "contact",
      slug: "contact",
      title: "Contact",
      navLabel: "Contact",
      summary: "Support and contact page content.",
      kind: "system",
      status: "published",
      showInTopNav: true,
      heroEyebrow: "Get In Touch",
      heroTitle: "Contact Us",
      heroSubtitle: "",
      heroBody: "",
      heroImage: "/hero.png",
      heroPrimaryCtaLabel: "",
      heroPrimaryCtaLink: "",
      heroSecondaryCtaLabel: "",
      heroSecondaryCtaLink: "",
      seoTitle: "Contact Proteinbar",
      seoDescription: "Reach Proteinbar for support or questions.",
      sections: []
    },
    {
      pageId: "locations",
      slug: "locations",
      title: "Locations",
      navLabel: "Locations",
      summary: "Hero and support copy for the locations page.",
      kind: "system",
      status: "published",
      showInTopNav: true,
      heroEyebrow: "Visit Us",
      heroTitle: "Locations",
      heroSubtitle: "",
      heroBody: "",
      heroImage: "/location_hero.png",
      heroPrimaryCtaLabel: "",
      heroPrimaryCtaLink: "",
      heroSecondaryCtaLabel: "",
      heroSecondaryCtaLink: "",
      seoTitle: "Proteinbar Locations",
      seoDescription: "Pickup points, delivery zones, and branch guidance.",
      sections: [
        {
          id: "locations-delivery-overview",
          sectionKey: "delivery-overview",
          sectionType: "stats",
          isVisible: true,
          sortOrder: 0,
          heading: "2 Locations & Delivery All Over Casablanca",
          body:
            "Besides Our 2 Locations, We Focus Bringing Healthy, Delicious Meals Right To Your Doorstep, Wherever You Are In Casablanca.",
          eyebrow: "",
          image: "/healthy/image-7.png",
          buttonLabel: "",
          buttonLink: "",
          items: [
            { id: "delivery-stat-1", title: "Staff Members", subtitle: "+", body: "users", value: "14", image: "" },
            { id: "delivery-stat-2", title: "Opens everyday", subtitle: "/7", body: "calendar", value: "7", image: "" },
            { id: "delivery-stat-3", title: "Positive Reviews", subtitle: "+", body: "thumbs-up", value: "411", image: "" }
          ]
        }
      ]
    }
  ]);

  await MenuCategoryModel.insertMany([
    {
      categoryId: "high-protein-breakfast",
      name: "BREAKFAST",
      description: "Petits Déjeuners",
      items: [
        {
          id: "leggs-day",
          name: "L'EGGS DAY",
          description: "Omelette, patate douce et salade.",
          priceMad: 45,
          calories: 794
        }
      ]
    }
  ]);

  await StoreProductModel.insertMany([
    {
      productId: "compose-plate",
      handle: "im-composing",
      title: "I'm composing!",
      description: "Build your own protein plate with your preferred macros.",
      priceMad: 0,
      image: "/food/food.png"
    },
    {
      productId: "keto-avocado-burger",
      handle: "keto-avocado-burger",
      title: "Keto avocado burger",
      description: "Low-carb burger option for keto-focused diets.",
      priceMad: 90,
      image: "/food/food13.webp"
    }
  ]);

  await PublicLocationModel.insertMany([
    {
      locationId: "anfa-casablanca",
      name: "PROTEINBAR - Bourgone.",
      address: "7 Rue Ibnou Jahir, Casablanca",
      phone: "0520-206366",
      mapUrl: "https://maps.google.com/?q=7+Rue+Ibnou+Jahir+Casablanca"
    }
  ]);

  await UserModel.updateOne(
    { email: "superadmin@proteinbar.com" },
    {
      $set: {
        role: "super_admin",
        password: "admin12345",
        fullName: "Proteinbar Super Admin",
        adminRoleId: "role-super-admin",
        allowedPages: ["/admin/users-permissions", "/admin/website", "/admin/profile"],
        canPublish: true,
        canManageUsers: true,
        isActive: true
      }
    },
    { upsert: true }
  );

  await UserModel.updateOne(
    { email: "admin@proteinbar.com" },
    {
      $set: {
        role: "admin",
        password: "admin12345",
        fullName: "Proteinbar Admin",
        adminRoleId: "role-admin",
        allowedPages: [],
        canPublish: true,
        canManageUsers: false,
        isActive: true
      }
    },
    { upsert: true }
  );

  console.log("Seed completed");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

