# BÁO CÁO BÀI TẬP LỚN SERVER NÂNG CAO - BUỔI 8
## CẤU HÌNH NGINX REVERSE PROXY – UPSTREAM NHIỀU BACKEND

**Đơn vị đào tạo**: Khoa Công nghệ Thông tin – Trường Đại học Xây dựng Hà Nội (HUCE)  
**Nhóm thực hiện**: Nhóm 7 (Đồng bộ tương thích Nhóm 8)  
**Học phần**: Hệ thống Server Nâng cao  
**Học kỳ / Năm học**: Tháng 10 năm 2026  

---

### Danh sách Thành viên Nhóm

| STT | Mã sinh viên | Họ và tên sinh viên | Vai trò / Nhiệm vụ chính trong dự án |
| :---: | :---: | :--- | :--- |
| 1 | **0210668** | Nguyễn Đức Mạnh | Nghiên cứu NGINX Web Server, SPA fallback (`try_files`) & 4 Forwarded Headers |
| 2 | **0210768** | Nguyễn Tất Mạnh | Thiết kế Cụm Upstream Cân bằng tải, Docker Compose Network & Service Discovery |
| 3 | **0214268** | Đỗ Công Trí | Cấu hình giới hạn Body (413), Zero-Downtime Hot Reload & Xử lý sự cố |
| 4 | **0208368** | Nguyễn Huy Hoàng | Giả lập Domain local (`myapp.local`), Cấu hình HTTPS Tự ký có SAN & Chuỗi tin cậy |

---

### 1. Giới thiệu Bộ Slide Thuyết trình PowerPoint

Bộ slide thuyết trình `NGINX_Buoi_8_Nhom_7.pptx` (và bản sao tương thích `NGINX_Buoi_8_Nhom_8.pptx`) được sinh hoàn toàn tự động bằng Python script `generate_nginx_lesson8.py`, tuân thủ chuẩn mực học thuật HUCE và bám sát 100% đề cương bài tập lớn:

- **Định dạng**: 16:9 Widescreen (13.333 x 7.5 inches).
- **Màu sắc nhận diện HUCE**: Deep Navy (`#003366`), Royal Blue (`#1C64BA`), Soft Cyan (`#0EA5E9`), nền sáng dịu mắt (`#F8FAFC`).
- **Khung học thuật chuẩn mực**:
  - Mọi slide nội dung đều có Header mang logo chính thức của trường và dòng chữ `TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI`.
  - Chân trang ghi rõ `Hà Nội, tháng 10 năm 2026` kèm đánh số trang động `Trang X / 20`.
- **Tính khả biến cao (Fully Editable)**: Tất cả chữ, bảng biểu, sơ đồ luồng dữ liệu (Routing Flow, Upstream Cluster, Chain of Trust), bảng so sánh và khối code đều là các vector shape / native shape trong PowerPoint, tuyệt đối không dùng ảnh chụp màn hình đóng khung.
- **Presenter Notes chi tiết**: Mỗi slide đều chứa ghi chú đầy đủ: mục tiêu giảng giải, thao tác demo tương ứng, và tài liệu trích dẫn chuẩn mực.

---

### 2. Dự án Thực hành: Quản lý Sản phẩm Mini (Mini Product Management)

Dự án nằm trọn vẹn trong thư mục `demo/`, cung cấp một hệ thống phân tán thực tế có thể chạy ngay bằng Docker Compose:

1. **Frontend Tĩnh (SPA)**:
   - Giao diện HTML5/CSS3/JavaScript thuần, thiết kế theo nhận diện HUCE.
   - Hỗ trợ client-side routing (`/products/:id`) với cơ chế fallback NGINX `try_files $uri $uri/ /index.html;` (F5 không bao giờ bị lỗi 404).
   - Tích hợp sẵn form thêm mới sản phẩm, bộ công cụ tạo payload test 413, bảng điều khiển bắn 10 request liên tiếp đo cân bằng tải, và thanh tra 4 proxy headers.
2. **Backend Node.js 20 (Express)**:
   - Tổ chức theo kiến trúc 3 tầng chuẩn mực: **Controller - Service - Repository**.
   - Chạy 2 instance độc lập (`api1:3000` và `api2:3000`) từ cùng một Dockerfile, non-root user `USER node`.
   - Kết nối cơ sở dữ liệu quan hệ PostgreSQL (`db:5432`) qua connection pool (`pg.Pool`), có cơ chế dự phòng In-Memory fallback.
   - Dùng chung volume lưu trữ ảnh upload `uploads_data:/app/uploads`.
   - Ghi log chi tiết mỗi request: so sánh giữa IP peer kết nối trực tiếp (`req.socket.remoteAddress`) và các header NGINX chuyển tiếp (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`).
3. **NGINX Gateway (`proxy`)**:
   - Cổng truy cập công khai duy nhất ra máy host: `8080:80` (HTTP) và `8443:443` (HTTPS).
   - Backend và Database không cần publish cổng ra host, bảo mật an toàn bên trong mạng Docker bridge `app_net`.
   - Cân bằng tải Round-Robin giữa `api1:3000` và `api2:3000`.
   - Kiểm soát dung lượng body (`client_max_body_size 1m;` nâng lên `20m;`), hỗ trợ nạp nóng cấu hình `nginx -s reload`.
   - Chấm dứt SSL/TLS với chứng chỉ tự ký có trường SAN `DNS:myapp.local`.

---

### 3. Hướng dẫn Khởi chạy Hệ thống Demo

#### Yêu cầu môi trường
- Python 3.8+ (để sinh slide)
- Docker Desktop hoặc Docker Engine + Docker Compose

#### Tái tạo bài thuyết trình PowerPoint
```bash
pip install -r requirements.txt
python generate_nginx_lesson8.py
```

#### Khởi chạy toàn bộ hệ thống Demo với Docker Compose
```bash
cd demo
# Khởi động cụm 4 container (db, api1, api2, proxy)
docker compose up -d --build

# Kiểm tra trạng thái container và healthcheck
docker compose ps
```

#### Kiểm thử tự động 6 bước bằng PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File test_demo.ps1
```

#### Dừng và dọn dẹp hệ thống
```bash
# Dừng container, bảo lưu dữ liệu CSDL
docker compose down

# Dừng và xóa toàn bộ dữ liệu CSDL & ảnh upload
docker compose down -v
```

---

### 4. Danh mục Kiểm tra Thực hành 6 Bước (Section 3 PDF)

| Bước | Mục tiêu kỹ thuật | Thao tác thực tế | Kết quả quan sát |
| :---: | :--- | :--- | :--- |
| **1** | NGINX làm Web Server & SPA Fallback | Mở `http://localhost:8080/`. Click vào chi tiết sản phẩm và bấm F5. | Trang web tải thành công (HTTP 200 OK). Khi F5 tại route `/products/1`, NGINX `try_files` trả về `index.html` mượt mà không bị 404. |
| **2** | Reverse Proxy Ghép cặp FE-BE & Khử CORS | Xem danh sách và điền form thêm sản phẩm mới (`POST /api/products`). | Sản phẩm mới lưu thành công vào PostgreSQL. Console không có cảnh báo CORS nhờ môi trường Same-Origin. Log backend ghi nhận request. |
| **3** | Cụm Upstream Cân bằng tải | Bấm nút "Gửi liên tiếp 10 request" trên giao diện web. | 10 request `GET /api/products` được gửi; trường `instanceId` và header `X-Backend-Instance` luân phiên chia tải giữa `api1` và `api2`. |
| **4** | Docker Service Discovery vs localhost | Chạy: `docker compose exec proxy nslookup api1` | NGINX phân giải thành công IP nội bộ `172.x.x.x` của `api1`. Giải thích lỗi 502 nếu dùng `localhost:3000` do khác network namespace. |
| **5** | Bắt lỗi 413 & Zero-Downtime Reload | 1. Tải ảnh test 2.5 MB -> Bắt lỗi **413 Payload Too Large**.<br>2. Đổi cấu hình lên `client_max_body_size 20m;`.<br>3. Kiểm tra: `docker compose exec proxy nginx -t`<br>4. Nạp nóng: `docker compose exec proxy nginx -s reload`<br>5. Upload lại. | Lần 1: Nhận ngay mã HTTP 413.<br>Sau khi reload: Nhận HTTP 200 OK, ảnh lưu vào volume chung `uploads_data` và cả 2 backend đều truy cập được. |
| **6** | Domain Ảo & HTTPS Tự ký có SAN | 1. Thêm `127.0.0.1  myapp.local` vào tệp hosts.<br>2. Mở trình duyệt: `https://myapp.local:8443/`. | Trình duyệt cảnh báo đỏ `NET::ERR_CERT_AUTHORITY_INVALID` vì SSL tự ký thiếu Root CA công cộng bảo lãnh. Bấm Tiếp tục để duyệt web an toàn qua kênh TLS. |

---

### 5. Tính Minh bạch trong Kiểm thử (Verification Transparency)

- **Đã kiểm chứng trực tiếp trên máy (Locally Verified)**:
  - Mã nguồn Backend Node.js 20 (`server.js`): Chạy thực tế tại cổng 3000, kiểm thử trực tiếp `GET /api/products` (HTTP 200), `POST /api/products` (HTTP 201), logger request và header `X-Backend-Instance`.
  - Bộ chứng chỉ SSL tự ký có SAN (`demo/ssl/myapp.crt`): Đã xác thực qua OpenSSL với trường `Subject Alternative Name: DNS:myapp.local`.
  - Bộ sinh slide (`generate_nginx_lesson8.py`): Đã chạy sinh thành công file PowerPoint đầy đủ 20 slide, không phát sinh bất kỳ lỗi cú pháp hay đồ họa nào.
- **Kết quả dự kiến trên Docker Daemon (Expected Container Runtime)**:
  - Do Docker Desktop daemon hiện đang tắt trên máy này, các thao tác chạy trong môi trường container (`docker compose up`, `docker compose exec`, `nginx -s reload`) được bàn giao đầy đủ mã nguồn, script kiểm thử và bảng kết quả dự kiến chuẩn mực để chạy trên máy của bạn.
