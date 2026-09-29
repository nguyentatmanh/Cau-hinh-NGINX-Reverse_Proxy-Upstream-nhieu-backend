# ==============================================================================
# SCRIPT CHUYỂN ĐỔI GIAI ĐOẠN CẤU HÌNH NGINX (STAGES SWITCHER) - BUỔI 8 (NHÓM 8)
# Sử dụng:
#   .\switch_stage.ps1 1   -> Kích hoạt Bước 1: Static Web Server & SPA try_files
#   .\switch_stage.ps1 2   -> Kích hoạt Bước 2: Reverse Proxy tới 1 Backend (api1)
#   .\switch_stage.ps1 3   -> Kích hoạt Bước 3: Upstream Cluster Round-Robin (api1, api2)
#   .\switch_stage.ps1 5   -> Kích hoạt Bước 5: Nâng client_max_body_size lên 20m
#   .\switch_stage.ps1 6   -> Kích hoạt Bước 6: HTTPS 443 SSL tự ký có SAN
# ==============================================================================

param (
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet("1", "2", "3", "5", "6")]
    [string]$Stage
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$stagesDir = Join-Path $scriptDir "nginx\stages"
$confDDir  = Join-Path $scriptDir "nginx\conf.d"
$targetConf = Join-Path $confDDir "default.conf"

$stageFiles = @{
    "1" = "step1_web_server.conf"
    "2" = "step2_single_backend.conf"
    "3" = "step3_upstream_cluster.conf"
    "5" = "step5_body_limit_20m.conf"
    "6" = "step6_https_san.conf"
}

$stageDescriptions = @{
    "1" = "Bước 1: NGINX làm Web Server phục vụ file tĩnh & SPA try_files (Không mở API)"
    "2" = "Bước 2: Reverse Proxy ghép cặp Frontend và 1 Backend API (api1:3000)"
    "3" = "Bước 3 & 4: Upstream Cân bằng tải Round-Robin (api1:3000 & api2:3000, body 1m)"
    "5" = "Bước 5: Khắc phục lỗi 413 bằng cách nâng client_max_body_size lên 20m"
    "6" = "Bước 6: Cấu hình tên miền ảo myapp.local và HTTPS cổng 443 với SSL SAN"
}

$sourceFile = Join-Path $stagesDir $stageFiles[$Stage]

if (-not (Test-Path $sourceFile)) {
    Write-Host "❌ Lỗi: Không tìm thấy tệp cấu hình nguồn tại $sourceFile" -ForegroundColor Red
    exit 1
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " CHUYỂN ĐỔI CẤU HÌNH NGINX -> GIAI ĐOẠN $Stage" -ForegroundColor Cyan
Write-Host " $($stageDescriptions[$Stage])" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Sao chép cấu hình vào nginx/conf.d/default.conf
Copy-Item -Path $sourceFile -Destination $targetConf -Force
Write-Host "✔ Đã áp dụng tệp: $($stageFiles[$Stage]) -> nginx/conf.d/default.conf" -ForegroundColor Green

# 2. Kiểm tra nếu container proxy đang chạy thì thực hiện nginx -t và nginx -s reload
Write-Host "`n[Kiểm tra Container NGINX...]" -ForegroundColor Gray
$dockerCheck = docker ps --filter "name=huce_nginx_proxy" --format "{{.Names}}" 2>$null

if ($dockerCheck -match "huce_nginx_proxy") {
    Write-Host "-> Container 'huce_nginx_proxy' đang chạy. Thực hiện kiểm tra cú pháp nginx -t..." -ForegroundColor Yellow
    $testOutput = docker compose -f "$scriptDir\compose.yaml" exec proxy nginx -t 2>&1

    if ($LASTEXITCODE -eq 0 -or ($testOutput -match "syntax is ok" -and $testOutput -match "test is successful")) {
        Write-Host "✔ Kiểm tra cú pháp thành công (nginx -t is successful)!" -ForegroundColor Green
        Write-Host "-> Đang nạp nóng cấu hình (nginx -s reload)..." -ForegroundColor Yellow
        $reloadOutput = docker compose -f "$scriptDir\compose.yaml" exec proxy nginx -s reload 2>&1
        Write-Host "✔ Đã nạp nóng cấu hình thành công không downtime!" -ForegroundColor Green
    } else {
        Write-Host "❌ Cảnh báo: Cú pháp NGINX không hợp lệ!" -ForegroundColor Red
        Write-Host $testOutput -ForegroundColor DarkYellow
        exit 1
    }
} else {
    Write-Host "ℹ Container NGINX chưa chạy hoặc Docker Desktop chưa bật." -ForegroundColor DarkYellow
    Write-Host "  Cấu hình đã sẵn sàng trong 'nginx/conf.d/default.conf'. Khi chạy 'docker compose up -d', NGINX sẽ tự động nạp cấu hình này." -ForegroundColor Gray
}

Write-Host "`n✔ Hoàn tất chuyển đổi giai đoạn $Stage thành công!" -ForegroundColor Green
