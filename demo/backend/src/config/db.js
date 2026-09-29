/**
 * config/db.js - Quản lý kết nối CSDL PostgreSQL với pg.Pool
 * Tự động kiểm tra kết nối và khởi tạo bảng nếu cần
 */
const { Pool } = require('pg');

const dbConfig = {
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'product_db',
    user: process.env.DB_USER || 'app_user',
    password: process.env.DB_PASSWORD || 'secret_password',
    max: 10,
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

        // Đảm bảo bảng products tồn tại
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
                description TEXT,
                image_url VARCHAR(500) DEFAULT '/assets/placeholder.png',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Đảm bảo có dữ liệu mẫu ban đầu
        const countRes = await client.query('SELECT COUNT(*) FROM products;');
        if (parseInt(countRes.rows[0].count, 10) === 0) {
            await client.query(`
                INSERT INTO products (name, price, description, image_url)
                VALUES 
                    ('Máy chủ Dell PowerEdge R750', 85000000.00, 'Máy chủ 2U Rack cao cấp phục vụ NGINX Cluster.', '/assets/placeholder.png'),
                    ('Switch Cisco Catalyst 24 Port', 18500000.00, 'Switch Layer 3 Gigabit hỗ trợ VLAN, LACP.', '/assets/placeholder.png'),
                    ('SSD Enterprise NVMe 3.84TB', 12500000.00, 'SSD PCIe Gen4 tốc độ cao cho Database.', '/assets/placeholder.png');
            `);
            console.log('[DATABASE] Đã nạp dữ liệu mẫu ban đầu vào bảng products.');
        }
        client.release();
    } catch (err) {
        console.warn(`[DATABASE CẢNH BÁO] Không thể kết nối tới PostgreSQL (${err.message}). Chuyển sang cơ chế lưu trữ bộ nhớ dự phòng (In-Memory Fallback).`);
        isConnected = false;
    }
}

function isDbConnected() {
    return isConnected;
}

module.exports = {
    getPool,
    initDatabase,
    isDbConnected
};
