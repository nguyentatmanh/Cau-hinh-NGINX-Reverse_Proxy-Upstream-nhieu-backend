/**
 * src/app.js - Cấu hình ứng dụng Express
 * Thiết lập Multer lưu ảnh, Middleware Header & Routing
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requestLogger } = require('./utils/logger');
const { createProductController } = require('./controllers/productController');

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
            const safeName = `prod_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
            cb(null, safeName);
        }
    });

    const upload = multer({
        storage,
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

    // Khởi tạo Controller
    const productController = createProductController(instanceId);

    // =========================================================================
    // API ROUTING (Khớp chính xác với proxy_pass http://backend_cluster;)
    // =========================================================================
    const apiRouter = express.Router();

    apiRouter.get('/products', productController.getProducts);
    apiRouter.get('/products/:id', productController.getProductById);
    apiRouter.post('/products', productController.createProduct);
    apiRouter.post('/upload', upload.single('image'), productController.uploadImage);
    apiRouter.get('/info', productController.getInfo);
    apiRouter.get('/health', productController.getHealth);

    // Phục vụ ảnh tĩnh đã tải lên từ thư mục dùng chung
    apiRouter.use('/uploads', express.static(uploadDir));

    app.use('/api', apiRouter);

    // Route kiểm tra ở root
    app.get('/', (req, res) => {
        res.send(`Backend instance [${instanceId}] is running. Please access API via /api/...`);
    });

    // Xử lý lỗi tập trung
    app.use((err, req, res, next) => {
        console.error(`[BACKEND ${instanceId} ERROR]`, err.message);
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                instanceId,
                error: `Lỗi tải file (Multer): ${err.message}`
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
