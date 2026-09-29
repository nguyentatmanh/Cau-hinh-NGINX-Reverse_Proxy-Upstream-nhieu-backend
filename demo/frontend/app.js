/**
 * app.js - Xử lý logic Frontend SPA, Router, API Calls & Kịch bản Thực hành NGINX
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. QUẢN LÝ TABS & SPA ROUTER
    // =========================================================================
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    function switchTab(tabId) {
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            // Nếu bấm vào tab danh sách sản phẩm thì cập nhật URL về '/'
            if (targetTab === 'tab-products') {
                if (window.location.pathname !== '/') {
                    history.pushState(null, '', '/');
                }
                showProductListView();
            }
            switchTab(targetTab);
        });
    });

    // =========================================================================
    // 2. SPA ROUTER: ĐỊNH TUYẾN ẢO & KIỂM CHỨNG TRY_FILES (BƯỚC 1)
    // =========================================================================
    const viewList = document.getElementById('view-product-list');
    const viewDetail = document.getElementById('view-product-detail');
    const btnBackToList = document.getElementById('btn-back-to-list');

    function showProductListView() {
        viewList.classList.remove('hidden');
        viewDetail.classList.add('hidden');
        loadProducts();
    }

    function showProductDetailView(productId) {
        viewList.classList.add('hidden');
        viewDetail.classList.remove('hidden');
        loadProductDetail(productId);
    }

    btnBackToList.addEventListener('click', () => {
        history.pushState(null, '', '/');
        showProductListView();
    });

    // Bắt sự kiện back/forward của trình duyệt
    window.addEventListener('popstate', handleLocationChange);

    function handleLocationChange() {
        const path = window.location.pathname;
        const match = path.match(/^\/products\/(\d+)$/);

        if (match) {
            switchTab('tab-products');
            showProductDetailView(match[1]);
        } else {
            // Mặc định ở trang chủ /
            showProductListView();
        }
    }

    // =========================================================================
    // 3. TẢI VÀ HIỂN THỊ DANH SÁCH SẢN PHẨM (GET /api/products)
    // =========================================================================
    const productsGrid = document.getElementById('products-grid');
    const btnRefresh = document.getElementById('btn-refresh-products');
    const listInstanceBadge = document.getElementById('list-instance-badge');
    const listTotalBadge = document.getElementById('list-total-badge');
    const listTimeBadge = document.getElementById('list-time-badge');

    async function loadProducts() {
        productsGrid.innerHTML = '<div class="loading-state">Đang gửi yêu cầu tới NGINX Gateway...</div>';
        try {
            const res = await fetch('/api/products');
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            // Cập nhật thông tin instance phản hồi
            listInstanceBadge.textContent = `Backend: ${data.instanceId || 'unknown'}`;
            listInstanceBadge.className = 'instance-badge';
            listTotalBadge.textContent = `${data.total || data.data.length} sản phẩm`;
            listTimeBadge.textContent = new Date().toLocaleTimeString('vi-VN');

            renderProducts(data.data || []);
        } catch (err) {
            productsGrid.innerHTML = `
                <div class="empty-state text-danger">
                    <b>Lỗi kết nối API:</b> ${err.message}<br>
                    <small>Hãy đảm bảo NGINX và Backend cluster đang chạy trên cổng 8080.</small>
                </div>
            `;
            listInstanceBadge.textContent = 'Lỗi kết nối';
            listInstanceBadge.className = 'instance-badge badge-neutral';
        }
    }

    function renderProducts(products) {
        if (!products || products.length === 0) {
            productsGrid.innerHTML = '<div class="empty-state">Chưa có sản phẩm nào trong CSDL PostgreSQL.</div>';
            return;
        }

        productsGrid.innerHTML = products.map(p => {
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price);
            const imgSrc = p.image_url || '/assets/placeholder.svg';
            return `
                <div class="product-card" data-id="${p.id}">
                    <img src="${imgSrc}" alt="${p.name}" class="product-thumb" onerror="this.src='/assets/placeholder.svg'">
                    <div class="product-body">
                        <h4 class="product-title">${p.name}</h4>
                        <div class="product-price">${formattedPrice}</div>
                        <p class="product-desc">${p.description || 'Không có mô tả chi tiết.'}</p>
                        <div class="product-footer">
                            <span class="code-span">ID: #${p.id}</span>
                            <button class="btn btn-sm btn-outline btn-view-detail" data-id="${p.id}">
                                Xem Chi tiết &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Gắn sự kiện click xem chi tiết (chuyển hướng SPA ảo)
        document.querySelectorAll('.btn-view-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                history.pushState(null, '', `/products/${id}`);
                showProductDetailView(id);
            });
        });
    }

    btnRefresh.addEventListener('click', loadProducts);

    // =========================================================================
    // 4. HIỂN THỊ CHI TIẾT SẢN PHẨM (GET /api/products/:id)
    // =========================================================================
    const detailCard = document.getElementById('product-detail-card');

    async function loadProductDetail(id) {
        detailCard.innerHTML = '<div class="loading-state">Đang tải chi tiết sản phẩm...</div>';
        try {
            const res = await fetch(`/api/products/${id}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            const p = data.data;
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price);
            const imgSrc = p.image_url || '/assets/placeholder.svg';
            const createdDate = p.created_at ? new Date(p.created_at).toLocaleString('vi-VN') : 'Mặc định';

            detailCard.innerHTML = `
                <div>
                    <img src="${imgSrc}" alt="${p.name}" class="detail-thumb" onerror="this.src='/assets/placeholder.svg'">
                </div>
                <div class="detail-info">
                    <h3>${p.name}</h3>
                    <div class="detail-price">${formattedPrice}</div>
                    <div class="detail-desc-box">
                        <b>Mô tả sản phẩm:</b>
                        <p style="margin-top: 0.5rem;">${p.description || 'Chưa có thông số chi tiết.'}</p>
                    </div>
                    <ul class="detail-meta-list">
                        <li><b>Mã định danh (ID):</b> #${p.id}</li>
                        <li><b>Ngày tạo:</b> ${createdDate}</li>
                        <li><b>Backend Instance xử lý:</b> <span class="instance-badge">${data.instanceId}</span></li>
                        <li><b>Đường dẫn URL hiện tại:</b> <code>/products/${p.id}</code> (SPA client routing)</li>
                    </ul>
                </div>
            `;
        } catch (err) {
            detailCard.innerHTML = `
                <div class="empty-state text-danger">
                    <b>Không thể tải chi tiết sản phẩm #${id}:</b> ${err.message}
                </div>
            `;
        }
    }

    // =========================================================================
    // 5. THÊM SẢN PHẨM MỚI (POST /api/products)
    // =========================================================================
    const formCreate = document.getElementById('form-create-product');
    const createResult = document.getElementById('create-result');

    formCreate.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-submit-product');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Đang lưu vào PostgreSQL...';

        const payload = {
            name: document.getElementById('prod-name').value,
            price: document.getElementById('prod-price').value,
            description: document.getElementById('prod-desc').value,
            imageUrl: document.getElementById('prod-image-url').value
        };

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            createResult.classList.remove('hidden');
            if (res.ok) {
                createResult.className = 'result-box alert-success';
                createResult.innerHTML = `
                    <b>Thành công!</b> Đã thêm sản phẩm ID #${data.data.id} vào PostgreSQL.<br>
                    Instance xử lý: <span class="instance-badge">${data.instanceId}</span>
                `;
                formCreate.reset();
            } else {
                createResult.className = 'result-box alert-danger';
                createResult.innerHTML = `<b>Lỗi:</b> ${data.error || 'Không thể tạo sản phẩm.'}`;
            }
        } catch (err) {
            createResult.classList.remove('hidden');
            createResult.className = 'result-box alert-danger';
            createResult.innerHTML = `<b>Lỗi mạng:</b> ${err.message}`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>💾 Lưu Sản phẩm</span>';
        }
    });

    // =========================================================================
    // 6. KIỂM THỬ GIỚI HẠN REQUEST BODY 413 & TẢI ẢNH (BƯỚC 5)
    // =========================================================================
    const uploadForm = document.getElementById('form-upload-image');
    const uploadFileInput = document.getElementById('upload-file');
    const fileSizeDisplay = document.getElementById('file-size-display');
    const uploadStatusBox = document.getElementById('upload-status-box');
    const btnGenSmall = document.getElementById('btn-gen-small');
    const btnGenLarge = document.getElementById('btn-gen-large');

    let currentUploadFile = null;

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    uploadFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            currentUploadFile = e.target.files[0];
            fileSizeDisplay.textContent = `Tệp đã chọn: ${currentUploadFile.name} (${formatBytes(currentUploadFile.size)})`;
        }
    });

    // Tạo payload nhị phân giả lập nhanh 500KB (< 1MB)
    btnGenSmall.addEventListener('click', () => {
        const size = 500 * 1024;
        const blob = new Blob([new Uint8Array(size)], { type: 'image/png' });
        currentUploadFile = new File([blob], 'sample_small_500kb.png', { type: 'image/png' });
        fileSizeDisplay.textContent = `Tệp giả lập: sample_small_500kb.png (500.00 KB - Hợp lệ < 1MB)`;
    });

    // Tạo payload nhị phân giả lập nhanh 2.5MB (> 1MB)
    btnGenLarge.addEventListener('click', () => {
        const size = Math.floor(2.5 * 1024 * 1024);
        const blob = new Blob([new Uint8Array(size)], { type: 'image/png' });
        currentUploadFile = new File([blob], 'sample_large_2.5mb.png', { type: 'image/png' });
        fileSizeDisplay.textContent = `Tệp giả lập: sample_large_2.5mb.png (2.50 MB - Vượt mức 1MB mặc định!)`;
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUploadFile) {
            alert('Vui lòng chọn tệp hoặc bấm nút tạo tệp mẫu trước!');
            return;
        }

        const sendBtn = document.getElementById('btn-send-upload');
        sendBtn.disabled = true;
        sendBtn.innerHTML = 'Đang gửi qua NGINX Gateway...';

        uploadStatusBox.className = 'upload-status-box';
        uploadStatusBox.innerHTML = '<div class="loading-state">Đang truyền tải request tới cổng 8080...</div>';

        const formData = new FormData();
        formData.append('image', currentUploadFile);
        const prodId = document.getElementById('upload-prod-id').value;
        if (prodId) formData.append('productId', prodId);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (res.status === 413) {
                // BẮT ĐÚNG LỖI 413 PAYLOAD TOO LARGE CỦA NGINX!
                uploadStatusBox.className = 'upload-status-box error';
                uploadStatusBox.innerHTML = `
                    <h4 style="color:#b91c1c; font-size:1.1rem; margin-bottom:0.5rem;">
                        🛑 HTTP 413 Payload Too Large (Bị chặn bởi NGINX!)
                    </h4>
                    <p><b>Giải thích kỹ thuật:</b> NGINX đang áp dụng chỉ thị mặc định <code>client_max_body_size 1m;</code>. Do request (${formatBytes(currentUploadFile.size)}) vượt quá 1 MB, NGINX lập tức đóng kết nối và trả về mã lỗi 413 mà không chuyển tiếp vào Backend!</p>
                    <p style="margin-top:0.5rem;"><b>Hành động tiếp theo:</b> Sửa <code>default.conf</code> thành <code>client_max_body_size 20m;</code>, chạy <code>docker compose exec proxy nginx -s reload</code> rồi bấm gửi lại!</p>
                `;
            } else if (res.ok) {
                const data = await res.json();
                uploadStatusBox.className = 'upload-status-box success';
                uploadStatusBox.innerHTML = `
                    <h4 style="color:#15803d; font-size:1.1rem; margin-bottom:0.5rem;">
                        ✔ HTTP 200 OK - Tải tệp lên Thành công!
                    </h4>
                    <p><b>Instance xử lý:</b> <span class="instance-badge">${data.instanceId}</span></p>
                    <p><b>Tên tệp đã lưu:</b> <code>${data.file.filename}</code> (${data.file.sizeKB} KB)</p>
                    <p><b>Đường dẫn tệp Shared:</b> <a href="${data.file.url}" target="_blank">${data.file.url}</a></p>
                    <div style="margin-top: 0.8rem;">
                        <img src="${data.file.url}" alt="Uploaded" style="max-height: 120px; border-radius: 4px; border: 1px solid #cbd5e1;" onerror="this.style.display='none'">
                    </div>
                `;
            } else {
                const text = await res.text();
                uploadStatusBox.className = 'upload-status-box error';
                uploadStatusBox.innerHTML = `<h4>HTTP ${res.status}</h4><pre>${text}</pre>`;
            }
        } catch (err) {
            uploadStatusBox.className = 'upload-status-box error';
            uploadStatusBox.innerHTML = `<b>Lỗi kết nối:</b> ${err.message}`;
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<span>🚀 Gửi Request Upload</span>';
        }
    });

    // =========================================================================
    // 7. CÂN BẰNG TẢI UPSTREAM ROUND-ROBIN (BƯỚC 3)
    // =========================================================================
    const btnTestLb = document.getElementById('btn-test-lb');
    const btnResetLb = document.getElementById('btn-reset-lb');
    const countApi1 = document.getElementById('count-api1');
    const countApi2 = document.getElementById('count-api2');
    const countTotal = document.getElementById('count-total');
    const pctApi1 = document.getElementById('pct-api1');
    const pctApi2 = document.getElementById('pct-api2');
    const lbLogBody = document.getElementById('lb-log-body');

    let stats = { api1: 0, api2: 0, total: 0 };
    let requestLogs = [];

    function updateStatsUI() {
        countApi1.textContent = stats.api1;
        countApi2.textContent = stats.api2;
        countTotal.textContent = stats.total;

        if (stats.total > 0) {
            pctApi1.textContent = Math.round((stats.api1 / stats.total) * 100) + '%';
            pctApi2.textContent = Math.round((stats.api2 / stats.total) * 100) + '%';
        } else {
            pctApi1.textContent = '0%';
            pctApi2.textContent = '0%';
        }
    }

    btnResetLb.addEventListener('click', () => {
        stats = { api1: 0, api2: 0, total: 0 };
        requestLogs = [];
        updateStatsUI();
        lbLogBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Đã xóa dữ liệu kiểm thử.</td></tr>';
    });

    btnTestLb.addEventListener('click', async () => {
        btnTestLb.disabled = true;
        btnTestLb.innerHTML = 'Đang gửi 10 request luân phiên...';

        for (let i = 1; i <= 10; i++) {
            const start = performance.now();
            try {
                // Thêm timestamp để tránh cache trình duyệt
                const res = await fetch(`/api/products?t=${Date.now()}_${i}`);
                const duration = Math.round(performance.now() - start);
                const data = await res.json();
                const instance = data.instanceId || res.headers.get('X-Backend-Instance') || 'unknown';

                if (instance === 'api1') stats.api1++;
                else if (instance === 'api2') stats.api2++;
                stats.total++;

                requestLogs.unshift({
                    seq: stats.total,
                    time: new Date().toLocaleTimeString('vi-VN'),
                    endpoint: '/api/products',
                    status: res.status,
                    instance,
                    duration: duration + ' ms'
                });
            } catch (err) {
                stats.total++;
                requestLogs.unshift({
                    seq: stats.total,
                    time: new Date().toLocaleTimeString('vi-VN'),
                    endpoint: '/api/products',
                    status: 'ERR',
                    instance: 'Fail: ' + err.message,
                    duration: '-'
                });
            }

            updateStatsUI();
            renderLbLogs();
            // Khoảng nghỉ nhỏ 100ms giữa các request để quan sát
            await new Promise(r => setTimeout(r, 120));
        }

        btnTestLb.disabled = false;
        btnTestLb.innerHTML = '<span>⚡ Gửi tiếp 10 Request tới Upstream</span>';
    });

    function renderLbLogs() {
        lbLogBody.innerHTML = requestLogs.slice(0, 15).map(log => {
            const badgeClass = log.instance === 'api1' ? 'instance-badge' : (log.instance === 'api2' ? 'instance-badge' : 'instance-badge badge-neutral');
            const statusClass = log.status === 200 ? 'color: #16a34a; font-weight: bold;' : 'color: #dc2626; font-weight: bold;';
            return `
                <tr>
                    <td><b>#${log.seq}</b></td>
                    <td>${log.time}</td>
                    <td><code>${log.endpoint}</code></td>
                    <td style="${statusClass}">HTTP ${log.status}</td>
                    <td><span class="${badgeClass}">${log.instance}</span></td>
                    <td>${log.duration}</td>
                </tr>
            `;
        }).join('');
    }

    // =========================================================================
    // 8. SOI FORWARDED HEADERS & ĐỊA CHỈ IP (GET /api/info)
    // =========================================================================
    const btnInspectHeaders = document.getElementById('btn-inspect-headers');
    const hdrPeerIp = document.getElementById('hdr-peer-ip');
    const hdrXRealIp = document.getElementById('hdr-x-real-ip');
    const hdrHost = document.getElementById('hdr-host');
    const hdrXForwardedFor = document.getElementById('hdr-x-forwarded-for');
    const hdrXForwardedProto = document.getElementById('hdr-x-forwarded-proto');
    const hdrInstanceId = document.getElementById('hdr-instance-id');

    async function inspectHeaders() {
        try {
            const res = await fetch('/api/info');
            const data = await res.json();

            hdrPeerIp.textContent = data.peerIp || 'Chưa xác định';
            hdrXRealIp.textContent = data.headers['x-real-ip'] || '(Chưa có - Cần NGINX reverse proxy)';
            hdrHost.textContent = data.headers['host'] || '(none)';
            hdrXForwardedFor.textContent = data.headers['x-forwarded-for'] || '(none)';
            hdrXForwardedProto.textContent = data.headers['x-forwarded-proto'] || '(none)';
            hdrInstanceId.textContent = data.instanceId || 'unknown';
        } catch (err) {
            hdrPeerIp.textContent = 'Lỗi kết nối';
            hdrXRealIp.textContent = err.message;
        }
    }

    btnInspectHeaders.addEventListener('click', inspectHeaders);

    // =========================================================================
    // KHỞI ĐỘNG BAN ĐẦU
    // =========================================================================
    handleLocationChange();
    inspectHeaders();
});
