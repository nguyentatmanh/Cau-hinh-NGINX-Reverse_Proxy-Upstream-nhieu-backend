# ==============================================================================
# SCRIPT KIỂM THỬ TỰ ĐỘNG 6 BƯỚC DEMO BUỔI 8 - NHÓM 7 (HUCE)
# Chạy script này sau khi đã khởi động Docker Compose:
#   cd demo
#   docker compose up -d
# ==============================================================================

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " BẮT ĐẦU KIỂM THỬ 6 BƯỚC THỰC HÀNH NGINX REVERSE PROXY & UPSTREAM " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# BƯỚC 1: Kiểm thử NGINX làm Web Server phục vụ Frontend tĩnh
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 1] Kiểm tra Frontend tĩnh tại http://localhost:8080/..." -ForegroundColor Yellow
try {
    $res1 = Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing -TimeoutSec 5
    if ($res1.StatusCode -eq 200 -and $res1.Content -match "TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI") {
        Write-Host "✔ THÀNH CÔNG: NGINX trả về HTTP 200 OK cho file index.html tĩnh!" -ForegroundColor Green
    } else {
        Write-Host "⚠ Trả về mã $($res1.StatusCode) nhưng nội dung chưa khớp." -ForegroundColor DarkYellow
    }
} catch {
    Write-Host "❌ CHƯA KẾT NỐI ĐƯỢC: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  -> Hãy đảm bảo lệnh 'docker compose up -d' đã được chạy!" -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# BƯỚC 2: Kiểm thử Reverse Proxy định tuyến /api/ và Khử CORS
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 2] Kiểm tra Reverse Proxy tại http://localhost:8080/api/products..." -ForegroundColor Yellow
try {
    $res2 = Invoke-RestMethod -Uri "http://localhost:8080/api/products" -Method Get -TimeoutSec 5
    if ($res2.success -eq $true) {
        Write-Host "✔ THÀNH CÔNG: Nhận dữ liệu JSON từ Backend thông qua NGINX Reverse Proxy!" -ForegroundColor Green
        Write-Host "  - Số sản phẩm: $($res2.total)" -ForegroundColor Gray
        Write-Host "  - Node xử lý đầu tiên: $($res2.instanceId)" -ForegroundColor Gray
        Write-Host "  - Client IP nhận diện: $($res2.clientIp)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ LỖI: $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# BƯỚC 3: Kiểm thử Cân bằng tải Upstream qua 10 request
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 3] Kiểm tra Cân bằng tải Upstream qua 10 request liên tiếp..." -ForegroundColor Yellow
$counts = @{ "backend-1" = 0; "backend-2" = 0; "other" = 0 }
for ($i = 1; $i -le 10; $i++) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:8080/api/products" -Method Get -TimeoutSec 3
        $node = $r.instanceId
        if ($counts.ContainsKey($node)) {
            $counts[$node]++
        } else {
            $counts["other"]++
        }
        Write-Host "  Req #$("{0:D2}" -f $i): Phục vụ bởi node [$node]" -ForegroundColor Gray
    } catch {
        Write-Host "  Req #$("{0:D2}" -f $i): Thất bại ($($_.Exception.Message))" -ForegroundColor Red
    }
}
Write-Host "✔ KẾT QUẢ PHÂN BỔ: backend-1 = $($counts['backend-1']), backend-2 = $($counts['backend-2'])" -ForegroundColor Green

# ------------------------------------------------------------------------------
# BƯỚC 4: Kiểm tra Service Discovery & Network Docker
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 4] Kiểm tra phân giải tên Service Name trong container NGINX..." -ForegroundColor Yellow
try {
    $dnsCheck = docker compose exec proxy nslookup backend1 2>&1
    Write-Host "✔ Service Discovery NGINX -> backend1:" -ForegroundColor Green
    Write-Host ($dnsCheck | Out-String).Trim() -ForegroundColor Gray
} catch {
    Write-Host "⚠ Không thể thực hiện lệnh 'docker compose exec' trực tiếp từ script này." -ForegroundColor DarkYellow
}

# ------------------------------------------------------------------------------
# BƯỚC 5: Kiểm tra Giới hạn Request Body (Mã 413)
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 5] Kiểm tra Giới hạn Request Body (client_max_body_size)..." -ForegroundColor Yellow
$bigPayload = "A" * (2 * 1024 * 1024) # 2 MB (vượt 1 MB mặc định)
try {
    $uploadRes = Invoke-WebRequest -Uri "http://localhost:8080/api/upload" -Method Post -Body $bigPayload -ContentType "text/plain" -UseBasicParsing -TimeoutSec 10
    Write-Host "⚠ Trả về HTTP $($uploadRes.StatusCode) (Nếu đã nâng lên 20M thì đây là bình thường)" -ForegroundColor DarkYellow
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 413) {
        Write-Host "✔ THÀNH CÔNG: NGINX chặn chính xác và trả về HTTP 413 Request Entity Too Large!" -ForegroundColor Green
        Write-Host "  -> Để thử nạp nóng cấu hình: Đổi client_max_body_size thành 20m và chạy:" -ForegroundColor Gray
        Write-Host "     docker compose exec proxy nginx -s reload" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ------------------------------------------------------------------------------
# BƯỚC 6: Kiểm tra HTTPS với SSL Tự ký
# ------------------------------------------------------------------------------
Write-Host "`n[BƯỚC 6] Kiểm tra HTTPS tại https://localhost:8443/..." -ForegroundColor Yellow
Write-Host "  (Lưu ý: Chứng chỉ tự ký sẽ bị từ chối nếu không bỏ qua xác thực CA)" -ForegroundColor Gray
try {
    # Bỏ qua kiểm tra chứng chỉ tự ký để kiểm tra bắt tay TLS
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $httpsRes = Invoke-WebRequest -Uri "https://localhost:8443/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✔ KẾT NỐI HTTPS THÀNH CÔNG: Bắt tay TLS hoàn tất, mã phản hồi $($httpsRes.StatusCode) OK!" -ForegroundColor Green
} catch {
    Write-Host "❌ Không thể bắt tay HTTPS: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $null
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host " HOÀN TẤT KỊCH BẢN KIỂM THỬ BUỔI 8!" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
