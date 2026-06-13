-- ============================================================
--  SEED DATA
-- ============================================================

-- Clean any existing seed data (ordered by dependency)
TRUNCATE cook_category_preferences, cooks, payments, order_items, orders,
         sessions, loyalty_transactions, customers, tables, floors,
         products, categories, users, coupons, promotions CASCADE;

-- 1. Users
-- password_hash is for 'admin123'
INSERT INTO users (name, email, password_hash, role, is_active) VALUES
    ('Cafe Admin', 'admin@odoocafe.com', '$2a$10$tMh4E/P.w/Z/HlyfA8n4tOVzO3e5wG9j8Lp9fPzVnU3D0C7v6R4/O', 'admin', TRUE),
    ('Cafe Cashier', 'cashier@odoocafe.com', '$2a$10$tMh4E/P.w/Z/HlyfA8n4tOVzO3e5wG9j8Lp9fPzVnU3D0C7v6R4/O', 'employee', TRUE);

-- 2. Categories
INSERT INTO categories (name, color) VALUES
    ('Coffee', '#3E2723'),
    ('Tea', '#81C784'),
    ('Pastries', '#FFB74D'),
    ('Sandwiches', '#4FC3F7');

-- 3. Products
INSERT INTO products (name, category_id, price, unit_of_measure, tax_rate, description, estimated_prep_time, show_on_kds, is_active) VALUES
    ('Espresso', 1, 120.00, 'piece', 5.00, 'Strong black coffee made by forcing steam under pressure through ground coffee beans.', 2, TRUE, TRUE),
    ('Cappuccino', 1, 150.00, 'piece', 5.00, 'Traditional espresso with steamed milk foam.', 3, TRUE, TRUE),
    ('Iced Latte', 1, 160.00, 'piece', 5.00, 'Chilled espresso with fresh milk over ice.', 3, TRUE, TRUE),
    ('Green Tea', 2, 90.00, 'piece', 5.00, 'Premium organic Japanese green tea.', 2, TRUE, TRUE),
    ('Butter Croissant', 3, 110.00, 'piece', 12.00, 'Flaky, buttery French puff pastry.', 1, TRUE, TRUE),
    ('Chocolate Muffin', 3, 95.00, 'piece', 12.00, 'Double chocolate muffin with melted chocolate chips.', 1, TRUE, TRUE),
    ('Club Sandwich', 4, 180.00, 'piece', 12.00, 'Classic double-decker sandwich with chicken, lettuce, tomato, and mayo.', 5, TRUE, TRUE),
    ('Premium Coffee Beans', 1, 650.00, 'kg', 18.00, 'Whole bean roasted Arabica beans for home brewing.', NULL, FALSE, TRUE);

-- 4. Floors
INSERT INTO floors (name) VALUES
    ('Ground Floor'),
    ('First Floor');

-- 5. Tables
INSERT INTO tables (floor_id, table_number, seats, is_active) VALUES
    (1, 1, 2, TRUE),
    (1, 2, 4, TRUE),
    (1, 3, 4, TRUE),
    (1, 4, 6, TRUE),
    (2, 5, 2, TRUE),
    (2, 6, 4, TRUE),
    (2, 7, 8, TRUE);

-- 6. Cooks
INSERT INTO cooks (name, is_active) VALUES
    ('Chef Raj', TRUE),
    ('Baker Priya', TRUE);

-- 7. Cook Category Preferences
INSERT INTO cook_category_preferences (cook_id, category_id) VALUES
    (1, 1), -- Chef Raj prefers Coffee
    (1, 2), -- Chef Raj prefers Tea
    (1, 4), -- Chef Raj prefers Sandwiches
    (2, 3); -- Baker Priya prefers Pastries

-- 8. Customers
INSERT INTO customers (name, email, phone, address, loyalty_points) VALUES
    ('John Doe', 'john@example.com', '9876543210', '123, Park Avenue, Bengaluru', 120),
    ('Jane Smith', 'jane@example.com', '9876543211', '456, Lake View Road, Bengaluru', 40),
    ('Anonymous Walkin', NULL, NULL, NULL, 0);

-- 9. Coupons
INSERT INTO coupons (code, discount_type, discount_value, is_active) VALUES
    ('WELCOME10', 'percentage', 10.00, TRUE),
    ('FLAT50', 'fixed', 50.00, TRUE),
    ('EXPIRED20', 'percentage', 20.00, FALSE);

-- 10. Promotions
INSERT INTO promotions (name, applies_to, product_id, min_quantity, min_order_amount, discount_type, discount_value, rules, is_active) VALUES
    ('Buy 2 Croissants, Get 20 Off', 'product', 5, 2, NULL, 'fixed', 20.00, '{"description": "Buy 2 Butter Croissants and receive a flat ₹20 discount on the pastry line items."}', TRUE),
    ('Grand Opening 5% Off', 'order', NULL, NULL, 500.00, 'percentage', 5.00, '{"description": "Flat 5% discount on orders totaling ₹500 or more (before tax/discounts)."}', TRUE);

-- Re-establish PMS and App Settings (ensuring clean initial entries in case of truncations)
DELETE FROM payment_method_settings;
INSERT INTO payment_method_settings (method, is_enabled, upi_id) VALUES
    ('cash',  TRUE,  NULL),
    ('card',  TRUE,  NULL),
    ('upi',   TRUE,  'odoocafe@ybl');

DELETE FROM app_settings;
INSERT INTO app_settings (key, value) VALUES
    ('loyalty_points_rate',     '10'),           -- ₹10 spent = 1 point earned
    ('loyalty_redemption_rate', '1'),            -- 1 point = ₹1 discount at redemption
    ('cafe_name',               'Odoo Cafe'),    -- used in UPI deep-link pn parameter
    ('receipt_footer',          'Thank you for visiting Odoo Cafe!');
