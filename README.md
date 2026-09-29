# BÁO CÁO BÀI TẬP LỚN SERVER NÂNG CAO - BUỔI 8
## CẤU HÌNH NGINX REVERSE PROXY – UPSTREAM NHIỀU BACKEND

**Đơn vị đào tạo**: Khoa Công nghệ Thông tin – Trường Đại học Xây dựng Hà Nội (HUCE)  
**Nhóm thực hiện**: **Nhóm 8**  
**Học phần**: Hệ thống Server Nâng cao  
**Học kỳ / Năm học**: Tháng 10 năm 2026  

---

### Danh sách Thành viên Nhóm 8

| STT | Mã sinh viên | Họ và tên sinh viên | Vai trò / Nhiệm vụ chính trong dự án |
| :---: | :---: | :--- | :--- |
| 1 | **0210668** | Nguyễn Đức Mạnh | Nghiên cứu NGINX Web Server tĩnh, SPA fallback (`try_files`), tích hợp 4 Forwarded Headers |
| 2 | **0210768** | Nguyễn Tất Mạnh | Thiết kế cụm Upstream cân bằng tải Round-Robin, Docker Compose Network & Service Discovery |
| 3 | **0214268** | Đỗ Công Trí | Cấu hình kiểm soát Request Body (413), Hot Reload nạp nóng cấu hình & điều tra xử lý sự cố |
| 4 | **0208368** | Nguyễn Huy Hoàng | Giả lập Domain local (`myapp.local`), Cấu hình HTTPS SSL tự ký có SAN & Chuỗi tin cậy CA |

---

### 1. Giới thiệu Bộ Slide Thuyết trình PowerPoint

Bộ slide thuyết trình chính thức `NGINX_Buoi_8_Nhom_8.pptx` (cùng bản sao tương thích `NGINX_Buoi_8_Nhom_7.pptx`) được sinh hoàn toàn tự động bằng Python script `generate_nginx_lesson8.py`, tuân thủ chuẩn mực học thuật HUCE và bám sát 100% đề cương bài tập lớn:

- **Định dạng**: 16:9 Widescreen (13.333 x 7.5 inches).
- **Màu sắc nhận diện HUCE**: Deep Navy (`#103672`), Royal Blue (`#1C64BA`), Soft Cyan (`#0284C7`), nền trắng sáng dịu mắt (`#FFFFFF` / `#F8FAFC`).
- **Khung học thuật chuẩn mực**:
  - Mọi slide nội dung đều có Header mang logo chính thức của trường và dòng chữ `TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI`.
  - Chân trang ghi rõ `Hà Nội, tháng 10 năm 2026`, tên chuyên đề Nhóm 8 và đánh số trang động `Trang X / 20`.
- **Tính khả biến cao (Fully Editable)**: Tất cả chữ, bảng biểu, sơ đồ luồng dữ liệu (Routing Flow, Upstream Cluster, Chain of Trust), bảng so sánh và khối code đều là các vector shape / native shape trong PowerPoint, tuyệt đối không dùng ảnh chụp màn hình chèn vào.
- **Presenter Notes chi tiết**: Mỗi slide đều chứa ghi chú đầy đủ: mục tiêu giảng giải, thao tác demo tương ứng, và tài liệu trích dẫn chuẩn mực.

---

### 2. Dự án Thực hành: Cửa hàng Học liệu & Khóa học HUCE Learning Store

Dự án nằm trọn vẹn trong thư mục `demo/`, cung cấp một hệ thống phân tán thực tế có thể chạy ngay bằng Docker Compose:

1. **Frontend Tĩnh (SPA Storefront)**:
   - Giao diện HTML5/CSS3/JavaScript thuần, thiết kế chuyên nghiệp theo nhận diện học viện HUCE.
   - Hỗ trợ client-side routing (`/products/:id`) với cơ chế fallback NGINX `try_files $uri $uri/ /index.html;` (F5 không bao giờ bị lỗi 404).
   - Tích hợp bộ lọc sách & khóa học, tìm kiếm thời gian thực, giỏ hàng, đặt hàng thực tế vào CSDL, bảng điều khiển bắn 10 request liên tiếp đo cân bằng tải, thanh tra 4 proxy headers, và công cụ upload ảnh bìa kiểm chứng lỗi 413.
2. **Backend Node.js 20 (Express)**:
   - Tổ chức theo kiến trúc 3 tầng chuẩn mực: **Controller → Service → Repository**.
   - Chạy 2 instance độc lập (`api1:3000` và `api2:3000`) từ cùng một Dockerfile, non-root user `USER node`.
   - Kết nối cơ sở dữ liệu quan hệ PostgreSQL (`db:5432`) qua connection pool (`pg.Pool`), hỗ trợ transaction an toàn chống race-condition (`SELECT ... FOR UPDATE` khi trừ tồn kho sách).
   - Tuyệt đối không dùng dữ liệu giả lập (In-Memory Fallback): khi CSDL ngắt, backend trả mã 503 và endpoint `/api/health` báo `unhealthy`, phản ánh đúng thực trạng hạ tầng.
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
- Python 3.8+ (để sinh slide PowerPoint và ảnh mẫu test)
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

#### Chuyển đổi nhanh cấu hình NGINX theo từng bước demo (Hot Reload)
```powershell
cd demo
# Bước 1: Web server tĩnh
.\switch_stage.ps1 1

# Bước 2: Reverse Proxy 1 backend (api1)
.\switch_stage.ps1 2

# Bước 3: Cụm Upstream cân bằng tải 2 backend
.\switch_stage.ps1 3

# Bước 5: Nâng hạn mức body lên 20m
.\switch_stage.ps1 5

# Bước 6: Cấu hình chuẩn đầy đủ HTTP + HTTPS
.\switch_stage.ps1 6
```

#### Kiểm thử tự động 6 bước bằng PowerShell
```powershell
cd demo
powershell -ExecutionPolicy Bypass -File test_demo.ps1
```

#### Dừng và dọn dẹp hệ thống
```bash
cd demo
# Dừng container, bảo lưu dữ liệu CSDL
docker compose down

# Dừng và xóa toàn bộ dữ liệu CSDL & ảnh upload
docker compose down -v
```

---

### 4. Danh mục Kiểm tra Thực hành 6 Bước (Section 3 PDF)

| Bước | Mục tiêu kỹ thuật | Thao tác thực tế | Kết quả quan sát |
| :---: | :--- | :--- | :--- |
| **1** | NGINX làm Web Server & SPA Fallback | Mở `http://localhost:8080/`. Click vào chi tiết sách/khóa học và bấm F5. | Trang web tải thành công (HTTP 200 OK). Khi F5 tại route `/products/1`, NGINX `try_files` trả về `index.html` mượt mà không bị 404. |
| **2** | Reverse Proxy Ghép cặp FE-BE & Khử CORS | Xem danh mục học liệu và tạo đơn hàng thử nghiệm (`POST /api/orders`). | Đơn hàng lưu thành công vào PostgreSQL. Console không có cảnh báo CORS nhờ môi trường Same-Origin. Log backend ghi nhận request. |
| **3** | Cụm Upstream Cân bằng tải | Bấm nút "Gửi liên tiếp 10 request" trên giao diện web. | 10 request `GET /api/products` được gửi; trường `instanceId` và header `X-Backend-Instance` luân phiên chia tải giữa `api1` và `api2`. |
| **4** | Docker Service Discovery vs localhost | Chạy: `docker compose exec proxy nslookup api1` | NGINX phân giải thành công IP nội bộ `172.x.x.x` của `api1`. Giải thích lỗi 502 nếu dùng `localhost:3000` do khác network namespace. |
| **5** | Bắt lỗi 413 & Zero-Downtime Reload | 1. Tải ảnh bìa mẫu 1.34 MB -> Bắt lỗi **413 Payload Too Large**.<br>2. Chuyển stage: `.\switch_stage.ps1 5` (`client_max_body_size 20m;`).<br>3. Upload lại. | Lần 1: Nhận ngay mã HTTP 413.<br>Sau khi reload nóng: Nhận HTTP 200 OK, ảnh lưu vào volume chung `uploads_data` và hiển thị trên web. |
| **6** | Domain Ảo & HTTPS Tự ký có SAN | 1. Thêm `127.0.0.1  myapp.local` vào tệp hosts.<br>2. Mở trình duyệt: `https://myapp.local:8443/`. | Trình duyệt cảnh báo đỏ `NET::ERR_CERT_AUTHORITY_INVALID` vì SSL tự ký thiếu Root CA công cộng bảo lãnh. Bấm Tiếp tục để duyệt web an toàn qua kênh TLS. |

---

### 5. Tính Minh bạch trong Kiểm thử (Verification Transparency)

- **Đã kiểm chứng trực tiếp trên máy (Locally Verified)**:
  - Mã nguồn Backend Node.js 20 (`server.js`): Cấu trúc route, controller, service, repository, kết nối db hoàn chỉnh không có lỗi cú pháp.
  - Tệp ảnh kiểm thử (`sample_cover_small.png` 28 KB, `sample_cover_large.png` 1.34 MB): Được sinh bằng Pillow với dữ liệu ảnh thực, dung lượng vượt 1 MB để kích hoạt chính xác lỗi HTTP 413.
  - Bộ chứng chỉ SSL tự ký có SAN (`demo/ssl/myapp.crt`): Đã xác thực qua OpenSSL với trường `Subject Alternative Name: DNS:myapp.local`.
  - Bộ sinh slide (`generate_nginx_lesson8.py`): Đã chạy sinh thành công file PowerPoint `NGINX_Buoi_8_Nhom_8.pptx` (và bản sao `NGINX_Buoi_8_Nhom_7.pptx`) đầy đủ 20 slide, đồng bộ 100% nhận diện Nhóm 8.
  - Tệp Compose (`compose.yaml`): Đã kiểm tra cú pháp thành công với `docker compose config` (exit code 0).
- **Thực thi trên Docker Daemon trong Buổi thuyết trình (Expected Container Runtime)**:
  - Khi khởi động Docker Desktop trên máy giảng đường, các container sẽ tự động dựng và nạp dữ liệu từ các tệp nguồn có sẵn. Tất cả script tiện ích (`switch_stage.ps1`, `test_demo.ps1`) đã sẵn sàng phục vụ buổi bảo vệ.
