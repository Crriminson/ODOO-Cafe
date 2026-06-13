# Tracker — Person 1: Auth/JWT Integration & App Shell
### Branch: `feature/auth-shell`

Read `00-MASTER-GUIDE.md` first if you haven't.

> Note: backend JWT (login/signup/logout/me, middleware, role guard) is **already
> implemented** — `server/src/controllers/auth.controller.js`,
> `server/src/middleware/auth.js`, `server/src/middleware/requireRole.js`,
> `server/src/utils/jwt.js`. Your job is the **frontend integration + the app shell**
> that everyone else's pages plug into. You are the critical path for Checkpoint A —
> push early, even rough.

---

## Before you start

- [ ] Pulled latest `master`, created `feature/auth-shell` from it.
- [ ] Confirmed seed users work: `POST /auth/login` with `admin@odoocafe.com` /
  `admin123` and `cashier@odoocafe.com` / `admin123` both return `{ token, user }`.
- [ ] Skimmed `docs/guidelines-design.md` §1 (tokens), §2.1–2.9 (core components),
  §3.1–3.3 (layouts) — referenced inline below per task.

---

## Task 1 — Shared UI primitives (`client/src/shared/components/`)

Files: `Button.jsx`, `Card.jsx`, `Modal.jsx`, `DataTable.jsx`

**Contract to follow** (guidelines-design.md):
- `Button` — variants: primary (amber `#F5C142`, `font-black`), secondary (white,
  `font-bold`), danger (red `#EF4444`), ghost (no border, gray text). Min touch
  target 44×44px. Loading state via spinner icon replacing label. Disabled →
  `opacity-40 pointer-events-none`. (§2.1)
- `Card` — variants: page-level (`rounded-2xl p-8 shadow-xl`), content (`rounded-xl
  p-4 shadow-lg`, hover lift `translate-y-[-2px]`), inner panel (`border-[#E5E7EB]
  rounded-xl p-5`, no shadow). (§2.2)
- `Modal` — **must** trap focus, close on `Esc`, return focus to trigger on close,
  `duration-200` transition, dark overlay `bg-[#1A1A1A]/50`. This replaces every
  `window.alert`/`window.confirm` in the whole app — every other person depends on
  this existing and working before they build delete/confirm flows. (§2.6)
- `DataTable` — header row `bg-[#F5F0E8]` with dark bottom border, body rows
  `border-[#E5E7EB]`, hover highlight, numeric columns right-aligned + `font-mono`,
  `overflow-x-auto` wrapper on small screens. Needs to support: custom column
  defs, row click handler (for "open order detail" style rows), empty state. (§2.5)

### Verification checklist
- [ ] All 4 components use CSS variable tokens (`--shadow-sm/md/lg/xl/modal`,
  `--color-*`) from §1.1/1.4 — not ad-hoc hex values duplicated everywhere.
- [ ] `Button` renders all 4 variants + loading + disabled states correctly.
- [ ] `Modal` traps focus and closes on `Esc` — actually test this with keyboard,
  don't just read the code.
- [ ] `DataTable` handles an empty `rows` array gracefully (no crash, shows an
  empty state).
- [ ] None of these files import anything from `admin/`, `pos/`, or `kds/` —
  they must stay surface-agnostic since all three surfaces import them.

---

## Task 2 — Auth state & API (`shared/hooks/useAuth.js`,
`app/providers/AuthProvider.jsx`, `shared/api/auth.api.js`)

**Contract to follow** — `docs/API-Contract.md` "Auth" section:

| Endpoint | Request | Response |
|---|---|---|
| `POST /auth/signup` | `{ name, email, password, role }` | `201 { token, user: {id,name,email,role} }` |
| `POST /auth/login` | `{ email, password }` | `200 { token, user: {id,name,email,role} }` |
| `POST /auth/logout` | (empty, Bearer) | `200 { message }` |
| `GET /auth/me` | (Bearer) | `200 { user: {id,name,email,role,is_active,created_at} }` |

Errors: `409 EMAIL_EXISTS`, `422 VALIDATION_ERROR` (signup), `401
INVALID_CREDENTIALS` / `422 VALIDATION_ERROR` (login).

`AuthProvider` responsibilities:
- Store JWT (the existing `shared/api/client.js` already reads `localStorage.getItem('token')`
  on every request — **store the token under the key `"token"`**, don't invent a
  different key).
- On mount: if a token exists, call `GET /auth/me` to hydrate `user`; on 401 the
  existing axios interceptor already clears the token and redirects to `/login` —
  don't duplicate that logic.
- Expose `{ user, role, login(email,password), signup(...), logout(), isLoading }`
  via `useAuth()`.

### Verification checklist
- [ ] Token stored under `localStorage` key `"token"` (matches `shared/api/client.js`
  interceptor — check the actual key string, don't assume).
- [ ] `role` comes from `user.role`, values are exactly `"admin"` / `"employee"` —
  use `ROLES.ADMIN` / `ROLES.EMPLOYEE` from `shared/constants`, not literals.
- [ ] Login error message surfaces the `error.message` from the thrown Error
  (the interceptor already attaches `.message`, `.code`, `.fields`) — don't
  re-parse `err.response.data` yourself, it's already unwrapped.
- [ ] Signup form sends `role` — confirm with the group whether signup UI lets a
  user pick `admin`/`employee` or whether it's admin-only / hidden (spec doesn't
  fully resolve this — flag if ambiguous, don't silently guess).
- [ ] No `password_hash` or password ever logged to console.

---

## Task 3 — Login / Signup pages (`auth/LoginPage.jsx`, `auth/SignupPage.jsx`)

**Layout contract** — guidelines-design.md §3.1: centered `max-w-[420px]` container,
brand mark, white card (`border-2 shadow-xl rounded-2xl p-8`), labeled fields above
inputs (never placeholder-as-label), API error banner, full-width primary CTA,
footer link between login/signup. Signup adds Name + Role.

**Role-based redirect after login** (spec-sheet.md §5.1):
```
Login → JWT issued
  ├── role = admin    → /admin
  └── role = employee → /pos
```

### Verification checklist
- [ ] Required fields marked `*`, `aria-required="true"` (§2.3).
- [ ] Validation errors shown inline, real-time, red border + red text — not just
  an alert.
- [ ] On successful login, redirect target depends on `user.role` — test both
  seed accounts and confirm they land on `/admin` and `/pos` respectively.
- [ ] On `422 VALIDATION_ERROR`, the `fields` array from the error response is
  mapped to the correct input's error message (field-by-field), not dumped as one
  generic banner.
- [ ] Search input debounce rule (§2.3, 300ms) doesn't apply here — these aren't
  search fields, don't add unnecessary debouncing to login/signup inputs.

---

## Task 4 — Router & App shell (`app/router.jsx`, `app/App.jsx`)

**Contract to follow** — spec-sheet.md §4/§5.1 role-based routing:

| Route | Guard |
|---|---|
| `/login`, `/signup` | none |
| `/admin/*` | `role === 'admin'` only |
| `/pos/*` | `role === 'employee'` only |
| `/kds` | **none** — open display, per API-Contract ambiguity #7 |

A logged-out user hitting `/admin/*` or `/pos/*` → redirect to `/login`. A logged-in
`employee` hitting `/admin/*` (or vice versa) → redirect to their own surface, not
to `/login` (they ARE authenticated, just wrong role) — per spec §4 "hard role
separation," but don't bounce them to a dead end either.

### Verification checklist
- [ ] `App.jsx` wraps everything in `AuthProvider` (Task 2) before the router.
- [ ] `/admin/*` renders `AdminLayout` (Task 5) wrapping `admin/routes.jsx`.
- [ ] `/pos/*` renders `PosLayout` (Task 6) wrapping `pos/routes.jsx`.
- [ ] `/kds` renders `kds/routes.jsx` with **no** auth wrapper at all — confirm by
  testing in an incognito/no-token browser session.
- [ ] Wrong-role access redirects to the correct surface, not `/login`, when the
  user IS authenticated.
- [ ] No infinite redirect loops (test: logged out → `/admin` → `/login` → does NOT
  bounce back to `/admin` automatically).

---

## Task 5 — Admin layout (`admin/layout/AdminLayout.jsx`)

**Contract** — guidelines-design.md §3.2 + spec-sheet.md §3 nav list. Dark sidebar
(`#1A1A1A`, ~240px), nav items in this exact order:

```
Dashboard, Products, Categories, Payment Methods, Floors & Tables,
Coupons & Promotions, Employees, Cooks, Reports, Settings, Booking, Log Out
```

Active item = amber pill (`bg-[#F5C142] text-[#1A1A1A]`), inactive = `#9CA3AF`,
hover = `bg-white/[0.08]`. Collapse behind hamburger below `lg` (1024px).

### Verification checklist
- [ ] Nav item order matches the list above exactly (other people's routes will
  be added under matching labels — keep order stable so it doesn't reshuffle
  mid-build).
- [ ] "Booking" is a **placeholder link only** — per spec, no page/route behind it
  yet (round 2 may add a stub page). Don't build a full Booking feature.
- [ ] "Log Out" calls `useAuth().logout()` and redirects to `/login`.
- [ ] Active-route highlighting works for nested routes (e.g. `/admin/products/5`
  still highlights "Products").
- [ ] Sidebar collapses to hamburger below 1024px — test by resizing.

---

## Task 6 — POS layout (`pos/layout/PosLayout.jsx`)

**Contract** — guidelines-design.md §3.3 + spec-sheet.md §7.1. Horizontal dark top
bar (same visual language as admin sidebar) containing, left to right:

```
POS Order | Orders | Customer | Table View | [product search bar]
[current table indicator] | [employee name ▾] | [hamburger ≡]
```

Hamburger dropdown links to: Products, Category, Payment Method, Coupon &
Promotion, Booking, User/Employee, KDS, Reports, Log-Out (spec §3.1 — this is the
**same set as the admin sidebar**, reused as a dropdown here since employees can't
navigate to `/admin/*` but the spec still lists these as POS hamburger links —
**flag this to the group**: does the employee hamburger actually need working links
to admin-only pages, or are these meant to be disabled/hidden for employee role?
Don't silently implement full admin access from the POS hamburger).

### Verification checklist
- [ ] "Current Table Indicator" is a slot/prop that other pages (P3's OrderView)
  can populate — don't hardcode it empty or static.
- [ ] "Employee Icon" shows `user.name` from `useAuth()`, not a placeholder.
- [ ] Product search bar in the top nav is a **shared/global** search affordance —
  confirm with P3 whether it filters the current Order View's product grid or
  navigates somewhere; don't build it in isolation without checking.
- [ ] Touch targets 44px minimum throughout (§3.3 — this is a tablet UI).
- [ ] Flagged the hamburger-menu admin-link question above to the group before
  building full nav-through to admin pages from POS.

---

## Task 7 — Surface route skeletons (`admin/routes.jsx`, `pos/routes.jsx`,
`kds/routes.jsx`)

These are **skeleton files only** — your job is structure, not content. Each
feature owner appends their own route entry later.

```jsx
// admin/routes.jsx — EXAMPLE STRUCTURE
import { Routes, Route } from 'react-router-dom';
// import Dashboard from './pages/Dashboard';   ← P2/P3/P4 add their imports here

const AdminRoutes = () => (
  <Routes>
    {/* === Dashboard / Reports — owner: TBD (round 2) === */}
    {/* <Route path="/" element={<Dashboard />} /> */}

    {/* === Products & Categories — owner: P2 === */}
    {/* <Route path="/products" element={<Products />} /> */}
    {/* <Route path="/categories" element={<Categories />} /> */}

    {/* === Payment Methods & Floors/Tables — owner: P2 === */}
    {/* <Route path="/payment-methods" element={<PaymentMethods />} /> */}
    {/* <Route path="/floors-tables" element={<FloorsAndTables />} /> */}

    {/* === Cooks & Coupons/Promotions — owner: P4 === */}
    {/* <Route path="/cooks" element={<Cooks />} /> */}
    {/* <Route path="/coupons-promotions" element={<CouponsPromotions />} /> */}

    {/* === Employees, Reports, Settings — owner: TBD (round 2) === */}
  </Routes>
);
export default AdminRoutes;
```

Same pattern for `pos/routes.jsx` (sections: Session/OrderType/FloorPopup/TableView
/OrderView/Orders → P3; Customers → P4) and `kds/routes.jsx` (KitchenDisplay → P4,
single route).

### Verification checklist
- [ ] Each commented block has an `owner:` label matching the master guide's
  assignment — this is what prevents two people editing the same block.
- [ ] File compiles/builds with everything commented out (i.e. an empty route
  list doesn't crash the app).
- [ ] Pushed to `master` **before** Checkpoint A so P2/P3/P4 can rebase onto it.

---

## Task 8 — Shared constants re-export (`client/src/shared/constants/index.js`)

Thin re-export of `/shared/constants/*.js` (root-level package: `roles.js`,
`orderStatus.js`, `kdsStages.js`, `paymentMethods.js`, `discountTypes.js`,
`orderType.js`, `unitOfMeasure.js`) so client code does one import:

```js
export * from '../../../../shared/constants/roles.js';
export * from '../../../../shared/constants/orderStatus.js';
// ... etc for all 7 files
```

### Verification checklist
- [ ] All 7 constant modules re-exported, no name collisions.
- [ ] `import { ROLES, ORDER_STATUS } from '@/shared/constants'` (or your actual
  alias) resolves correctly from at least one consuming file as a smoke test.
- [ ] You did **not** copy/duplicate the constant values into this file — it's a
  re-export only, single source of truth stays in `/shared/constants/`.

---

## AI Dev Log

Log every deviation your AI introduced and you caught (see Master Guide §1).

| Date/Time | Task | What I asked for | What AI produced | Deviation | Fix |
|---|---|---|---|---|---|
| | | | | | |

---

## Dependencies

**I'm blocking:** P2, P3, P4 on `admin/routes.jsx`/`pos/routes.jsx`/`kds/routes.jsx`
skeletons, `AdminLayout`/`PosLayout`, `Button`/`Card`/`Modal`/`DataTable`,
`AuthProvider`. → Push these to `master` **before Checkpoint A (~1:30)**, even if
unstyled.

**I'm blocked on:** nothing — Tasks 1–8 only depend on the already-implemented
backend auth.

**After Checkpoint A:** float to help P3 (`feature/pos-core`) on Order View, or
pick up a round-2 item (Employees admin page) — check with the group at Checkpoint
B before committing to either.
