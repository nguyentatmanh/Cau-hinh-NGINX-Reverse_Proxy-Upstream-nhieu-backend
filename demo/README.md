# HƯỚNG DẪN CHẠY DEMO THỰC HÀNH BUỔI 8 (NHÓM 8 - HUCE)
## HỆ THỐNG SERVER NÂNG CAO • NGINX REVERSE PROXY & UPSTREAM NHIỀU BACKEND
### DỰ ÁN: CỬA HÀNG HỌC LIỆU & KHÓA HỌC CÔNG NGHỆ (HUCE LEARNING STORE)

Thư mục `demo/` cung cấp mã nguồn **chạy thật, hoàn chỉnh và độc lập** cho bài thực hành Buổi 8 theo đúng yêu cầu Đề cương PDF. Hệ thống mô phỏng một storefront hoàn chỉnh bán sách công nghệ và khóa học lập trình (**HUCE Learning Store**), được triển khai qua Docker Compose với 4 service container:

1. **`db` (PostgreSQL 16 Alpine)**:
   - Quản lý các bảng CSDL quan hệ: `products` (sách & khóa học), `orders` (đơn hàng), `order_items` (chi tiết đơn hàng).
   - Dữ liệu bền vững qua persistent volume `pg_data`.
   - Tự động nạp schema và 7 bản ghi mẫu (sách Docker/Kubernetes, NGINX, Node.js, Thiết kế Vi dịch vụ, khóa học DevOps, System Design...) qua `init-db/01-init.sql`. Hỗ trợ migration không mất dữ liệu qua `init-db/02-migrate-learning-store.sql`.
2. **`api1` & `api2` (Node.js 20 Express)**:
   - Hai container backend chạy song song từ cùng một Dockerfile, non-root user `USER node`.
   - Kiến trúc 3 tầng chuẩn mực: **Controller → Service → Repository**.
   - Cùng kết nối vào CSDL PostgreSQL (`db:5432`) qua connection pool (`pg.Pool`), hỗ trợ transaction an toàn chống race-condition (`SELECT ... FOR UPDATE` khi trừ tồn kho sách).
   - **Tuyệt đối không dùng dữ liệu giả lập (In-Memory Fallback)**: Khi CSDL mất kết nối, hệ thống trả về mã lỗi HTTP 503 và endpoint `/api/health` báo trạng thái `unhealthy`, phản ánh đúng thực trạng hạ tầng.
   - Dùng chung shared volume ảnh bìa `uploads_data:/app/uploads`.
   - Mỗi phản hồi API trả về header `X-Backend-Instance` và trường JSON `instanceId` (`api1` hoặc `api2`).
3. **`proxy` (NGINX 1.27 Alpine)**:
   - Điểm vào công khai duy nhất (Single Entry Point), mở cổng host `8080:80` (HTTP) và `8443:443` (HTTPS). Backend và CSDL chạy hoàn toàn nội bộ trong mạng bridge `app_net`.
   - Phục vụ Frontend tĩnh tại `/` bằng `root`, `index`, `try_files` (SPA fallback).
   - Chuyển tiếp `/api/` tới cụm Upstream `backend_cluster` gồm `api1:3000` và `api2:3000` theo thuật toán Round-Robin.
   - Bảo toàn 4 forwarded headers: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`.
   - Kiểm soát hạn mức request body (`client_max_body_size 1m;` nâng lên `20m;`) và hỗ trợ Hot Reload không gián đoạn (`nginx -s reload`).
   - Cung cấp HTTPS với chứng chỉ SSL tự ký có Subject Alternative Name (`SAN: DNS:myapp.local`).

---

### 1. Cấu trúc Thư mục Dự án Demo

```text
demo/
├── backend/
│   ├── src/
│   │   ├── config/db.js                       # Kết nối pg.Pool, auto-migrate, healthcheck
│   │   ├── controllers/
│   │   │   ├── productController.js           # Xử lý HTTP request sản phẩm & upload ảnh
│   │   │   └── orderController.js             # Xử lý HTTP request giỏ hàng & đơn hàng
│   │   ├── services/
│   │   │   ├── productService.js              # Nghiệp vụ sách vs khóa học, validation
│   │   │   └── orderService.js                # Nghiệp vụ tính tiền, kiểm tra tồn kho
│   │   ├── repositories/
│   │   │   ├── productRepository.js           # Truy vấn SQL bảng products
│   │   │   └── orderRepository.js             # Transaction SQL bảng orders/order_items
│   │   ├── utils/logger.js                    # Ghi log IP peer vs Forwarded Headers
│   │   └── app.js                             # Express app, Multer, routes, X-Backend-Instance
│   ├── server.js                              # Khởi chạy server Node.js cổng 3000
│   ├── package.json                           # express, pg, multer
│   ├── Dockerfile                             # Node 20 Alpine, non-root user (node)
│   └── .dockerignore
├── frontend/
│   ├── index.html                             # Storefront SPA (Catalog, Details, Cart, Admin, Demo Console)
│   ├── style.css                              # Giao diện học viện HUCE (Deep Navy, thẻ card, modal, badges)
│   ├── app.js                                 # SPA Router (/products/:id), Cart state, Fetch API, HTML 413 handling
│   └── assets/
│       ├── huce_logo.png                      # Logo chính thức HUCE
│       ├── sample_cover_small.png             # Ảnh bìa mẫu hợp lệ (< 1 MB: 28 KB)
│       └── sample_cover_large.png             # Ảnh bìa mẫu vượt hạn mức NGINX (> 1 MB: 1.34 MB)
├── init-db/
│   ├── 01-init.sql                            # Khởi tạo schema products, orders, order_items & seed data
│   └── 02-migrate-learning-store.sql          # Di trú nâng cấp từ schema cũ trên volume đã có
├── nginx/
│   ├── conf.d/
│   │   └── default.conf                       # Cấu hình chuẩn đầy đủ (Upstream, try_files, headers, HTTPS)
│   └── stages/                                # Cấu hình tương ứng 6 bước thực hành của PDF:
│       ├── step1_web_server.conf              # Bước 1: Web server tĩnh thuần túy (không proxy API)
│       ├── step2_single_backend.conf          # Bước 2: Reverse proxy tới 1 backend (api1:3000)
│       ├── step3_upstream_cluster.conf        # Bước 3: Upstream cân bằng tải Round-robin (api1, api2)
│       ├── step5_body_limit_20m.conf          # Bước 5: Nâng hạn mức body lên 20 MB (client_max_body_size 20m;)
│       └── step6_https_san.conf               # Bước 6: Đầy đủ HTTP (80) + HTTPS (443) có SAN
├── ssl/
│   ├── myapp.crt                              # Chứng chỉ SSL X.509 có SAN DNS:myapp.local
│   ├── myapp.key                              # Khóa riêng RSA 2048-bit
│   ├── generate_cert.ps1                      # Script tạo cert trên Windows bằng OpenSSL
│   └── generate_cert.sh                       # Script tạo cert trên Linux / macOS
├── compose.yaml                               # Khai báo db, api1, api2, proxy, volumes, networks, healthcheck
├── switch_stage.ps1                           # Script chuyển đổi nhanh 5 stage NGINX & reload tự động
├── test_demo.ps1                              # Script kiểm thử tự động toàn diện 6 bước bằng PowerShell
└── generate_sample_images.py                  # Script sinh ảnh PNG thực phục vụ bài test 413
```

---

### 2. Các Lệnh Khởi động, Chuyển Stage và Dọn dẹp

#### 2.1. Khởi động toàn bộ stack
Mở PowerShell tại thư mục `demo/`:
```powershell
# 1. Khởi động các container ngầm (background)
docker compose up -d --build

# 2. Kiểm tra trạng thái container và healthcheck
docker compose ps
```
Cả 4 container:
- `huce_postgres_db` (Up / healthy)
- `huce_api_1` (Up / healthy)
- `huce_api_2` (Up / healthy)
- `huce_nginx_proxy` (Up / running)

#### 2.2. Chuyển đổi nhanh cấu hình NGINX theo từng bước demo
Sử dụng script tiện ích `switch_stage.ps1` để sao chép file cấu hình tương ứng vào `nginx/conf.d/default.conf`, tự động chạy `docker compose exec proxy nginx -t` kiểm tra cú pháp và `nginx -s reload` nạp nóng:

```powershell
# Chuyển về Bước 1: Chỉ phục vụ Web Server tĩnh
.\switch_stage.ps1 1

# Chuyển về Bước 2: Reverse Proxy tới 1 backend (api1)
.\switch_stage.ps1 2

# Chuyển về Bước 3: Cụm Upstream cân bằng tải 2 backend (api1 & api2)
.\switch_stage.ps1 3

# Chuyển về Bước 5: Nâng hạn mức client_max_body_size 20m
.\switch_stage.ps1 5

# Chuyển về Bước 6: Cấu hình chuẩn đầy đủ HTTP (80) + HTTPS (443)
.\switch_stage.ps1 6
```

#### 2.3. Theo dõi nhật ký (Logs)
```powershell
# Theo dõi log NGINX Gateway
docker compose logs -f proxy

# Theo dõi đồng thời log cả 2 backend Node.js
docker compose logs -f api1 api2
```

#### 2.4. Dừng và dọn dẹp hệ thống
```powershell
# Dừng container, bảo lưu dữ liệu CSDL và ảnh upload
docker compose down

# Dừng và xóa trắng toàn bộ volume (reset CSDL từ đầu)
docker compose down -v
```

---

### 3. Kịch bản Thuyết trình & Demo Thực hành Chi tiết (10 – 15 Phút)

Kịch bản được thiết kế bám sát 100% mục tiêu của đề bài Buổi 8 PDF, phân công rõ ràng cho 4 thành viên Nhóm 8:

#### Pha 1: Giới thiệu Kiến trúc & Khởi động Hệ thống (2 phút)
- **Người trình bày**: Nguyễn Đức Mạnh & Nguyễn Tất Mạnh.
- **Thao tác**:
  1. Chiếu Slide 1 & 2 giới thiệu Nhóm 8 và dự án **HUCE Learning Store**.
  2. Mở terminal tại thư mục `demo/`, chạy `docker compose up -d` và `docker compose ps`.
  3. Chỉ cho Hội đồng thấy 4 container đều ở trạng thái `healthy`, cổng host chỉ mở duy nhất `8080:80` và `8443:443` cho NGINX, các backend hoàn toàn ẩn bên trong mạng `app_net`.

#### Pha 2: Bước 1 & Bước 2 — Web Server Tĩnh, SPA Routing & Same-Origin API (3 phút)
- **Người trình bày**: Nguyễn Đức Mạnh.
- **Thao tác**:
  1. Chuyển NGINX sang cấu hình tĩnh: `.\switch_stage.ps1 1`.
  2. Mở trình duyệt tại `http://localhost:8080/`. Giao diện storefront HUCE Learning Store xuất hiện với banner thông báo chế độ Web Server tĩnh.
  3. Nhấn vào một cuốn sách bất kỳ, URL trên thanh địa chỉ chuyển thành `/products/1`. Nhấn phím **F5 (Reload trang)**.
     - **Giải thích**: Trang web vẫn tải lại hoàn hảo, không bị lỗi 404 nhờ chỉ thị `try_files $uri $uri/ /index.html;`.
  4. Chuyển NGINX sang cấu hình Reverse Proxy: `.\switch_stage.ps1 2`.
  5. Reload lại trang web, danh mục học liệu từ CSDL PostgreSQL lập tức xuất hiện.
  6. Mở DevTools (F12) tab Network: cho thấy request `GET /api/products` và thêm vào giỏ hàng `POST /api/orders` đều gửi tới cùng origin `http://localhost:8080`, chứng minh không bị chặn CORS.

#### Pha 3: Bước 3 & Bước 4 — Upstream Cân bằng tải & Docker Service Discovery (3 phút)
- **Người trình bày**: Nguyễn Tất Mạnh.
- **Thao tác**:
  1. Kích hoạt Upstream 2 backend: `.\switch_stage.ps1 3`.
  2. Trên giao diện web, tìm tới khu vực **"Bảng Điều khiển Đo Kiểm NGINX"**, bấm nút **"Gửi liên tiếp 10 request (Test Round-Robin)"**.
  3. Quan sát kết quả: Huy hiệu `api1` và `api2` thay phiên nhau nhận request (tỷ lệ xấp xỉ 5/5). Header `X-Backend-Instance` và trường `instanceId` trong JSON phản hồi luân phiên chính xác.
  4. Mở terminal, chạy lệnh chứng minh Service Discovery nội bộ Docker:
     ```powershell
     docker compose exec proxy nslookup api1
     docker compose exec proxy nslookup api2
     ```
  5. **Giải thích**: Docker phân giải tên dịch vụ thành IP nội bộ `172.x.x.x`. Nếu cấu hình `localhost:3000`, NGINX sẽ tìm cổng 3000 của chính nó và lập tức trả mã lỗi **502 Bad Gateway**.
  6. Bấm nút **"Thanh tra Forwarded Headers (GET /api/info)"**: hiển thị rõ `Host: localhost:8080`, `X-Real-IP: 172.x.x.1`, `X-Forwarded-For: 172.x.x.1`, `X-Forwarded-Proto: http`.

#### Pha 4: Bước 5 — Bắt lỗi 413 & Zero-Downtime Hot Reload (3 phút)
- **Người trình bày**: Đỗ Công Trí.
- **Thao tác**:
  1. Đảm bảo cấu hình NGINX đang ở mức mặc định 1 MB (`client_max_body_size 1m;` trong Stage 3).
  2. Tại giao diện Admin (hoặc Demo Console), chọn file ảnh bìa lớn `sample_cover_large.png` (dung lượng 1.34 MB) rồi bấm **"Tải lên ảnh bìa"**.
  3. Quan sát phản hồi: Trình duyệt nhận ngay mã lỗi **HTTP 413 Payload Too Large**.
     - **Giải thích**: NGINX từ chối request ngay tại tầng reverse proxy để bảo vệ tài nguyên RAM/Disk của backend.
  4. Thực hiện nâng hạn mức lên 20 MB mà không tắt hệ thống:
     ```powershell
     .\switch_stage.ps1 5
     ```
     Script sẽ tự động sao chép cấu hình `client_max_body_size 20m;`, kiểm tra cú pháp `nginx -t` thành công và gửi tín hiệu `nginx -s reload`.
  5. Bấm lại nút **"Tải lên ảnh bìa"**: Request tải lên thành công tức thì với mã **HTTP 200 OK**, ảnh được lưu vào volume `uploads_data` dùng chung và hiển thị ngay trên storefront.

#### Pha 5: Bước 6 — Domain Local & HTTPS Tự ký có SAN (3 phút)
- **Người trình bày**: Nguyễn Huy Hoàng.
- **Thao tác**:
  1. Thêm dòng sau vào tệp `C:\Windows\System32\drivers\etc\hosts` (trên Windows) hoặc `/etc/hosts` (trên Linux):
     ```text
     127.0.0.1  myapp.local
     ```
  2. Kích hoạt cấu hình đầy đủ HTTP và HTTPS: `.\switch_stage.ps1 6`.
  3. Mở trình duyệt và truy cập: `https://myapp.local:8443/`.
  4. Quan sát: Trình duyệt cảnh báo bảo mật đỏ `NET::ERR_CERT_AUTHORITY_INVALID`.
     - **Giải thích**: Kênh truyền TLS được mã hóa an toàn, nhưng vì chứng chỉ do nhóm tự ký bằng OpenSSL (Self-Signed) chứ không phải do CA công cộng trong Trust Store (như Let's Encrypt hay DigiCert) phát hành nên trình duyệt cảnh báo danh tính.
  5. Bấm **"Advanced (Nâng cao) → Proceed to myapp.local"**: Storefront HUCE Learning Store hiển thị trơn tru dưới giao thức HTTPS an toàn, chứng minh cơ chế SSL Termination tại NGINX.

#### Pha 6: Tổng kết & Trả lời Câu hỏi của Giảng viên (1 phút)
- **Đại diện Nhóm 8**: Nguyễn Tất Mạnh.
- Chiếu Slide 20 (Bảng kiểm tra thực hành 6 bước). Tuyên bố hoàn thành trọn vẹn toàn bộ 6/6 yêu cầu kỹ thuật của Đề cương PDF Buổi 8.

---

### 4. Kiểm thử Tự động Toàn diện với PowerShell (`test_demo.ps1`)

Nếu muốn kiểm tra toàn bộ 6 bước mà không cần thao tác tay trên giao diện web, chạy script kiểm thử tự động:

```powershell
cd demo
powershell -ExecutionPolicy Bypass -File test_demo.ps1
```

Script sẽ tuần tự kiểm tra:
1. `GET http://localhost:8080/` (Kiểm tra HTTP 200 frontend tĩnh).
2. `GET http://localhost:8080/products/1` (Kiểm tra SPA fallback try_files).
3. `GET http://localhost:8080/api/products` (Kiểm tra đọc dữ liệu PostgreSQL).
4. `POST http://localhost:8080/api/orders` (Kiểm tra tạo đơn hàng thực tế).
5. Gửi 10 request liên tiếp kiểm tra Round-Robin và header `X-Backend-Instance`.
6. Upload ảnh lớn `sample_cover_large.png` (1.34 MB) để bắt lỗi HTTP 413, sau đó reload 20m và kiểm tra upload thành công HTTP 200.
7. `curl -k https://localhost:8443/` (Kiểm tra SSL Termination).

---

### 5. Minh bạch về Hiện trạng Kiểm thử (Verification Transparency)

- **Đã kiểm chứng trực tiếp thành công trong môi trường phát triển (Verified Locally)**:
  - Máy chủ Node.js Express (`server.js`): Kiểm tra cú pháp và cấu trúc route hoàn chỉnh không có lỗi runtime.
  - Các tệp ảnh thử nghiệm (`sample_cover_small.png` 28 KB, `sample_cover_large.png` 1.34 MB): Đã sinh thật bằng thư viện Pillow, có cấu trúc byte hợp lệ và dung lượng thực tế vượt ngưỡng 1 MB để kích hoạt chuẩn xác lỗi 413.
  - Bộ chứng chỉ SSL tự ký có SAN (`demo/ssl/myapp.crt`): Đã xác thực cấu trúc X.509 với OpenSSL, có trường `Subject Alternative Name: DNS:myapp.local`.
  - Bộ sinh slide thuyết trình (`generate_nginx_lesson8.py`): Đã chạy thành công sinh cả hai tệp `NGINX_Buoi_8_Nhom_8.pptx` và `NGINX_Buoi_8_Nhom_7.pptx` (20 slide, đầy đủ logo HUCE, đồng bộ chuẩn xác Nhóm 8).
  - Tệp khai báo Docker Compose (`compose.yaml`): Đã kiểm tra cú pháp thành công với lệnh `docker compose config` (exit code 0).
- **Thực thi trên Docker Daemon trong Buổi thuyết trình (Expected Container Runtime)**:
  - Khi khởi động Docker Desktop trên máy giảng đường, các container sẽ tự động dựng và nạp dữ liệu từ các tệp nguồn có sẵn. Tất cả script tiện ích (`switch_stage.ps1`, `test_demo.ps1`) đã sẵn sàng phục vụ buổi bảo vệ.
