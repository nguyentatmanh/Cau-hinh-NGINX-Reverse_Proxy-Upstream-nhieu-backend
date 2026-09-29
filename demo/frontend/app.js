document.addEventListener('DOMContentLoaded', () => {
    // 1. Hiển thị thông tin môi trường mạng client
    const currentOrigin = window.location.origin;
    const currentProto = window.location.protocol.replace(':', '').toUpperCase();
    const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');

    document.getElementById('currentOrigin').textContent = currentOrigin;
    document.getElementById('currentProto').textContent = currentProto;
    document.getElementById('currentPort').textContent = currentPort;

    // 2. Thử nghiệm 1: Gọi API sản phẩm 1 lần
    const btnFetchSingle = document.getElementById('btnFetchSingle');
    const productResults = document.getElementById('productResults');

    btnFetchSingle.addEventListener('click', async () => {
        productResults.innerHTML = '<span style="color:#94a3b8">Đang gửi request GET /api/products...</span>';
        try {
            const start = performance.now();
            const res = await fetch('/api/products');
            const latency = Math.round(performance.now() - start);

            if (!res.ok) {
                throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            const nodeBadge = data.instanceId === 'backend-1' ?
                '<span style="color:#60a5fa;font-weight:bold">backend-1</span>' :
                '<span style="color:#4ade80;font-weight:bold">backend-2</span>';

            let html = `<div style="margin-bottom:0.5rem">`;
            html += `<strong>HTTP ${res.status} OK</strong> | Phục vụ bởi: ${nodeBadge} (${latency}ms)<br>`;
            html += `Client IP nhận diện: <span style="color:#fbbf24">${data.clientIp}</span>`;
            html += `</div>`;

            html += `<table class="data-table"><thead><tr><th>ID</th><th>Tên sản phẩm</th><th>Giá (VNĐ)</th><th>Nhóm</th></tr></thead><tbody>`;
            data.data.forEach(p => {
                html += `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.price.toLocaleString('vi-VN')} đ</td><td>${p.category}</td></tr>`;
            });
            html += `</tbody></table>`;
            productResults.innerHTML = html;
        } catch (err) {
            productResults.innerHTML = `<span style="color:#f87171">Lỗi kết nối: ${err.message}</span>`;
        }
    });

    // 3. Thử nghiệm 2: Gửi liên tiếp 10 request để kiểm tra Load Balancing
    const btnFetchLoadBalance = document.getElementById('btnFetchLoadBalance');
    const lbSummary = document.getElementById('lbSummary');
    const countBe1 = document.getElementById('countBe1');
    const countBe2 = document.getElementById('countBe2');

    btnFetchLoadBalance.addEventListener('click', async () => {
        lbSummary.classList.remove('hidden');
        let c1 = 0, c2 = 0;
        countBe1.textContent = '0';
        countBe2.textContent = '0';
        productResults.innerHTML = '<span style="color:#94a3b8">Bắt đầu gửi 10 request liên tiếp...</span><br>';

        for (let i = 1; i <= 10; i++) {
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                if (data.instanceId === 'backend-1') c1++;
                if (data.instanceId === 'backend-2') c2++;

                countBe1.textContent = c1;
                countBe2.textContent = c2;

                const nodeTag = data.instanceId === 'backend-1' ?
                    '<span style="color:#60a5fa">backend-1</span>' :
                    '<span style="color:#4ade80">backend-2</span>';

                productResults.innerHTML += `Request #${i.toString().padStart(2, '0')}: Phục vụ bởi ${nodeTag} | X-Real-IP: ${data.clientIp}<br>`;
                productResults.scrollTop = productResults.scrollHeight;
            } catch (err) {
                productResults.innerHTML += `Request #${i}: <span style="color:#f87171">Lỗi: ${err.message}</span><br>`;
            }
        }
    });

    // 4. Thử nghiệm 3: Kiểm tra Header (GET /api/info)
    const btnCheckHeaders = document.getElementById('btnCheckHeaders');
    const headerResults = document.getElementById('headerResults');

    btnCheckHeaders.addEventListener('click', async () => {
        headerResults.innerHTML = '<span style="color:#94a3b8">Đang gửi GET /api/info...</span>';
        try {
            const res = await fetch('/api/info');
            const data = await res.json();
            headerResults.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        } catch (err) {
            headerResults.innerHTML = `<span style="color:#f87171">Lỗi: ${err.message}</span>`;
        }
    });

    // 5. Thử nghiệm 4: Giới hạn Request Body (413)
    const btnTestUpload = document.getElementById('btnTestUpload');
    const payloadSizeSelect = document.getElementById('payloadSizeSelect');
    const uploadResult = document.getElementById('uploadResult');

    btnTestUpload.addEventListener('click', async () => {
        const sizeBytes = parseInt(payloadSizeSelect.value, 10);
        const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
        uploadResult.innerHTML = `<span style="color:#94a3b8">Đang sinh payload dung lượng ${sizeMB} MB và gửi POST /api/upload...</span>`;

        try {
            // Tạo chuỗi giả lập đúng kích thước
            const payload = "X".repeat(sizeBytes);
            const start = performance.now();
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: payload
            });
            const latency = Math.round(performance.now() - start);

            if (res.status === 413) {
                uploadResult.innerHTML = `<div style="color:#f87171">` +
                    `<strong>❌ KẾT QUẢ: HTTP 413 Payload Too Large (${latency}ms)</strong><br>` +
                    `NGINX đã chặn request ngay tại Gateway do kích thước payload (${sizeMB} MB) ` +
                    `vượt quá ngưỡng 'client_max_body_size' (mặc định 1M). Request hoàn toàn không được gửi tới Backend!` +
                    `</div>`;
            } else if (res.ok) {
                const data = await res.json();
                uploadResult.innerHTML = `<div style="color:#4ade80">` +
                    `<strong>✔ KẾT QUẢ: HTTP 200 OK (${latency}ms)</strong><br>` +
                    `${data.message}<br>` +
                    `Số bytes backend tiếp nhận: ${data.bytesReceived.toLocaleString()} bytes.` +
                    `</div>`;
            } else {
                uploadResult.innerHTML = `<span style="color:#fbbf24">HTTP ${res.status}: ${res.statusText}</span>`;
            }
        } catch (err) {
            uploadResult.innerHTML = `<span style="color:#f87171">Lỗi gửi request: ${err.message}</span>`;
        }
    });
});
