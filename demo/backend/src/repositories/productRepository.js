/**
 * repositories/productRepository.js - Tầng Repository truy xuất dữ liệu
 * Tương tác trực tiếp với bảng 'products' trong PostgreSQL
 */
const { getPool, isDbConnected } = require('../config/db');

// Dữ liệu bộ nhớ dự phòng (phục vụ test offline khi chưa có container db)
let inMemoryProducts = [
    {
        id: 1,
        name: 'Máy chủ Dell PowerEdge R750',
        price: '85000000.00',
        description: 'Máy chủ 2U Rack cao cấp 2 socket Intel Xeon phục vụ ảo hóa và hạ tầng NGINX cluster.',
        image_url: '/assets/placeholder.png',
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Switch Quản lý Cisco Catalyst 24 Port',
        price: '18500000.00',
        description: 'Switch Layer 3 Gigabit hỗ trợ VLAN, LACP và định tuyến mạng doanh nghiệp.',
        image_url: '/assets/placeholder.png',
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        name: 'Ổ cứng SSD Enterprise NVMe 3.84TB',
        price: '12500000.00',
        description: 'SSD chuẩn U.2 PCIe Gen4 tốc độ đọc ghi 7000MB/s độ bền cao cho Database.',
        image_url: '/assets/placeholder.png',
        created_at: new Date().toISOString()
    },
    {
        id: 4,
        name: 'Thiết bị Cân bằng tải F5 BIG-IP',
        price: '150000000.00',
        description: 'Thiết bị phần cứng cân bằng tải chuyên dụng bảo mật L4-L7 cấp doanh nghiệp.',
        image_url: '/assets/placeholder.png',
        created_at: new Date().toISOString()
    }
];

class ProductRepository {
    async findAll() {
        if (isDbConnected()) {
            const pool = getPool();
            const res = await pool.query('SELECT id, name, price, description, image_url, created_at FROM products ORDER BY id ASC;');
            return res.rows;
        }
        return [...inMemoryProducts];
    }

    async findById(id) {
        const numId = parseInt(id, 10);
        if (isDbConnected()) {
            const pool = getPool();
            const res = await pool.query('SELECT id, name, price, description, image_url, created_at FROM products WHERE id = $1;', [numId]);
            return res.rows[0] || null;
        }
        return inMemoryProducts.find(p => p.id === numId) || null;
    }

    async create({ name, price, description, imageUrl }) {
        if (isDbConnected()) {
            const pool = getPool();
            const res = await pool.query(
                `INSERT INTO products (name, price, description, image_url)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, name, price, description, image_url, created_at;`,
                [name, price, description || '', imageUrl || '/assets/placeholder.png']
            );
            return res.rows[0];
        }

        const newId = inMemoryProducts.length > 0 ? Math.max(...inMemoryProducts.map(p => p.id)) + 1 : 1;
        const newProd = {
            id: newId,
            name,
            price: parseFloat(price).toFixed(2),
            description: description || '',
            image_url: imageUrl || '/assets/placeholder.png',
            created_at: new Date().toISOString()
        };
        inMemoryProducts.push(newProd);
        return newProd;
    }

    async updateImage(id, imageUrl) {
        const numId = parseInt(id, 10);
        if (isDbConnected()) {
            const pool = getPool();
            const res = await pool.query(
                'UPDATE products SET image_url = $1 WHERE id = $2 RETURNING *;',
                [imageUrl, numId]
            );
            return res.rows[0] || null;
        }
        const item = inMemoryProducts.find(p => p.id === numId);
        if (item) {
            item.image_url = imageUrl;
            return item;
        }
        return null;
    }
}

module.exports = new ProductRepository();
