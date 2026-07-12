import mongoose from "mongoose";
import { connectDb } from "../config/db";
import { SubscriptionModel } from "../modules/admin/admin.model";
import { CustomerSubscriptionModel } from "../modules/public/public.model";

const subscriptionId = "SUB-DEMO-ADMIN-001";

async function main() {
  await connectDb();

  const selectedMeals = [
    {
      instanceId: "seed-meal-2026-07-13-lunch",
      id: "seed-chicken-burrito-bowl",
      title: "Chicken Burrito Bowl",
      date: "2026-07-13",
      extrasSummary: "Extra chicken",
      calories: 620,
      protein: 48,
      carb: 58,
      fat: 18,
      basePrice: 14,
      totalPrice: 16,
    },
    {
      instanceId: "seed-meal-2026-07-14-lunch",
      id: "seed-salmon-power-box",
      title: "Salmon Power Box",
      date: "2026-07-14",
      extrasSummary: "",
      calories: 540,
      protein: 42,
      carb: 44,
      fat: 20,
      basePrice: 17,
      totalPrice: 17,
    },
  ];

  const [subscriptionResult, customerSubscriptionResult] = await Promise.all([
    SubscriptionModel.updateOne(
      { subscriptionId },
      {
        $setOnInsert: {
          subscriptionId,
          client: "Demo Subscription Client",
          plan: "1 Month Cut - Men",
          totalWeeks: 4,
          currentWeek: 1,
          dayProgress: "0/3",
          remainingMeals: 24,
          status: "active",
          log: [
            "Seeded demo subscription for admin testing",
            "Payment confirmed on seed data",
          ],
        },
      },
      { upsert: true },
    ),
    CustomerSubscriptionModel.updateOne(
      { subscriptionId },
      {
        $setOnInsert: {
          subscriptionId,
          rawPayload: {
            source: "seed-subscription-demo",
            note: "Safe demo data for /admin/subscriptions",
          },
          customer: {
            firstName: "Demo",
            lastName: "Client",
            email: "demo.subscription@proteinbargroup.com",
            phone: "+212600000001",
            emirate: "Casablanca",
            area: "Maarif",
          },
          plan: {
            id: "seed-plan-cut-men",
            title: "1 Month Cut - Men",
          },
          selection: {
            meals: "2",
            days: "3",
            weeks: "4",
            snacks: "0",
            startDate: "2026-07-13",
            deliveryDays: "Monday,Tuesday,Wednesday",
            planType: "pre-made",
            selectedMeals,
          },
          delivery: {
            optionId: "daily-delivery",
            address: "Demo address, Maarif, Casablanca",
            pickupLocation: {
              id: "",
              name: "",
              address: "",
            },
          },
          status: "active",
        },
      },
      { upsert: true },
    ),
  ]);

  const createdSubscription = subscriptionResult.upsertedCount > 0;
  const createdCustomerSubscription = customerSubscriptionResult.upsertedCount > 0;

  console.log(
    [
      `Demo subscription id: ${subscriptionId}`,
      `SubscriptionModel: ${createdSubscription ? "created" : "already existed"}`,
      `CustomerSubscriptionModel: ${createdCustomerSubscription ? "created" : "already existed"}`,
    ].join("\n"),
  );
}

main()
  .catch((error) => {
    console.error("Failed to seed demo subscription:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
