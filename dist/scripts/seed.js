"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const admin_model_1 = require("../modules/admin/admin.model");
const auth_model_1 = require("../modules/auth/auth.model");
const public_model_1 = require("../modules/public/public.model");
async function seed() {
    await (0, db_1.connectDb)();
    await Promise.all([
        admin_model_1.ProductModel.deleteMany({}),
        admin_model_1.MenuItemModel.deleteMany({}),
        admin_model_1.LocationModel.deleteMany({}),
        admin_model_1.MonthlyPlanModel.deleteMany({}),
        admin_model_1.IngredientModel.deleteMany({}),
        admin_model_1.OrderModel.deleteMany({}),
        admin_model_1.SubscriptionModel.deleteMany({}),
        admin_model_1.NotificationModel.deleteMany({}),
        admin_model_1.WebsitePageModel.deleteMany({}),
        public_model_1.MenuCategoryModel.deleteMany({}),
        public_model_1.StoreProductModel.deleteMany({}),
        public_model_1.PublicLocationModel.deleteMany({})
    ]);
    await admin_model_1.ProductModel.insertMany([
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
    await admin_model_1.MenuItemModel.insertMany([
        {
            menuId: "MENU-901",
            title: "High Protein Lunch Box",
            image: "/food/food.png",
            linkedProductSkus: ["PRD-101"],
            visibleDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            timeSlots: ["12:00-14:00", "14:00-16:00"],
            mealTypes: ["Lunch"],
            planCompatibility: ["Weight Loss", "Muscle Gain"],
            priority: 1,
            status: "Visible"
        }
    ]);
    await admin_model_1.LocationModel.insertMany([
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
    await admin_model_1.MonthlyPlanModel.insertMany([
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
    await admin_model_1.IngredientModel.insertMany([
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
    await admin_model_1.OrderModel.insertMany([
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
    await admin_model_1.SubscriptionModel.insertMany([
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
    await admin_model_1.NotificationModel.insertMany([
        {
            notificationId: "NOTIF-1",
            title: "New order received",
            meta: "ORD-2092 from Casablanca",
            time: "2 min ago",
            status: "Unread"
        }
    ]);
    await admin_model_1.WebsitePageModel.insertMany([
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
            heroSubtitle: "Fresh ingredients. No oil. No trans fat. Casablanca's favorite healthy restaurant since 2018.",
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
                    body: "Besides Our 2 Locations, We Focus Bringing Healthy, Delicious Meals Right To Your Doorstep, Wherever You Are In Casablanca.",
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
    await public_model_1.MenuCategoryModel.insertMany([
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
    await public_model_1.StoreProductModel.insertMany([
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
    await public_model_1.PublicLocationModel.insertMany([
        {
            locationId: "anfa-casablanca",
            name: "PROTEINBAR - Bourgone.",
            address: "7 Rue Ibnou Jahir, Casablanca",
            phone: "0520-206366",
            mapUrl: "https://maps.google.com/?q=7+Rue+Ibnou+Jahir+Casablanca"
        }
    ]);
    await auth_model_1.UserModel.updateOne({ email: "admin@proteinbar.com" }, { $set: { role: "admin", password: "admin12345" } }, { upsert: true });
    console.log("Seed completed");
    process.exit(0);
}
seed().catch((error) => {
    console.error(error);
    process.exit(1);
});
