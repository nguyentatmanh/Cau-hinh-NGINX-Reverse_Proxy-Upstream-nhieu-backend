# ==============================================================================
# Dockerfile cho Backend Service (Mini Product API)
# Tuân thủ Best Practices: Node Alpine nhẹ, non-root user, multi-step clean build
# ==============================================================================
FROM node:20-alpine AS base

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Khai báo môi trường chạy sản xuất
ENV NODE_ENV=production

# Sao chép tệp mô tả thư viện và cài đặt (chỉ cài dependencies sản xuất)
COPY package*.json ./
RUN npm install --only=production --ignore-scripts \
    && npm cache clean --force

# Sao chép toàn bộ mã nguồn ứng dụng
COPY . .

# Tạo thư mục uploads dùng chung và phân quyền sở hữu cho user 'node'
RUN mkdir -p /app/uploads \
    && chown -R node:node /app

# Chuyển sang user không phải root (Non-root user) để bảo mật container
USER node

# Khai báo cổng nội bộ container
EXPOSE 3000

# Lệnh khởi chạy ứng dụng
CMD ["node", "server.js"]
