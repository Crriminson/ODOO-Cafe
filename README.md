# Odoo Cafe POS

A full-stack, web-based Restaurant Point-of-Sale system built as a monorepo.

## Surfaces

| Surface | Route | Who Uses It |
|---|---|---|
| **Admin / Backend** | `/admin` | Admin — product, category, floor, employee, report management |
| **POS Terminal** | `/pos` | Employee / Cashier — order taking, payment, sessions |
| **Kitchen Display (KDS)** | `/kds` | Kitchen staff — real-time order tickets, cook allocation |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite (role-based routing) |
| Backend | Node.js + Express |
| Database | PostgreSQL 16 (raw SQL via `pg`) |
| Real-time | Socket.io (WebSocket) |
| Auth | JWT (stateless) |

## Project Structure

```
odoo-cafe-pos/
├── client/               # React app — Admin, POS, KDS surfaces
├── server/               # Express API + Socket.io server
├── shared/               # Plain JS constants shared by both sides
│   └── constants/        # roles, orderStatus, kdsStages, paymentMethods, discountTypes
└── docs/                 # Spec-Sheet.md, guidelines-design.md
```

## Prerequisites

- Node.js 20+
- PostgreSQL 16 (local install — see note below on Docker)

## Local Setup

### 1. Clone & configure environment

```bash
git clone https://github.com/Crriminson/ODOO-Cafe.git
cd ODOO-Cafe
```

Copy the example env file and fill in your local DB credentials:

```bash
cp .env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=odoocafe
JWT_SECRET=change_me_to_something_secret
JWT_EXPIRES_IN=1d
```

### 2. Run migrations + seed

```bash
cd server
npm install
npm run migrate   # creates DB + runs all 10 migrations
npm run seed      # loads sample products, users, floors, cooks, etc.
```

**Default seed credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@odoocafe.com | admin123 |
| Cashier | cashier@odoocafe.com | admin123 |

### 3. Start the server

```bash
# inside /server
npm run dev       # nodemon, port 5000
```

### 4. Start the client

```bash
cd ../client
npm install
npm run dev       # Vite, port 5173
```

### 5. Open in browser

| URL | Surface |
|---|---|
| http://localhost:5173/login | Login (redirects by role) |
| http://localhost:5173/admin | Admin dashboard |
| http://localhost:5173/pos | POS terminal |
| http://localhost:5173/kds | Kitchen display (no login) |

---

## Docker (optional)

If you don't want to install PostgreSQL locally, a `docker-compose.yml` is provided:

```bash
docker compose up -d   # starts Postgres 16 on port 5432
```

Then run migrations as normal. Stop with `docker compose down`.

---

## Branch Strategy

- `master` — stable, always deployable
- `feature/<module-name>` — one branch per feature track (e.g. `feature/products-categories`)
- At least one teammate reviews before merging into `master`

## Feature Build Order

1. Products & Categories
2. Payment Methods + Floors & Tables
3. Sessions + Order Type + Order View (Product/Cart)
4. Payment Section + Receipt
5. KDS + Cook Allocation
6. Coupons & Promotions
7. Customers & Loyalty
8. Employees / User Management
9. Reports & Dashboard
10. Settings, Cooks refinement, Booking placeholder

---

## Docs

- [`docs/Spec-Sheet.md`](docs/spec-sheet.md) — full feature spec, schema, API structure, flows
- [`docs/guidelines-design.md`](docs/guidelines-design.md) — design system, component patterns, tokens
