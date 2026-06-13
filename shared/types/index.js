/**
 * JSDoc typedefs for every database table.
 * Field names, types, and nullability match the actual schema columns exactly.
 * All timestamps are UTC ISO 8601 strings on the wire.
 *
 * Import example:
 *   @param {import('@shared/types').Order} order
 */

// ─── Users ───────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} User
 * @property {number}  id
 * @property {string}  name          - VARCHAR(100)
 * @property {string}  email         - VARCHAR(150) UNIQUE
 * @property {string}  role          - 'admin' | 'employee'
 * @property {boolean} is_active
 * @property {string}  created_at    - TIMESTAMPTZ ISO 8601
 * @property {string}  updated_at    - TIMESTAMPTZ ISO 8601
 */

// NOTE: password_hash is never included in API responses — omitted intentionally.

// ─── Sessions ────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Session
 * @property {number}      id
 * @property {number}      employee_id
 * @property {string}      opened_at                - TIMESTAMPTZ ISO 8601
 * @property {string|null} closed_at                - null while session is open
 * @property {number|null} closing_total_orders     - populated on close
 * @property {string|null} closing_total_revenue    - DECIMAL as string, e.g. "1250.00"
 * @property {Object|null} closing_breakdown        - JSONB: { cash: "500.00", card: "750.00", upi: "0.00" }
 * @property {string}      created_at               - TIMESTAMPTZ ISO 8601
 */

// ─── Categories ──────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Category
 * @property {number} id
 * @property {string} name        - VARCHAR(100) UNIQUE
 * @property {string} color       - VARCHAR(7) hex e.g. '#FF5733'
 * @property {string} created_at  - TIMESTAMPTZ ISO 8601
 * @property {string} updated_at  - TIMESTAMPTZ ISO 8601
 */

// ─── Products ────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Product
 * @property {number}      id
 * @property {string}      name                - VARCHAR(150)
 * @property {number}      category_id
 * @property {string}      price               - DECIMAL(10,2) as string e.g. "120.00"
 * @property {string}      unit_of_measure     - 'piece' | 'kg' | 'litre'
 * @property {string}      tax_rate            - DECIMAL(5,2) as string e.g. "5.00"
 * @property {string|null} description
 * @property {number|null} estimated_prep_time - minutes
 * @property {boolean}     show_on_kds
 * @property {boolean}     is_active
 * @property {string}      created_at          - TIMESTAMPTZ ISO 8601
 * @property {string}      updated_at          - TIMESTAMPTZ ISO 8601
 */

// ─── Floors ──────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Floor
 * @property {number} id
 * @property {string} name        - VARCHAR(100)
 * @property {string} created_at  - TIMESTAMPTZ ISO 8601
 */

// ─── Tables ──────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Table
 * @property {number}  id
 * @property {number}  floor_id
 * @property {number}  table_number
 * @property {number}  seats
 * @property {boolean} is_active
 * @property {string}  created_at   - TIMESTAMPTZ ISO 8601
 * @property {string}  updated_at   - TIMESTAMPTZ ISO 8601
 */

// ─── Customers ───────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Customer
 * @property {number}      id
 * @property {string}      name           - VARCHAR(100)
 * @property {string|null} email          - VARCHAR(150) UNIQUE
 * @property {string|null} phone          - VARCHAR(20)
 * @property {string|null} address
 * @property {number}      loyalty_points - DEFAULT 0
 * @property {string}      created_at     - TIMESTAMPTZ ISO 8601
 * @property {string}      updated_at     - TIMESTAMPTZ ISO 8601
 */

// ─── Loyalty Transactions ────────────────────────────────────────────────────

/**
 * @typedef {Object} LoyaltyTransaction
 * @property {number} id
 * @property {number} customer_id
 * @property {number} order_id    - NOT NULL — always tied to an order
 * @property {string} type        - 'earned' | 'redeemed'
 * @property {number} points      - positive integer
 * @property {string} created_at  - TIMESTAMPTZ ISO 8601
 */

// ─── Orders ──────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Order
 * @property {number}      id
 * @property {number}      session_id
 * @property {number}      employee_id
 * @property {number|null} customer_id
 * @property {number|null} table_id              - null for takeaway
 * @property {string}      order_type            - 'dine_in' | 'takeaway'
 * @property {string}      status                - 'draft' | 'sent' | 'paid' | 'cancelled'
 * @property {string}      subtotal              - DECIMAL(10,2) as string
 * @property {string}      tax_total             - DECIMAL(10,2) as string
 * @property {string}      discount_total        - DECIMAL(10,2) as string
 * @property {string}      tip                   - DECIMAL(10,2) as string DEFAULT "0.00"
 * @property {string}      total                 - DECIMAL(10,2) as string
 * @property {number}      loyalty_points_redeemed
 * @property {string}      loyalty_discount      - DECIMAL(10,2) as string
 * @property {string}      created_at            - TIMESTAMPTZ ISO 8601
 * @property {string}      updated_at            - TIMESTAMPTZ ISO 8601
 */

// ─── Order Items ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} OrderItem
 * @property {number}      id
 * @property {number}      order_id
 * @property {number}      product_id
 * @property {number}      quantity
 * @property {string}      unit_price          - DECIMAL(10,2) snapshot at time of order
 * @property {string}      line_total          - DECIMAL(10,2)
 * @property {string}      kds_status          - 'to_cook' | 'preparing' | 'completed'
 * @property {boolean}     is_item_completed   - item-level strikethrough
 * @property {number|null} assigned_cook_id
 * @property {string}      created_at          - TIMESTAMPTZ ISO 8601
 * @property {string}      updated_at          - TIMESTAMPTZ ISO 8601
 */

// ─── Payments ────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Payment
 * @property {number}      id
 * @property {number}      order_id
 * @property {string}      method                - 'cash' | 'card' | 'upi'
 * @property {string}      amount                - DECIMAL(10,2) as string
 * @property {string}      tip                   - DECIMAL(10,2) as string DEFAULT "0.00"
 * @property {string|null} transaction_reference - required when method = 'card'
 * @property {string}      created_at            - TIMESTAMPTZ ISO 8601
 */

// ─── Coupons ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Coupon
 * @property {number}  id
 * @property {string}  code            - VARCHAR(50) UNIQUE
 * @property {string}  discount_type   - 'percentage' | 'fixed'
 * @property {string}  discount_value  - DECIMAL(10,2) as string
 * @property {boolean} is_active
 * @property {string}  created_at      - TIMESTAMPTZ ISO 8601
 * @property {string}  updated_at      - TIMESTAMPTZ ISO 8601
 */

// ─── Promotions ──────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Promotion
 * @property {number}      id
 * @property {string}      name              - VARCHAR(150)
 * @property {string}      applies_to        - 'product' | 'order'
 * @property {number|null} product_id        - required when applies_to = 'product'
 * @property {number|null} min_quantity      - required when applies_to = 'product'
 * @property {string|null} min_order_amount  - DECIMAL(10,2), required when applies_to = 'order'
 * @property {string}      discount_type     - 'percentage' | 'fixed'
 * @property {string}      discount_value    - DECIMAL(10,2) as string
 * @property {Object}      rules             - JSONB full rule snapshot
 * @property {boolean}     is_active
 * @property {string}      created_at        - TIMESTAMPTZ ISO 8601
 * @property {string}      updated_at        - TIMESTAMPTZ ISO 8601
 */

// ─── Order Discounts ─────────────────────────────────────────────────────────

/**
 * @typedef {Object} OrderDiscount
 * @property {number}      id
 * @property {number}      order_id
 * @property {number|null} coupon_id     - null if applied via promotion
 * @property {number|null} promotion_id  - null if applied via coupon
 * @property {string}      discount_type   - 'percentage' | 'fixed'
 * @property {string}      discount_value  - DECIMAL(10,2) the rate/amount
 * @property {string}      applied_amount  - DECIMAL(10,2) actual ₹ deducted
 * @property {string}      created_at      - TIMESTAMPTZ ISO 8601
 */

// ─── Payment Method Settings ─────────────────────────────────────────────────

/**
 * @typedef {Object} PaymentMethodSetting
 * @property {number}      id
 * @property {string}      method      - 'cash' | 'card' | 'upi'
 * @property {boolean}     is_enabled
 * @property {string|null} upi_id      - only meaningful when method = 'upi'
 * @property {string}      updated_at  - TIMESTAMPTZ ISO 8601
 */

// ─── Cooks ───────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Cook
 * @property {number}  id
 * @property {string}  name        - VARCHAR(100)
 * @property {boolean} is_active
 * @property {string}  created_at  - TIMESTAMPTZ ISO 8601
 * @property {string}  updated_at  - TIMESTAMPTZ ISO 8601
 */

// ─── Cook Category Preferences ───────────────────────────────────────────────

/**
 * @typedef {Object} CookCategoryPreference
 * @property {number} id
 * @property {number} cook_id
 * @property {number} category_id
 */

// ─── App Settings ────────────────────────────────────────────────────────────

/**
 * @typedef {Object} AppSetting
 * @property {number} id
 * @property {string} key        - VARCHAR(100) UNIQUE e.g. 'loyalty_points_rate'
 * @property {string} value      - always a string; parse to number where needed
 * @property {string} updated_at - TIMESTAMPTZ ISO 8601
 */

export default {};
