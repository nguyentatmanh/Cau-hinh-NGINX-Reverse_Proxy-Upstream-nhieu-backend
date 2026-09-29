# ==============================================================================
# SCRIPT KIỂM THỬ TỰ ĐỘNG 6 BƯỚC THỰC HÀNH BUỔI 8 - NHÓM 8 (HUCE)
# Ứng dụng: HUCE Learning Store (Cửa hàng Sách & Khóa học Công nghệ)
# Kiến trúc: NGINX Gateway -> [api1:3000, api2:3000] -> PostgreSQL (db:5432)
# ==============================================================================

$hasError = $false
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$assetsDir = Join-Path $scriptDir "frontend\assets"
$largeImgPath = Join-Path $assetsDir "sample_cover_large.png"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " BẮT ĐẦU KIỂM THỬ 6 BƯỚC DEMO BUỔI 8 - HUCE LEARNING STORE       " -ForegroundColor Cyan
Write-Host " Nhóm 8 • NGINX Gateway (8080/8443) -> [api1, api2] -> PostgreSQL " -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# BƯỚC 1: Kiểm thử NGINX làm Web Server phục vụ Frontend tĩnh & SPA Fallback
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 1] Kiểm tra Frontend tĩnh & SPA try_files..." -ForegroundColor Yellow
try {
    $res1 = Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing -TimeoutSec 5
    if ($res1.StatusCode -eq 200 -and $res1.Content -match "TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI") {
        Write-Host "  ✔ THÀNH CÔNG: NGINX trả về HTTP 200 OK cho file index.html!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ THẤT BẠI: Trả về mã $($res1.StatusCode) hoặc nội dung không khớp." -ForegroundColor Red
        $hasError = $true
    }

    # Thử nghiệm SPA route ảo /products/1
    $resSpa = Invoke-WebRequest -Uri "http://localhost:8080/products/1" -UseBasicParsing -TimeoutSec 5
    if ($resSpa.StatusCode -eq 200 -and $resSpa.Content -match "HUCE Learning Store") {
        Write-Host "  ✔ THÀNH CÔNG: SPA try_files fallback hoạt động chính xác tại /products/1 (HTTP 200)!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ THẤT BẠI: SPA route không fallback về index.html (Status: $($resSpa.StatusCode))." -ForegroundColor Red
        $hasError = $true
    }
} catch {
    Write-Host "  ❌ CHƯA KẾT NỐI ĐƯỢC: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "     -> Đảm bảo lệnh 'docker compose up -d' đã được chạy!" -ForegroundColor DarkYellow
    $hasError = $true
}

# ------------------------------------------------------------------------------
# BƯỚC 2: Kiểm thử Reverse Proxy định tuyến /api/ & Khử CORS & Thao tác CSDL
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 2] Kiểm tra Reverse Proxy CRUD & Forwarded Headers..." -ForegroundColor Yellow
try {
    # 1. GET /api/products
    $resList = Invoke-RestMethod -Uri "http://localhost:8080/api/products" -Method Get -TimeoutSec 5
    if ($resList.success -eq $true -and $resList.total -ge 1) {
        Write-Host "  ✔ THÀNH CÔNG: Lấy danh mục ($($resList.total) học liệu) qua NGINX Reverse Proxy (Node: $($resList.instanceId))" -ForegroundColor Green
    } else {
        Write-Host "  ❌ THẤT BẠI: Không nhận được danh sách sản phẩm hợp lệ." -ForegroundColor Red
        $hasError = $true
    }

    # 2. POST /api/products (Thêm sách mới)
    $newBook = @{
        title = "Sách Test Tự Động Buổi 8 - $(Get-Date -Format 'HH:mm:ss')"
        product_type = "book"
        price = 195000
        author = "Kỹ sư Nhóm 8"
        stock_quantity = 12
        description = "Sách tạo tự động bằng test_demo.ps1 để kiểm tra ghi dữ liệu PostgreSQL."
    } | ConvertTo-Json

    $resCreate = Invoke-RestMethod -Uri "http://localhost:8080/api/products" -Method Post -Body $newBook -ContentType "application/json; charset=utf-8" -TimeoutSec 5
    if ($resCreate.success -eq $true -and $resCreate.data.id -gt 0) {
        Write-Host "  ✔ THÀNH CÔNG: Tạo sách mới ID #${$resCreate.data.id} lưu trực tiếp vào PostgreSQL (Node: $($resCreate.instanceId))" -ForegroundColor Green
    } else {
        Write-Host "  ❌ THẤT BẠI: Không thể tạo sản phẩm mới." -ForegroundColor Red
        $hasError = $true
    }

    # 3. GET /api/info (Forwarded Headers)
    $resInfo = Invoke-RestMethod -Uri "http://localhost:8080/api/info" -Method Get -TimeoutSec 5
    if ($resInfo.headers.'x-real-ip') {
        Write-Host "  ✔ THÀNH CÔNG: NGINX Forwarded Headers bảo toàn danh tính client (X-Real-IP: $($resInfo.headers.'x-real-ip'), Peer Socket: $($resInfo.peerIp))" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ CẢNH BÁO: Chưa thấy X-Real-IP trong /api/info." -ForegroundColor DarkYellow
    }
} catch {
    Write-Host "  ❌ LỖI BƯỚC 2: $($_.Exception.Message)" -ForegroundColor Red
    $hasError = $true
}

# ------------------------------------------------------------------------------
# BƯỚC 3: Kiểm thử Cân bằng tải Upstream Round-Robin & Nhất quán Đơn hàng
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 3] Kiểm tra Cân bằng tải Upstream qua 10 request liên tiếp..." -ForegroundColor Yellow
$counts = @{ "api1" = 0; "api2" = 0; "other" = 0 }
for ($i = 1; $i -le 10; $i++) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:8080/api/products?t=$i" -Method Get -TimeoutSec 3
        $node = $r.instanceId
        if ($counts.ContainsKey($node)) {
            $counts[$node]++
        } else {
            $counts["other"]++
        }
        Write-Host "    Req #$("{0:D2}" -f $i): Phục vụ bởi [$node]" -ForegroundColor Gray
    } catch {
        Write-Host "    Req #$("{0:D2}" -f $i): Thất bại ($($_.Exception.Message))" -ForegroundColor Red
        $hasError = $true
    }
}
Write-Host "  ✔ KẾT QUẢ PHÂN BỔ UPSTREAM: api1 = $($counts['api1']), api2 = $($counts['api2'])" -ForegroundColor Green

# Tạo đơn hàng và kiểm tra tra cứu chéo instance
try {
    $orderPayload = @{
        customerName = "Sinh vien Test Buoi 8"
        customerEmail = "test@huce.edu.vn"
        items = @(
            @{ productId = 1; quantity = 1 }
        )
    } | ConvertTo-Json

    $resOrder = Invoke-RestMethod -Uri "http://localhost:8080/api/orders" -Method Post -Body $orderPayload -ContentType "application/json; charset=utf-8" -TimeoutSec 5
    if ($resOrder.success -eq $true) {
        $orderId = $resOrder.data.id
        Write-Host "  ✔ THÀNH CÔNG: Đã tạo đơn hàng ID #${orderId} (Xử lý bởi: $($resOrder.instanceId), Tổng: $($resOrder.data.total_amount) đ)" -ForegroundColor Green

        # Tra cứu lại đơn hàng
        $resLookup = Invoke-RestMethod -Uri "http://localhost:8080/api/orders/$orderId" -Method Get -TimeoutSec 5
        if ($resLookup.success -eq $true -and $resLookup.data.id -eq $orderId) {
            Write-Host "  ✔ THÀNH CÔNG: Tra cứu thành công Đơn hàng #${orderId} từ Backend [$($resLookup.instanceId)] (CSDL dùng chung!)" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  ❌ LỖI TẠO ĐƠN HÀNG: $($_.Exception.Message)" -ForegroundColor Red
    $hasError = $true
}

# ------------------------------------------------------------------------------
# BƯỚC 4: Kiểm tra Service Discovery & Network Docker
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 4] Kiểm tra phân giải tên Service Name trong mạng Docker..." -ForegroundColor Yellow
try {
    $dnsCheck = docker compose exec proxy nslookup api1 2>&1
    if ($dnsCheck -match "Address" -or $dnsCheck -match "172\.") {
        Write-Host "  ✔ Service Discovery NGINX -> api1 thành công:" -ForegroundColor Green
        Write-Host ($dnsCheck | Out-String).Trim() -ForegroundColor Gray
    } else {
        Write-Host "  ℹ Kết quả nslookup api1:" -ForegroundColor DarkYellow
        Write-Host ($dnsCheck | Out-String).Trim() -ForegroundColor Gray
    }
} catch {
    Write-Host "  ℹ Không thể thực hiện lệnh 'docker compose exec' trực tiếp từ script này." -ForegroundColor DarkYellow
}

# ------------------------------------------------------------------------------
# BƯỚC 5: Kiểm tra Giới hạn Request Body (Mã 413) với Multipart/Form-Data thật
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 5] Kiểm tra Giới hạn Request Body (HTTP 413) với Multipart Form-Data..." -ForegroundColor Yellow
if (Test-Path $largeImgPath) {
    $imgSizeMB = (Get-Item $largeImgPath).Length / (1024 * 1024)
    Write-Host "  -> Sử dụng tệp ảnh thực tế: sample_cover_large.png ($([math]::Round($imgSizeMB, 2)) MB > 1MB)" -ForegroundColor Gray

    try {
        # Gửi multipart/form-data thật
        $boundary = [System.Guid]::NewGuid().ToString()
        $fileBytes = [System.IO.File]::ReadAllBytes($largeImgPath)
        $fileName = [System.IO.Path]::GetFileName($largeImgPath)

        $bodyHeader = "--$boundary`r`nContent-Disposition: form-data; name=`"image`"; filename=`"$fileName`"`r`nContent-Type: image/png`r`n`r`n"
        $bodyFooter = "`r`n--$boundary--`r`n"
        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($bodyHeader)
        $footerBytes = [System.Text.Encoding]::ASCII.GetBytes($bodyFooter)

        $totalBytes = [byte[]]::new($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
        [System.Buffer]::BlockCopy($headerBytes, 0, $totalBytes, 0, $headerBytes.Length)
        [System.Buffer]::BlockCopy($fileBytes, 0, $totalBytes, $headerBytes.Length, $fileBytes.Length)
        [System.Buffer]::BlockCopy($footerBytes, 0, $totalBytes, $headerBytes.Length + $fileBytes.Length, $footerBytes.Length)

        $req = [System.Net.HttpWebRequest]::Create("http://localhost:8080/api/upload")
        $req.Method = "POST"
        $req.ContentType = "multipart/form-data; boundary=$boundary"
        $req.ContentLength = $totalBytes.Length
        $req.Timeout = 10000

        $stream = $req.GetRequestStream()
        $stream.Write($totalBytes, 0, $totalBytes.Length)
        $stream.Close()

        $resp = $req.GetResponse()
        $statusCode = [int]$resp.StatusCode
        $resp.Close()

        if ($statusCode -eq 200) {
            Write-Host "  ℹ NGINX phản hồi HTTP 200 (Hệ thống hiện đang áp dụng cấu hình client_max_body_size 20m)." -ForegroundColor DarkYellow
        }
    } catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        if ($resp -and [int]$resp.StatusCode -eq 413) {
            Write-Host "  ✔ THÀNH CÔNG: NGINX chặn chính xác và trả về HTTP 413 Payload Too Large!" -ForegroundColor Green
            Write-Host "     -> Chứng minh hạn mức 1 MB mặc định hoạt động đúng." -ForegroundColor Gray
            Write-Host "     -> Để nạp cấu hình 20m: chạy '.\\switch_stage.ps1 5'" -ForegroundColor Cyan
        } else {
            Write-Host "  ❌ LỖI KHÁC: $($_.Exception.Message)" -ForegroundColor Red
            $hasError = $true
        }
    }
} else {
    Write-Host "  ⚠ Chưa tìm thấy file $largeImgPath. Hãy chạy 'python demo/generate_sample_images.py' trước." -ForegroundColor DarkYellow
}

# ------------------------------------------------------------------------------
# BƯỚC 6: Kiểm tra HTTPS với SSL Tự ký có SAN
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 6] Kiểm tra HTTPS cổng 8443..." -ForegroundColor Yellow
try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
    $httpsRes = Invoke-WebRequest -Uri "https://localhost:8443/api/health" -UseBasicParsing -TimeoutSec 5
    if ($httpsRes.StatusCode -eq 200) {
        Write-Host "  ✔ BẮT TAY HTTPS THÀNH CÔNG: Mã phản hồi HTTP $($httpsRes.StatusCode) OK qua kênh TLS!" -ForegroundColor Green
    }
} catch {
    Write-Host "  ℹ Chưa kết nối được HTTPS cổng 8443: $($_.Exception.Message)" -ForegroundColor DarkYellow
    Write-Host "    (Để kích hoạt HTTPS: chạy '.\\switch_stage.ps1 6')" -ForegroundColor Gray
} finally {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $null
}

Write-Host "`n================================================================" -ForegroundColor Cyan
if ($hasError) {
    Write-Host " ❌ KẾT THÚC KIỂM THỬ: Phát hiện một số bước chưa đạt yêu cầu!" -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host " ✔ HOÀN TẤT KỊCH BẢN KIỂM THỬ BUỔI 8 THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Cyan
    exit 0
}
