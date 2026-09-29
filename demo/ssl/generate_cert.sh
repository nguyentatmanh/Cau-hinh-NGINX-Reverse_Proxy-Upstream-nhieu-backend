#!/bin/bash
# ==============================================================================
# Script sinh chứng chỉ SSL tự ký có Subject Alternative Name (SAN) cho Linux/macOS
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
KEY_PATH="$DIR/myapp.key"
CRT_PATH="$DIR/myapp.crt"

echo "Đang sinh cặp khóa RSA 2048 và chứng chỉ X.509 tự ký có SAN DNS:myapp.local..."

openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$KEY_PATH" \
    -out "$CRT_PATH" \
    -days 365 \
    -subj "/CN=myapp.local/O=HUCE/OU=CNTT/C=VN" \
    -addext "subjectAltName=DNS:myapp.local,DNS:localhost,IP:127.0.0.1"

if [ -f "$KEY_PATH" ] && [ -f "$CRT_PATH" ]; then
    echo "✔ Đã tạo thành công chứng chỉ và khóa bảo mật:"
    echo "  - Khóa riêng: $KEY_PATH"
    echo "  - Chứng chỉ: $CRT_PATH"
else
    echo "❌ Sinh chứng chỉ thất bại!"
    exit 1
fi
