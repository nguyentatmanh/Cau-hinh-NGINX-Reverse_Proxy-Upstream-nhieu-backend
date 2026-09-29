# Script sinh chung chi SSL tu ky co SAN DNS:myapp.local cho Windows
$sslDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$keyPath = Join-Path $sslDir "myapp.key"
$crtPath = Join-Path $sslDir "myapp.crt"

$opensslCmd = "openssl"
if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
    $gitOpenssl = "C:\Program Files\Git\usr\bin\openssl.exe"
    if (Test-Path $gitOpenssl) {
        $opensslCmd = $gitOpenssl
    } else {
        Write-Error "Khong tim thay OpenSSL. Vui long cai dat Git for Windows!"
        exit 1
    }
}

Write-Host "Dang sinh cap khoa RSA va chung chi co SAN DNS:myapp.local..." -ForegroundColor Cyan

& $opensslCmd req -x509 -newkey rsa:2048 -nodes -keyout $keyPath -out $crtPath -days 365 -subj "/CN=myapp.local/O=HUCE/OU=CNTT/C=VN" -addext "subjectAltName=DNS:myapp.local,DNS:localhost,IP:127.0.0.1"

if ((Test-Path $keyPath) -and (Test-Path $crtPath)) {
    Write-Host "[OK] Da tao thanh cong: $keyPath va $crtPath" -ForegroundColor Green
} else {
    Write-Error "[FAIL] Sinh chung chi that bai!"
}
