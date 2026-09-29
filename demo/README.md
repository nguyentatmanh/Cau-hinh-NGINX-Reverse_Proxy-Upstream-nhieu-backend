# HƯỚNG DẪN CHẠY DEMO THỰC HÀNH BUỔI 8 (NHÓM 7 - HUCE)
## HỆ THỐNG SERVER NÂNG CAO • NGINX REVERSE PROXY & UPSTREAM
### DỰ ÁN: QUẢN LÝ SẢN PHẨM MINI (MINI PRODUCT MANAGEMENT)

Thư mục `demo/` cung cấp mã nguồn **chạy thật, hoàn chỉnh và độc lập** cho bài thực hành Buổi 8. Hệ thống được triển khai qua Docker Compose với 4 service container:
1. **`db` (PostgreSQL 16 Alpine)**: Lưu trữ bảng `products` (id, name, price, description, image_url, created_at) với persistent volume `pg_data`. Khởi tạo tự động qua `init-db/01-init.sql`.
2. **`api1` & `api2` (Node.js 20 Express)**: Hai container backend chạy từ cùng một Dockerfile, cấu trúc 3 tầng **Controller - Service - Repository**, non-root user `node`, cùng kết nối tới `db:5432` và dùng chung volume `uploads_data:/app/uploads`. Mỗi phản hồi trả về header `X-Backend-Instance` và trường JSON `instanceId` (`api1` hoặc `api2`).
3. **`proxy` (NGINX 1.27 Alpine)**: Điểm vào công khai duy nhất, lắng nghe `8080:80` (HTTP) và `8443:443` (HTTPS), phục vụ Frontend tĩnh (SPA), reverse proxy `/api/` tới Upstream cluster `backend_cluster` (`api1:3000`, `api2:3000`), bảo toàn 4 forwarded headers và kiểm soát hạn mức body (413).

---

### 1. Cấu trúc Thư mục Dự án Demo
```text
demo/
├── backend/
│   ├── src/
│   │   ├── config/db.js             # Kết nối pg.Pool với PostgreSQL + In-Memory Fallback
│   │   ├── controllers/productController.js  # Tầng Controller xử lý HTTP
│   │   ├── services/productService.js        # Tầng Service nghiệp vụ & validation
│   │   ├── repositories/productRepository.js # Tầng Repository truy vấn CSDL
│   │   ├── utils/logger.js          # Ghi log IP peer vs Forwarded Headers
│   │   └── app.js                   # Express app, Multer (25MB), Router /api/...
│   ├── server.js                    # File khởi chạy máy chủ Node.js cổng 3000
│   ├── package.json                 # express, pg, multer
│   ├── Dockerfile                   # Node 20 Alpine, non-root user (USER node)
│   └── .dockerignore
├── frontend/
│   ├── index.html                   # Giao diện SPA (Danh sách, Chi tiết, Thêm SP, Test 413, Upstream Monitor)
│   ├── style.css                    # Thiết kế học viện HUCE (xanh đậm, thẻ card, responsive)
│   ├── app.js                       # HTML5 History API routing (/products/:id), AJAX fetch
│   └── assets/                      # huce_logo.png, placeholder.svg
├── init-db/
│   └── 01-init.sql                  # Script tạo bảng products và nạp 4 bản ghi ban đầu
├── nginx/
│   ├── conf.d/default.conf          # Cấu hình lab chuẩn (Upstream api1 & api2, try_files, 4 headers, HTTPS)
│   └── stages/                      # 5 cấu hình riêng cho từng bước demo trên lớp:
│       ├── step1_web_server.conf    # Bước 1: Chỉ phục vụ Frontend tĩnh & try_files
│       ├── step2_single_backend.conf# Bước 2: Reverse proxy tới 1 backend (api1:3000)
│       ├── step3_upstream_cluster.conf # Bước 3: Cụm Upstream Round-robin (api1, api2)
│       ├── step5_body_limit_20m.conf   # Bước 5: Nâng client_max_body_size lên 20m
│       └── step6_https_san.conf        # Bước 6: Cấu hình đầy đủ HTTP (80) + HTTPS (443)
├── ssl/
│   ├── myapp.crt                    # Chứng chỉ SSL tự ký có SAN DNS:myapp.local (X.509)
│   ├── myapp.key                    # Khóa riêng RSA 2048-bit
│   ├── generate_cert.ps1            # Script sinh cert trên Windows
│   └── generate_cert.sh             # Script sinh cert trên Linux/macOS
├── compose.yaml                     # Định nghĩa db, api1, api2, proxy, volumes, healthcheck
└── test_demo.ps1                    # Script kiểm thử tự động 6 bước bằng PowerShell
```

---

### 2. Các Lệnh Khởi động và Dọn dẹp

#### Khởi động hệ thống
Mở PowerShell hoặc terminal tại thư mục `demo`:
```bash
# 1. Khởi động toàn bộ stack ngầm (background)
docker compose up -d --build

# 2. Kiểm tra trạng thái các container và healthcheck
docker compose ps
```
Cả 4 container `huce_postgres_db` (healthy), `huce_api_1` (healthy), `huce_api_2` (healthy), `huce_nginx_proxy` (running) đều sẵn sàng.

#### Theo dõi nhật ký (Logs)
```bash
# Xem log NGINX Gateway
docker compose logs -f proxy

# Xem log các instance Backend (để quan sát Round-Robin và IP logger)
docker compose logs -f api1 api2
```

#### Dừng và Dọn dẹp
```bash
# Dừng container (giữ nguyên dữ liệu CSDL)
docker compose down

# Dừng và xóa toàn bộ persistent volumes (xóa trắng CSDL và uploads)
docker compose down -v
```

---

### 3. Kịch bản Kiểm chứng 6 Bước Thực hành Chi tiết

| Bước | Mục tiêu | Thao tác thực hiện | Kết quả quan sát |
| :---: | :--- | :--- | :--- |
| **1** | Web Server tĩnh & SPA Routing | Mở trình duyệt: `http://localhost:8080/`. Click vào một sản phẩm để chuyển route `/products/1`, sau đó bấm **F5 (Reload)**. | Giao diện HTML/CSS tải trơn tru, mã HTTP 200 OK. Khi F5 tại route ảo, NGINX `try_files` trả về `index.html` thay vì lỗi 404. |
| **2** | Reverse Proxy CRUD & Same-Origin | Trên web, xem danh sách sản phẩm hoặc điền form "Thêm sản phẩm mới" rồi bấm Submit (gửi `POST /api/products`). | Sản phẩm mới được ghi vào PostgreSQL; giao diện cập nhật ngay; Tab Console không có cảnh báo CORS; Backend log ghi nhận request qua NGINX. |
| **3** | Upstream Cân bằng tải | Bấm nút **"Gửi liên tiếp 10 request (Test Load Balancing)"** trên giao diện web. | 10 request `GET /api/products` được gửi; trường `instanceId` và header `X-Backend-Instance` luân phiên giữa `api1` và `api2` theo thuật toán Round-Robin. |
| **4** | Docker Service Discovery vs localhost | Chạy lệnh kiểm tra DNS nội bộ Docker:<br>`docker compose exec proxy nslookup api1` | NGINX phân giải thành công IP nội bộ `172.x.x.x` của container `api1`. Giải thích: nếu dùng `localhost:3000` NGINX sẽ bị lỗi 502 Bad Gateway vì khác Network Namespace. |
| **5** | Bắt lỗi 413 & Zero-Downtime Reload | 1. Chọn file ảnh > 1 MB (hoặc bấm nút "Tải ảnh test 2.5 MB").<br>2. Sửa `client_max_body_size 20m;` trong `nginx/conf.d/default.conf`.<br>3. Kiểm tra: `docker compose exec proxy nginx -t`<br>4. Reload: `docker compose exec proxy nginx -s reload`<br>5. Bấm Upload lại. | Lần 1: Nhận ngay mã lỗi **HTTP 413 Payload Too Large**.<br>Sau khi reload: Upload thành công nhận mã **HTTP 200 OK**, ảnh lưu vào volume chung `uploads_data` và cả 2 backend đều xem được. |
| **6** | Domain Ảo & HTTPS Tự ký có SAN | 1. Thêm dòng `127.0.0.1  myapp.local` vào tệp hosts của HĐH.<br>2. Mở trình duyệt: `https://myapp.local:8443/`. | Trình duyệt báo đỏ `NET::ERR_CERT_AUTHORITY_INVALID` vì SSL tự ký không thuộc Trust Store của HĐH. Bấm "Nâng cao -> Tiếp tục" để vào web qua kênh mã hóa TLS v1.2/v1.3 an toàn. |

---

### 4. Minh bạch về Hiện trạng Kiểm thử (Verification Transparency)

- **Đã kiểm chứng trực tiếp trong môi trường phát triển (Verified Locally)**:
  - Máy chủ Node.js Express (`server.js`): Đã chạy trực tiếp qua `node server.js`, kiểm thử `GET /api/products` (HTTP 200, 4 bản ghi), `POST /api/products` (HTTP 201, tạo sản phẩm mới), hệ thống logger IP và header `X-Backend-Instance`.
  - Bộ chứng chỉ SSL tự ký có SAN (`demo/ssl/myapp.crt`): Đã kiểm tra cấu trúc X.509 với OpenSSL, có trường `Subject Alternative Name: DNS:myapp.local`.
  - Bộ sinh slide thuyết trình (`generate_nginx_lesson8.py`): Đã biên dịch tạo thành công cả hai tệp `NGINX_Buoi_8_Nhom_7.pptx` và `NGINX_Buoi_8_Nhom_8.pptx` (20 slide, đầy đủ logo HUCE, ghi chú thuyết trình và bảng kết quả).
- **Kết quả dự kiến trên Docker Daemon (Expected Container Runtime)**:
  - Do Docker Desktop daemon hiện đang tắt trên máy này, các bước container hóa (`docker compose up`, `docker compose exec proxy nslookup api1`, `nginx -s reload`) được cung cấp đầy đủ script mẫu và bảng kết quả dự kiến chuẩn mực để chạy trên máy của bạn hoặc trong buổi thuyết trình.
