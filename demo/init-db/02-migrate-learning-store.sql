-- ==============================================================================
-- HUCE Learning Store - Script Migration CSDL (Không làm mất dữ liệu cũ)
-- ==============================================================================

-- Bổ sung các cột mới vào bảng products nếu chưa có
ALTER TABLE products ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'book';
ALTER TABLE products ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500) DEFAULT '/assets/placeholder.svg';
ALTER TABLE products ADD COLUMN IF NOT EXISTS author VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS isbn VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS instructor VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS level VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS duration VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Đồng bộ dữ liệu cũ sang các cột mới
UPDATE products SET title = name WHERE title IS NULL AND name IS NOT NULL;
UPDATE products SET cover_image = image_url WHERE cover_image IS NULL AND image_url IS NOT NULL;
UPDATE products SET name = title WHERE name IS NULL AND title IS NOT NULL;

-- Đảm bảo có bảng orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'completed',
    processed_by_instance VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Đảm bảo có bảng order_items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_title VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(12, 2) NOT NULL
);
