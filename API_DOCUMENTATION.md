# Proteinbar Backend API Reference

Source of truth: route/controller/validation files in `proteinbar-backend/src`.

## Base URL

- API base: `http://localhost:5000/api/v1`
- Health check: `GET http://localhost:5000/health`

`PORT` is configurable via environment; `5000` is the default in code.

## Authentication / Authorization

- No route-level auth middleware is currently applied to `/api/v1/admin`, `/api/v1/auth`, or `/api/v1/public`.
- `POST /api/v1/auth/admin-login` returns a `token` value (`"demo-admin-token"`), but it is not enforced by middleware in the current code.

## Common Response Format

### Success (most endpoints)

```json
{
  "success": true,
  "data": {}
}
```

### Delete success

- `204 No Content`
- Empty body

### Error

```json
{
  "success": false,
  "message": "Validation failed",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Invalid email"]
    }
  }
}
```

## Auth Routes (`/api/v1/auth`)

### `POST /send-code`

- Description: Create email verification code (6 digits, expires in 10 minutes).
- Body:

```json
{
  "email": "user@example.com"
}
```

- `201 Created` data:

```json
{
  "email": "user@example.com",
  "code": "123456",
  "expiresAt": "2026-03-07T10:10:00.000Z"
}
```

### `POST /verify-code`

- Description: Verify code and upsert customer user.
- Body:

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

- `200 OK` data:

```json
{
  "user": {
    "id": "mongo_object_id",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

- Errors:
- `400 Invalid or expired verification code`

### `POST /admin-login`

- Description: Authenticate admin by email/password.
- Body:

```json
{
  "email": "admin@example.com",
  "password": "secret"
}
```

- `200 OK` data:

```json
{
  "user": {
    "id": "mongo_object_id",
    "email": "admin@example.com",
    "role": "admin"
  },
  "token": "demo-admin-token"
}
```

- Errors:
- `401 Invalid admin credentials`

### `POST /reset-password`

- Description: Upsert admin user and set password.
- Body:

```json
{
  "email": "admin@example.com",
  "newPassword": "new-secret"
}
```

- `200 OK` data:

```json
{
  "user": {
    "id": "mongo_object_id",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

## Admin Routes (`/api/v1/admin`)

## Dashboard

### `GET /dashboard`

- `200 OK` data:

```json
{
  "dashboardStats": [
    { "title": "Today Orders", "value": "12" },
    { "title": "Daily Production", "value": "18 Meals" },
    { "title": "Active Menu Cards", "value": "25" },
    { "title": "Active Subscribers", "value": "77" }
  ],
  "latestOrders": [
    {
      "id": "ORD-1",
      "customer": "John Doe",
      "amount": "$120.00",
      "status": "Pending",
      "date": "2026-03-07"
    }
  ]
}
```

## Products

### `GET /products`

- `200 OK` data: array of products.

### `POST /products`

- `201 Created`
- Body (required):

```json
{
  "sku": "SKU-1001",
  "name": "Chicken Bowl",
  "category": "Lunch",
  "price": "$12.00",
  "kcal": 450,
  "protein": "35g",
  "carbs": "30g",
  "fat": "12g",
  "tags": ["high-protein"],
  "allergens": ["nuts"],
  "availability": "Active",
  "imageUrl": "https://example.com/image.jpg"
}
```

### `PATCH /products/:id`

- `200 OK`
- Params:
- `id`: Mongo `_id`
- Body: any subset of product fields.

### `DELETE /products/:id`

- `204 No Content`
- Errors:
- `404 Product not found`

## Menu Items

### `GET /menu-items`

- `200 OK` data: array of menu items.

### `POST /menu-items`

- `201 Created`
- Body:

```json
{
  "menuId": "MENU-001",
  "title": "Weekday Lunch Set",
  "linkedProductSkus": ["SKU-1001", "SKU-1002"],
  "visibleDays": ["Mon", "Tue"],
  "timeSlots": ["Lunch"],
  "mealTypes": ["Main"],
  "planCompatibility": ["custom", "preset"],
  "priority": 1,
  "status": "Visible"
}
```

### `PATCH /menu-items/:id`

- `200 OK`
- Params:
- `id`: Mongo `_id`
- Body: partial menu item fields.

### `DELETE /menu-items/:id`

- `204 No Content`
- Errors:
- `404 Menu item not found`

## Locations

### `GET /locations`

- `200 OK` data: array of admin locations.

### `POST /locations`

- `201 Created`
- Body:

```json
{
  "locationId": "LOC-001",
  "name": "Marina Pickup",
  "pickupAddress": "Marina, Dubai",
  "mapLink": "https://maps.google.com",
  "deliveryZone": "Zone A",
  "deliveryFee": "$5.00",
  "workingDays": ["Mon", "Tue", "Wed"],
  "cutoffTime": "10:00 PM",
  "timeSlots": ["Morning", "Evening"]
}
```

### `PATCH /locations/:id`

- `200 OK`
- Params:
- `id`: Mongo `_id`
- Body: partial location fields.

### `DELETE /locations/:id`

- `204 No Content`
- Errors:
- `404 Location not found`

## Monthly Plans

### `GET /monthly-plans`

- `200 OK` data: array of monthly plans.

### `POST /monthly-plans`

- `201 Created`
- Body:

```json
{
  "planId": "PLAN-001",
  "name": "Keto Monthly",
  "basePrice": "$399",
  "members": 25,
  "status": "Active",
  "isNew": true,
  "description": "Low-carb monthly plan",
  "imageUrl": "https://example.com/plan.jpg"
}
```

### `PATCH /monthly-plans/:id`

- `200 OK`
- Params:
- `id`: Mongo `_id`
- Body: partial monthly plan fields.

### `DELETE /monthly-plans/:id`

- `204 No Content`
- Errors:
- `404 Plan not found`

## Plan Flows

### `GET /plan-flows`

- `200 OK` data: array of flows (`custom`, `preset`) with ordered `steps`.
- Seeds default flows if missing.

### `PUT /plan-flows/:flowType`

- `200 OK`
- Params:
- `flowType`: `custom` or `preset`
- Body:

```json
{
  "steps": [
    { "step": "Step 1", "title": "Set number of meals" },
    { "step": "Step 2", "title": "Pick start date" }
  ]
}
```

- Validation:
- `steps` must be non-empty
- each step needs non-empty `step` and `title`

## Ingredients

### `GET /ingredients`

- `200 OK` data: array of ingredients.

### `POST /ingredients`

- `201 Created`
- Body:

```json
{
  "ingredientId": "ING-001",
  "category": "Protein",
  "item": "Chicken Breast",
  "quantityLabel": "150g",
  "kcal": 200,
  "protein": 35,
  "carbs": 0,
  "fat": 5
}
```

### `PATCH /ingredients/:id`

- `200 OK`
- Params:
- `id`: Mongo `_id`
- Body: partial ingredient fields.

### `DELETE /ingredients/:id`

- `204 No Content`
- Errors:
- `404 Ingredient not found`

## Orders

### `GET /orders`

- `200 OK` data: array of orders.
- Optional query params:
- `status` exact match
- `payment` exact match
- `mode` maps to `orderType`
- `client` case-insensitive contains
- `location` case-insensitive contains
- `plan` case-insensitive contains
- `date` case-insensitive contains

### `PATCH /orders/:id`

- `200 OK`
- Params:
- `id`: Mongo `_id`
- Body (all optional):

```json
{
  "status": "Completed",
  "confirmationStatus": "Confirmed",
  "notes": "Leave at door",
  "payment": "Paid",
  "location": "Marina",
  "schedule": "Mon-Fri"
}
```

- Behavior: prepends `auditLog` with `Order updated` action.
- Errors:
- `404 Order not found`

### `GET /orders-of-day`

- `200 OK` data: latest 20 orders.

### `GET /printing`

- `200 OK` data: flattened printable rows:

```json
{
  "orderId": "ORD-1",
  "client": "John Doe",
  "date": "2026-03-07",
  "meal": "Chicken Bowl",
  "macros": "P35/C30/F12",
  "bestBefore": "2026-03-07"
}
```

## Subscriptions

### `GET /subscriptions`

- `200 OK` data: array of subscriptions.

### `PATCH /subscriptions/:id`

- `200 OK`
- Params:
- `id`: Mongo `_id`
- Body (all optional):

```json
{
  "status": "Paused",
  "dayProgress": "Day 8/30",
  "totalWeeks": 4,
  "currentWeek": 2,
  "remainingMeals": 18,
  "logMessage": "Paused by support"
}
```

- Behavior: `logMessage` is inserted into `log` array, then removed from direct patch.
- Errors:
- `404 Subscription not found`

## Notifications

### `GET /notifications`

- `200 OK` data: array of notifications.

### `DELETE /notifications/:id`

- `204 No Content`
- Errors:
- `404 Notification not found`

## Public Routes (`/api/v1/public`)

### `GET /menu-categories`

- `200 OK` data: array of menu categories.

### `GET /monthly-plans`

- `200 OK` data: array of monthly plans.

### `GET /monthly-plans/:planId`

- `200 OK` data: monthly plan by `planId` (not Mongo `_id`).
- Errors:
- `404 Monthly plan not found`

### `GET /products`

- `200 OK` data: array of store products.

### `GET /products/:handle`

- `200 OK` data: product by unique `handle`.
- Errors:
- `404 Product not found`

### `GET /locations`

- `200 OK` data: array of public locations.

### `GET /builder-ingredients`

- `200 OK` data: array of ingredients (from admin ingredient model).

### `POST /contact`

- `201 Created`
- Body:

```json
{
  "name": "John Doe",
  "phone": "+971500000000",
  "email": "john@example.com",
  "message": "I would like more details about your plans."
}
```

### `POST /checkout`

- `201 Created`
- Body:

```json
{
  "subscription": {
    "plan": {
      "id": "PLAN-001",
      "title": "Keto Monthly"
    },
    "selection": {
      "meals": "3",
      "days": "5",
      "snacks": "1",
      "startDate": "2026-03-10",
      "planType": "custom"
    },
    "delivery": {
      "optionId": "delivery",
      "address": "Dubai Marina",
      "pickupLocation": {
        "id": "LOC-001",
        "name": "Marina Pickup",
        "address": "Marina, Dubai"
      }
    }
  },
  "order": {
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+971500000000",
      "emirate": "Dubai",
      "area": "Marina"
    },
    "delivery": {
      "optionId": "delivery",
      "address": "Dubai Marina",
      "pickupLocation": {
        "id": "LOC-001",
        "name": "Marina Pickup",
        "address": "Marina, Dubai"
      }
    },
    "totals": {
      "subtotal": 100,
      "giftDiscount": 0,
      "vat": 5,
      "safetyBag": 2,
      "grandTotal": 107
    }
  }
}
```

- `201 Created` data includes:
- `subscription` with generated `subscriptionId` (`SUB-...`)
- `order` with generated `orderId` (`ORD-...`)

### `POST /store-orders`

- `201 Created`
- Body:

```json
{
  "customer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+971500000000",
    "cityArea": "Marina",
    "address": "Street 1"
  },
  "items": [
    {
      "handle": "protein-bar-choco",
      "title": "Protein Bar Choco",
      "priceMad": 20,
      "quantity": 2
    }
  ],
  "totals": {
    "subtotal": 40,
    "vat": 2,
    "total": 42
  }
}
```

- `201 Created` data includes generated `orderId` (`STORE-ORD-...`).

## Status Code Summary

- `200` successful reads/updates/login/verify
- `201` successful creates
- `204` successful deletes
- `400` validation error, invalid/expired code
- `401` invalid admin credentials
- `404` resource not found or route not found
- `500` internal server error
