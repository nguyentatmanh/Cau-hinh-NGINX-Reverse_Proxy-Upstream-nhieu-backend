/**
 * services/orderService.js - Tầng Nghiệp vụ Đơn hàng
 * Kiểm tra tính hợp lệ của khách hàng và danh sách hàng hóa
 */
const orderRepository = require('../repositories/orderRepository');

class OrderService {
    async createOrder({ customerName, customerEmail, items, instanceId }) {
        if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
            const err = new Error('Họ và tên người đặt hàng không được để trống.');
            err.statusCode = 400;
            throw err;
        }

        if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
            const err = new Error('Địa chỉ email của khách hàng không hợp lệ.');
            err.statusCode = 400;
            throw err;
        }

        if (!Array.isArray(items) || items.length === 0) {
            const err = new Error('Đơn hàng phải chứa ít nhất một sản phẩm.');
            err.statusCode = 400;
            throw err;
        }

        return await orderRepository.createOrderWithItems({
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
            items,
            instanceId
        });
    }

    async getOrderById(id) {
        if (!id || isNaN(parseInt(id, 10))) {
            const err = new Error('Mã đơn hàng không hợp lệ.');
            err.statusCode = 400;
            throw err;
        }

        const order = await orderRepository.findOrderById(id);
        if (!order) {
            const err = new Error(`Không tìm thấy đơn hàng với mã ID #${id}.`);
            err.statusCode = 404;
            throw err;
        }

        return order;
    }
}

module.exports = new OrderService();
