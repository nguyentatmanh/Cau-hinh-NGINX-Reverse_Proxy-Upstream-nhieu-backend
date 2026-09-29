/**
 * repositories/productRepository.js - Tầng Repository truy xuất dữ liệu sản phẩm
 * Tương tác trực tiếp với bảng 'products' trong PostgreSQL
 * Không sử dụng in-memory fallback - đảm bảo tính toàn vẹn giữa các instance
 */
const { getPool, isDbConnected } = require('../config/db');

class ProductRepository {
    _ensureDb() {
        if (!isDbConnected()) {
            const err = new Error('Cơ sở dữ liệu PostgreSQL hiện không khả dụng. Không thể thực hiện truy vấn.');
            err.statusCode = 503;
            throw err;
        }
    }

    async findAll({ type, search } = {}) {
        this._ensureDb();
        const pool = getPool();
        const conditions = [];
        const params = [];

        if (type && (type === 'book' || type === 'course')) {
            params.push(type);
            conditions.push(`product_type = $${params.length}`);
        }

        if (search && search.trim()) {
            params.push(`%${search.trim()}%`);
            const idx = params.length;
            conditions.push(`(title ILIKE $${idx} OR COALESCE(author, '') ILIKE $${idx} OR COALESCE(instructor, '') ILIKE $${idx} OR description ILIKE $${idx} OR COALESCE(isbn, '') ILIKE $${idx})`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const query = `
            SELECT id, title, COALESCE(name, title) AS name, product_type, price, description,
                   COALESCE(cover_image, image_url) AS cover_image,
                   COALESCE(image_url, cover_image) AS image_url,
                   author, isbn, stock_quantity, instructor, level, duration,
                   created_at, updated_at
            FROM products
            ${whereClause}
            ORDER BY id ASC;
        `;

        const res = await pool.query(query, params);
        return res.rows;
    }

    async findById(id) {
        this._ensureDb();
        const numId = parseInt(id, 10);
        const pool = getPool();
        const query = `
            SELECT id, title, COALESCE(name, title) AS name, product_type, price, description,
                   COALESCE(cover_image, image_url) AS cover_image,
                   COALESCE(image_url, cover_image) AS image_url,
                   author, isbn, stock_quantity, instructor, level, duration,
                   created_at, updated_at
            FROM products
            WHERE id = $1;
        `;
        const res = await pool.query(query, [numId]);
        return res.rows[0] || null;
    }

    async create({ title, product_type, price, description, cover_image, author, isbn, stock_quantity, instructor, level, duration }) {
        this._ensureDb();
        const pool = getPool();
        const finalTitle = title.trim();
        const finalType = product_type || 'book';
        const finalImg = cover_image || '/assets/placeholder.svg';
        const finalStock = finalType === 'course' ? 0 : (parseInt(stock_quantity, 10) || 0);

        const query = `
            INSERT INTO products (
                title, name, product_type, price, description, cover_image, image_url,
                author, isbn, stock_quantity, instructor, level, duration
            )
            VALUES ($1, $1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, title, name, product_type, price, description, cover_image, image_url,
                      author, isbn, stock_quantity, instructor, level, duration, created_at, updated_at;
        `;
        const params = [
            finalTitle,
            finalType,
            price,
            description || '',
            finalImg,
            author || null,
            isbn || null,
            finalStock,
            instructor || null,
            level || null,
            duration || null
        ];

        const res = await pool.query(query, params);
        return res.rows[0];
    }

    async update(id, fields) {
        this._ensureDb();
        const numId = parseInt(id, 10);
        const pool = getPool();

        const updates = [];
        const params = [];

        const allowedFields = [
            'title', 'price', 'description', 'cover_image', 'author',
            'isbn', 'stock_quantity', 'instructor', 'level', 'duration', 'product_type'
        ];

        for (const key of allowedFields) {
            if (fields[key] !== undefined) {
                params.push(fields[key]);
                updates.push(`${key} = $${params.length}`);

                // Đồng bộ title <-> name và cover_image <-> image_url
                if (key === 'title') {
                    params.push(fields[key]);
                    updates.push(`name = $${params.length}`);
                }
                if (key === 'cover_image') {
                    params.push(fields[key]);
                    updates.push(`image_url = $${params.length}`);
                }
            }
        }

        if (updates.length === 0) {
            return await this.findById(numId);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(numId);
        const idIdx = params.length;

        const query = `
            UPDATE products
            SET ${updates.join(', ')}
            WHERE id = $${idIdx}
            RETURNING id, title, name, product_type, price, description, cover_image, image_url,
                      author, isbn, stock_quantity, instructor, level, duration, created_at, updated_at;
        `;

        const res = await pool.query(query, params);
        return res.rows[0] || null;
    }

    async updateCoverImage(id, imageUrl) {
        return await this.update(id, { cover_image: imageUrl });
    }
}

module.exports = new ProductRepository();
