/**
 * repositories/orderRepository.js - Tầng Repository quản lý Đơn hàng
 * Xử lý giao dịch ACID, trừ tồn kho nguyên tử (Atomic Stock Decrement),
 * chụp ảnh giá (Price Snapshot) và ghi nhận instance xử lý
 */
const { getPool, isDbConnected } = require('../config/db');

class OrderRepository {
    _ensureDb() {
        if (!isDbConnected()) {
            const err = new Error('Cơ sở dữ liệu PostgreSQL hiện không khả dụng.');
            err.statusCode = 503;
            throw err;
        }
    }

    /**
     * Tạo đơn hàng trong một Transaction nguyên tử
     * @param {Object} param0 
     * @returns {Object} Đơn hàng kèm danh sách sản phẩm
     */
    async createOrderWithItems({ customerName, customerEmail, items, instanceId }) {
        this._ensureDb();
        const pool = getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN;');

            let totalAmount = 0;
            const processedItems = [];

            // Duyệt qua từng sản phẩm trong giỏ hàng
            for (const item of items) {
                const prodId = parseInt(item.productId || item.product_id, 10);
                const reqQty = parseInt(item.quantity, 10);

                if (!prodId || isNaN(prodId) || !reqQty || reqQty <= 0) {
                    const err = new Error('Sản phẩm hoặc số lượng đặt hàng không hợp lệ.');
                    err.statusCode = 400;
                    throw err;
                }

                // Khóa dòng sản phẩm để đảm bảo không bị race condition khi trừ tồn kho
                const prodRes = await client.query(
                    'SELECT id, title, product_type, price, stock_quantity FROM products WHERE id = $1 FOR UPDATE;',
                    [prodId]
                );

                if (prodRes.rows.length === 0) {
                    const err = new Error(`Không tìm thấy sản phẩm có mã ID #${prodId}.`);
                    err.statusCode = 404;
                    throw err;
                }

                const product = prodRes.rows[0];

                // Kiểm tra ràng buộc theo loại sản phẩm
                if (product.product_type === 'course') {
                    if (reqQty > 1) {
                        const err = new Error(`Khóa học "${product.title}" chỉ được đăng ký tối đa 1 suất mỗi đơn hàng.`);
                        err.statusCode = 400;
                        throw err;
                    }
                } else if (product.product_type === 'book') {
                    if (product.stock_quantity < reqQty) {
                        const err = new Error(
                            `Sách "${product.title}" không đủ số lượng tồn kho (Hiện còn: ${product.stock_quantity}, Yêu cầu: ${reqQty}).`
                        );
                        err.statusCode = 400;
                        throw err;
                    }

                    // Trừ tồn kho nguyên tử ngay trong transaction
                    await client.query(
                        'UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;',
                        [reqQty, prodId]
                    );
                }

                // Tính toán giá tiền từ database (không tin tưởng giá client gửi lên)
                const unitPrice = parseFloat(product.price);
                const subtotal = unitPrice * reqQty;
                totalAmount += subtotal;

                processedItems.push({
                    productId: product.id,
                    productTitle: product.title,
                    unitPrice,
                    quantity: reqQty,
                    subtotal
                });
            }

            // Tạo bản ghi đơn hàng
            const orderRes = await client.query(
                `INSERT INTO orders (customer_name, customer_email, total_amount, status, processed_by_instance)
                 VALUES ($1, $2, $3, 'completed', $4)
                 RETURNING id, customer_name, customer_email, total_amount, status, processed_by_instance, created_at;`,
                [customerName.trim(), customerEmail.trim(), totalAmount, instanceId]
            );

            const newOrder = orderRes.rows[0];

            // Tạo các bản ghi chi tiết đơn hàng
            for (const pItem of processedItems) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, product_title, unit_price, quantity, subtotal)
                     VALUES ($1, $2, $3, $4, $5, $6);`,
                    [newOrder.id, pItem.productId, pItem.productTitle, pItem.unitPrice, pItem.quantity, pItem.subtotal]
                );
            }

            await client.query('COMMIT;');

            newOrder.items = processedItems;
            return newOrder;
        } catch (err) {
            await client.query('ROLLBACK;');
            throw err;
        } finally {
            client.release();
        }
    }

    async findOrderById(id) {
        this._ensureDb();
        const numId = parseInt(id, 10);
        const pool = getPool();

        const orderRes = await pool.query(
            'SELECT id, customer_name, customer_email, total_amount, status, processed_by_instance, created_at FROM orders WHERE id = $1;',
            [numId]
        );

        if (orderRes.rows.length === 0) {
            return null;
        }

        const order = orderRes.rows[0];

        const itemsRes = await pool.query(
            'SELECT id, product_id, product_title, unit_price, quantity, subtotal FROM order_items WHERE order_id = $1 ORDER BY id ASC;',
            [numId]
        );

        order.items = itemsRes.rows;
        return order;
    }
}

module.exports = new OrderRepository();
