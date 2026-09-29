/**
 * Server Backend Node.js minh họa cho Buổi 8 - Nhóm 7
 * Cổng lắng nghe nội bộ: 3000
 * Không phụ thuộc thư viện ngoài (sử dụng thư viện chuẩn 'http' của Node.js)
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || 'backend-dev';

// Danh mục sản phẩm minh họa bài toán nghiệp vụ thực tế
const PRODUCTS = [
    { id: 1, name: "Khóa học NGINX Reverse Proxy Chuyên sâu", price: 450000, category: "DevOps" },
    { id: 2, name: "Giáo trình Docker & Docker Compose Nâng cao", price: 380000, category: "Infrastructure" },
    { id: 3, name: "Thực hành Triển khai Cụm Microservices High Availability", price: 520000, category: "System Architecture" },
    { id: 4, name: "Sổ tay Bảo mật Mạng & Quản trị Chứng chỉ SSL/TLS", price: 290000, category: "Security" }
];

const server = http.createServer((req, res) => {
    // Thu thập các Proxy Header do NGINX chuyển tiếp
    const xRealIp = req.headers['x-real-ip'] || null;
    const xForwardedFor = req.headers['x-forwarded-for'] || null;
    const hostHeader = req.headers['host'] || null;
    const directPeerIp = req.socket.remoteAddress;

    // Ghi log định dạng rõ ràng để quan sát trong container log
    console.log(`[${new Date().toISOString()}] [Node: ${INSTANCE_ID}] ${req.method} ${req.url}`);
    console.log(`  -> Peer IP (NGINX container): ${directPeerIp}`);
    console.log(`  -> X-Real-IP: ${xRealIp || '(không có - kết nối trực tiếp)'}`);
    console.log(`  -> X-Forwarded-For: ${xForwardedFor || '(không có)'}`);
    console.log(`  -> Host Header: ${hostHeader}`);

    // Thiết lập header mặc định
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Served-By', INSTANCE_ID);

    // 1. Endpoint lấy danh sách sản phẩm
    if (req.method === 'GET' && (req.url === '/api/products' || req.url === '/api/products/')) {
        res.statusCode = 200;
        return res.end(JSON.stringify({
            success: true,
            instanceId: INSTANCE_ID,
            clientIp: xRealIp || directPeerIp,
            proxyDetails: {
                xRealIp: xRealIp,
                xForwardedFor: xForwardedFor,
                directPeerIp: directPeerIp,
                host: hostHeader
            },
            total: PRODUCTS.length,
            data: PRODUCTS,
            timestamp: new Date().toISOString()
        }, null, 2));
    }

    // 2. Endpoint lấy thông tin định danh máy chủ & Proxy headers
    if (req.method === 'GET' && req.url === '/api/info') {
        res.statusCode = 200;
        return res.end(JSON.stringify({
            success: true,
            instanceId: INSTANCE_ID,
            nodeVersion: process.version,
            serverTime: new Date().toISOString(),
            headersReceived: req.headers
        }, null, 2));
    }

    // 3. Endpoint nhận tải lên dữ liệu (dùng để kiểm thử mã lỗi 413)
    if (req.method === 'POST' && req.url === '/api/upload') {
        let bytesReceived = 0;
        req.on('data', chunk => {
            bytesReceived += chunk.length;
        });
        req.on('end', () => {
            console.log(`  -> Upload hoàn tất: đã nhận ${bytesReceived} bytes`);
            res.statusCode = 200;
            return res.end(JSON.stringify({
                success: true,
                message: `Backend [${INSTANCE_ID}] đã tiếp nhận payload thành công!`,
                bytesReceived: bytesReceived,
                timestamp: new Date().toISOString()
            }, null, 2));
        });
        return;
    }

    // 4. Healthcheck
    if (req.method === 'GET' && (req.url === '/api/health' || req.url === '/health')) {
        res.statusCode = 200;
        return res.end(JSON.stringify({ status: 'UP', instanceId: INSTANCE_ID }));
    }

    // Mặc định: 404 cho các route không khớp
    res.statusCode = 404;
    res.end(JSON.stringify({
        error: "Route không tồn tại trên backend",
        path: req.url,
        instanceId: INSTANCE_ID
    }));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=== BACKEND INSTANCE [${INSTANCE_ID}] ĐÃ KHỞI ĐỘNG ===`);
    console.log(`Lắng nghe tại: http://0.0.0.0:${PORT}`);
});
