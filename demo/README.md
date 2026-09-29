# HƯỚNG DẪN CHẠY DEMO THỰC HÀNH BUỔI 8 (NHÓM 7 - HUCE)
## HỆ THỐNG SERVER NÂNG CAO • NGINX REVERSE PROXY & UPSTREAM

Thư mục `demo/` cung cấp mã nguồn độc lập, hoàn chỉnh và sẵn sàng chạy thực tế cho bài thực hành Buổi 8. Ứng dụng bao gồm:
- **Frontend tĩnh**: Giao diện HTML/CSS/JS thuần, có các nút kiểm thử Same-Origin, Load Balancing, Proxy Headers và Upload thử mã 413.
- **Backend Node.js**: 2 instance chạy cổng nội bộ 3000, trả về `instanceId` (`backend-1` và `backend-2`), xử lý upload và log proxy headers.
- **NGINX Gateway**: Lắng nghe cổng host `8080` (HTTP) và `8443` (HTTPS), cấu hình Upstream, SPA fallback, proxy headers và SSL tự ký có SAN `myapp.local`.

---

### 1. Yêu cầu Trước khi Khởi động
- Đã cài đặt **Docker** và **Docker Compose**.
- Đã có chứng chỉ tự ký trong thư mục `demo/ssl/` (Tệp `myapp.crt` và `myapp.key` đã được tạo sẵn bằng OpenSSL; nếu cần tạo lại, chạy script `generate_cert.ps1` hoặc `generate_cert.sh`).

---

### 2. Các Bước Khởi động Hệ thống

Mở terminal tại thư mục `demo`:
```bash
# 1. Khởi động 3 container (proxy, backend1, backend2)
docker compose up -d --build

# 2. Kiểm tra trạng thái container
docker compose ps
```
Cả 3 container `huce_nginx_proxy`, `huce_backend_1`, `huce_backend_2` đều phải ở trạng thái `Up`.

---

### 3. Hướng dẫn Kiểm chứng 6 Bước Thực hành

#### Bước 1: NGINX phục vụ Frontend tĩnh
- Mở trình duyệt truy cập: `http://localhost:8080/`
- **Kết quả quan sát**: Giao diện trang chủ tải thành công, HTTP 200 OK.
- **Khái niệm chứng minh**: NGINX hoạt động như một Web Server tĩnh, phục vụ các file tĩnh qua chỉ thị `root` và `index`.

#### Bước 2: Reverse Proxy chuyển tiếp API & Khử CORS
- Trên giao diện web, nhấn nút **"Tải danh sách sản phẩm (1 req)"**.
- **Kết quả quan sát**: Bảng sản phẩm hiện lên đầy đủ; Console trình duyệt không có cảnh báo lỗi CORS; Backend ghi nhận request và log header.
- **Khái niệm chứng minh**: NGINX đóng vai trò Reverse Proxy, gom Frontend và Backend về chung một Origin (`http://localhost:8080`), loại bỏ rào cản CORS cho luồng gọi API nội bộ.

#### Bước 3: Cân bằng tải Upstream qua 2 Backend
- Trên giao diện web, nhấn nút **"Gửi liên tiếp 10 request (Test Load Balancing)"**.
- **Kết quả quan sát**: Các request được phân phối luân phiên giữa `backend-1` và `backend-2`.
- **Khái niệm chứng minh**: Khối `upstream backend_cluster` phân bổ tải request qua thuật toán Round-Robin.

#### Bước 4: Mạng Docker Compose & Service Discovery
- Mở terminal và kiểm tra khả năng phân giải DNS nội bộ của NGINX:
  ```bash
  docker compose exec proxy nslookup backend1
  ```
- **Kết quả quan sát**: NGINX phân giải được địa chỉ IP nội bộ của container `backend1` (dải `172.x.x.x`).
- **Khái niệm chứng minh**: Docker Internal DNS phân giải tên service name thành IP container trong cùng mạng cầu nối (`app_net`).

#### Bước 5: Giới hạn Request Body (Mã 413) & Hot Reload
1. Trên giao diện web, chọn payload dung lượng **2 MB** và bấm **"Gửi Payload (POST /api/upload)"**.
   - **Kết quả quan sát**: NGINX trả về ngay mã lỗi **`HTTP 413 Payload Too Large`** do vượt mức 1 MB mặc định.
2. Nâng hạn mức body lên 20 MB:
   - Mở tệp `nginx/conf.d/default.conf`, sửa dòng `client_max_body_size 1m;` thành `client_max_body_size 20m;`.
   - Kiểm tra cú pháp: `docker compose exec proxy nginx -t`
   - Nạp nóng cấu hình không downtime: `docker compose exec proxy nginx -s reload`
3. Nhấn lại nút **"Gửi Payload"**:
   - **Kết quả quan sát**: Upload thành công, nhận mã **`HTTP 200 OK`**.

#### Bước 6: Giả lập Domain Local & HTTPS Tự ký
1. Thêm ánh xạ vào tệp hosts (trên Windows: `C:\Windows\System32\drivers\etc\hosts`, trên Linux: `/etc/hosts`):
   ```text
   127.0.0.1  myapp.local
   ```
2. Mở trình duyệt truy cập: `https://myapp.local:8443/`
   - **Kết quả quan sát**: Trình duyệt hiển thị cảnh báo đỏ "Your connection is not private / NET::ERR_CERT_AUTHORITY_INVALID".
   - **Bản chất**: Kênh truyền đã được mã hóa TLS, nhưng chứng chỉ tự ký không được ký bởi một CA công cộng có sẵn trong Trust Store của hệ điều hành.

---

### 4. Lệnh Kiểm thử Tự động nhanh bằng PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File test_demo.ps1
```

---

### 5. Dừng và Dọn dẹp Hệ thống
```bash
docker compose down
```
