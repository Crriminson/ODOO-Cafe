# API Contract

> **This document is frozen.** It is the single source of truth for every API endpoint.
> Feature owners implement routes against this. Frontend owners implement `api/*.js` against this.
> Neither side references the other — both reference this doc.
>
> Changes require group discussion and a new commit that updates both this doc and the relevant route/client function simultaneously.

---

## Conventions

- All routes: `POST /api/v1/...`
- Auth: `Authorization: Bearer <jwt>` on all routes except `/auth/*`
- All timestamps: UTC ISO 8601 (`"2024-06-13T10:30:00.000Z"`)
- All DECIMAL fields: numeric strings (`"1250.50"`) — never raw JS numbers
- Currency symbol: displayed by frontend only via `formatCurrency()`
- Error envelope (all errors): `{ "error": { "message": "...", "code": "..." } }`
- Validation error (422): adds `"fields": [{ "field": "...", "message": "..." }]`

---

## Error Response Examples

### 401 Unauthorized
```json
{ "error": { "message": "Invalid or expired token", "code": "TOKEN_INVALID" } }
```

### 403 Forbidden
```json
{ "error": { "message": "Access restricted to: admin", "code": "FORBIDDEN" } }
```

### 404 Not Found
```json
{ "error": { "message": "Order not found", "code": "NOT_FOUND" } }
```

### 422 Validation Error
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": [
      { "field": "email", "message": "Invalid email address" },
      { "field": "price", "message": "Expected number, received string" }
    ]
  }
}
```

---

## Auth

### POST `/auth/signup`
No auth required.

**Request:**
```json
{
  "name":     "Cafe Admin",
  "email":    "admin@odoocafe.com",
  "password": "admin123",
  "role":     "admin"
}
```

**Response 201:**
```json
{
  "token": "<jwt>",
  "user": {
    "id":         1,
    "name":       "Cafe Admin",
    "email":      "admin@odoocafe.com",
    "role":       "admin"
  }
}
```

**Errors:** `409 EMAIL_EXISTS`, `422 VALIDATION_ERROR`

---

### POST `/auth/login`
No auth required.

**Request:**
```json
{
  "email":    "admin@odoocafe.com",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "token": "<jwt>",
  "user": {
    "id":    1,
    "name":  "Cafe Admin",
    "email": "admin@odoocafe.com",
    "role":  "admin"
  }
}
```

**Errors:** `401 INVALID_CREDENTIALS`, `422 VALIDATION_ERROR`

---

### POST `/auth/logout`
Requires auth.

**Request:** empty body

**Response 200:**
```json
{ "message": "Logged out successfully" }
```

---

### GET `/auth/me`
Requires auth.

**Response 200:**
```json
{
  "user": {
    "id":         1,
    "name":       "Cafe Admin",
    "email":      "admin@odoocafe.com",
    "role":       "admin",
    "is_active":  true,
    "created_at": "2024-06-13T10:30:00.000Z"
  }
}
```

---

## Products

### GET `/products`
Requires auth.
Query: `?category_id=1` `?search=espresso` `?is_active=true`

**Response 200:**
```json
{
  "products": [
    {
      "id":                  1,
      "name":                "Espresso",
      "category_id":         1,
      "price":               "120.00",
      "unit_of_measure":     "piece",
      "tax_rate":            "5.00",
      "description":         "Strong black coffee.",
      "estimated_prep_time": 2,
      "show_on_kds":         true,
      "is_active":           true,
      "created_at":          "2024-06-13T10:30:00.000Z",
      "updated_at":          "2024-06-13T10:30:00.000Z"
    }
  ]
}
```

---

### POST `/products`
Requires auth. Role: `admin`.

**Request:**
```json
{
  "name":                "Espresso",
  "category_id":         1,
  "price":               120.00,
  "unit_of_measure":     "piece",
  "tax_rate":            5.00,
  "description":         "Strong black coffee.",
  "estimated_prep_time": 2,
  "show_on_kds":         true
}
```

**Response 201:**
```json
{ "product": { /* same shape as GET list item */ } }
```

**Errors:** `422 VALIDATION_ERROR`, `403 FORBIDDEN`

---

### PUT `/products/:id`
Requires auth. Role: `admin`.

**Request:** same fields as POST, all optional (partial update).

**Response 200:**
```json
{ "product": { /* updated product */ } }
```

**Errors:** `404 NOT_FOUND`, `422 VALIDATION_ERROR`, `403 FORBIDDEN`

---

### DELETE `/products/:id`
Requires auth. Role: `admin`. Soft-deletes (`is_active = false`).

**Response 200:**
```json
{ "message": "Product archived successfully" }
```

**Errors:** `404 NOT_FOUND`, `403 FORBIDDEN`

---

## Categories

### GET `/categories`
Requires auth.

**Response 200:**
```json
{
  "categories": [
    {
      "id":         1,
      "name":       "Coffee",
      "color":      "#3E2723",
      "created_at": "2024-06-13T10:30:00.000Z",
      "updated_at": "2024-06-13T10:30:00.000Z"
    }
  ]
}
```

---

### POST `/categories`
Requires auth. Role: `admin`.

**Request:**
```json
{ "name": "Coffee", "color": "#3E2723" }
```

**Response 201:**
```json
{ "category": { /* same shape as GET list item */ } }
```

**Errors:** `409 NAME_EXISTS`, `422 VALIDATION_ERROR`

---

### PUT `/categories/:id`
Requires auth. Role: `admin`.

**Request:** `name` and/or `color` (both optional, at least one required).

**Response 200:**
```json
{ "category": { /* updated category */ } }
```

---

### DELETE `/categories/:id`
Requires auth. Role: `admin`. Hard delete — fails if products reference this category.

**Response 200:**
```json
{ "message": "Category deleted successfully" }
```

**Errors:** `409 HAS_PRODUCTS` (if products still reference it)

---

## Sessions

### GET `/sessions/current`
Requires auth.
Returns the caller's open session, or `null` if no session is open.

**Response 200:**
```json
{
  "session": {
    "id":          1,
    "employee_id": 2,
    "opened_at":   "2024-06-13T08:00:00.000Z",
    "closed_at":   null,
    "created_at":  "2024-06-13T08:00:00.000Z"
  }
}
```
or:
```json
{ "session": null }
```

---

### POST `/sessions/open`
Requires auth. Role: `employee`.
Fails if the caller already has an open session.

**Request:** empty body

**Response 201:**
```json
{
  "session": {
    "id":          1,
    "employee_id": 2,
    "opened_at":   "2024-06-13T08:00:00.000Z",
    "closed_at":   null,
    "created_at":  "2024-06-13T08:00:00.000Z"
  }
}
```

**Errors:** `409 SESSION_ALREADY_OPEN`

> **Frontend contract:** store `session.id` and pass it as `session_id` when creating orders.

---

### POST `/sessions/close`
Requires auth. Role: `employee`.
Closes the caller's open session and returns the closing summary.

**Request:** empty body

**Response 200:**
```json
{
  "session": {
    "id":                    1,
    "employee_id":           2,
    "opened_at":             "2024-06-13T08:00:00.000Z",
    "closed_at":             "2024-06-13T20:00:00.000Z",
    "closing_total_orders":  12,
    "closing_total_revenue": "4560.00",
    "closing_breakdown": {
      "cash": "2000.00",
      "card": "1500.00",
      "upi":  "1060.00"
    },
    "created_at": "2024-06-13T08:00:00.000Z"
  }
}
```

**Errors:** `404 NO_OPEN_SESSION`

---

## Orders

### GET `/orders`
Requires auth.
Query: `?session_id=1` `?status=draft` `?search=john`

**Response 200:**
```json
{
  "orders": [
    {
      "id":                      5,
      "session_id":              1,
      "employee_id":             2,
      "customer_id":             null,
      "table_id":                3,
      "order_type":              "dine_in",
      "status":                  "sent",
      "subtotal":                "270.00",
      "tax_total":               "13.50",
      "discount_total":          "0.00",
      "tip":                     "0.00",
      "total":                   "283.50",
      "loyalty_points_redeemed": 0,
      "loyalty_discount":        "0.00",
      "created_at":              "2024-06-13T10:30:00.000Z",
      "updated_at":              "2024-06-13T10:31:00.000Z"
    }
  ]
}
```

---

### POST `/orders`
Requires auth.

**Request:**
```json
{
  "session_id":  1,
  "order_type":  "dine_in",
  "table_id":    3,
  "customer_id": null,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 6, "quantity": 1 }
  ]
}
```

> `table_id` must be present when `order_type = "dine_in"`. Omit or send `null` for takeaway.
> Server computes `unit_price` (snapshot), `line_total`, `subtotal`, `tax_total`, `total`.
> Created order has `status: "draft"`.

**Response 201:**
```json
{
  "order": {
    /* full Order object */
    "items": [ /* array of OrderItem */ ]
  }
}
```

**Errors:** `422 VALIDATION_ERROR`, `400 TABLE_REQUIRED_FOR_DINE_IN`

---

### GET `/orders/:id`
Requires auth.

**Response 200:**
```json
{
  "order": {
    /* full Order object */
    "items":     [ /* OrderItem[] */ ],
    "payments":  [ /* Payment[]   */ ],
    "discounts": [ /* OrderDiscount[] */ ]
  }
}
```

---

### PUT `/orders/:id`
Requires auth. Only allowed when `status = "draft"`.

**Request:** same shape as POST (all fields optional). Can update items array — server replaces items.

**Response 200:**
```json
{ "order": { /* updated order + items */ } }
```

**Errors:** `409 ORDER_NOT_DRAFT`

---

### POST `/orders/:id/send`
Requires auth. Moves status from `draft` → `sent`. Triggers `order:new` WebSocket event.

**Request:** empty body

**Response 200:**
```json
{ "order": { /* updated order with status "sent" */ } }
```

**Errors:** `409 ORDER_NOT_DRAFT`

---

### POST `/orders/:id/pay`
Requires auth. Moves status from `sent` → `paid`. Creates payment record. Triggers `order:paid` WebSocket event. Awards loyalty points if customer is linked.

**Request:**
```json
{
  "method":                "cash",
  "amount":                "300.00",
  "tip":                   "0.00",
  "transaction_reference": null,
  "coupon_code":           null,
  "loyalty_points_to_redeem": 0
}
```

> `transaction_reference` required when `method = "card"`.
> `coupon_code` — server validates and applies if provided.
> `loyalty_points_to_redeem` — server validates against customer balance and rate.

**Response 200:**
```json
{
  "order": { /* updated order with status "paid" */ },
  "payment": { /* Payment object */ },
  "change_due": "16.50"
}
```

**Errors:** `409 ORDER_NOT_SENT`, `400 INSUFFICIENT_LOYALTY_POINTS`, `400 INVALID_COUPON`, `422 VALIDATION_ERROR`

---

### DELETE `/orders/:id`
Requires auth. Only allowed when `status = "draft"`. Hard delete.

**Response 200:**
```json
{ "message": "Order deleted successfully" }
```

**Errors:** `409 ORDER_NOT_DRAFT`

---

## Customers

### GET `/customers`
Requires auth.
Query: `?search=john` (matches name, email, phone)

**Response 200:**
```json
{
  "customers": [
    {
      "id":             1,
      "name":           "Priya Sharma",
      "email":          "priya@example.com",
      "phone":          "9876543210",
      "address":        null,
      "loyalty_points": 45,
      "created_at":     "2024-06-13T10:30:00.000Z",
      "updated_at":     "2024-06-13T10:30:00.000Z"
    }
  ]
}
```

---

### POST `/customers`
Requires auth.

**Request:**
```json
{
  "name":    "Priya Sharma",
  "email":   "priya@example.com",
  "phone":   "9876543210",
  "address": null
}
```

**Response 201:**
```json
{ "customer": { /* Customer object */ } }
```

---

### PUT `/customers/:id`
Requires auth.

**Request:** same as POST, all fields optional.

**Response 200:**
```json
{ "customer": { /* updated Customer */ } }
```

---

### DELETE `/customers/:id`
Requires auth.

**Response 200:**
```json
{ "message": "Customer deleted successfully" }
```

---

## KDS

### GET `/kds/orders`
No auth required (KDS is an open display).
Returns all active KDS orders (status = `sent`, kds_status != `completed`).

**Response 200:**
```json
{
  "orders": [
    {
      "id":          5,
      "order_type":  "dine_in",
      "table_id":    3,
      "status":      "sent",
      "created_at":  "2024-06-13T10:30:00.000Z",
      "items": [
        {
          "id":               1,
          "product_id":       1,
          "product_name":     "Espresso",
          "category_id":      1,
          "show_on_kds":      true,
          "quantity":         2,
          "unit_price":       "120.00",
          "kds_status":       "to_cook",
          "is_item_completed": false,
          "assigned_cook_id": 1,
          "assigned_cook_name": "Chef Raj"
        }
      ]
    }
  ]
}
```

---

### PUT `/kds/orders/:id/stage`
No auth required. Advances `kds_status` of ALL items in the order to the next stage.
Progression: `to_cook` → `preparing` → `completed`.
Triggers `order:stage_updated` WebSocket event.

**Request:** empty body

**Response 200:**
```json
{
  "order_id":  5,
  "kds_status": "preparing"
}
```

**Errors:** `409 ALREADY_COMPLETED`

---

### PUT `/kds/items/:id/complete`
No auth required. Sets `is_item_completed = true` on a single item.
Triggers `item:completed` WebSocket event.

**Request:** empty body

**Response 200:**
```json
{
  "item_id":           1,
  "is_item_completed": true
}
```

---

## Floors & Tables

### GET `/floors`
Requires auth.

**Response 200:**
```json
{
  "floors": [
    {
      "id":         1,
      "name":       "Ground Floor",
      "created_at": "2024-06-13T10:30:00.000Z",
      "tables": [
        {
          "id":           1,
          "floor_id":     1,
          "table_number": 1,
          "seats":        4,
          "is_active":    true,
          "has_active_order": false
        }
      ]
    }
  ]
}
```

> `has_active_order` = true if a `sent` or `draft` order references this table.

---

### POST `/floors`
Requires auth. Role: `admin`.

**Request:** `{ "name": "Ground Floor" }`

**Response 201:** `{ "floor": { id, name, created_at } }`

---

### POST `/floors/:id/tables`
Requires auth. Role: `admin`.

**Request:**
```json
{ "table_number": 5, "seats": 4 }
```

**Response 201:** `{ "table": { /* Table object */ } }`

---

### PUT `/tables/:id`
Requires auth. Role: `admin`.

**Request:** `{ "table_number"?, "seats"?, "is_active"? }`

**Response 200:** `{ "table": { /* updated Table */ } }`

---

### DELETE `/tables/:id`
Requires auth. Role: `admin`. Soft-delete (`is_active = false`).

**Response 200:** `{ "message": "Table deactivated successfully" }`

---

## Coupons

### GET `/coupons`
Requires auth. Role: `admin`.

**Response 200:**
```json
{
  "coupons": [
    {
      "id":             1,
      "code":           "WELCOME10",
      "discount_type":  "percentage",
      "discount_value": "10.00",
      "is_active":      true,
      "created_at":     "2024-06-13T10:30:00.000Z",
      "updated_at":     "2024-06-13T10:30:00.000Z"
    }
  ]
}
```

---

### POST `/coupons`
Requires auth. Role: `admin`.

**Request:**
```json
{ "code": "WELCOME10", "discount_type": "percentage", "discount_value": 10.00 }
```

**Response 201:** `{ "coupon": { /* Coupon */ } }`

**Errors:** `409 CODE_EXISTS`

---

### PUT `/coupons/:id`
Requires auth. Role: `admin`.

**Request:** any fields from POST, all optional.

**Response 200:** `{ "coupon": { /* updated Coupon */ } }`

---

### DELETE `/coupons/:id`
Requires auth. Role: `admin`. Hard delete.

**Response 200:** `{ "message": "Coupon deleted successfully" }`

---

## Promotions

### GET `/promotions`
Requires auth. Role: `admin`.

**Response 200:**
```json
{
  "promotions": [
    {
      "id":               1,
      "name":             "Buy 2 Get 10% Off Coffee",
      "applies_to":       "product",
      "product_id":       1,
      "min_quantity":     2,
      "min_order_amount": null,
      "discount_type":    "percentage",
      "discount_value":   "10.00",
      "rules":            { "applies_to": "product", "min_quantity": 2, "product_id": 1 },
      "is_active":        true,
      "created_at":       "2024-06-13T10:30:00.000Z",
      "updated_at":       "2024-06-13T10:30:00.000Z"
    }
  ]
}
```

---

### POST `/promotions`
Requires auth. Role: `admin`.

**Request:**
```json
{
  "name":             "Buy 2 Get 10% Off Coffee",
  "applies_to":       "product",
  "product_id":       1,
  "min_quantity":     2,
  "min_order_amount": null,
  "discount_type":    "percentage",
  "discount_value":   10.00
}
```

**Response 201:** `{ "promotion": { /* Promotion */ } }`

---

### PUT `/promotions/:id` / DELETE `/promotions/:id`
Same pattern as coupons.

---

## Employees (Users)

### GET `/employees`
Requires auth. Role: `admin`.
Query: `?role=employee` `?is_active=true`

**Response 200:**
```json
{
  "users": [
    {
      "id":         2,
      "name":       "Cafe Cashier",
      "email":      "cashier@odoocafe.com",
      "role":       "employee",
      "is_active":  true,
      "created_at": "2024-06-13T10:30:00.000Z"
    }
  ]
}
```

---

### PUT `/employees/:id`
Requires auth. Role: `admin`.

**Request:** `{ "name"?, "role"?, "is_active"?, "password"? }`

**Response 200:** `{ "user": { /* updated User (no password_hash) */ } }`

---

### DELETE `/employees/:id`
Requires auth. Role: `admin`. Hard delete.

**Response 200:** `{ "message": "User deleted successfully" }`

---

## Cooks

### GET `/cooks`
Requires auth. Role: `admin`.
Query: `?is_active=true`

**Response 200:**
```json
{
  "cooks": [
    {
      "id":                  1,
      "name":                "Chef Raj",
      "is_active":           true,
      "category_preferences": [1, 2, 4],
      "created_at":          "2024-06-13T10:30:00.000Z",
      "updated_at":          "2024-06-13T10:30:00.000Z"
    }
  ]
}
```

---

### POST `/cooks`
Requires auth. Role: `admin`.

**Request:**
```json
{ "name": "Chef Raj", "category_preferences": [1, 2, 4] }
```

**Response 201:** `{ "cook": { /* Cook + category_preferences array */ } }`

---

### PUT `/cooks/:id`
Requires auth. Role: `admin`.

**Request:** `{ "name"?, "is_active"?, "category_preferences"? }` — providing `category_preferences` replaces the whole set.

**Response 200:** `{ "cook": { /* updated Cook */ } }`

---

## Reports

All report endpoints require auth. Role: `admin`.
All accept query params: `?from=<ISO>&to=<ISO>` `?employee_id=2` `?session_id=1`

> Dates are UTC ISO 8601. Frontend computes these from Asia/Kolkata using `getTodayRangeUTC()`.

---

### GET `/reports/summary`

**Response 200:**
```json
{
  "total_orders":        42,
  "total_revenue":       "15430.00",
  "average_order_value": "367.38"
}
```

---

### GET `/reports/sales-trend`
Query: `?granularity=day` (day | week | month)

**Response 200:**
```json
{
  "trend": [
    { "period": "2024-06-13", "revenue": "4560.00", "orders": 12 }
  ]
}
```

---

### GET `/reports/top-products`

**Response 200:**
```json
{
  "products": [
    { "product_id": 1, "name": "Espresso", "quantity_sold": 45, "revenue": "5400.00" }
  ]
}
```

---

### GET `/reports/top-categories`

**Response 200:**
```json
{
  "categories": [
    { "category_id": 1, "name": "Coffee", "color": "#3E2723", "revenue": "8200.00" }
  ]
}
```

---

### GET `/reports/top-orders`

**Response 200:**
```json
{
  "orders": [
    { "id": 5, "total": "1200.00", "customer_name": "Priya Sharma", "created_at": "2024-06-13T10:30:00.000Z" }
  ]
}
```

---

### GET `/reports/export`
Query: `?format=pdf` or `?format=xls` plus the same period filters.

**Response 200:** Binary file download with `Content-Disposition: attachment`.

---

## Settings

### GET `/settings`
Requires auth.

**Response 200:**
```json
{
  "settings": {
    "loyalty_points_rate":     "10",
    "loyalty_redemption_rate": "1",
    "cafe_name":               "Odoo Cafe",
    "receipt_footer":          "Thank you for visiting Odoo Cafe!"
  }
}
```

> Returns as a flat key→value object, not an array.

---

### PUT `/settings`
Requires auth. Role: `admin`.

**Request:**
```json
{ "loyalty_points_rate": "10", "cafe_name": "Odoo Cafe" }
```

**Response 200:** `{ "settings": { /* same flat object */ } }`

---

### GET `/settings/payment-methods`
Requires auth.

**Response 200:**
```json
{
  "payment_methods": [
    { "method": "cash", "is_enabled": true,  "upi_id": null         },
    { "method": "card", "is_enabled": true,  "upi_id": null         },
    { "method": "upi",  "is_enabled": true,  "upi_id": "cafe@ybl"  }
  ]
}
```

---

### PUT `/settings/payment-methods`
Requires auth. Role: `admin`.

**Request:**
```json
[
  { "method": "cash", "is_enabled": true,  "upi_id": null        },
  { "method": "upi",  "is_enabled": true,  "upi_id": "cafe@ybl" }
]
```

**Response 200:** `{ "payment_methods": [ /* same shape as GET */ ] }`

---

## ⚠️ Ambiguities Flagged

The following points are unresolved in the spec. They have been given a **decision** here that feature owners must follow. If any decision is wrong, raise it before building, not after.

| # | Issue | Decision |
|---|---|---|
| 1 | **Multiple discounts per order** — can both a coupon AND a promotion apply to the same order? | **Yes, both can apply.** `order_discounts` has a row per applied discount; `discount_total` is the sum of all `applied_amount` rows. |
| 2 | **Session close computation** — does the server compute `closing_total_orders` / `closing_total_revenue`, or does the client send them? | **Server computes** from `orders` where `session_id = X AND status = 'paid'`. Client sends empty body. |
| 3 | **Promotion application trigger** — who checks if a promotion applies? | **Server checks** on `POST /orders/:id/pay`. The server evaluates all active promotions against the order at pay time and creates `order_discounts` rows automatically. Client does NOT send promotion IDs. |
| 4 | **`loyalty_transactions.order_id`** — can loyalty be adjusted without an order? | **No.** `order_id` is NOT NULL. Loyalty points only move during order pay. |
| 5 | **`DELETE /categories/:id`** — soft or hard delete? | **Hard delete**, but fails with `409 HAS_PRODUCTS` if products reference it. |
| 6 | **Floors in spec section 11** — not listed as a separate resource group. | **Added** as `/floors` and `/tables` endpoints (see above). Feature owner: implement these. |
| 7 | **`GET /kds/orders`** — requires auth or open? | **No auth** — KDS is an open display per spec 8. |
| 8 | **Report date parameters** — named `from`/`to`? UTC or Kolkata? | Named `from` and `to`. Values are **UTC ISO 8601**. Frontend converts Kolkata day-boundaries to UTC using `getTodayRangeUTC()`. |
