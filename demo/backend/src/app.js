/**
 * src/app.js - Cấu hình ứng dụng Express cho HUCE Learning Store
 * Thiết lập Multer lưu ảnh, Middleware Header & Routing
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requestLogger } = require('./utils/logger');
const { createProductController } = require('./controllers/productController');
const { createOrderController } = require('./controllers/orderController');

function createApp(instanceId) {
    const app = express();

    // Thư mục lưu trữ tệp tin upload (dùng chung qua Docker Shared Volume)
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Cấu hình Multer lưu ảnh vào đĩa với hạn mức 25MB
    // (Đảm bảo backend không chặn trước mà để NGINX 413 kiểm soát hạn mức 1m / 20m)
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase() || '.png';
            const safeName = `cover_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
            cb(null, safeName);
        }
    });

    const fileFilter = (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype.toLowerCase())) {
            cb(null, true);
        } else {
            const err = new Error('Chỉ chấp nhận các định dạng ảnh hợp lệ: PNG, JPEG, WEBP, GIF.');
            err.statusCode = 400;
            cb(err, false);
        }
    };

    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: 25 * 1024 * 1024 // 25 MB
        }
    });

    // Body Parsers (cho phép JSON payload lớn lên tới 25MB)
    app.use(express.json({ limit: '25mb' }));
    app.use(express.urlencoded({ extended: true, limit: '25mb' }));

    // Middleware gán Header định danh Instance cho mọi phản hồi
    app.use((req, res, next) => {
        res.setHeader('X-Backend-Instance', instanceId);
        next();
    });

    // Ghi log chi tiết mỗi request
    app.use(requestLogger(instanceId));

    // Khởi tạo Controllers
    const productController = createProductController(instanceId);
    const orderController = createOrderController(instanceId);

    // =========================================================================
    // API ROUTING (Khớp chính xác với proxy_pass http://backend_cluster;)
    // =========================================================================
    const apiRouter = express.Router();

    // 1. Tuyến đường Sản phẩm (Học liệu & Khóa học)
    apiRouter.get('/products', productController.getProducts);
    apiRouter.get('/products/:id', productController.getProductById);
    apiRouter.post('/products', productController.createProduct);
    apiRouter.patch('/products/:id', productController.updateProduct);
    apiRouter.post('/products/:id/image', upload.single('image'), productController.uploadImage);
    apiRouter.post('/upload', upload.single('image'), productController.uploadImage);

    // 2. Tuyến đường Đơn hàng (Giỏ hàng & Đặt hàng)
    apiRouter.post('/orders', orderController.createOrder);
    apiRouter.get('/orders/:id', orderController.getOrderById);

    // 3. Tuyến đường Giám sát & Chẩn đoán
    apiRouter.get('/info', productController.getInfo);
    apiRouter.get('/health', productController.getHealth);

    // 4. Phục vụ ảnh tĩnh đã tải lên từ thư mục dùng chung
    apiRouter.use('/uploads', express.static(uploadDir));

    app.use('/api', apiRouter);

    // Route kiểm tra ở root
    app.get('/', (req, res) => {
        res.send(`HUCE Learning Store - Backend instance [${instanceId}] is running. Please access API via /api/...`);
    });

    // Xử lý lỗi tập trung
    app.use((err, req, res, next) => {
        console.error(`[BACKEND ${instanceId} ERROR]`, err.message);
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                instanceId,
                error: `Lỗi tải file ảnh (Multer): ${err.message}`
            });
        }
        res.status(err.statusCode || 500).json({
            success: false,
            instanceId,
            error: err.message || 'Lỗi máy chủ nội bộ.'
        });
    });

    return app;
}

module.exports = {
    createApp
};
