/**
 * controllers/productController.js - Tầng Điều khiển (Controller)
 * Xử lý request, response, thiết lập mã trạng thái và trả kèm instanceId
 */
const productService = require('../services/productService');

function createProductController(instanceId) {
    return {
        // GET /api/products
        async getProducts(req, res) {
            try {
                const products = await productService.getAllProducts();
                return res.status(200).json({
                    success: true,
                    instanceId,
                    total: products.length,
                    data: products,
                    serverTime: new Date().toISOString()
                });
            } catch (err) {
                return res.status(500).json({
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
                const { name, price, description, imageUrl } = req.body;
                const newProduct = await productService.createProduct({
                    name,
                    price,
                    description,
                    imageUrl
                });
                return res.status(201).json({
                    success: true,
                    instanceId,
                    message: 'Tạo sản phẩm mới thành công.',
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

        // POST /api/upload
        async uploadImage(req, res) {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        instanceId,
                        error: 'Không tìm thấy tệp tin được tải lên (field name: "image").'
                    });
                }

                // Đường dẫn URL ảnh để client truy cập qua NGINX reverse proxy
                const fileUrl = `/api/uploads/${req.file.filename}`;

                // Nếu có productId gửi kèm thì cập nhật ảnh cho sản phẩm đó
                if (req.body.productId) {
                    await productService.updateProductImage(req.body.productId, fileUrl);
                }

                return res.status(200).json({
                    success: true,
                    instanceId,
                    message: 'Tải tệp tin ảnh lên thành công.',
                    file: {
                        filename: req.file.filename,
                        originalName: req.file.originalname,
                        sizeBytes: req.file.size,
                        sizeKB: (req.file.size / 1024).toFixed(2),
                        url: fileUrl
                    }
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
                    nodeVersion: process.version,
                    platform: process.platform,
                    uptimeSeconds: Math.floor(process.uptime()),
                    dbHost: process.env.DB_HOST || 'db'
                }
            });
        },

        // GET /api/health
        getHealth(req, res) {
            return res.status(200).json({
                status: 'healthy',
                instanceId,
                uptime: process.uptime()
            });
        }
    };
}

module.exports = {
    createProductController
};
