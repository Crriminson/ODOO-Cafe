# Odoo Cafe POS — Frontend Design Guidelines
### Version 1.0 — Single Source of Truth for Visual Decisions

> Companion to `Spec-Sheet.md`. Where the spec defines *what* to build, this document
> defines *how it looks*. Any of the three surfaces (Admin, POS Terminal, KDS) should be
> visually indistinguishable in "family" — same borders, same shadows, same type, same
> spacing — even though their layouts differ.

---

## 0. Approach

This system reuses the **Editorial Flat-Bold** language from the Traveloop project
(2px dark borders, flat offset shadows, cream canvas, amber accent, `font-black`
headings) — it's already implemented, the team knows it, and it removes a category
of decisions under time pressure. It's extended here with the spacing/grid rigor,
elevation hierarchy, table conventions, and accessibility checklist from the general
design-principles reference, plus a set of POS-specific components (product cards,
cart lines, KDS tickets, QR payment, etc.) that didn't exist in Traveloop.

If a component isn't listed here, default to the **closest existing token** rather
than inventing a new pattern — consistency matters more than novelty for a 10-12 hour
build judged partly on "polished, consistent UI."

---

## 1. Design Tokens

### 1.1 Color Palette

```css
:root {
  /* Canvas & surfaces */
  --color-canvas: #F5F0E8;        /* page background, all three surfaces */
  --color-surface: #FFFFFF;       /* cards — never gray */

  /* Accent */
  --color-accent: #F5C142;        /* amber — primary actions, active states, badges */
  --color-accent-hover: #E0AE30;

  /* Text */
  --color-text: #1A1A1A;          /* headings, labels, borders, body-on-light */
  --color-text-secondary: #6B7280;
  --color-text-placeholder: #9CA3AF;

  /* Borders */
  --color-border: #1A1A1A;        /* interactive elements */
  --color-border-soft: #E5E7EB;   /* inner panels, table dividers, input default */

  /* Semantic */
  --color-error: #EF4444;
  --color-error-bg: #FEF2F2;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;

  /* Radius */
  --radius-md: 0.5rem;   /* inputs, buttons, badges */
  --radius-lg: 0.75rem;  /* content cards, inner panels, tabs */
  --radius-xl: 1rem;     /* page-level cards */

  /* Shadows — flat, offset, never blurred (see 1.4) */
  --shadow-sm: 2px 2px 0px var(--color-text);
  --shadow-md: 3px 3px 0px var(--color-text);
  --shadow-lg: 4px 4px 0px var(--color-text);
  --shadow-xl: 6px 6px 0px var(--color-text);
  --shadow-modal: 8px 8px 0px var(--color-text);
}
```

**Admin sidebar** (dark, distinct from canvas — see 3.2):

```
Sidebar background:    #1A1A1A
Sidebar active item:   #F5C142 (amber fill)
Sidebar active text:   #1A1A1A
Sidebar inactive text: #9CA3AF
Sidebar hover bg:      rgba(255,255,255,0.08)
```

The POS Terminal top nav (3.3) reuses these same values — same dark bar, same
amber active state — so Admin and POS feel like one product.

---

### 1.2 Status & Stage Badges

Two enums need badges: **order status** (`draft` / `sent` / `paid` / `cancelled`) and
**KDS stage** (`to_cook` / `preparing` / `completed`). Both reuse one 4-color semantic
system so the whole app speaks one "traffic light" language — amber = pending,
blue = in progress, green = done, gray = inactive.

| Value | bg | text | Meaning |
|---|---|---|---|
| `draft` / `to_cook` | `#FEF3C7` | `#92400E` | pending / not started |
| `sent` / `preparing` | `#DBEAFE` | `#1E40AF` | in progress |
| `paid` / `completed` | `#D1FAE5` | `#065F46` | done |
| `cancelled` | `#F3F4F6` | `#6B7280` | inactive / void |

```jsx
<span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
      style={{ background: badgeBg, color: badgeText }}>
  {label}
</span>
```

Map these from `shared/constants/orderStatus.js` and `kdsStages.js` — don't
hardcode the enum strings in component files.

---

### 1.3 Category Colors (admin-defined, dynamic)

Categories carry an admin-chosen hex color that must appear consistently on product
cards, POS category tabs, and the order view (per spec 2.3). Two rules keep this safe:

1. **Category color is never used as a full-card background.** It appears as a small
   color dot (`w-2.5 h-2.5 rounded-full`), a 4px top accent bar on product cards, or
   the fill of an *active* category tab. The card itself stays white with the standard
   dark border.
2. **Text on a category color is always `#1A1A1A`.** To guarantee this stays readable,
   the admin color picker should be constrained to a curated palette or enforce
   **HSL lightness ≥ 55%** — i.e. no near-black category colors. Flag this to whoever
   builds the Category form.

---

### 1.4 Elevation (Shadows)

Flat offset shadows are the signature — never use `shadow-sm`/`shadow-md` blur
utilities on cards, buttons, or badges.

| Level | Token | Usage |
|---|---|---|
| 0 | none, border only | inner panels, table rows, inactive tabs |
| 1 | `--shadow-sm` (2px) | small badges, icon badges |
| 2 | `--shadow-md` (3px) | buttons, avatar/icon circles, toggles |
| 3 | `--shadow-lg` (4px) | content cards — product cards, table/floor cards, KDS tickets |
| 4 | `--shadow-xl` (6px) | page-level cards — main panels, auth card |
| 5 | `--shadow-modal` (8px) | modals / confirmation dialogs |

**Exception:** dropdowns, the hamburger menu, and tooltips may use a conventional
soft blurred shadow (`0 4px 6px rgba(0,0,0,0.1)`) — these are the only floating
elements exempt from the flat-shadow rule.

---

### 1.5 Typography

Font: **Inter** (already in Traveloop's `index.css`). 2-3 weights max: 400, 700, 900.

| Role | Size / Weight | Class |
|---|---|---|
| Brand mark | 1.5rem / 900 | `text-[1.5rem] font-black` |
| Page heading | 1.5rem / 900 | `text-[1.5rem] font-black` |
| Section title (card heading) | 1.125rem / 700 | `text-lg font-bold` |
| Body | 0.875rem / 400 | `text-sm` |
| Field label | 0.75rem / 700, uppercase | `text-xs font-bold uppercase tracking-widest` |
| Helper / subtitle | 0.875rem / 400, secondary | `text-sm text-[#6B7280]` |
| Button text | 0.875rem / 900 | `text-sm font-black` |
| Table header | 0.75rem / 700, uppercase | `text-xs font-bold uppercase tracking-wide` |

**Monospace (`font-mono`) for all numbers that represent money, IDs, order numbers,
quantities, and timestamps** — prices, totals, order #, table #, transaction
references, receipt line items. This is a strong convention carried over from
Traveloop and it matters a lot for a POS: numeric columns read faster when they're
tabular and right-aligned (see 1.6).

---

### 1.6 Spacing & Grid

8px baseline, all spacing in multiples of 4px.

- **Within a group** (label → input, icon → text): `gap-1` to `gap-2`.
- **Between groups** (form rows, cart line items, dashboard cards): `gap-4` to `gap-6`.
- Page-level card padding: `p-8`. Inner panel padding: `p-5`. List/table cell padding: `px-4 py-3` minimum.
- Numbers in tables and order summaries: **right-aligned**, `font-mono`.
- Layout: flex/grid, 8px-multiple keylines. Gutters: 16px mobile, 24px tablet+.

---

### 1.7 Iconography

`lucide-react` exclusively, `strokeWidth` 2-2.5.

| Context | Size | strokeWidth |
|---|---|---|
| Icon badges (section headings) | 18px | 2.5 |
| Sidebar / top-nav icons | 18px | 2 |
| Button icons | 15-16px | 2 |
| Inline / card icons (seats, cook, table) | 14-16px | 1.5-2 |
| KDS ticket icons (large display) | 20-24px | 2 |

Every icon-only control (qty stepper, hamburger, employee icon, KDS item checkmark,
table-card tap target) needs `aria-label`.

---

### 1.8 Motion

```
Hover transitions:   duration-150
Modal open/close:    duration-200
Card hover lift:     hover:translate-y-[-2px]
Page transitions:    none — instant navigation
```

**Real-time updates (WebSocket-driven):** when a new KDS ticket arrives, give it a
brief amber border pulse (~1.2s, one cycle) rather than a jarring reflow — it's a
state change, not decoration, so it's allowed. Wrap it (and all hover-lift/pulse
animation) in `prefers-reduced-motion: reduce` and skip straight to the end state.

---

## 2. Core Components

### 2.1 Buttons

```jsx
{/* PRIMARY */}
<button className="bg-[#F5C142] text-[#1A1A1A] font-black text-sm rounded-lg px-4 py-3
  border-2 border-[#1A1A1A] hover:bg-[#E0AE30] transition-colors duration-150"
  style={{ boxShadow: 'var(--shadow-md)' }}>
  Save
</button>

{/* SECONDARY */}
<button className="bg-white text-[#1A1A1A] font-bold text-sm rounded-lg px-4 py-2.5
  border-2 border-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors duration-150">
  Cancel
</button>

{/* DANGER — used in confirmation modals */}
<button className="bg-[#EF4444] text-white font-bold text-sm rounded-lg px-4 py-2.5
  border-2 border-[#1A1A1A] hover:bg-red-600 transition-colors duration-150">
  Delete
</button>

{/* GHOST */}
<button className="text-[#6B7280] hover:text-[#1A1A1A] text-sm font-medium transition-colors">
  Cancel
</button>
```

Minimum touch target **44×44px** — important for the POS terminal (touch device).
Loading state: replace label with `<Loader2 className="animate-spin" size={16} />`.
Disabled state: `opacity-40`, `pointer-events-none`.

---

### 2.2 Cards

```jsx
{/* PAGE-LEVEL — main content surface */}
<div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-xl)' }} />

{/* CONTENT CARD — product cards, table cards, KDS tickets, list items */}
<div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-4
  hover:translate-y-[-2px] transition-transform duration-150" style={{ boxShadow: 'var(--shadow-lg)' }} />

{/* INNER PANEL — form grouping, order summary box */}
<div className="border-2 border-[#E5E7EB] rounded-xl p-5" />
```

---

### 2.3 Inputs & Form Fields

```jsx
<label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest">Field Label</label>

<input className="border-2 rounded-lg px-3 py-2.5 text-sm w-full bg-white text-[#1A1A1A]
  placeholder-[#9CA3AF] border-[#E5E7EB] focus:border-[#1A1A1A] focus:outline-none
  transition-colors duration-150" />

{/* error state */}
<input aria-invalid="true" className="border-2 rounded-lg px-3 py-2.5 text-sm w-full bg-white
  text-[#1A1A1A] border-[#EF4444] focus:border-[#EF4444] focus:outline-none" />
<p className="text-xs text-[#EF4444] font-medium mt-1">Invalid email address.</p>
```

Rules: label always above the input (never placeholder-as-label); `gap-1` between
label and input, `gap-4`+ between rows; required fields marked `*` with
`aria-required="true"`; show validation errors in real time, with red border + red
helper text (color is never the only signal — pair with the message).

**Search inputs** — same input style with a leading `Search` icon, **debounced at
300ms minimum**. Used in: product search (POS), customer/order search (POS), KDS
search.

---

### 2.4 Icon Badges

```jsx
<div className="w-9 h-9 rounded-lg flex items-center justify-center
  bg-[#F5C142] border-2 border-[#1A1A1A] flex-shrink-0" style={{ boxShadow: 'var(--shadow-sm)' }}>
  <Icon size={18} strokeWidth={2.5} className="text-[#1A1A1A]" />
</div>
```

Paired with a heading:

```jsx
<div className="flex items-center gap-3 mb-1">
  {/* icon badge */}
  <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Section Title</h1>
</div>
<p className="text-sm text-[#6B7280] mb-6 ml-12">Subtitle text.</p>
```

---

### 2.5 Tables (Admin lists, Reports)

```jsx
<div className="bg-white border-2 border-[#1A1A1A] rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-xl)' }}>
  <table className="w-full text-sm">
    <thead>
      <tr className="bg-[#F5F0E8] border-b-2 border-[#1A1A1A]">
        <th className="text-left text-xs font-bold uppercase tracking-wide px-4 py-3">Name</th>
        <th className="text-right text-xs font-bold uppercase tracking-wide px-4 py-3">Price</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-[#E5E7EB] hover:bg-[#F5F0E8] transition-colors">
        <td className="px-4 py-3">Cappuccino</td>
        <td className="px-4 py-3 text-right font-mono">₹120.00</td>
      </tr>
    </tbody>
  </table>
</div>
```

Header row shaded (`#F5F0E8`) with a dark bottom border, body rows divided by
`border-[#E5E7EB]`, hover highlight, numeric columns right-aligned and `font-mono`.
On screens below `md`, wrap in `overflow-x-auto` rather than wrapping columns.

---

### 2.6 Modals / Confirmation Dialogs

**Never `window.alert()` / `window.confirm()`.** Every destructive action (delete
product, delete draft order, archive employee, cancel order) goes through this:

```jsx
<div className="fixed inset-0 bg-[#1A1A1A]/50 flex items-center justify-center z-50 p-4">
  <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-md w-full"
    style={{ boxShadow: 'var(--shadow-modal)' }}>
    <h2 className="text-lg font-black mb-2">Delete this product?</h2>
    <p className="text-sm text-[#6B7280] mb-6">This can't be undone.</p>
    <div className="flex justify-end gap-3">
      <button className="ghost">Cancel</button>
      <button className="danger">Delete</button>
    </div>
  </div>
</div>
```

Modal must trap focus, close on `Esc`, and return focus to the triggering element
on close. `duration-200` for open/close transitions.

---

### 2.7 Toggles (Payment method enable/disable)

```jsx
<button role="switch" aria-checked={enabled} aria-label="Enable UPI QR"
  className={`w-11 h-6 rounded-full border-2 border-[#1A1A1A] relative transition-colors duration-150
    ${enabled ? 'bg-[#F5C142]' : 'bg-white'}`}>
  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#1A1A1A] transition-transform duration-150
    ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
</button>
```

---

### 2.8 Tabs (Category filters, Order View sections on small screens)

```jsx
{/* inactive */}
<button className="px-4 py-2 rounded-lg border-2 border-[#1A1A1A] bg-white text-sm font-bold
  flex items-center gap-2 hover:bg-[#F5F0E8] transition-colors">
  <span className="w-2.5 h-2.5 rounded-full" style={{ background: category.color }} />
  {category.name}
</button>

{/* active — filled with category color */}
<button className="px-4 py-2 rounded-lg border-2 border-[#1A1A1A] text-sm font-black
  flex items-center gap-2 text-[#1A1A1A]" style={{ background: category.color, boxShadow: 'var(--shadow-sm)' }}>
  {category.name}
</button>
```

---

### 2.9 Dividers & Links

```jsx
{/* OR divider */}
<div className="flex items-center gap-3 my-6">
  <div className="flex-1 h-px bg-[#E5E7EB]" />
  <span className="text-xs text-[#9CA3AF] font-medium">OR</span>
  <div className="flex-1 h-px bg-[#E5E7EB]" />
</div>

{/* inline link */}
<Link className="text-[#1A1A1A] font-bold underline underline-offset-2
  hover:text-[#F5C142] transition-colors">Create account</Link>
```

---

## 3. Layout Patterns by Surface

### 3.1 Auth (`/login`, `/signup`)

```
[Cream canvas, full screen]
  └── [Centered container, max-w-[420px]]
        ├── Brand mark (icon badge + cafe name, font-black)
        ├── [White card — 2px border, shadow-xl, rounded-2xl, p-8]
        │     ├── Icon badge + heading ("Sign in") + subtitle
        │     ├── Email field
        │     ├── Password field
        │     ├── API error banner (if any)
        │     ├── Primary CTA (full width)
        │     └── Footer link (Sign up / Have an account?)
        └── Footer tagline
```

Signup adds Name + Role fields in the same field-order convention as Traveloop's
registration form: 2-column rows for paired short fields, full-width for the rest.

---

### 3.2 Admin (`/admin/*`)

```
┌──────────┬──────────────────────────────────────────┐
│ Sidebar  │  Cream canvas content area                 │
│ (#1A1A1A)│   ┌──────────────────────────────────┐    │
│          │   │ Icon badge + Page heading          │   │
│ Dashboard│   │ Subtitle (ml-12)                    │   │
│ Products │   │                                     │   │
│ Categories│  │ [Page-level card: table / form /   │   │
│ Payment  │   │  charts depending on page]          │   │
│ Methods  │   │                                     │   │
│ Floors & │   └──────────────────────────────────┘    │
│ Tables   │                                            │
│ Coupons &│                                            │
│Promotions│                                            │
│ Employees│                                            │
│ Cooks    │                                            │
│ Reports  │                                            │
│ Settings │                                            │
│ Booking  │                                            │
│ Log Out  │                                            │
└──────────┴──────────────────────────────────────────┘
```

Sidebar: fixed width (~240px), dark `#1A1A1A`, active nav item is an amber pill
(`bg-[#F5C142] text-[#1A1A1A]`), inactive items `#9CA3AF`, hover
`bg-white/[0.08]`. Below `lg` (1024px), collapse the sidebar behind a hamburger.

**Dashboard / Reports** specifically: filter bar (Period / Employee / Session /
Product — styled as small `Tabs`/`select` inputs) at the top of the page-level card,
then a grid of stat cards (3 across: Total Orders, Revenue, Avg Order Value — each
a content card with the value in `font-mono font-black text-2xl`), then charts
(Sales Trend, Top Categories) in content cards using the accent + neutral grays for
series colors, then Top Products / Top Orders / Top Categories as tables (2.5).

---

### 3.3 POS Terminal (`/pos/*`)

```
┌──────────────────────────────────────────────────────────┐
│ Top bar (#1A1A1A): POS Order | Orders | Customer | Table   │
│  View   [search]   [table: T4]   [employee: Asha ▾]  [≡]  │
├──────────────────────────────────────────────────────────┤
│                                                              │
│   Product Section        Cart Section      Payment Section │
│   (category tabs +       (line items +      (methods +     │
│    product card grid)     order summary)     QR / cash UI) │
│                                                              │
└──────────────────────────────────────────────────────────┘
```

The top bar reuses the sidebar's dark background and amber active-item treatment —
same nav language as Admin, just horizontal. Order View is a 3-column grid on
`lg`+ (roughly 5:4:3); below `1024px`, collapse into tabs (Product / Cart / Payment)
using the Tab component from 2.8, since three columns won't fit on a tablet in
portrait. Touch targets throughout this surface are 44px minimum — this is the
screen a cashier taps all day.

**Floor Pop-up**: numbered grid of table cards (5.4) as a modal/overlay (use the
modal shadow tier).

---

### 3.4 Kitchen Display (`/kds`)

```
┌──────────────────────────────────────────────────────────┐
│  [Cafe Name] — KDS     [● live]   [search]   [filters ▾]   │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Ticket   │ │ Ticket   │ │ Ticket   │ │ Ticket   │  ...  │
│  │ #102     │ │ #103     │ │ #104     │ │ #105     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└──────────────────────────────────────────────────────────┘
```

KDS is kiosk-mode — no login, designed for a large display in the kitchen. Keep the
cream canvas for brand consistency, but tickets are **larger** versions of the
content card (bigger padding, `text-lg` item names) so they're readable from a
distance. A small green pulsing dot + "live" label in the header indicates the
WebSocket connection is active. Grid: 4 columns at `≥1280px`, 3 at `1024-1280px`,
2 at `768-1024px`, 1 below that.

---

## 4. POS & KDS Specific Components

### 4.1 Product Card

```jsx
<div className="bg-white border-2 border-[#1A1A1A] rounded-xl overflow-hidden
  hover:translate-y-[-2px] transition-transform duration-150 cursor-pointer"
  style={{ boxShadow: 'var(--shadow-lg)' }}>
  <div className="h-1" style={{ background: category.color }} />
  <div className="p-3">
    <p className="text-sm font-bold text-[#1A1A1A] truncate">Cappuccino</p>
    <p className="text-sm font-mono font-black mt-1">₹120.00</p>
  </div>
</div>
```

The 4px category-color bar at the top is the only place a category color touches a
product card directly — keeps the grid scannable without turning into a color soup.

---

### 4.2 Cart Line Item

```jsx
<div className="flex items-center justify-between gap-3 py-2 border-b border-[#E5E7EB]">
  <div className="flex-1">
    <p className="text-sm font-bold">Cappuccino</p>
    {hasDiscount && <p className="text-xs text-[#92400E]">-₹20.00 (promo)</p>}
  </div>
  <div className="flex items-center gap-2">
    <button aria-label="Decrease quantity" className="w-7 h-7 rounded-md border-2 border-[#1A1A1A] flex items-center justify-center">−</button>
    <span className="font-mono text-sm w-6 text-center">2</span>
    <button aria-label="Increase quantity" className="w-7 h-7 rounded-md border-2 border-[#1A1A1A] flex items-center justify-center">+</button>
  </div>
  <span className="font-mono text-sm w-16 text-right">₹240.00</span>
</div>
```

---

### 4.3 Order Summary

Inner-panel style (2.3 inner panel), right-aligned `font-mono` figures, total row
visually emphasized:

```jsx
<div className="border-2 border-[#E5E7EB] rounded-xl p-5 space-y-2">
  <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Subtotal</span><span className="font-mono">₹480.00</span></div>
  <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Tax</span><span className="font-mono">₹24.00</span></div>
  <div className="flex justify-between text-sm"><span className="text-[#92400E]">Discount</span><span className="font-mono text-[#92400E]">−₹20.00</span></div>
  <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Tip</span><span className="font-mono">₹0.00</span></div>
  <div className="h-px bg-[#1A1A1A] my-2" />
  <div className="flex justify-between text-lg font-black"><span>Total</span><span className="font-mono">₹484.00</span></div>
</div>
```

---

### 4.4 Payment Method Selector

```jsx
{/* selected */}
<button className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[#1A1A1A]
  bg-[#F5C142] text-[#1A1A1A]" style={{ boxShadow: 'var(--shadow-sm)' }}>
  <Banknote size={20} strokeWidth={2} /> <span className="font-black text-sm">Cash</span>
</button>

{/* unselected */}
<button className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[#1A1A1A]
  bg-white text-[#1A1A1A] hover:bg-[#F5F0E8]">
  <CreditCard size={20} strokeWidth={2} /> <span className="font-bold text-sm">Card</span>
</button>
```

Icons: Cash → `Banknote`, Card/Digital → `CreditCard`, UPI → `QrCode`.

---

### 4.5 UPI QR Display

Centered in a page-level card (modal context):

```jsx
<div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-8 max-w-sm mx-auto text-center"
  style={{ boxShadow: 'var(--shadow-modal)' }}>
  <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-4">Scan to pay</p>
  <div className="border-2 border-[#1A1A1A] rounded-xl p-4 inline-block">
    {/* <QRCode value={upiDeepLink} size={200} /> */}
  </div>
  <p className="font-mono font-black text-2xl mt-4">₹484.00</p>
  <div className="flex gap-3 mt-6">
    <button className="secondary flex-1">Cancel</button>
    <button className="primary flex-1">Confirmed</button>
  </div>
</div>
```

---

### 4.6 Floor / Table Card

```jsx
{/* available */}
<div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-4 text-center
  hover:translate-y-[-2px] transition-transform duration-150" style={{ boxShadow: 'var(--shadow-lg)' }}>
  <p className="font-mono font-black text-2xl">T4</p>
  <p className="text-xs text-[#6B7280] flex items-center justify-center gap-1 mt-1">
    <Users size={14} /> 4 seats
  </p>
</div>

{/* occupied — active order */}
<div className="bg-[#F5C142] border-2 border-[#1A1A1A] rounded-xl p-4 text-center relative"
  style={{ boxShadow: 'var(--shadow-lg)' }}>
  <p className="font-mono font-black text-2xl">T4</p>
  <p className="text-xs text-[#1A1A1A] flex items-center justify-center gap-1 mt-1"><Users size={14} /> 4 seats</p>
  <span className="absolute top-2 right-2 text-xs font-bold bg-[#1A1A1A] text-white px-1.5 py-0.5 rounded">●</span>
</div>
```

---

### 4.7 KDS Ticket Card

```jsx
<div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-4 cursor-pointer"
  style={{ boxShadow: 'var(--shadow-lg)' }}>
  <div className="flex justify-between items-center mb-2">
    <span className="font-mono font-black text-xl">#102</span>
    <span className="badge" /* stage badge, see 1.2 */ >To Cook</span>
  </div>
  <p className="text-xs text-[#6B7280] mb-3">Dine-in — Table T4 · Cook: Asha</p>
  <ul className="space-y-1.5">
    <li className="flex justify-between text-sm">
      <span>2× Cappuccino</span>
    </li>
    <li className="flex justify-between text-sm text-[#9CA3AF] line-through">
      <span>1× Croissant</span>
    </li>
  </ul>
</div>
```

Clicking the card body advances the whole ticket's stage (badge updates +
animates between the three stage colors from 1.2). Clicking an individual item
toggles its own strikethrough/`is_item_completed` without changing the ticket's
overall stage. New tickets arriving via `order:new` get the amber pulse from 1.8.

---

### 4.8 Receipt (print / on-screen)

```jsx
<div className="font-mono text-sm max-w-xs mx-auto p-4 bg-white">
  <p className="text-center font-black text-base mb-2">{cafeName}</p>
  <div className="border-t border-dashed border-[#1A1A1A] my-2" />
  {items.map(i => (
    <div className="flex justify-between"><span>{i.qty}× {i.name}</span><span>₹{i.lineTotal}</span></div>
  ))}
  <div className="border-t border-dashed border-[#1A1A1A] my-2" />
  <div className="flex justify-between font-black"><span>Total</span><span>₹{total}</span></div>
</div>
```

Add `@media print { .no-print { display: none } }` to hide buttons/nav when printing.

---

## 5. UX Patterns

**Loading** — inline: swap button label for `<Loader2 className="animate-spin" />`.
Page-level: skeleton blocks (`bg-[#E5E7EB] animate-pulse rounded-lg`) shaped like the
real content (product card grid skeletons, table row skeletons) — never a full-page
spinner.

**Empty states** — descriptive message + amber primary CTA, always. Examples:
"No products yet — add your first menu item" → *+ Add Product*. KDS: "No active
orders — tickets appear here in real time" (no CTA needed, it's passive).

**Error states** — field-level: red border + red `text-xs` message under the input.
API/async: red banner (`bg-red-50 border-2 border-[#EF4444]`) inside the form.
Route-level: dedicated error page with a way back, matching the app's branding.

**Real-time updates** — KDS tickets and table-occupancy badges update via WebSocket
without a page reload. New ticket → amber pulse (1.8). Order paid → ticket fades out
of KDS. Always pair the visual change with the badge/text update, not color alone.

**Search** — 300ms debounce minimum, everywhere (product search, customer search,
orders list, KDS search).

**Confirmation** — styled modal (2.6) for every destructive action, never browser
dialogs.

---

## 6. Responsive Strategy

Mobile-first base styles, layered breakpoints at `640 / 768 / 1024 / 1280px`. Per
surface:

| Surface | Primary target | Behavior below target |
|---|---|---|
| Auth | All sizes | Single column, `max-w-[420px]`, always works |
| Admin | `≥1024px` (desktop back-office) | Sidebar collapses behind hamburger; tables `overflow-x-auto` |
| POS Terminal | `768-1024px` (tablet, cashier) | 3-column Order View → tabbed Product/Cart/Payment; nav secondary items into hamburger below `768px` |
| KDS | `≥1280px` (kitchen display) | Ticket grid: 4 → 3 → 2 → 1 columns as width drops |

---

## 7. Accessibility Checklist

- All interactive elements reachable via `Tab`; visible focus ring (`focus:border-[#1A1A1A]` + outline).
- Every icon-only control has `aria-label` (qty steppers, hamburger, employee icon, KDS item toggle, table cards).
- Text contrast ≥ 4.5:1; category colors constrained to **HSL lightness ≥ 55%** so `#1A1A1A` text always passes.
- Status/stage always conveyed by **badge text + color**, never color alone.
- Modals trap focus, close on `Esc`, restore focus to trigger on close.
- Forms: every input has an associated `<label>`, required fields marked `*` + `aria-required="true"`, invalid inputs get `aria-invalid="true"`.
- All non-essential animation (hover lift, real-time pulse) wrapped in `prefers-reduced-motion: reduce`.

---

## 8. Pre-Ship Checklist (per page/component)

- [ ] Spacing uses 4px-multiple Tailwind classes; groups have more surrounding space than internal space
- [ ] Borders are `2px solid #1A1A1A` on all interactive surfaces; shadows are flat-offset (1.4), not blurred
- [ ] Headings are `font-black`; no more than 3 weights on the page
- [ ] Numbers (money, IDs, counts, timestamps) are `font-mono` and right-aligned in tables
- [ ] Category/status colors come from `shared/constants` or the category's stored hex — never hardcoded
- [ ] Loading, empty, and error states are all designed, not just the happy path
- [ ] Destructive actions go through the modal (2.6), not `window.confirm`
- [ ] Touch targets ≥ 44px on POS/KDS surfaces
- [ ] Checked at the relevant breakpoint for this surface (Table 6)
