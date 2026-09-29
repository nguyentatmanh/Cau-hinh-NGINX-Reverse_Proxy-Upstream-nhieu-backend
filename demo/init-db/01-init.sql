-- ==============================================================================
-- HUCE - Hệ thống Server Nâng cao - Buổi 8
-- Script khởi tạo CSDL PostgreSQL cho Ứng dụng Quản lý Sản phẩm Mini
-- ==============================================================================

CREATE TABLE
IF
  NOT EXISTS products (
    id SERIAL PRIMARY KEY
    , name VARCHAR(255) NOT NULL
    , price NUMERIC(12, 2) NOT NULL DEFAULT 0.00
    , description TEXT
    , image_url VARCHAR(500) DEFAULT '/assets/placeholder.png'
    , created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Dữ liệu mẫu khởi tạo ban đầu
  INSERT INTO
    products (name, price, description, image_url)
  VALUES
    (
      'Máy chủ Dell PowerEdge R750'
      , 85000000.00
      , 'Máy chủ 2U Rack cao cấp 2 socket Intel Xeon phục vụ ảo hóa và hạ tầng NGINX cluster.'
      , '/assets/placeholder.png'
    )
    , (
      'Switch Quản lý Cisco Catalyst 24 Port'
      , 18500000.00
      , 'Switch Layer 3 Gigabit hỗ trợ VLAN, LACP và định tuyến mạng doanh nghiệp.'
      , '/assets/placeholder.png'
    )
    , (
      'Ổ cứng SSD Enterprise NVMe 3.84TB'
      , 12500000.00
      , 'SSD chuẩn U.2 PCIe Gen4 tốc độ đọc ghi 7000MB/s độ bền cao cho Database.'
      , '/assets/placeholder.png'
    )
    , (
      'Thiết bị Cân bằng tải F5 BIG-IP'
      , 150000000.00
      , 'Thiết bị phần cứng cân bằng tải chuyên dụng bảo mật L4-L7 cấp doanh nghiệp.'
      , '/assets/placeholder.png'
    )
  ON CONFLICT
DO
  NOTHING;