/**
 * controllers/productController.js - Tầng Điều khiển Sản phẩm (Sách & Khóa học)
 * Xử lý danh mục, tìm kiếm, lọc, tạo mới, chỉnh sửa thông tin và thay ảnh bìa
 */
const productService = require('../services/productService');
const { checkDbHealth } = require('../config/db');

function createProductController(instanceId) {
    return {
        // GET /api/products?type=book|course&search=...
        async getProducts(req, res) {
            try {
                const { type, search } = req.query;
                const products = await productService.getAllProducts({ type, search });
                return res.status(200).json({
                    success: true,
                    instanceId,
                    total: products.length,
                    data: products,
                    serverTime: new Date().toISOString()
                });
            } catch (err) {
                return res.status(err.statusCode || 500).json({
                    success: false,
                    instanceId,
                    error: err.message
                });
            }
        },

        // GET /api/products/:id
        async getProductById(req, res) {
            try {
                const product = await productService.getProductById(req.params.id);
                return res.status(200).json({
                    success: true,
                    instanceId,
                    data: product
                });
            } catch (err) {
                return res.status(err.statusCode || 500).json({
                    success: false,
                    instanceId,
                    error: err.message
                });
            }
        },

        // POST /api/products
        async createProduct(req, res) {
            try {
                const newProduct = await productService.createProduct(req.body);
                return res.status(201).json({
                    success: true,
                    instanceId,
                    message: 'Tạo học liệu mới thành công.',
                    data: newProduct
                });
            } catch (err) {
                return res.status(err.statusCode || 500).json({
                    success: false,
                    instanceId,
                    error: err.message
                });
            }
        },

        // PATCH /api/products/:id
        async updateProduct(req, res) {
            try {
                const updated = await productService.updateProduct(req.params.id, req.body);
                return res.status(200).json({
                    success: true,
                    instanceId,
                    message: 'Cập nhật thông tin học liệu thành công.',
                    data: updated
                });
            } catch (err) {
                return res.status(err.statusCode || 500).json({
                    success: false,
                    instanceId,
                    error: err.message
                });
            }
        },

        // POST /api/products/:id/image  hoặc  POST /api/upload
        async uploadImage(req, res) {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        instanceId,
                        error: 'Không tìm thấy tệp tin được tải lên (Yêu cầu field: "image").'
                    });
                }

                // Đường dẫn URL ảnh để client truy cập qua NGINX reverse proxy
                const fileUrl = `/api/uploads/${req.file.filename}`;

                // Xác định productId từ params hoặc body
                const productId = req.params.id || req.body.productId;
                let updatedProduct = null;

                if (productId) {
                    updatedProduct = await productService.updateProductImage(productId, fileUrl);
                }

                return res.status(200).json({
                    success: true,
                    instanceId,
                    message: 'Tải và lưu trữ ảnh bìa thành công vào Volume dùng chung.',
                    file: {
                        filename: req.file.filename,
                        originalName: req.file.originalname,
                        sizeBytes: req.file.size,
                        sizeKB: (req.file.size / 1024).toFixed(2),
                        url: fileUrl
                    },
                    product: updatedProduct
                });
            } catch (err) {
                return res.status(err.statusCode || 500).json({
                    success: false,
                    instanceId,
                    error: err.message
                });
            }
        },

        // GET /api/info
        getInfo(req, res) {
            return res.status(200).json({
                instanceId,
                peerIp: req.socket.remoteAddress,
                headers: {
                    host: req.headers['host'] || null,
                    'x-real-ip': req.headers['x-real-ip'] || null,
                    'x-forwarded-for': req.headers['x-forwarded-for'] || null,
                    'x-forwarded-proto': req.headers['x-forwarded-proto'] || null
                },
                environment: {
                    appName: 'HUCE Learning Store',
                    nodeVersion: process.version,
                    platform: process.platform,
                    uptimeSeconds: Math.floor(process.uptime()),
                    dbHost: process.env.DB_HOST || 'db'
                }
            });
        },

        // GET /api/health
        async getHealth(req, res) {
            const isDbUp = await checkDbHealth();
            if (!isDbUp) {
                return res.status(503).json({
                    status: 'unhealthy',
                    instanceId,
                    database: 'disconnected',
                    error: 'Không thể kết nối tới cơ sở dữ liệu PostgreSQL.'
                });
            }

            return res.status(200).json({
                status: 'healthy',
                instanceId,
                database: 'connected',
                uptime: process.uptime()
            });
        }
    };
}

module.exports = {
    createProductController
};
