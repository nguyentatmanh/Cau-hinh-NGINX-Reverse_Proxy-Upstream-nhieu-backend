/**
 * server.js - Điểm khởi chạy Backend Service (Instance API) cho HUCE Learning Store
 * Kết nối CSDL và khởi động HTTP Server tại cổng 3000
 */
const { initDatabase } = require('./src/config/db');
const { createApp } = require('./src/app');

const PORT = parseInt(process.env.PORT || '3000', 10);
const INSTANCE_ID = process.env.INSTANCE_ID || 'api1';

async function bootstrap() {
    console.log(`=======================================================`);
    console.log(` Khởi động HUCE Learning Store Backend: [${INSTANCE_ID}]`);
    console.log(` Thời gian: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`=======================================================`);

    // Khởi tạo kết nối CSDL PostgreSQL & chạy migration
    await initDatabase();

    const app = createApp(INSTANCE_ID);

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[HTTP SERVER] Instance [${INSTANCE_ID}] đang lắng nghe tại cổng nội bộ ${PORT}`);
        console.log(`[ROUTING] Sẵn sàng phục vụ API: /api/products, /api/orders, /api/upload, /api/info, /api/health`);
    });
}

bootstrap().catch((err) => {
    console.error('[BOOTSTRAP FATAL ERROR]', err);
    process.exit(1);
});
