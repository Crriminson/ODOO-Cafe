# Odoo Cafe POS — Project Specification Sheet
### Version 1.0 — Final Pre-Build Reference

---

> This document is the single source of truth for the Odoo Cafe POS system.
> It reflects all architectural decisions, feature definitions, flow designs, schema,
> and deviations from the original problem statement. Any collaborator (human or AI)
> should be able to pick this up and build from it without needing prior context.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Roles & Access Control](#4-roles--access-control)
5. [Application Flows](#5-application-flows)
6. [Feature Specifications — Backend / Admin](#6-feature-specifications--backend--admin)
7. [Feature Specifications — POS Terminal](#7-feature-specifications--pos-terminal)
8. [Feature Specifications — Kitchen Display (KDS)](#8-feature-specifications--kitchen-display-kds)
9. [Database Schema](#9-database-schema)
10. [WebSocket Events](#10-websocket-events)
11. [API Structure](#11-api-structure)
12. [Design Decisions & Deviations](#12-design-decisions--deviations)
13. [Out of Scope](#13-out-of-scope)

---

## 1. Project Overview

**Project Name:** Odoo Cafe POS
**Type:** Full-stack web-based Restaurant Point-of-Sale system
**Team:** 4 members
**Build Window:** ~10–12 hours (~40–48 person-hours total)

### What We're Building

A complete restaurant POS ecosystem consisting of three distinct frontend surfaces:

| Surface | Who Uses It | How Accessed |
|---|---|---|
| **Admin / Backend** | Admin (User role) | `/admin` — role-gated route |
| **POS Terminal** | Employee / Cashier | `/pos` — role-gated route |
| **Kitchen Display (KDS)** | Kitchen staff | `/kds` — fixed URL, open on a dedicated device/tab |

All three surfaces share a single backend API and a single PostgreSQL database.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Frontend** | React (single codebase, role-based routing) | One repo, one language, role-gated views |
| **Backend** | Node.js + Express | Single language across stack; trivial WebSocket integration |
| **Database** | PostgreSQL | JSONB for flexible promotion rules; window functions for reporting; full-text search for product bar |
| **Query Method** | Raw SQL via `pg` / `postgres.js` | Full control; no ORM abstraction fighting PostgreSQL-specific features |
| **Real-time** | WebSockets (`ws` / `socket.io`) | KDS real-time order updates; self-contained, no external service |
| **Repo Structure** | Monorepo | One clone, one branch/PR flow; minimises merge-conflict surface for inexperienced git team |
| **Auth** | JWT (stateless) | Simple, self-contained, no third-party auth service |
| **UPI QR** | Client-side QR generation (e.g. `qrcode.js`) | UPI deep-link string encoded to QR; no payment gateway; no external API |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MONOREPO                             │
│                                                             │
│  /client  (React)                /server  (Node + Express)  │
│  ├── /admin      (Admin UI)      ├── /routes                │
│  ├── /pos        (POS Terminal)  ├── /controllers           │
│  ├── /kds        (KDS View)      ├── /middleware            │
│  └── /shared     (components,    ├── /websocket             │
│                   hooks, utils)  └── /db  (raw SQL queries) │
│                                                             │
│                    PostgreSQL Database                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

- **One shared API** consumed by all three surfaces
- **Role-based routing** — frontend redirects based on JWT role claim
- **WebSocket server** runs alongside the Express HTTP server — same process
- **No BaaS, no third-party APIs** — entirely self-contained backend
- **Sequential build approach** — shared foundation (schema + base code) built first, then features built one at a time by the full team

---

## 4. Roles & Access Control

Three roles exist in the system. Access is enforced at both the API (JWT middleware) and frontend (route guards) levels.

| Role | Access | Notes |
|---|---|---|
| **Admin (User)** | Admin/Backend UI only | Cannot access POS terminal or KDS |
| **Employee (Cashier)** | POS Terminal only | Cannot access admin config |
| **Kitchen Staff** | KDS only | No login — KDS is open on a fixed URL |

### Auth Flow

- Signup fields: Name, Email, Password, Role
- Login fields: Email, Password
- On successful login → JWT issued → frontend redirects to correct surface based on role
- JWT stored in `httpOnly` cookie or `Authorization` header

---

## 5. Application Flows

### 5.1 Session Open Flow (Admin / Employee)

```
Login → JWT issued → Role check
  ├── Admin  → Admin Dashboard
  └── Employee → POS Session Screen
                   └── Open Session → Order Type Selection
                                        ├── Dine-In  → Floor Pop-up → Table Selection → Order View
                                        └── Takeaway → Order View (no table assigned)
```

### 5.2 Order Flow

```
Order View
  ├── Browse / search products by category
  ├── Add items to cart
  ├── Adjust quantities in cart
  ├── Apply coupon code (manual popup) or automated promotion (auto-applied)
  ├── Assign customer (optional — lookup or create)
  ├── Send to Kitchen → order status: "sent" → KDS receives ticket in real time
  └── Payment
        ├── Cash    → enter amount received → system shows change due
        ├── UPI     → QR code generated from saved UPI ID + order total → employee confirms
        └── Card    → employee enters transaction reference → confirm
              └── Payment complete → order marked Paid
                    └── Receipt: Print or Email to customer
```

### 5.3 KDS Flow

```
Order arrives on KDS (via WebSocket)
  └── Ticket card shown: Order Number, Items, Quantities
        ├── Click ticket card → entire order moves to next stage
        │     To Cook → Preparing → Completed
        └── Click individual item → item marked completed (strikethrough)
```

### 5.4 Session Close Flow

```
Employee closes session
  └── Closing Summary displayed:
        ├── Total Orders
        ├── Total Revenue
        └── Revenue by Payment Method (Cash / Card / UPI)
              └── Session archived → Admin can view in Reports
```

### 5.5 Loyalty Redemption Flow

```
Employee opens customer lookup at payment
  └── Selects customer → sees loyalty points balance
        └── Employee toggles "Redeem Points" → enters points to redeem
              └── Points converted to discount → applied to order total
                    └── Points deducted from customer balance
                          └── Redeemed amount recorded in loyalty_transactions
```

---

## 6. Feature Specifications — Backend / Admin

### 6.1 Auth — Login & Signup

| Field | Type | Notes |
|---|---|---|
| Name | Text | Signup only |
| Email | Text | Unique, validated format |
| Password | Text | Hashed (bcrypt) |
| Role | Enum | `admin` / `employee` |

On successful login → POS session screen (employee) or admin dashboard (admin).

---

### 6.2 Product Management

Full CRUD. Products appear as cards in the POS terminal.

| Field | Type | Notes |
|---|---|---|
| Name | Text | Required |
| Category | FK → categories | Pick existing or create new inline |
| Price | Decimal | Required |
| Unit of Measure | Enum | `piece` / `kg` / `litre` |
| Tax | Decimal (%) | Per-product tax rate; applied to order total |
| Description | Text | Optional |
| Estimated Prep Time | Integer (minutes) | Set by admin; used by cook allocation algorithm |
| Show on KDS | Boolean | Only KDS-flagged products appear on kitchen display |
| Is Active | Boolean | Soft delete / archive |

---

### 6.3 Product Category Management

Full CRUD. Color assigned to a category propagates everywhere — product cards in POS, category filter tabs, order view — and updates automatically when changed in admin.

| Field | Type | Notes |
|---|---|---|
| Name | Text | Required, unique |
| Color | Hex string | Required; propagated to all UI surfaces |

---

### 6.4 Payment Method Settings

Toggles only — no creation. Each method is enabled/disabled globally.

| Method | Toggle | Extra Config |
|---|---|---|
| Cash | On/Off | None |
| Card / Digital | On/Off | None |
| UPI QR | On/Off | Requires UPI ID to be saved (e.g. `cafe@ybl`) |

UPI QR is generated client-side at payment time using the standard deep-link format:
```
upi://pay?pa=UPI_ID&pn=CAFE_NAME&am=ORDER_TOTAL&cu=INR
```

---

### 6.5 Floor Plan & Table Management

Admins create floors and add tables under each floor.

**Floor Fields:**

| Field | Type |
|---|---|
| Name | Text |

**Table Fields:**

| Field | Type | Notes |
|---|---|---|
| Table Number | Integer | Unique per floor |
| Number of Seats | Integer | |
| Active Status | Boolean | Inactive tables hidden from POS floor pop-up |
| Floor | FK → floors | |

---

### 6.6 Coupons & Promotions

Two distinct discount types.

#### Coupon Codes (Manual)

Employee enters code at POS to apply.

| Field | Type | Notes |
|---|---|---|
| Code | Text | Unique, case-insensitive |
| Discount Type | Enum | `percentage` / `fixed` |
| Discount Value | Decimal | |
| Is Active | Boolean | |

#### Automated Promotions (No Code)

Trigger automatically when conditions are met.

| Field | Type | Notes |
|---|---|---|
| Name | Text | |
| Applies To | Enum | `product` / `order` |
| Minimum Quantity | Integer | Required if `applies_to = product` |
| Minimum Order Amount | Decimal | Required if `applies_to = order` |
| Target Product | FK → products | Required if `applies_to = product` |
| Discount Type | Enum | `percentage` / `fixed` |
| Discount Value | Decimal | |
| Is Active | Boolean | |

Discount rules stored as **JSONB** on the promotions table for flexibility.

---

### 6.7 User / Employee Management

Admins can list, create, and manage all accounts.

| Field | Type |
|---|---|
| Name | Text |
| Email | Text |
| Role | Enum (`admin` / `employee`) |

**Actions per record:**

| Action | Behaviour |
|---|---|
| Change Password | Updates hashed password |
| Archive | Sets `is_active = false` — account deactivated, not deleted |
| Delete | Hard delete |

---

### 6.8 POS Session Management

The POS terminal shows the **last open session date** and **last closing sale amount** before a new session is opened.

- **Open Session** → creates a new session record, timestamps `opened_at`, links to the employee
- **Close Session** → timestamps `closed_at`, generates closing summary (total orders, total revenue, revenue by payment method), session archived
- All orders created during a session are linked to that session via FK

---

### 6.9 Reporting & Dashboard

All stats, charts, and tables update dynamically when a filter is changed.

**Filters:**

| Filter | Options |
|---|---|
| Period | Today / This Week / This Month / Custom Date Range |
| Employee | Dropdown of all employees |
| Session | Dropdown of all sessions |
| Product | Dropdown of all products |

**Summary Metrics:**

- Total Orders
- Total Revenue
- Average Order Value

**Dashboard Components:**

| Component | Description |
|---|---|
| Sales Trend Chart | Revenue or order count over time |
| Top Categories Chart | Sales distribution by category |
| Top Orders Table | Highest-value orders |
| Top Products Table | Product name, quantity sold, revenue |
| Top Categories Table | Category-wise revenue |

**Export:** PDF and XLS

---

### 6.10 App Settings

Global configurable values stored in a settings table.

| Setting | Description |
|---|---|
| Loyalty Points Earning Rate | e.g. 1 point per ₹10 spent |
| Cafe Name | Used in UPI QR deep-link |
| UPI ID | Used for QR generation |

---

## 7. Feature Specifications — POS Terminal

### 7.1 Navigation Bar (Top)

| Element | Action |
|---|---|
| POS Order | Opens main order-taking screen |
| Orders | Opens orders list for current session |
| Customer | Opens customer management |
| Table View | Opens floor/table selection screen |
| Product Search Bar | Searches products by name |
| Current Table Indicator | Shows active table name/number |
| Employee Icon | Shows logged-in employee name |
| Hamburger Menu | Links to Products, Category, Payment Method, Coupon & Promotion, Booking (placeholder), User/Employee, KDS, Reports, Log-Out |

---

### 7.2 Order Type Selection

Shown immediately after session opens.

| Option | Flow |
|---|---|
| **Dine-In** | → Floor Pop-up → Table Selection → Order View |
| **Takeaway** | → Order View directly (no table assigned) |

---

### 7.3 Floor Pop-up

Appears on Dine-In selection or when employee taps Table View.

- All floors displayed with their tables as a **numbered grid of clickable cards**
- Each card shows: Table Number, Number of Seats
- Tables with **active orders** are visually distinct (e.g. different colour/badge) from available tables
- Selecting a table → opens Order View for that table

---

### 7.4 Order View

Three-section layout: **Product | Cart | Payment**

#### Product Section

- Products displayed as cards
- Category tabs for filtering
- Product search bar
- Clicking a product → adds to cart

#### Cart Section

Each line item shows:

| Field | Notes |
|---|---|
| Product Name | |
| Quantity | Adjustable directly in cart |
| Unit Price | |
| Line Total | |
| Discount (if any) | Shown inline on the relevant line |

Order-level discounts/coupons appear as a **separate line** in the order summary.

**Order Summary:**

- Subtotal
- Tax
- Discounts
- Tip (optional, entered by employee on customer's behalf)
- **Total**

**Cart Actions:**

| Action | Behaviour |
|---|---|
| Customer | Assign/lookup customer for this order |
| Discount | Open coupon code popup |
| Send to Kitchen | Sends order to KDS in real time via WebSocket |
| Send Receipt | Open receipt email popup |

---

### 7.5 Coupon / Discount Popup

- Employee enters coupon code manually
- If valid → discount applied, reflected in order summary
- Automated promotions apply silently — no popup needed

---

### 7.6 Payment Flow

#### Cash

- Employee enters amount received
- System calculates and displays **change due**

#### UPI QR

- QR code generated client-side from saved UPI ID + order total
- Shown on screen for customer to scan
- Employee clicks **Confirmed** once paid, or **Cancel** to return

#### Card

- Employee enters **transaction reference**
- Confirmed → payment recorded

**Post-payment:**

- Order marked **Paid**
- Employee can: **Print Receipt** or **Email Receipt** to customer's saved email

---

### 7.7 Orders List

Shows all orders in the current session.

**Search by:** Customer name, Order number, Date

**Each order shows:**

| Field | |
|---|---|
| Order Number | |
| Date | |
| Customer | |
| Amount | |
| Status | `Draft` / `Paid` / `Cancelled` |

**Order Detail View** shows full breakdown including products.

- **Draft orders:** Delete and Edit Order buttons visible. Edit → loads order back into cart.
- **Paid orders:** View-only.

---

### 7.8 Table View

- Shows all tables across all floors
- Active orders visually distinct from available tables
- Selecting a table → opens its corresponding order

---

### 7.9 Customer Management

Employee can search or create customers directly from POS.

**Fields:**

| Field | Type |
|---|---|
| Name | Text |
| Email | Text |
| Phone Number | Text |
| Address | Text |
| Loyalty Points Balance | Integer (read-only display) |

**Actions:** Create, Edit, Delete

Once a customer is selected and linked to an order:
- Their email is used for receipt delivery
- Their loyalty points balance is visible at payment for redemption

---

## 8. Feature Specifications — Kitchen Display (KDS)

Accessed at a **fixed URL** (`/kds`) on a dedicated device or browser tab. No login required.

### 8.1 Real-time Order Reception

Orders arrive instantly via **WebSocket** when an employee clicks Send to Kitchen. Each order appears as a **ticket card**.

**Ticket Card Shows:**

| Field | Notes |
|---|---|
| Order Number | Same as ticket number |
| Order Type | Dine-In (with table number) or Takeaway |
| Ordered Items | Only products with `show_on_kds = true` |
| Quantities | Per item |
| Assigned Cook | Name of cook assigned by allocation algorithm (with manual override option) |

---

### 8.2 Order Stages

| Stage | Meaning | Trigger |
|---|---|---|
| **To Cook** | Order received, not started | Automatic on arrival |
| **Preparing** | Currently being made | Click ticket card |
| **Completed** | Ready to serve | Click ticket card again |

- **Click ticket card** → moves entire order to next stage
- **Click individual item** → marks that item completed with strikethrough (item-level tracking)

---

### 8.3 Cook Allocation System

**Target: Complex Tier** (fall back to Medium Tier if baseline is at risk)

#### Complex Tier

Allocation algorithm considers:

- Cook's **category preferences** (e.g. prefers hot beverages, pastries)
- Cook's **current active workload** (number of items currently assigned and in-progress)
- **Estimated prep time** of the dish (set by admin per product)
- **Cook availability** (not currently overwhelmed)

Algorithm assigns a cook automatically when an order arrives. Cook is displayed on the ticket card. Manual override always available.

#### Medium Tier (Fallback)

Algorithm considers only:
- Current workload (fewest active items wins)
- Category preference match

#### Cook Profiles

| Field | Type | Notes |
|---|---|---|
| Name | Text | |
| Is Active | Boolean | Only active cooks receive assignments |
| Category Preferences | FK join table | Many-to-many with categories |

---

### 8.4 KDS Filters & Search

- **Search bar** — filter tickets by product name
- **Filter by product** — show only tickets containing a specific product
- **Filter by category** — show only tickets containing products from a selected category

---

## 9. Database Schema

> All tables use `id SERIAL PRIMARY KEY` unless noted.
> All tables include `created_at TIMESTAMPTZ DEFAULT NOW()` and `updated_at TIMESTAMPTZ DEFAULT NOW()`.

---

### 9.1 `users`
Stores all admin and employee accounts.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(150) | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| role | VARCHAR(20) | NOT NULL — `admin` / `employee` |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.2 `sessions`
Tracks POS sessions opened and closed by employees.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| employee_id | INTEGER | FK → users(id) |
| opened_at | TIMESTAMPTZ | NOT NULL |
| closed_at | TIMESTAMPTZ | NULLABLE |
| closing_total_orders | INTEGER | NULLABLE — populated on close |
| closing_total_revenue | DECIMAL(10,2) | NULLABLE — populated on close |
| closing_breakdown | JSONB | NULLABLE — revenue per payment method |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.3 `categories`
Product categories with color propagation.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(100) | UNIQUE, NOT NULL |
| color | VARCHAR(7) | NOT NULL — hex e.g. `#FF5733` |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.4 `products`
All menu items.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(150) | NOT NULL |
| category_id | INTEGER | FK → categories(id) |
| price | DECIMAL(10,2) | NOT NULL |
| unit_of_measure | VARCHAR(20) | NOT NULL — `piece` / `kg` / `litre` |
| tax_rate | DECIMAL(5,2) | NOT NULL DEFAULT 0 — percentage |
| description | TEXT | NULLABLE |
| estimated_prep_time | INTEGER | NULLABLE — minutes; used by cook allocation |
| show_on_kds | BOOLEAN | DEFAULT true |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.5 `floors`

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(100) | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.6 `tables`

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| floor_id | INTEGER | FK → floors(id) |
| table_number | INTEGER | NOT NULL |
| seats | INTEGER | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.7 `customers`
First-class entity — designed for loyalty and future extensibility.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(150) | NULLABLE, UNIQUE |
| phone | VARCHAR(20) | NULLABLE |
| address | TEXT | NULLABLE |
| loyalty_points | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.8 `loyalty_transactions`
Audit trail for all loyalty point movements.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| customer_id | INTEGER | FK → customers(id) |
| order_id | INTEGER | FK → orders(id) |
| type | VARCHAR(20) | NOT NULL — `earned` / `redeemed` |
| points | INTEGER | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.9 `orders`

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| session_id | INTEGER | FK → sessions(id) |
| employee_id | INTEGER | FK → users(id) |
| customer_id | INTEGER | NULLABLE, FK → customers(id) |
| table_id | INTEGER | NULLABLE, FK → tables(id) — NULL for takeaway |
| order_type | VARCHAR(20) | NOT NULL — `dine_in` / `takeaway` |
| status | VARCHAR(20) | NOT NULL — `draft` / `sent` / `paid` / `cancelled` |
| subtotal | DECIMAL(10,2) | NOT NULL DEFAULT 0 |
| tax_total | DECIMAL(10,2) | NOT NULL DEFAULT 0 |
| discount_total | DECIMAL(10,2) | NOT NULL DEFAULT 0 |
| tip | DECIMAL(10,2) | DEFAULT 0 |
| total | DECIMAL(10,2) | NOT NULL DEFAULT 0 |
| loyalty_points_redeemed | INTEGER | DEFAULT 0 |
| loyalty_discount | DECIMAL(10,2) | DEFAULT 0 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.10 `order_items`

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| order_id | INTEGER | FK → orders(id) |
| product_id | INTEGER | FK → products(id) |
| quantity | INTEGER | NOT NULL |
| unit_price | DECIMAL(10,2) | NOT NULL — snapshot at time of order |
| line_total | DECIMAL(10,2) | NOT NULL |
| kds_status | VARCHAR(20) | DEFAULT `to_cook` — `to_cook` / `preparing` / `completed` |
| is_item_completed | BOOLEAN | DEFAULT false — item-level strikethrough |
| assigned_cook_id | INTEGER | NULLABLE, FK → cooks(id) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.11 `payments`

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| order_id | INTEGER | FK → orders(id) |
| method | VARCHAR(20) | NOT NULL — `cash` / `card` / `upi` |
| amount | DECIMAL(10,2) | NOT NULL |
| tip | DECIMAL(10,2) | DEFAULT 0 |
| transaction_reference | TEXT | NULLABLE — required when method = `card` |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.12 `coupons`

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| code | VARCHAR(50) | UNIQUE, NOT NULL |
| discount_type | VARCHAR(20) | NOT NULL — `percentage` / `fixed` |
| discount_value | DECIMAL(10,2) | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.13 `promotions`
Automated promotions — stored with JSONB rules for flexibility.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(150) | NOT NULL |
| applies_to | VARCHAR(20) | NOT NULL — `product` / `order` |
| product_id | INTEGER | NULLABLE, FK → products(id) |
| min_quantity | INTEGER | NULLABLE |
| min_order_amount | DECIMAL(10,2) | NULLABLE |
| discount_type | VARCHAR(20) | NOT NULL — `percentage` / `fixed` |
| discount_value | DECIMAL(10,2) | NOT NULL |
| rules | JSONB | Full rule snapshot for audit/flexibility |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.14 `order_discounts`
Records which coupon or promotion was applied to an order.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| order_id | INTEGER | FK → orders(id) |
| coupon_id | INTEGER | NULLABLE, FK → coupons(id) |
| promotion_id | INTEGER | NULLABLE, FK → promotions(id) |
| discount_type | VARCHAR(20) | NOT NULL |
| discount_value | DECIMAL(10,2) | NOT NULL |
| applied_amount | DECIMAL(10,2) | NOT NULL — actual ₹ deducted |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.15 `payment_method_settings`
Stores which payment methods are enabled and global payment config.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| method | VARCHAR(20) | UNIQUE — `cash` / `card` / `upi` |
| is_enabled | BOOLEAN | DEFAULT false |
| upi_id | TEXT | NULLABLE — only for UPI |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.16 `cooks`
Kitchen staff profiles for cook allocation system.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(100) | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9.17 `cook_category_preferences`
Many-to-many: which categories each cook prefers.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| cook_id | INTEGER | FK → cooks(id) |
| category_id | INTEGER | FK → categories(id) |

---

### 9.18 `app_settings`
Global configurable system values.

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PK |
| key | VARCHAR(100) | UNIQUE, NOT NULL |
| value | TEXT | NOT NULL |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Default rows:**

| key | value |
|---|---|
| `loyalty_points_rate` | `10` (₹10 = 1 point) |
| `cafe_name` | `Odoo Cafe` |

---

### Entity Relationship Summary

```
users ──────────────── sessions ──────────── orders
                                               │
customers ─────────────────────────────────────┤
loyalty_transactions ──────────────────────────┤
                                               │
tables ─────────────────────────────────────── │
floors ──────── tables                         │
                                               │
order_items ───────────────────────────────────┤
  └── products ──── categories                 │
  └── cooks ────── cook_category_preferences   │
                                               │
payments ──────────────────────────────────────┤
order_discounts ── coupons                     │
               └── promotions ─────────────────┘
```

---

## 10. WebSocket Events

All real-time communication uses WebSockets between the Express server and the KDS client.

| Event | Direction | Payload | Trigger |
|---|---|---|---|
| `order:new` | Server → KDS | Full order object with items | Employee clicks Send to Kitchen |
| `order:stage_updated` | Server → KDS | `{ order_id, new_stage }` | Cook clicks ticket card |
| `item:completed` | Server → KDS | `{ order_id, item_id }` | Cook clicks individual item |
| `order:paid` | Server → KDS | `{ order_id }` | Order marked paid — remove from KDS |

---

## 11. API Structure

All routes prefixed with `/api/v1`. JWT required on all routes except `/auth/*`.

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Create new user |
| POST | `/auth/login` | Login, receive JWT |
| POST | `/auth/logout` | Invalidate session |

### Products
| Method | Route | Description |
|---|---|---|
| GET | `/products` | List all active products |
| POST | `/products` | Create product (admin) |
| PUT | `/products/:id` | Update product (admin) |
| DELETE | `/products/:id` | Delete product (admin) |

### Categories
| Method | Route | Description |
|---|---|---|
| GET | `/categories` | List all categories |
| POST | `/categories` | Create category (admin) |
| PUT | `/categories/:id` | Update (admin) |
| DELETE | `/categories/:id` | Delete (admin) |

### Orders
| Method | Route | Description |
|---|---|---|
| GET | `/orders` | List orders (filterable by session) |
| POST | `/orders` | Create new order |
| GET | `/orders/:id` | Get order detail |
| PUT | `/orders/:id` | Update order (edit draft) |
| POST | `/orders/:id/send` | Send to kitchen |
| POST | `/orders/:id/pay` | Process payment |
| DELETE | `/orders/:id` | Delete draft order |

### Customers
| Method | Route | Description |
|---|---|---|
| GET | `/customers` | Search customers |
| POST | `/customers` | Create customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete customer |

### Sessions
| Method | Route | Description |
|---|---|---|
| GET | `/sessions/current` | Get current open session |
| POST | `/sessions/open` | Open new session |
| POST | `/sessions/close` | Close session + return summary |

### KDS
| Method | Route | Description |
|---|---|---|
| GET | `/kds/orders` | Get all active KDS orders |
| PUT | `/kds/orders/:id/stage` | Advance order stage |
| PUT | `/kds/items/:id/complete` | Mark item complete |

### Reports
| Method | Route | Description |
|---|---|---|
| GET | `/reports/summary` | Summary metrics (filterable) |
| GET | `/reports/sales-trend` | Chart data |
| GET | `/reports/top-products` | Top products table |
| GET | `/reports/top-categories` | Top categories table |
| GET | `/reports/top-orders` | Top orders table |
| GET | `/reports/export` | Export PDF or XLS |

### Settings
| Method | Route | Description |
|---|---|---|
| GET | `/settings` | Get all settings |
| PUT | `/settings` | Update settings (admin) |
| GET | `/settings/payment-methods` | Get payment method config |
| PUT | `/settings/payment-methods` | Update payment method toggles |

---

## 12. Design Decisions & Deviations

### Deviations from Original Spec

| Area | Original Spec | Our Approach | Reason |
|---|---|---|---|
| **Table flow** | Always: Floor popup → table → order | Dine-in/Takeaway split — takeaway skips table entirely | More realistic; a cafe shouldn't force table selection for walk-in orders |
| **Customer entity** | Basic CRUD — name, email, phone | First-class entity with loyalty points, history, extensibility hooks | Spec's version is throwaway data; elevation makes it genuinely useful |
| **Payment gateway** | Implied UPI/Card support | No gateway — UPI QR client-side, Card records reference only | Guideline C (no unnecessary third-party APIs); zero external failure surface in demo |

### Additions Beyond Spec

| Addition | Rationale |
|---|---|
| **Cook allocation system** (complex tier) | Elevates KDS from a display to a genuine kitchen management tool; evaluator-differentiating |
| **Loyalty points system** | Natural extension of the elevated customer entity; redeemable next order onwards |
| **Tips** | One field on payments; realistic cafe POS behaviour |
| **Dine-in / Takeaway distinction** | Cleaner UX than forcing every order through a floor plan |
| **`app_settings` table** | Configurable loyalty rate; avoids hardcoded business logic |

### Deliberate Non-Inclusions

| Item | Reason |
|---|---|
| **Stock / ingredient deduction** | Requires entire new admin config surface (ingredients, recipes) not in spec; ~4–5 hours additional build time; dropped to protect baseline |
| **Prisma ORM** | No technical justification over raw SQL; abstraction fights PostgreSQL-specific features (JSONB, window functions) that are core to the project |
| **Split payment** | Not in spec; unnecessary complexity |
| **"Booking" nav item** | Appears in spec nav but has no defined fields or behaviour; treated as placeholder nav link only |

---

## 13. Out of Scope

The following were considered and explicitly deferred. They may be built after the full baseline is complete, time permitting.

| Feature | Priority | Notes |
|---|---|---|
| Table heatmap (usage, peak times, occupancy) | High — post-baseline | Builds on existing table/order data |
| Waiter efficiency metrics | High — post-baseline | Builds on employee-order linkage |
| Dynamic combo engine | Medium | Relationship to coupons/promotions system needs clarification first |
| Online ordering portal (self-built) | Low | Requires Customer to become an active user role — structural change |
| Third-party delivery integration (Swiggy/Zomato) | Very Low | Conflicts with Guideline C |
| Demand prediction | Very Low | Requires historical data volume not achievable in demo |
| Stock / inventory management | Very Low | Dropped from even ideation backlog due to build cost |

---

*Spec compiled from full ideation session. All decisions logged with reasoning in the companion ideation document (`Odoo_Cafe_POS_Ideation.md`).*
