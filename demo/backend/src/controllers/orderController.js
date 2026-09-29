/**
 * controllers/orderController.js - Tầng Điều khiển Đơn hàng
 * Xử lý yêu cầu tạo đơn và tra cứu đơn hàng giữa các Backend Instances
 */
const orderService = require('../services/orderService');

function createOrderController(instanceId) {
    return {
        // POST /api/orders
        async createOrder(req, res) {
            try {
                const { customerName, customerEmail, items } = req.body;
                const order = await orderService.createOrder({
                    customerName,
                    customerEmail,
                    items,
                    instanceId
                });

                return res.status(201).json({
                    success: true,
                    instanceId,
                    message: 'Đặt hàng thành công. Đơn hàng đã được lưu vào CSDL PostgreSQL.',
                    data: order
                });
            } catch (err) {
                return res.status(err.statusCode || 500).json({
                    success: false,
                    instanceId,
                    error: err.message
                });
            }
        },

        // GET /api/orders/:id
        async getOrderById(req, res) {
            try {
                const order = await orderService.getOrderById(req.params.id);
                return res.status(200).json({
                    success: true,
                    instanceId,
                    data: order
                });
            } catch (err) {
                return res.status(err.statusCode || 500).json({
                    success: false,
                    instanceId,
                    error: err.message
                });
            }
        }
    };
}

module.exports = {
    createOrderController
};
