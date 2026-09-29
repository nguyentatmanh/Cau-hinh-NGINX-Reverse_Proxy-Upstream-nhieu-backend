/**
 * app.js - HUCE Learning Store Frontend
 * SPA Router, Storefront Catalog, Cart & Checkout, Admin Management, NGINX Diagnostics
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 0. TIỆN ÍCH AN TOÀN & ĐỊNH DẠNG (UTILITIES)
    // =========================================================================
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatVND(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // Active Backend Instance Indicator
    const activeInstancePill = document.getElementById('active-instance-pill');
    const activeInstanceText = document.getElementById('active-instance-text');

    function updateActiveInstance(instanceId) {
        if (!instanceId) return;
        activeInstanceText.textContent = `Backend: ${instanceId}`;
        activeInstancePill.className = `active-instance-badge node-${instanceId}`;
    }

    // =========================================================================
    // 1. QUẢN LÝ TABS & SPA CLIENT ROUTER
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
            if (targetTab === 'tab-store') {
                if (window.location.pathname !== '/') {
                    history.pushState(null, '', '/');
                }
                showCatalogView();
            } else if (targetTab === 'tab-manage') {
                loadAdminProductsTable();
            } else if (targetTab === 'tab-diagnostics') {
                inspectHeaders();
            }
            switchTab(targetTab);
        });
    });

    // =========================================================================
    // 2. SPA ROUTER: ĐỊNH TUYẾN ẢO & THỬ NGHIỆM TRY_FILES (BƯỚC 1)
    // =========================================================================
    const viewList = document.getElementById('view-product-list');
    const viewDetail = document.getElementById('view-product-detail');
    const btnBackToCatalog = document.getElementById('btn-back-to-catalog');
    const staticBanner = document.getElementById('static-mode-banner');

    function showCatalogView() {
        viewList.classList.remove('hidden');
        viewDetail.classList.add('hidden');
        loadCatalog();
    }

    function showDetailView(productId) {
        viewList.classList.add('hidden');
        viewDetail.classList.remove('hidden');
        loadProductDetail(productId);
    }

    btnBackToCatalog.addEventListener('click', () => {
        history.pushState(null, '', '/');
        showCatalogView();
    });

    window.addEventListener('popstate', handleLocationChange);

    function handleLocationChange() {
        const path = window.location.pathname;
        const match = path.match(/^\/products\/(\d+)$/);

        if (match) {
            switchTab('tab-store');
            showDetailView(match[1]);
        } else {
            showCatalogView();
        }
    }

    // =========================================================================
    // 3. CATALOG CỬA HÀNG: TÌM KIẾM, LỌC & HIỂN THỊ (GET /api/products)
    // =========================================================================
    const productsGrid = document.getElementById('products-grid');
    const filterPills = document.querySelectorAll('.filter-pill');
    const searchInput = document.getElementById('search-input');
    const btnSearch = document.getElementById('btn-search');

    let currentFilter = 'all';
    let currentSearch = '';

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter;
            loadCatalog();
        });
    });

    btnSearch.addEventListener('click', () => {
        currentSearch = searchInput.value.trim();
        loadCatalog();
    });

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            currentSearch = searchInput.value.trim();
            loadCatalog();
        }
    });

    async function loadCatalog() {
        productsGrid.innerHTML = '<div class="loading-state">Đang tải danh mục học liệu từ CSDL PostgreSQL...</div>';

        let url = '/api/products?';
        if (currentFilter !== 'all') url += `type=${encodeURIComponent(currentFilter)}&`;
        if (currentSearch) url += `search=${encodeURIComponent(currentSearch)}&`;

        try {
            const res = await fetch(url);
            const instanceHeader = res.headers.get('X-Backend-Instance');

            // Xử lý chế độ Web Server Tĩnh thuần túy (Bước 1 Đề cương - NGINX chưa mở proxy /api/)
            if (res.status === 404 || res.status === 502) {
                staticBanner.classList.remove('hidden');
                productsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; background: #ffffff; border-radius: var(--radius); border: 1px solid var(--border-color);">
                        <h3 style="color: var(--primary); margin-bottom: 0.5rem;">NGINX Đang Ở Chế độ Web Server Tĩnh (Bước 1)</h3>
                        <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto 1.5rem;">
                            Tệp giao diện tĩnh và SPA Routing (try_files) đang hoạt động hoàn hảo. Cổng API <code>/api/</code> chưa được mở qua Reverse Proxy.
                        </p>
                        <p style="font-size: 0.9rem;">
                            💡 Để kiểm chứng Bước 1: Hãy nhấn vào nút bên dưới để mở trang chi tiết, sau đó nhấn <b>F5 (Reload)</b> để chứng minh NGINX không bị lỗi 404!
                        </p>
                        <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem; justify-content: center;">
                            <button class="btn btn-primary" onclick="history.pushState(null, '', '/products/1'); window.dispatchEvent(new Event('popstate'));">
                                🔗 Thử nghiệm SPA Route: /products/1
                            </button>
                        </div>
                    </div>
                `;
                return;
            }

            staticBanner.classList.add('hidden');
            const data = await res.json();
            updateActiveInstance(data.instanceId || instanceHeader);

            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            renderCatalog(data.data || []);
        } catch (err) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--danger); background: #ffffff; border-radius: var(--radius); border: 1px solid var(--border-color);">
                    <b>Không thể tải dữ liệu:</b> ${escapeHtml(err.message)}<br>
                    <small style="color: var(--text-muted);">Hãy đảm bảo cụm container NGINX Gateway và Backend đang chạy trên cổng 8080.</small>
                </div>
            `;
        }
    }

    function renderCatalog(products) {
        if (!products || products.length === 0) {
            productsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">Không tìm thấy học liệu nào phù hợp với bộ lọc.</div>';
            return;
        }

        productsGrid.innerHTML = products.map(p => {
            const isBook = p.product_type === 'book';
            const formattedPrice = formatVND(p.price);
            const imgSrc = p.cover_image || p.image_url || '/assets/placeholder.svg';
            const typeLabel = isBook ? 'SÁCH CÔNG NGHỆ' : 'KHÓA HỌC';
            const typeClass = isBook ? 'tag-book' : 'tag-course';

            const subMeta = isBook
                ? `Tác giả: <b>${escapeHtml(p.author || 'Chưa cập nhật')}</b>`
                : `Giảng viên: <b>${escapeHtml(p.instructor || 'Chưa cập nhật')}</b> (${escapeHtml(p.level || 'Cơ bản')})`;

            const stockHtml = isBook
                ? (p.stock_quantity > 0
                    ? `<span class="product-stock-bar stock-in">✔ Còn ${p.stock_quantity} cuốn trong kho</span>`
                    : `<span class="product-stock-bar stock-out">✖ Tạm hết hàng</span>`)
                : `<span class="product-stock-bar stock-course">🎓 Đăng ký trực tuyến (${escapeHtml(p.duration || 'Theo tiến độ')})</span>`;

            const buyBtnLabel = isBook ? '🛒 Thêm giỏ' : '🎓 Đăng ký';
            const canBuy = !isBook || p.stock_quantity > 0;

            return `
                <div class="product-card" data-id="${p.id}">
                    <div class="product-thumb-wrapper" onclick="navigateToProduct(${p.id})">
                        <span class="product-type-tag ${typeClass}">${typeLabel}</span>
                        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.title)}" class="product-thumb" onerror="this.src='/assets/placeholder.svg'">
                    </div>
                    <div class="product-body">
                        <h4 class="product-title" onclick="navigateToProduct(${p.id})">${escapeHtml(p.title)}</h4>
                        <div class="product-meta-sub">${subMeta}</div>
                        <div class="product-price">${formattedPrice}</div>
                        <p class="product-desc">${escapeHtml(p.description || 'Chưa có mô tả chi tiết.')}</p>
                        ${stockHtml}
                        <div class="product-card-footer">
                            <button class="btn btn-outline btn-sm" onclick="navigateToProduct(${p.id})">
                                Chi tiết
                            </button>
                            <button class="btn btn-primary btn-sm btn-add-cart" 
                                    data-id="${p.id}" 
                                    data-title="${escapeHtml(p.title)}"
                                    data-price="${p.price}"
                                    data-type="${p.product_type}"
                                    data-stock="${p.stock_quantity}"
                                    ${!canBuy ? 'disabled' : ''}>
                                ${buyBtnLabel}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Gắn sự kiện Thêm vào Giỏ hàng
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = {
                    productId: parseInt(btn.dataset.id, 10),
                    title: btn.dataset.title,
                    price: parseFloat(btn.dataset.price),
                    productType: btn.dataset.type,
                    stock: parseInt(btn.dataset.stock, 10)
                };
                addToCart(item);
            });
        });
    }

    // Điều hướng toàn cục sang chi tiết SPA
    window.navigateToProduct = function (productId) {
        history.pushState(null, '', `/products/${productId}`);
        showDetailView(productId);
    };

    // =========================================================================
    // 4. CHI TIẾT SẢN PHẨM (GET /api/products/:id - SPA ROUTING & TRY_FILES)
    // =========================================================================
    const detailCard = document.getElementById('product-detail-card');

    async function loadProductDetail(id) {
        detailCard.innerHTML = '<div class="loading-state">Đang tải thông tin chi tiết học liệu...</div>';
        try {
            const res = await fetch(`/api/products/${id}`);
            const data = await res.json();
            updateActiveInstance(data.instanceId || res.headers.get('X-Backend-Instance'));

            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            const p = data.data;
            const isBook = p.product_type === 'book';
            const formattedPrice = formatVND(p.price);
            const imgSrc = p.cover_image || p.image_url || '/assets/placeholder.svg';

            const specificRows = isBook ? `
                <tr><td>Tác giả:</td><td><b>${escapeHtml(p.author || 'Chưa cập nhật')}</b></td></tr>
                <tr><td>Mã ISBN:</td><td><code>${escapeHtml(p.isbn || 'Chưa có')}</code></td></tr>
                <tr><td>Tồn kho vật lý:</td><td><b>${p.stock_quantity} cuốn</b></td></tr>
            ` : `
                <tr><td>Giảng viên phụ trách:</td><td><b>${escapeHtml(p.instructor || 'Chưa cập nhật')}</b></td></tr>
                <tr><td>Cấp độ đào tạo:</td><td><span class="instance-badge">${escapeHtml(p.level || 'Cơ bản')}</span></td></tr>
                <tr><td>Thời lượng khóa học:</td><td><b>${escapeHtml(p.duration || 'Tự do')}</b></td></tr>
            `;

            detailCard.innerHTML = `
                <div class="detail-thumb-box">
                    <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.title)}" class="detail-thumb" onerror="this.src='/assets/placeholder.svg'">
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-secondary btn-sm" onclick="openImageUploadModal(${p.id}, '${escapeHtml(p.title)}')">
                            🖼 Thay đổi ảnh bìa
                        </button>
                    </div>
                </div>
                <div class="detail-info">
                    <span class="product-type-tag ${isBook ? 'tag-book' : 'tag-course'}" style="position: static; display: inline-block; margin-bottom: 0.5rem;">
                        ${isBook ? 'SÁCH CÔNG NGHỆ' : 'KHÓA HỌC TRỰC TUYẾN'}
                    </span>
                    <h2>${escapeHtml(p.title)}</h2>
                    <div class="detail-price">${formattedPrice}</div>

                    <div class="detail-desc-box">
                        <b>Giới thiệu học liệu:</b>
                        <p style="margin-top: 0.5rem;">${escapeHtml(p.description || 'Chưa có mô tả chi tiết.')}</p>
                    </div>

                    <table class="detail-meta-table">
                        <tbody>
                            <tr><td>Mã định danh (ID):</td><td><code>#${p.id}</code></td></tr>
                            ${specificRows}
                            <tr><td>Ngày cập nhật:</td><td>${new Date(p.updated_at || p.created_at).toLocaleString('vi-VN')}</td></tr>
                            <tr><td>Backend phản hồi:</td><td><span class="instance-badge">${data.instanceId}</span></td></tr>
                        </tbody>
                    </table>

                    <div class="detail-actions">
                        <button class="btn btn-primary btn-lg" onclick="addToCart({
                            productId: ${p.id},
                            title: '${escapeHtml(p.title)}',
                            price: ${p.price},
                            productType: '${p.product_type}',
                            stock: ${p.stock_quantity || 0}
                        })">
                            🛒 ${isBook ? 'Thêm vào Giỏ hàng' : 'Đăng ký Khóa học'}
                        </button>
                        <button class="btn btn-secondary" onclick="editProductFromDetail(${p.id})">
                            ✏ Chỉnh sửa thông tin
                        </button>
                    </div>
                </div>
            `;
        } catch (err) {
            detailCard.innerHTML = `
                <div style="padding: 2rem; color: var(--danger); text-align: center;">
                    <b>Không thể tải chi tiết học liệu #${id}:</b> ${escapeHtml(err.message)}
                </div>
            `;
        }
    }

    // =========================================================================
    // 5. GIỎ HÀNG & THANH TOÁN MÔ PHỎNG (POST /api/orders)
    // =========================================================================
    let cart = [];
    const btnOpenCart = document.getElementById('btn-open-cart');
    const cartCounter = document.getElementById('cart-counter');
    const cartModal = document.getElementById('cart-modal');
    const btnCloseCart = document.getElementById('btn-close-cart');
    const cartItemsWrapper = document.getElementById('cart-items-wrapper');
    const formCheckout = document.getElementById('form-checkout');

    btnOpenCart.addEventListener('click', () => {
        renderCartModal();
        cartModal.classList.remove('hidden');
    });

    btnCloseCart.addEventListener('click', () => {
        cartModal.classList.add('hidden');
    });

    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.classList.add('hidden');
    });

    function addToCart(product) {
        const existing = cart.find(c => c.productId === product.productId);
        if (existing) {
            if (product.productType === 'course') {
                showToast(`Khóa học "${product.title}" đã có trong giỏ hàng (tối đa 1 suất)!`, 'warning');
                return;
            }
            if (existing.quantity >= product.stock) {
                showToast(`Số lượng sách trong giỏ đã đạt mức tồn kho tối đa (${product.stock})!`, 'warning');
                return;
            }
            existing.quantity += 1;
        } else {
            cart.push({
                productId: product.productId,
                title: product.title,
                price: product.price,
                productType: product.productType,
                stock: product.stock,
                quantity: 1
            });
        }
        updateCartCount();
        showToast(`Đã thêm "${product.title}" vào giỏ hàng!`, 'success');
    }

    function updateCartCount() {
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCounter.textContent = totalQty;
    }

    function renderCartModal() {
        if (cart.length === 0) {
            cartItemsWrapper.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    🛒 Giỏ hàng của bạn đang trống.<br>
                    <small>Hãy chọn sách hoặc khóa học từ cửa hàng!</small>
                </div>
            `;
            document.getElementById('checkout-form-box').classList.add('hidden');
            return;
        }

        document.getElementById('checkout-form-box').classList.remove('hidden');

        let grandTotal = 0;
        const rows = cart.map(item => {
            const subtotal = item.price * item.quantity;
            grandTotal += subtotal;
            const isCourse = item.productType === 'course';

            return `
                <tr>
                    <td>
                        <b>${escapeHtml(item.title)}</b><br>
                        <small class="text-muted">${isCourse ? '🎓 Khóa học' : '📚 Sách'} - ${formatVND(item.price)}</small>
                    </td>
                    <td>
                        ${isCourse ? '1 suất' : `
                            <div class="cart-qty-ctrl">
                                <button class="btn-qty" onclick="changeCartQty(${item.productId}, -1)">-</button>
                                <span>${item.quantity}</span>
                                <button class="btn-qty" onclick="changeCartQty(${item.productId}, 1)">+</button>
                            </div>
                        `}
                    </td>
                    <td style="text-align: right; font-weight: 700;">${formatVND(subtotal)}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-sm btn-danger" onclick="removeFromCart(${item.productId})">×</button>
                    </td>
                </tr>
            `;
        }).join('');

        cartItemsWrapper.innerHTML = `
            <table class="cart-table">
                <thead>
                    <tr>
                        <th>Học liệu</th>
                        <th>SL</th>
                        <th style="text-align: right;">Thành tiền</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="cart-total-box">
                Tổng cộng: ${formatVND(grandTotal)}
            </div>
        `;
    }

    window.changeCartQty = function (productId, delta) {
        const item = cart.find(c => c.productId === productId);
        if (!item) return;
        const nextQty = item.quantity + delta;
        if (nextQty <= 0) {
            removeFromCart(productId);
            return;
        }
        if (item.productType === 'book' && nextQty > item.stock) {
            showToast(`Vượt quá tồn kho có sẵn (${item.stock} cuốn)!`, 'warning');
            return;
        }
        item.quantity = nextQty;
        updateCartCount();
        renderCartModal();
    };

    window.removeFromCart = function (productId) {
        cart = cart.filter(c => c.productId !== productId);
        updateCartCount();
        renderCartModal();
    };

    // Submit Checkout
    formCheckout.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;

        const submitBtn = document.getElementById('btn-submit-order');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Đang ghi nhận đơn hàng vào PostgreSQL...';

        const payload = {
            customerName: document.getElementById('cust-name').value,
            customerEmail: document.getElementById('cust-email').value,
            items: cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }))
        };

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            updateActiveInstance(data.instanceId || res.headers.get('X-Backend-Instance'));

            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            const order = data.data;
            cart = [];
            updateCartCount();

            // Hiển thị Order Confirmation
            cartItemsWrapper.innerHTML = `
                <div class="order-success-box">
                    <div class="order-success-icon">🎉</div>
                    <h3 style="color: var(--success); margin-bottom: 0.5rem;">Đặt hàng Thành công!</h3>
                    <p style="color: var(--text-muted);">Đơn hàng đã được lưu trữ bền vững vào CSDL PostgreSQL.</p>
                    
                    <div class="order-badge-grid">
                        <div><b>Mã Đơn hàng:</b> <code>#${order.id}</code></div>
                        <div><b>Tổng số tiền:</b> <b style="color: var(--danger);">${formatVND(order.total_amount)}</b></div>
                        <div><b>Người đặt:</b> ${escapeHtml(order.customer_name)}</div>
                        <div><b>Instance xử lý:</b> <span class="instance-badge">${order.processed_by_instance || data.instanceId}</span></div>
                    </div>

                    <p style="font-size: 0.85rem; color: var(--text-muted);">
                        💡 Bạn có thể dùng Mã Đơn hàng <code>#${order.id}</code> tại tab "Chẩn đoán NGINX" để chứng minh Backend khác cũng đọc được đơn hàng này!
                    </p>
                </div>
            `;
            document.getElementById('checkout-form-box').classList.add('hidden');
            formCheckout.reset();
            loadCatalog(); // Cập nhật lại tồn kho nếu là sách
        } catch (err) {
            showToast(`Lỗi đặt hàng: ${err.message}`, 'error');
            alert(`Lỗi khi tạo đơn hàng: ${err.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>🛍 Xác nhận Đặt hàng (Tạo Đơn PostgreSQL)</span>';
        }
    });

    // =========================================================================
    // 6. QUẢN LÝ SẢN PHẨM: CREATE & UPDATE (ADMIN DEMO)
    // =========================================================================
    const formManage = document.getElementById('form-manage-product');
    const manageProdId = document.getElementById('manage-prod-id');
    const prodType = document.getElementById('prod-type');
    const editorTitle = document.getElementById('editor-title');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const btnNewProduct = document.getElementById('btn-new-product');
    const bookFields = document.querySelectorAll('.field-book-only');
    const courseFields = document.querySelectorAll('.field-course-only');

    function toggleTypeFields(type) {
        if (type === 'course') {
            bookFields.forEach(el => el.classList.add('hidden'));
            courseFields.forEach(el => el.classList.remove('hidden'));
            document.getElementById('prod-author').required = false;
            document.getElementById('prod-instructor').required = true;
        } else {
            bookFields.forEach(el => el.classList.remove('hidden'));
            courseFields.forEach(el => el.classList.add('hidden'));
            document.getElementById('prod-author').required = true;
            document.getElementById('prod-instructor').required = false;
        }
    }

    prodType.addEventListener('change', () => toggleTypeFields(prodType.value));

    function resetAdminForm() {
        manageProdId.value = '';
        formManage.reset();
        prodType.value = 'book';
        toggleTypeFields('book');
        editorTitle.textContent = 'Thêm Học liệu Mới vào PostgreSQL';
        document.getElementById('btn-save-manage').innerHTML = '<span>💾 Lưu vào PostgreSQL</span>';
    }

    btnCancelEdit.addEventListener('click', resetAdminForm);
    btnNewProduct.addEventListener('click', () => {
        resetAdminForm();
        window.scrollTo({ top: document.getElementById('product-editor-card').offsetTop - 80, behavior: 'smooth' });
    });

    formManage.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-save-manage');
        submitBtn.disabled = true;

        const isUpdate = !!manageProdId.value;
        const type = prodType.value;

        const payload = {
            title: document.getElementById('prod-title').value,
            product_type: type,
            price: document.getElementById('prod-price').value,
            description: document.getElementById('prod-desc').value,
            cover_image: document.getElementById('prod-cover-url').value
        };

        if (type === 'book') {
            payload.author = document.getElementById('prod-author').value;
            payload.isbn = document.getElementById('prod-isbn').value;
            payload.stock_quantity = document.getElementById('prod-stock').value;
        } else {
            payload.instructor = document.getElementById('prod-instructor').value;
            payload.level = document.getElementById('prod-level').value;
            payload.duration = document.getElementById('prod-duration').value;
        }

        const endpoint = isUpdate ? `/api/products/${manageProdId.value}` : '/api/products';
        const method = isUpdate ? 'PATCH' : 'POST';

        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            updateActiveInstance(data.instanceId || res.headers.get('X-Backend-Instance'));

            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            showToast(data.message || 'Thành công!', 'success');
            resetAdminForm();
            loadAdminProductsTable();
            loadCatalog();
        } catch (err) {
            showToast(`Lỗi: ${err.message}`, 'error');
            alert(`Lỗi: ${err.message}`);
        } finally {
            submitBtn.disabled = false;
        }
    });

    async function loadAdminProductsTable() {
        const tbody = document.getElementById('admin-table-body');
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Đang tải danh sách từ CSDL...</td></tr>';
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            updateActiveInstance(data.instanceId || res.headers.get('X-Backend-Instance'));

            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

            const products = data.data || [];
            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Chưa có sản phẩm nào.</td></tr>';
                return;
            }

            tbody.innerHTML = products.map(p => {
                const isBook = p.product_type === 'book';
                const typeBadge = isBook ? '<span class="product-type-tag tag-book">SÁCH</span>' : '<span class="product-type-tag tag-course">KHÓA HỌC</span>';
                const creator = isBook ? escapeHtml(p.author || '-') : escapeHtml(p.instructor || '-');
                const stock = isBook ? `${p.stock_quantity} cuốn` : 'Vô hạn';

                return `
                    <tr>
                        <td><b>#${p.id}</b></td>
                        <td>${typeBadge}</td>
                        <td>
                            <a href="/products/${p.id}" onclick="event.preventDefault(); navigateToProduct(${p.id});" style="color: var(--primary); font-weight: 600;">
                                ${escapeHtml(p.title)}
                            </a>
                        </td>
                        <td>${creator}</td>
                        <td style="font-weight: 700; color: var(--danger);">${formatVND(p.price)}</td>
                        <td>${stock}</td>
                        <td>
                            <div style="display: flex; gap: 0.35rem;">
                                <button class="btn btn-sm btn-secondary" onclick="populateEditForm(${p.id})">Sửa</button>
                                <button class="btn btn-sm btn-outline" onclick="openImageUploadModal(${p.id}, '${escapeHtml(p.title)}')">Ảnh</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--danger);">Lỗi tải bảng: ${escapeHtml(err.message)}</td></tr>`;
        }
    }

    window.populateEditForm = async function (id) {
        try {
            const res = await fetch(`/api/products/${id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            const p = data.data;

            manageProdId.value = p.id;
            prodType.value = p.product_type;
            toggleTypeFields(p.product_type);

            document.getElementById('prod-title').value = p.title || p.name || '';
            document.getElementById('prod-price').value = p.price;
            document.getElementById('prod-desc').value = p.description || '';
            document.getElementById('prod-cover-url').value = p.cover_image || p.image_url || '';

            if (p.product_type === 'book') {
                document.getElementById('prod-author').value = p.author || '';
                document.getElementById('prod-isbn').value = p.isbn || '';
                document.getElementById('prod-stock').value = p.stock_quantity;
            } else {
                document.getElementById('prod-instructor').value = p.instructor || '';
                document.getElementById('prod-level').value = p.level || 'Cơ bản';
                document.getElementById('prod-duration').value = p.duration || '';
            }

            editorTitle.textContent = `Chỉnh sửa Học liệu #${p.id}: ${p.title}`;
            document.getElementById('btn-save-manage').innerHTML = '<span>💾 Cập nhật Học liệu</span>';
            window.scrollTo({ top: document.getElementById('product-editor-card').offsetTop - 80, behavior: 'smooth' });
        } catch (err) {
            alert(`Lỗi khi nạp thông tin sửa: ${err.message}`);
        }
    };

    window.editProductFromDetail = function (id) {
        switchTab('tab-manage');
        window.populateEditForm(id);
    };

    // =========================================================================
    // 7. THAY ĐỔI ẢNH BÌA SẢN PHẨM (POST /api/products/:id/image)
    // =========================================================================
    const imageModal = document.getElementById('image-modal');
    const btnCloseImgModal = document.getElementById('btn-close-img-modal');
    const formModalImage = document.getElementById('form-modal-image');
    const modalImgProdId = document.getElementById('modal-img-prod-id');
    const modalImgProdTitle = document.getElementById('modal-img-prod-title');
    const modalFileInput = document.getElementById('modal-file-input');

    window.openImageUploadModal = function (id, title) {
        modalImgProdId.value = id;
        modalImgProdTitle.textContent = `#${id} - ${title}`;
        modalFileInput.value = '';
        imageModal.classList.remove('hidden');
    };

    btnCloseImgModal.addEventListener('click', () => imageModal.classList.add('hidden'));
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) imageModal.classList.add('hidden');
    });

    formModalImage.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = modalImgProdId.value;
        if (!modalFileInput.files[0]) {
            alert('Vui lòng chọn tệp ảnh hợp lệ!');
            return;
        }

        const formData = new FormData();
        formData.append('image', modalFileInput.files[0]);

        const submitBtn = document.getElementById('btn-modal-img-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Đang tải lên NGINX Gateway...';

        try {
            const res = await fetch(`/api/products/${id}/image`, {
                method: 'POST',
                body: formData
            });

            if (res.status === 413) {
                alert('Lỗi 413 Payload Too Large từ NGINX! Tệp ảnh vượt hạn mức client_max_body_size.');
                return;
            }

            const data = await res.json();
            updateActiveInstance(data.instanceId || res.headers.get('X-Backend-Instance'));

            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

            showToast('Thay ảnh bìa thành công! Đã lưu vào volume dùng chung.', 'success');
            imageModal.classList.add('hidden');
            loadCatalog();
            loadAdminProductsTable();
            if (!viewDetail.classList.contains('hidden')) {
                loadProductDetail(id);
            }
        } catch (err) {
            alert(`Lỗi upload ảnh: ${err.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>📤 Tải lên & Lưu vào Volume dùng chung</span>';
        }
    });

    // =========================================================================
    // 8. CHẨN ĐOÁN NGINX & KIỂM CHỨNG 6 BƯỚC
    // =========================================================================

    // A. Cân bằng tải Upstream 10 requests (Bước 3)
    const btnTestLb10 = document.getElementById('btn-test-lb-10');
    const btnResetLb = document.getElementById('btn-reset-lb');
    const countApi1 = document.getElementById('count-api1');
    const countApi2 = document.getElementById('count-api2');
    const countTotal = document.getElementById('count-total');
    const pctApi1 = document.getElementById('pct-api1');
    const pctApi2 = document.getElementById('pct-api2');
    const lbLogBody = document.getElementById('lb-log-body');

    let lbStats = { api1: 0, api2: 0, total: 0 };
    let lbLogs = [];

    function updateLbStatsUI() {
        countApi1.textContent = lbStats.api1;
        countApi2.textContent = lbStats.api2;
        countTotal.textContent = lbStats.total;
        if (lbStats.total > 0) {
            pctApi1.textContent = Math.round((lbStats.api1 / lbStats.total) * 100) + '%';
            pctApi2.textContent = Math.round((lbStats.api2 / lbStats.total) * 100) + '%';
        } else {
            pctApi1.textContent = '0%';
            pctApi2.textContent = '0%';
        }
    }

    btnResetLb.addEventListener('click', () => {
        lbStats = { api1: 0, api2: 0, total: 0 };
        lbLogs = [];
        updateLbStatsUI();
        lbLogBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Đã xóa lịch sử kiểm thử.</td></tr>';
    });

    btnTestLb10.addEventListener('click', async () => {
        btnTestLb10.disabled = true;
        btnTestLb10.innerHTML = 'Đang gửi 10 request luân phiên...';

        for (let i = 1; i <= 10; i++) {
            const start = performance.now();
            try {
                const res = await fetch(`/api/products?t=${Date.now()}_${i}`);
                const duration = Math.round(performance.now() - start);
                const data = await res.json();
                const instance = data.instanceId || res.headers.get('X-Backend-Instance') || 'unknown';

                if (instance === 'api1') lbStats.api1++;
                else if (instance === 'api2') lbStats.api2++;
                lbStats.total++;

                updateActiveInstance(instance);

                lbLogs.unshift({
                    seq: lbStats.total,
                    time: new Date().toLocaleTimeString('vi-VN'),
                    endpoint: '/api/products',
                    status: res.status,
                    instance,
                    duration: duration + ' ms'
                });
            } catch (err) {
                lbStats.total++;
                lbLogs.unshift({
                    seq: lbStats.total,
                    time: new Date().toLocaleTimeString('vi-VN'),
                    endpoint: '/api/products',
                    status: 'ERR',
                    instance: err.message,
                    duration: '-'
                });
            }

            updateLbStatsUI();
            renderLbLogs();
            await new Promise(r => setTimeout(r, 120));
        }

        btnTestLb10.disabled = false;
        btnTestLb10.innerHTML = '<span>⚡ Gửi tiếp 10 Request tới Upstream</span>';
    });

    function renderLbLogs() {
        lbLogBody.innerHTML = lbLogs.slice(0, 15).map(log => {
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

    // B. Kiểm chứng Tra cứu Đơn hàng chéo Instance
    const btnLookupOrder = document.getElementById('btn-lookup-order');
    const lookupOrderId = document.getElementById('lookup-order-id');
    const orderLookupResult = document.getElementById('order-lookup-result');

    btnLookupOrder.addEventListener('click', async () => {
        const id = lookupOrderId.value.trim();
        if (!id) {
            alert('Vui lòng nhập Mã Đơn hàng (ID) cần tra cứu!');
            return;
        }

        orderLookupResult.className = 'hint-card';
        orderLookupResult.classList.remove('hidden');
        orderLookupResult.innerHTML = 'Đang tra cứu từ PostgreSQL...';

        try {
            const res = await fetch(`/api/orders/${id}`);
            const data = await res.json();
            updateActiveInstance(data.instanceId || res.headers.get('X-Backend-Instance'));

            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

            const o = data.data;
            orderLookupResult.innerHTML = `
                <h4 style="color: var(--success); margin-bottom: 0.5rem;">✔ Tìm thấy Đơn hàng #${o.id}</h4>
                <p><b>Khách hàng:</b> ${escapeHtml(o.customer_name)} (${escapeHtml(o.customer_email)})</p>
                <p><b>Tổng giá trị:</b> <b style="color: var(--danger);">${formatVND(o.total_amount)}</b></p>
                <p><b>Instance tạo ban đầu:</b> <span class="instance-badge">${o.processed_by_instance || 'N/A'}</span></p>
                <p><b>Instance đang phản hồi tra cứu:</b> <span class="instance-badge">${data.instanceId}</span></p>
                <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #0c4a6e;">
                    ✔ <b>Chứng minh kiến trúc:</b> Dù request tra cứu này rơi vào bất kỳ backend nào (api1 hay api2), dữ liệu vẫn đồng nhất 100% nhờ CSDL chung PostgreSQL.
                </p>
            `;
        } catch (err) {
            orderLookupResult.className = 'upload-status-box error';
            orderLookupResult.innerHTML = `<b>Lỗi tra cứu:</b> ${escapeHtml(err.message)}`;
        }
    });

    // C. Kiểm thử Request Body Limit & Lỗi 413 (Bước 5)
    const formUploadTest = document.getElementById('form-upload-test');
    const diagUploadFile = document.getElementById('diag-upload-file');
    const diagFileInfo = document.getElementById('diag-file-info');
    const diagUploadResult = document.getElementById('diag-upload-result');
    const btnPickSmall = document.getElementById('btn-pick-small-image');
    const btnPickLarge = document.getElementById('btn-pick-large-image');

    let diagChosenBlob = null;

    btnPickSmall.addEventListener('click', async () => {
        try {
            const res = await fetch('/assets/sample_cover_small.png');
            const blob = await res.blob();
            diagChosenBlob = new File([blob], 'sample_cover_small.png', { type: 'image/png' });
            diagFileInfo.textContent = `Tệp đã chọn: sample_cover_small.png (${(diagChosenBlob.size / 1024).toFixed(1)} KB - Hợp lệ < 1MB)`;
        } catch (e) {
            alert('Không thể tải ảnh mẫu nhỏ.');
        }
    });

    btnPickLarge.addEventListener('click', async () => {
        try {
            const res = await fetch('/assets/sample_cover_large.png');
            const blob = await res.blob();
            diagChosenBlob = new File([blob], 'sample_cover_large.png', { type: 'image/png' });
            diagFileInfo.textContent = `Tệp đã chọn: sample_cover_large.png (${(diagChosenBlob.size / (1024 * 1024)).toFixed(2)} MB - VƯỢT MỨC 1MB!)`;
        } catch (e) {
            alert('Không thể tải ảnh mẫu lớn.');
        }
    });

    diagUploadFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            diagChosenBlob = e.target.files[0];
            diagFileInfo.textContent = `Tệp tùy chọn: ${diagChosenBlob.name} (${(diagChosenBlob.size / 1024).toFixed(1)} KB)`;
        }
    });

    formUploadTest.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!diagChosenBlob) {
            alert('Vui lòng chọn tệp hoặc nhấn một trong hai nút ảnh mẫu chuẩn bị sẵn!');
            return;
        }

        const sendBtn = document.getElementById('btn-diag-upload');
        sendBtn.disabled = true;
        sendBtn.innerHTML = 'Đang gửi qua NGINX Gateway...';

        diagUploadResult.className = 'upload-status-box';
        diagUploadResult.innerHTML = '<div class="loading-state">Đang truyền tải request tới cổng 8080...</div>';

        const formData = new FormData();
        formData.append('image', diagChosenBlob);
        const prodId = document.getElementById('diag-prod-id').value;
        if (prodId) formData.append('productId', prodId);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            // XỬ LÝ RÕ RÀNG MÃ LỖI 413 TỪ NGINX (HTML RESPONSE KHÔNG PHẢI JSON!)
            if (res.status === 413) {
                diagUploadResult.className = 'upload-status-box error';
                diagUploadResult.innerHTML = `
                    <h4 style="color:#b91c1c; font-size:1.1rem; margin-bottom:0.5rem;">
                        🛑 HTTP 413 Payload Too Large (Bị chặn bởi NGINX Gateway!)
                    </h4>
                    <p><b>Giải thích kỹ thuật:</b> NGINX đang áp dụng chỉ thị mặc định <code>client_max_body_size 1m;</code>. Do request (${(diagChosenBlob.size / (1024 * 1024)).toFixed(2)} MB) vượt quá hạn mức 1 MB, NGINX lập tức đóng kết nối và phản hồi mã 413 mà không bao giờ chuyển tiếp vào Backend!</p>
                    <div style="margin-top:0.8rem; background: #fff; padding: 0.6rem; border-radius: 4px; border: 1px solid #fca5a5;">
                        <b>Các bước nạp nóng tiếp theo:</b><br>
                        1. Chạy lệnh: <code>.\\switch_stage.ps1 5</code> (hoặc sửa <code>client_max_body_size 20m;</code>)<br>
                        2. Kiểm tra cú pháp: <code>docker compose exec proxy nginx -t</code><br>
                        3. Nạp nóng cấu hình: <code>docker compose exec proxy nginx -s reload</code><br>
                        4. Bấm lại nút gửi phía trên để thấy ảnh tải lên thành công <b>HTTP 200 OK</b>!
                    </div>
                `;
            } else if (res.ok) {
                const data = await res.json();
                updateActiveInstance(data.instanceId || res.headers.get('X-Backend-Instance'));

                diagUploadResult.className = 'upload-status-box success';
                diagUploadResult.innerHTML = `
                    <h4 style="color:#15803d; font-size:1.1rem; margin-bottom:0.5rem;">
                        ✔ HTTP 200 OK - Tải ảnh bìa thành công!
                    </h4>
                    <p><b>Backend Instance xử lý:</b> <span class="instance-badge">${data.instanceId}</span></p>
                    <p><b>Dung lượng tệp:</b> ${data.file.sizeKB} KB</p>
                    <p><b>Đường dẫn tệp trên Shared Volume:</b> <a href="${data.file.url}" target="_blank">${data.file.url}</a></p>
                    <div style="margin-top: 0.8rem;">
                        <img src="${data.file.url}" alt="Cover" style="max-height: 140px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: var(--shadow);">
                    </div>
                `;
                loadCatalog();
                loadAdminProductsTable();
            } else {
                const text = await res.text();
                diagUploadResult.className = 'upload-status-box error';
                diagUploadResult.innerHTML = `<h4>HTTP ${res.status}</h4><pre>${escapeHtml(text)}</pre>`;
            }
        } catch (err) {
            diagUploadResult.className = 'upload-status-box error';
            diagUploadResult.innerHTML = `<b>Lỗi kết nối:</b> ${escapeHtml(err.message)}`;
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<span>🚀 Gửi Request Upload tới NGINX</span>';
        }
    });

    // D. Soi Forwarded Headers (Bước 2 & 4)
    const btnRefreshHeaders = document.getElementById('btn-refresh-headers');
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
            updateActiveInstance(data.instanceId || res.headers.get('X-Backend-Instance'));

            hdrPeerIp.textContent = data.peerIp || 'Chưa xác định';
            hdrXRealIp.textContent = data.headers['x-real-ip'] || '(Chưa có)';
            hdrHost.textContent = data.headers['host'] || '(none)';
            hdrXForwardedFor.textContent = data.headers['x-forwarded-for'] || '(none)';
            hdrXForwardedProto.textContent = data.headers['x-forwarded-proto'] || '(none)';
            hdrInstanceId.textContent = data.instanceId || 'unknown';
        } catch (err) {
            hdrPeerIp.textContent = 'Lỗi kết nối';
            hdrXRealIp.textContent = err.message;
        }
    }

    btnRefreshHeaders.addEventListener('click', inspectHeaders);

    // =========================================================================
    // KHỞI ĐỘNG ỨNG DỤNG
    // =========================================================================
    handleLocationChange();
    inspectHeaders();
});
