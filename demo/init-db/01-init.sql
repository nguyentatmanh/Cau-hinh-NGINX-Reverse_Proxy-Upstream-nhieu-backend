-- ==============================================================================
-- HUCE - Hệ thống Server Nâng cao - Buổi 8 (Nhóm 8)
-- Script khởi tạo CSDL PostgreSQL cho ứng dụng HUCE Learning Store
-- (Cửa hàng Học liệu & Khóa học Công nghệ)
-- ==============================================================================

-- 1. Bảng sản phẩm (Sách & Khóa học)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    name VARCHAR(255), -- Giữ tương thích ngược với trường name cũ
    product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('book', 'course')),
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    cover_image VARCHAR(500) DEFAULT '/assets/placeholder.svg',
    image_url VARCHAR(500) DEFAULT '/assets/placeholder.svg', -- Tương thích ngược
    author VARCHAR(255),
    isbn VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    instructor VARCHAR(255),
    level VARCHAR(50),
    duration VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng đơn hàng (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'completed',
    processed_by_instance VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng chi tiết đơn hàng (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_title VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 4. Dữ liệu mẫu khởi tạo ban đầu (Idempotent Seed Data)
INSERT INTO products (title, name, product_type, price, description, cover_image, image_url, author, isbn, stock_quantity, instructor, level, duration)
VALUES 
    -- Sách công nghệ
    (
        'Giáo trình Thiết kế Hệ thống Phân tán & High Availability',
        'Giáo trình Thiết kế Hệ thống Phân tán & High Availability',
        'book',
        145000.00,
        'Tài liệu giảng dạy chính quy về kiến trúc cụm server, cân bằng tải NGINX, cơ chế chịu lỗi và tính sẵn sàng cao (HA).',
        '/assets/placeholder.svg',
        '/assets/placeholder.svg',
        'Bộ môn Hệ thống Thông tin - HUCE',
        '978-604-82-4123-1',
        25,
        NULL,
        NULL,
        NULL
    ),
    (
        'Quản trị Web Server NGINX & Reverse Proxy Toàn tập',
        'Quản trị Web Server NGINX & Reverse Proxy Toàn tập',
        'book',
        185000.00,
        'Cẩm nang từ cơ bản đến nâng cao: cấu hình Upstream, HTTP/HTTPS, SSL tự ký, kiểm soát body size và bảo mật header.',
        '/assets/placeholder.svg',
        '/assets/placeholder.svg',
        'Nguyễn Tất Mạnh',
        '978-604-82-5567-2',
        15,
        NULL,
        NULL,
        NULL
    ),
    (
        'Kiến trúc Microservices với Node.js & Docker',
        'Kiến trúc Microservices với Node.js & Docker',
        'book',
        210000.00,
        'Hướng dẫn thực hành xây dựng hệ thống phân tán, container hóa đa dịch vụ, quản lý trạng thái CSDL và mạng nội bộ Docker.',
        '/assets/placeholder.svg',
        '/assets/placeholder.svg',
        'Nguyễn Đức Mạnh',
        '978-604-82-9901-4',
        30,
        NULL,
        NULL,
        NULL
    ),
    (
        'Lập trình CSDL Nâng cao với PostgreSQL 16',
        'Lập trình CSDL Nâng cao với PostgreSQL 16',
        'book',
        165000.00,
        'Tối ưu hóa truy vấn, xử lý giao dịch ACID, khóa dòng (Row-level Locking) và bảo vệ tính nhất quán dữ liệu tồn kho.',
        '/assets/placeholder.svg',
        '/assets/placeholder.svg',
        'Đỗ Công Trí',
        '978-604-82-7744-8',
        8,
        NULL,
        NULL,
        NULL
    ),
    -- Khóa học công nghệ
    (
        'Khóa học NGINX Reverse Proxy & Upstream Nâng cao',
        'Khóa học NGINX Reverse Proxy & Upstream Nâng cao',
        'course',
        550000.00,
        'Khóa đào tạo chuyên sâu về kỹ thuật phân phối tải, cấu hình Keepalive, SSL Termination và nạp nóng không gián đoạn dịch vụ.',
        '/assets/placeholder.svg',
        '/assets/placeholder.svg',
        NULL,
        NULL,
        0,
        'TS. Nguyễn Đức Mạnh',
        'Nâng cao',
        '24 giờ (6 tuần)'
    ),
    (
        'Khóa học Triển khai Hệ thống Container với Docker Compose',
        'Khóa học Triển khai Hệ thống Container với Docker Compose',
        'course',
        750000.00,
        'Làm chủ Dockerfile tối ưu cho Node.js, mạng bridge, phân giải DNS nội bộ và gắn kết volume lưu trữ dữ liệu bền vững.',
        '/assets/placeholder.svg',
        '/assets/placeholder.svg',
        NULL,
        NULL,
        0,
        'ThS. Nguyễn Tất Mạnh',
        'Trung cấp',
        '36 giờ (8 tuần)'
    ),
    (
        'Khóa học Tối ưu hóa Web Server & An toàn Thông tin SSL/TLS',
        'Khóa học Tối ưu hóa Web Server & An toàn Thông tin SSL/TLS',
        'course',
        490000.00,
        'Thực hành cấu hình giao thức TLS 1.2/1.3, tạo chứng chỉ SAN, giải quyết rào cản CORS nội bộ và kiểm soát tải tệp tin.',
        '/assets/placeholder.svg',
        '/assets/placeholder.svg',
        NULL,
        NULL,
        0,
        'Kỹ sư Nguyễn Huy Hoàng',
        'Chuyên sâu',
        '18 giờ (4 tuần)'
    )
ON CONFLICT DO NOTHING;