-- ============================================================
--  SEED DATA
--  Run with: npm run seed  (from /server)
--  Credentials: admin@odoocafe.com / admin123
--               cashier@odoocafe.com / admin123
-- ============================================================

-- Clean existing data in FK-safe order, reset sequences
TRUNCATE cook_category_preferences, cooks, payments, order_discounts,
         order_items, orders, sessions, loyalty_transactions, customers,
         tables, floors, products, categories, users, coupons, promotions
RESTART IDENTITY CASCADE;

-- ── 1. Users ──────────────────────────────────────────────────────────────────
-- password_hash is bcrypt of 'admin123' (cost 10)
INSERT INTO users (name, email, password_hash, role, is_active) VALUES
    ('Cafe Admin',   'admin@odoocafe.com',   '$2a$10$xbDQKSco4pS3CLAU.SZa3.0eKd0z5N3pEXQ67H4DN7/XC4GW2vNl2', 'admin',    TRUE),
    ('Cafe Cashier', 'cashier@odoocafe.com', '$2a$10$xbDQKSco4pS3CLAU.SZa3.0eKd0z5N3pEXQ67H4DN7/XC4GW2vNl2', 'employee', TRUE);

-- ── 2. Categories ─────────────────────────────────────────────────────────────
INSERT INTO categories (name, color) VALUES
    ('Coffee',     '#3E2723'),
    ('Tea',        '#81C784'),
    ('Pastries',   '#FFB74D'),
    ('Sandwiches', '#4FC3F7');

-- ── 3. Products ───────────────────────────────────────────────────────────────
INSERT INTO products (name, category_id, price, unit_of_measure, tax_rate, description, estimated_prep_time, show_on_kds, is_active) VALUES
    ('Espresso',          1, 120.00, 'piece',  5.00, 'Strong black coffee, pulled as a double shot.',             2, TRUE,  TRUE),
    ('Cappuccino',        1, 150.00, 'piece',  5.00, 'Espresso with equal parts steamed milk and thick foam.',    3, TRUE,  TRUE),
    ('Iced Latte',        1, 160.00, 'piece',  5.00, 'Cold espresso poured over fresh milk and ice.',             3, TRUE,  TRUE),
    ('Green Tea',         2,  90.00, 'piece',  5.00, 'Premium organic Japanese matcha-grade green tea.',          2, TRUE,  TRUE),
    ('Masala Chai',       2,  80.00, 'piece',  5.00, 'Spiced milk tea with ginger, cardamom, and cinnamon.',      3, TRUE,  TRUE),
    ('Butter Croissant',  3, 110.00, 'piece', 12.00, 'Flaky, buttery French puff pastry, baked fresh daily.',    1, TRUE,  TRUE),
    ('Chocolate Muffin',  3,  95.00, 'piece', 12.00, 'Double-chocolate muffin with melted chips inside.',         1, TRUE,  TRUE),
    ('Club Sandwich',     4, 180.00, 'piece', 12.00, 'Double-decker: grilled chicken, lettuce, tomato, mayo.',   5, TRUE,  TRUE);

-- ── 4. Floors & Tables (1 floor, 4 tables) ───────────────────────────────────
INSERT INTO floors (name) VALUES ('Ground Floor');

INSERT INTO tables (floor_id, table_number, seats, is_active) VALUES
    (1, 1, 2, TRUE),
    (1, 2, 4, TRUE),
    (1, 3, 4, TRUE),
    (1, 4, 6, TRUE);

-- ── 5. Cooks ──────────────────────────────────────────────────────────────────
INSERT INTO cooks (name, is_active) VALUES
    ('Chef Raj',    TRUE),
    ('Baker Priya', TRUE);

INSERT INTO cook_category_preferences (cook_id, category_id) VALUES
    (1, 1), -- Chef Raj     → Coffee
    (1, 2), -- Chef Raj     → Tea
    (1, 4), -- Chef Raj     → Sandwiches
    (2, 3); -- Baker Priya  → Pastries

-- ── 6. App Settings ───────────────────────────────────────────────────────────
DELETE FROM app_settings;
INSERT INTO app_settings (key, value) VALUES
    ('loyalty_points_rate',     '10'),          -- ₹10 spent = 1 point
    ('loyalty_redemption_rate', '1'),           -- 1 point  = ₹1 discount
    ('cafe_name',               'Odoo Cafe'),
    ('receipt_footer',          'Thank you for visiting Odoo Cafe!');

-- ── 7. Payment Method Settings ────────────────────────────────────────────────
DELETE FROM payment_method_settings;
INSERT INTO payment_method_settings (method, is_enabled, upi_id) VALUES
    ('cash', TRUE,  NULL),
    ('card', TRUE,  NULL),
    ('upi',  TRUE,  'odoocafe@ybl');

-- ── 8. Demo Coupons ───────────────────────────────────────────────────────────
INSERT INTO coupons (code, discount_type, discount_value, is_active) VALUES
    ('WELCOME10', 'percentage', 10.00, TRUE),
    ('FLAT50',    'fixed',      50.00, TRUE);
