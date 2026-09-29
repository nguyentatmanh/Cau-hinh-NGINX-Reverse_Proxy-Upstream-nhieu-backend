# BÁO CÁO BÀI TẬP LỚN SERVER NÂNG CAO - BUỔI 8
## CẤU HÌNH NGINX REVERSE PROXY – UPSTREAM NHIỀU BACKEND

**Đơn vị đào tạo**: Khoa Công nghệ Thông tin – Trường Đại học Xây dựng Hà Nội (HUCE)  
**Nhóm thực hiện**: Nhóm 8  
**Thời gian**: Tháng 10 năm 2026  

---

### Danh sách Thành viên Nhóm 8

| STT | Mã sinh viên | Họ và tên sinh viên | Vai trò / Nhiệm vụ chính |
| :---: | :---: | :--- | :--- |
| 1 | **0210668** | Nguyễn Đức Mạnh | Nghiên cứu NGINX Web Server, SPA fallback & Proxy Headers |
| 2 | **0210768** | Nguyễn Tất Mạnh | Thiết kế Upstream cân bằng tải, Docker Compose Network |
| 3 | **0214268** | Đỗ Công Trí | Cấu hình giới hạn Body (413), Hot Reload & Xử lý lỗi |
| 4 | **0208368** | Nguyễn Huy Hoàng | Giả lập Domain local, Cấu hình HTTPS Tự ký & Certbot |

---

### 1. Giới thiệu Bài thuyết trình

Bộ slide thuyết trình `NGINX_Buoi_8_Nhom_8.pptx` được thiết kế chuẩn mực học thuật dành cho môn học **Hệ thống Server Nâng cao**, bám sát 100% yêu cầu nội dung trong tài liệu `Buổi 8 Cấu hình NGINX reverse proxy – Upstream nhiều backend (1).pdf`.

- **Định dạng**: 16:9 Widescreen (13.333 x 7.5 inches).
- **Màu sắc nhận diện**: HUCE Deep Navy (`#103672`), Royal Blue (`#1C64BA`), Soft Cyan (`#0EA5E9`), nền sáng sang trọng (`#F8FAFC`).
- **Khung tiêu chuẩn**: Mọi slide nội dung (từ slide 2 đến 20) đều có Header trang trọng mang logo chính thức của trường và dòng chữ `TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI`, chân trang `Hà Nội, tháng 10 năm 2026` cùng số trang động.
- **Tính khả biến (Editable)**: Toàn bộ text, bảng biểu, sơ đồ luồng dữ liệu (Routing Flow, Upstream Cluster, Docker Network, Chain of Trust), khối code đều là các vector shape / native shape trong PowerPoint, không sử dụng ảnh chụp tĩnh đóng khung.
- **Presenter Notes**: Đầy đủ ghi chú thuyết trình chi tiết cho từng slide (nội dung cần trình bày, kịch bản demo, tài liệu trích dẫn).

---

### 2. Hướng dẫn Tái tạo Slide (Regeneration)

Để sinh lại bài thuyết trình `NGINX_Buoi_8_Nhom_8.pptx` từ mã nguồn Python:

#### Bước 1: Cài đặt thư viện phụ thuộc
Đảm bảo đã cài Python 3.8+ và cài đặt package:
```bash
pip install -r requirements.txt
```
*(Chỉ cần thư viện `python-pptx>=1.0.2`)*

#### Bước 2: Chạy script sinh PowerPoint
```bash
python generate_nginx_lesson8.py
```
Sau vài giây, tệp `NGINX_Buoi_8_Nhom_8.pptx` sẽ được sinh ra ngay tại thư mục gốc với đầy đủ 20 slide chất lượng cao.

---

### 3. Nguồn gốc Tài nguyên & Logo Trường (Asset Attribution)

- **Logo Đại học Xây dựng Hà Nội**:
  - Tệp: `assets/huce_logo.png` (sao chép từ `assets/LOGO-HUCE-AI_3.png`).
  - Nguồn trích xuất: Cổng thông tin Hệ thống nhận diện thương hiệu HUCE chính thức tại [https://huce.edu.vn/he-thong-nhan-dien](https://huce.edu.vn/he-thong-nhan-dien).
  - Tải trực tiếp từ liên kết Google Drive chính thức do Nhà trường công bố (Mục "Logo HUCE dạng vector và PNG độ phân giải cao").
  - Tỷ lệ kích thước gốc (2270 x 2241 px) được bảo toàn nguyên vẹn, không bóp méo hay vẽ lại.

---

### 4. Cấu trúc 20 Slide & Bảng Ma trận Yêu cầu

| Slide | Tiêu đề nội dung | Ánh xạ yêu cầu đề bài & Mục demo |
| :---: | :--- | :--- |
| **01** | Trang bìa BUỔI 8 - CẤU HÌNH NGINX REVERSE PROXY - NHÓM 8 | Bìa trang trọng, bảng 4 thành viên chính xác 100% MSSV và họ tên |
| **02** | Kế thừa Buổi 7 & Nhu cầu Buổi 8 | Kết nối kiến thức Docker Compose Buổi 7 sang NGINX Gateway |
| **03** | Bản chất NGINX: Kiến trúc Hướng sự kiện | Khái niệm NGINX, Event-driven non-blocking I/O vs Thread-based |
| **04** | Phân định Web Server, Reverse Proxy & Load Balancer | Phân biệt 3 vai trò then chốt trên cùng 1 hệ thống |
| **05** | Nền tảng Mạng & Giao thức Web | Phân tích IP, Domain, Hosts file, Port 80/443, HTTP vs HTTPS |
| **06** | Sơ đồ Luồng Yêu cầu (Request-Response Flow) | Sơ đồ vector luồng routing: Client -> NGINX -> Static FE / BE |
| **07** | Quản trị Cấu hình NGINX: Linux vs Docker | Khác biệt `sites-available`/`sites-enabled` trên OS và `conf.d/` trong Docker |
| **08** | NGINX làm Web Server: Phục vụ File Tĩnh | **Kế hoạch Demo Bước 1**: `root`, `index`, zero-copy I/O |
| **09** | SPA Fallback với try_files & Lỗi 404 khi F5 | Phân tích bản chất client-side routing và cơ chế fallback an toàn |
| **10** | NGINX Reverse Proxy: Ghép cặp FE - BE & Xóa bỏ CORS | **Kế hoạch Demo Bước 2**: Khử CORS qua Same-Origin, API `/api/v1/products` |
| **11** | Các Proxy Headers Quan trọng | `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` & Log Backend |
| **12** | Cấu hình Upstream Cân bằng tải | **Kế hoạch Demo Bước 3**: Upstream 2 backend, Round-robin, least_conn |
| **13** | Mạng Docker Compose & Service Discovery | **Kế hoạch Demo Bước 4**: NGINX gọi backend qua Service Name, bẫy `localhost` |
| **14** | Cấu trúc Toàn diện Server Block Production | Giải phẫu hoàn chỉnh cú pháp NGINX: `server`, `location`, `logs`, `limits` |
| **15** | Giới hạn Kích thước Body & Hot Reload | **Kế hoạch Demo Bước 5**: Bắt lỗi 413, tăng `client_max_body_size`, `nginx -t` |
| **16** | Giả lập Domain Local với Hosts File | Phân biệt cấu hình hosts trên Windows Browser, WSL và Linux Curl |
| **17** | Cấu hình HTTPS với SSL Tự ký | **Kế hoạch Demo Bước 6**: OpenSSL key/cert, `443 ssl`, cảnh báo bảo mật |
| **18** | Chuỗi Tin cậy (Chain of Trust) & Certbot | Sơ đồ Root CA -> Intermediate CA -> Server Cert; Cơ chế Let's Encrypt |
| **19** | Kỹ năng Điều tra & Xử lý sự cố NGINX | Cẩm nang gỡ lỗi: `nginx -t`, reload nóng, tra cứu lỗi 404, 413, 502 |
| **20** | Tổng kết Buổi 8 & Danh mục Kiểm tra Thực hành | Bảng tổng kết 6 bước demo, thông điệp kết luận & cảm ơn |

---

### 5. Kế hoạch Demo Thực hành (Section 3 PDF)

Toàn bộ 6 bước demo được xây dựng với vai trò **Kế hoạch demo đề xuất (Proposed Demo Plan)** dựa trên bài toán nghiệp vụ thực tế (API quản lý dữ liệu `/api/v1/products` thay vì mock data `Hello World`):

1. **Bước 1 (Slide 8)**: Khởi chạy container NGINX mount thư mục build frontend tĩnh (`index.html`, `style.css`, `app.js`). Trình duyệt tải thành công trang chủ giao diện với mã `HTTP 200 OK`.
2. **Bước 2 (Slide 10)**: Bấm nút "Tải danh sách sản phẩm" gọi `GET /api/v1/products`. Frontend và Backend cùng chung Origin qua NGINX nên sạch hoàn toàn lỗi CORS; backend log ra IP thực tế.
3. **Bước 3 (Slide 12)**: Khởi chạy 2 instance backend (`api1:5000` và `api2:5000`) sau khối `upstream`. Gửi liên tiếp 10 request và quan sát log phản hồi luân phiên 50/50 theo thuật toán Round-robin.
4. **Bước 4 (Slide 13)**: Chứng minh NGINX định tuyến tới backend qua Docker Service Discovery (`http://backend_cluster`). Giải thích rõ sự khác biệt giữa `localhost` bên trong container và `localhost` máy host.
5. **Bước 5 (Slide 15)**: Gửi request body vượt quá 1 MB (ví dụ upload file 5 MB), NGINX trả về mã `413 Payload Too Large`. Bổ sung `client_max_body_size 20M;`, kiểm tra cú pháp `nginx -t`, nạp nóng `nginx -s reload` và gửi lại thành công `200 OK`.
6. **Bước 6 (Slide 17)**: Ánh xạ tệp hosts máy Windows (`127.0.0.1 myapp.local`), kích hoạt SSL tự ký trên cổng 443. Truy cập `https://myapp.local:8443`, quan sát cảnh báo đỏ của trình duyệt và giải thích nguyên nhân do thiếu Root CA bảo lãnh.

*Lưu ý: Do không gian làm việc ban đầu chỉ bàn giao tài liệu yêu cầu (PDF) và slide Buổi 7 tham khảo (`Nhóm 6.pptx`), các bước demo được định nghĩa theo kịch bản chuẩn kỹ thuật sẵn sàng chạy khi có mã nguồn.*
