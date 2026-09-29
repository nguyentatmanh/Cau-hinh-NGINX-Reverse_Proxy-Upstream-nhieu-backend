/**
 * config/db.js - Quản lý kết nối CSDL PostgreSQL với pg.Pool
 * Khởi tạo bảng và migration tự động cho HUCE Learning Store
 * Không sử dụng cơ chế in-memory fallback để đảm bảo tính nhất quán giữa api1 và api2
 */
const { Pool } = require('pg');

const dbConfig = {
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'product_db',
    user: process.env.DB_USER || 'app_user',
    password: process.env.DB_PASSWORD || 'secret_password',
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};

let pool = null;
let isConnected = false;

function getPool() {
    if (!pool) {
        pool = new Pool(dbConfig);
        pool.on('error', (err) => {
            console.error('[DB POOL ERROR] Lỗi kết nối PostgreSQL đột ngột:', err.message);
            isConnected = false;
        });
    }
    return pool;
}

/**
 * Kiểm tra kết nối CSDL và tạo bảng tự động nếu CSDL còn trống
 */
async function initDatabase() {
    const p = getPool();
    try {
        const client = await p.connect();
        console.log(`[DATABASE] Kết nối thành công tới PostgreSQL tại ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        isConnected = true;

        // 1. Tạo hoặc cập nhật bảng products
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                product_type VARCHAR(20) NOT NULL DEFAULT 'book' CHECK (product_type IN ('book', 'course')),
                price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
                description TEXT,
                cover_image VARCHAR(500) DEFAULT '/assets/placeholder.svg',
                image_url VARCHAR(500) DEFAULT '/assets/placeholder.svg',
                author VARCHAR(255),
                isbn VARCHAR(50),
                stock_quantity INTEGER DEFAULT 0,
                instructor VARCHAR(255),
                level VARCHAR(50),
                duration VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migration bảo toàn volume cũ
        await client.query(`
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

            UPDATE products SET title = name WHERE title IS NULL AND name IS NOT NULL;
            UPDATE products SET cover_image = image_url WHERE cover_image IS NULL AND image_url IS NOT NULL;
            UPDATE products SET name = title WHERE name IS NULL AND title IS NOT NULL;
        `);

        // 2. Tạo bảng orders
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
                status VARCHAR(50) DEFAULT 'completed',
                processed_by_instance VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Tạo bảng order_items
        await client.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER NOT NULL REFERENCES products(id),
                product_title VARCHAR(255) NOT NULL,
                unit_price NUMERIC(12, 2) NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                subtotal NUMERIC(12, 2) NOT NULL
            );
        `);

        // 4. Kiểm tra và nạp dữ liệu mẫu ban đầu nếu bảng đang rỗng
        const countRes = await client.query('SELECT COUNT(*) FROM products;');
        if (parseInt(countRes.rows[0].count, 10) === 0) {
            await client.query(`
                INSERT INTO products (title, name, product_type, price, description, cover_image, image_url, author, isbn, stock_quantity, instructor, level, duration)
                VALUES 
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
                    );
            `);
            console.log('[DATABASE] Đã nạp thành công 7 sản phẩm mẫu (Sách & Khóa học) vào PostgreSQL.');
        }

        client.release();
    } catch (err) {
        console.error(`[DATABASE LỖI] Không thể kết nối hoặc khởi tạo PostgreSQL: ${err.message}`);
        isConnected = false;
        // KHÔNG dùng fallback in-memory: ứng dụng phải báo lỗi nếu DB down để tránh phân mảnh dữ liệu giữa api1 và api2
    }
}

async function checkDbHealth() {
    try {
        const p = getPool();
        const client = await p.connect();
        await client.query('SELECT 1;');
        client.release();
        isConnected = true;
        return true;
    } catch (err) {
        isConnected = false;
        return false;
    }
}

function isDbConnected() {
    return isConnected;
}

module.exports = {
    getPool,
    initDatabase,
    checkDbHealth,
    isDbConnected
};
