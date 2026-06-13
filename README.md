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
DATABASE_URL=postgres://postgres:your_password@localhost:5432/odoocafe
JWT_SECRET=change_me_to_something_long_and_random_at_least_32_chars
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
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

---

## Running the Backend

### Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally (default port 5432)

### Setup

```bash
cd server
npm install
```

Copy and fill in env file:

```bash
cp .env.example .env
# edit .env — set DATABASE_URL and JWT_SECRET at minimum
```

```env
DATABASE_URL=postgres://postgres:your_password@localhost:5432/odoocafe
JWT_SECRET=change_me_to_something_long_and_random_at_least_32_chars
PORT=5000
CLIENT_URL=http://localhost:5173
```

Run migrations (creates the DB if it doesn't exist, applies all 10 schema files):

```bash
npm run migrate
```

Seed with demo data (1 admin, 1 cashier, 4 categories, 8 products, 1 floor, 4 tables):

```bash
npm run seed
```

Start dev server with hot reload:

```bash
npm run dev
```

Server starts at `http://localhost:5000`.

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | None | Health check — `{ status, db }` |
| `POST` | `/api/v1/auth/signup` | None | Create account |
| `POST` | `/api/v1/auth/login` | None | Login → JWT (12h) |
| `POST` | `/api/v1/auth/logout` | Bearer | Acknowledge logout |
| `GET` | `/api/v1/auth/me` | Bearer | Current user profile |
| `*` | `/api/v1/<feature>/*` | — | 501 Not Implemented (stub) |

### Error Response Shape

All errors use a consistent envelope:

```json
{
  "error": {
    "message": "Human-readable description",
    "code": "MACHINE_READABLE_CODE"
  }
}
```

Validation errors (422) also include `fields`:

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "fields": [{ "field": "email", "message": "Invalid email address" }]
  }
}
```

### Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@odoocafe.com | admin123 |
| Cashier | cashier@odoocafe.com | admin123 |
