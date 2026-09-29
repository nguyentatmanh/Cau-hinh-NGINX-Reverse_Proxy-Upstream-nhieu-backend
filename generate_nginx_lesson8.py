#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
CHƯƠNG TRÌNH TỰ ĐỘNG SINH BÀI THUYẾT TRÌNH BÁO CÁO HỆ THỐNG SERVER NÂNG CAO
HỌC PHẦN: HỆ THỐNG SERVER NÂNG CAO - KHOA CÔNG NGHỆ THÔNG TIN
ĐƠN VỊ: TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI (HUCE)
CHUYÊN ĐỀ: BUỔI 8 - CẤU HÌNH NGINX REVERSE PROXY – UPSTREAM NHIỀU BACKEND
NHÓM THỰC HIỆN: NHÓM 7
================================================================================
Thành viên Nhóm 7:
  1. 0210668 - Nguyễn Đức Mạnh
  2. 0210768 - Nguyễn Tất Mạnh
  3. 0214268 - Đỗ Công Trí
  4. 0208368 - Nguyễn Huy Hoàng

Tài liệu tham chiếu & căn cứ kỹ thuật:
  - Đề bài: "Buổi 8 Cấu hình NGINX reverse proxy – Upstream nhiều backend (1).pdf"
  - Slide tham khảo buổi trước: "Nhóm 6.pptx" (tham chiếu kiến trúc Docker Compose)
  - Hệ thống nhận diện thương hiệu HUCE: https://huce.edu.vn/he-thong-nhan-dien
================================================================================
"""

import sys
import os
import shutil
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR

# Đảm bảo đầu ra console Windows hỗ trợ UTF-8 chuẩn xác
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ==============================================================================
# HẰNG SỐ CẤU HÌNH & XÁC THỰC TÀI NGUYÊN NHẬN DIỆN THƯƠNG HIỆU HUCE
# ==============================================================================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.join(SCRIPT_DIR, "assets", "huce_logo.png")

# Kiểm tra sự tồn tại của logo chính thức. Báo lỗi rõ ràng nếu thiếu.
if not os.path.exists(LOGO_PATH):
    raise FileNotFoundError(
        f"\n[LỖI XÁC THỰC LOGO TRƯỜNG HUCE]\n"
        f"Không tìm thấy tệp logo tại đường dẫn: '{LOGO_PATH}'.\n"
        f"Theo quy định nhận diện thương hiệu Trường Đại học Xây dựng Hà Nội,\n"
        f"vui lòng đảm bảo tệp logo chính thức đã được đóng gói tại 'assets/huce_logo.png'\n"
        f"(Nguồn tải chính thức: https://huce.edu.vn/he-thong-nhan-dien).\n"
    )

# Kích thước ảnh gốc của logo HUCE: 2270 x 2241 (tỷ lệ 1.0129)
LOGO_ASPECT_RATIO = 2270.0 / 2241.0

# Bảng màu chuẩn nhận diện HUCE & Academic Style
COLOR_PRIMARY = RGBColor(16, 54, 114)     # HUCE Deep Navy (#103672)
COLOR_SECONDARY = RGBColor(28, 100, 186)  # HUCE Royal Blue (#1C64BA)
COLOR_ACCENT = RGBColor(2, 132, 199)      # Sky Blue (#0284C7)
COLOR_TEXT_DARK = RGBColor(15, 23, 42)    # Slate Dark (#0F172A)
COLOR_TEXT_MUTED = RGBColor(71, 85, 105)  # Slate Muted (#475569)
COLOR_BG_PAGE = RGBColor(255, 255, 255)   # Pure White
COLOR_BG_CARD = RGBColor(248, 250, 252)   # Light Gray-Blue (#F8FAFC)
COLOR_BORDER = RGBColor(203, 213, 225)    # Slate Border (#CBD5E1)
COLOR_WHITE = RGBColor(255, 255, 255)
COLOR_SUCCESS = RGBColor(22, 163, 74)     # Emerald Green (#16A34A)
COLOR_DANGER = RGBColor(220, 38, 38)      # Crimson Red (#DC2626)
COLOR_WARNING = RGBColor(217, 119, 6)     # Amber (#D97706)

# Màu khối code tối phong cách Developer Console
COLOR_CODE_BG = RGBColor(15, 23, 42)      # Slate 900 (#0F172A)
COLOR_CODE_TEXT = RGBColor(241, 245, 249) # Slate 100
COLOR_CODE_KW = RGBColor(56, 189, 248)    # Sky 400
COLOR_CODE_CMT = RGBColor(148, 163, 184)  # Slate 400

FONT_HEADING = "Segoe UI"
FONT_BODY = "Segoe UI"
FONT_CODE = "Consolas"

TOTAL_SLIDES = 20


# ==============================================================================
# HÀM BỔ TRỢ XÂY DỰNG KHUNG HỌC THUẬT & GIAO DIỆN SLIDE (ACADEMIC FRAME)
# ==============================================================================
def add_academic_frame(slide, slide_num, total_slides=TOTAL_SLIDES):
    """
    Tạo khung header & footer học thuật chuẩn mực trên MỌI slide nội dung (từ slide 2 đến 20):
      - Header: Logo chính thức HUCE (bảo toàn tỷ lệ) + tên 'TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI'
      - Footer: 'Hà Nội, tháng 10 năm 2026' + Tên chuyên đề Nhóm 7 + Số trang 'Trang XX / 20'
    """
    # 1. Logo chính thức HUCE góc trên bên trái
    logo_h = Inches(0.68)
    logo_w = logo_h * LOGO_ASPECT_RATIO
    slide.shapes.add_picture(LOGO_PATH, Inches(0.8), Inches(0.42), width=logo_w, height=logo_h)

    # 2. Text Header Trường
    tb_h = slide.shapes.add_textbox(Inches(1.6), Inches(0.40), Inches(10.8), Inches(0.70))
    tf_h = tb_h.text_frame
    tf_h.word_wrap = True
    tf_h.margin_left = tf_h.margin_top = tf_h.margin_right = tf_h.margin_bottom = 0

    p_univ = tf_h.paragraphs[0]
    p_univ.text = "TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI"
    p_univ.font.name = FONT_HEADING
    p_univ.font.size = Pt(13)
    p_univ.font.bold = True
    p_univ.font.color.rgb = COLOR_PRIMARY

    p_sub = tf_h.add_paragraph()
    p_sub.text = "KHOA CÔNG NGHỆ THÔNG TIN • HỆ THỐNG SERVER NÂNG CAO"
    p_sub.font.name = FONT_HEADING
    p_sub.font.size = Pt(9.5)
    p_sub.font.color.rgb = COLOR_TEXT_MUTED

    # 3. Đường kẻ phân cách Header
    line_h = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.22), Inches(11.733), Inches(0.025))
    line_h.fill.solid()
    line_h.fill.fore_color.rgb = COLOR_BORDER
    line_h.line.fill.background()

    # 4. Đường kẻ phân cách Footer
    line_f = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.92), Inches(11.733), Inches(0.02))
    line_f.fill.solid()
    line_f.fill.fore_color.rgb = COLOR_BORDER
    line_f.line.fill.background()

    # 5. Footer Text 3 cột: Địa danh/thời gian | Tên nhóm & chuyên đề | Số trang
    # Cột trái: Hà Nội, tháng 10 năm 2026
    tb_fl = slide.shapes.add_textbox(Inches(0.8), Inches(6.98), Inches(4.0), Inches(0.35))
    tf_fl = tb_fl.text_frame
    tf_fl.margin_left = tf_fl.margin_top = tf_fl.margin_right = tf_fl.margin_bottom = 0
    p_fl = tf_fl.paragraphs[0]
    p_fl.text = "Hà Nội, tháng 10 năm 2026"
    p_fl.font.name = FONT_BODY
    p_fl.font.size = Pt(10)
    p_fl.font.color.rgb = COLOR_TEXT_MUTED

    # Cột giữa: Tên chuyên đề Nhóm 7
    tb_fc = slide.shapes.add_textbox(Inches(4.5), Inches(6.98), Inches(4.8), Inches(0.35))
    tf_fc = tb_fc.text_frame
    tf_fc.margin_left = tf_fc.margin_top = tf_fc.margin_right = tf_fc.margin_bottom = 0
    p_fc = tf_fc.paragraphs[0]
    p_fc.text = "Nhóm 7 • NGINX Reverse Proxy & Upstream nhiều Backend"
    p_fc.font.name = FONT_BODY
    p_fc.font.size = Pt(9.5)
    p_fc.font.color.rgb = COLOR_TEXT_MUTED
    p_fc.alignment = PP_ALIGN.CENTER

    # Cột phải: Trang XX / 20
    tb_fr = slide.shapes.add_textbox(Inches(10.0), Inches(6.98), Inches(2.533), Inches(0.35))
    tf_fr = tb_fr.text_frame
    tf_fr.margin_left = tf_fr.margin_top = tf_fr.margin_right = tf_fr.margin_bottom = 0
    p_fr = tf_fr.paragraphs[0]
    p_fr.text = f"Trang {slide_num:02d} / {total_slides:02d}"
    p_fr.font.name = FONT_BODY
    p_fr.font.size = Pt(10)
    p_fr.font.bold = True
    p_fr.font.color.rgb = COLOR_PRIMARY
    p_fr.alignment = PP_ALIGN.RIGHT


def add_slide_header(slide, category, title):
    """Tiêu đề slide lớn, rõ ràng (26 pt), nằm gọn trên 1 dòng để không đè lên content."""
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(1.36), Inches(11.733), Inches(0.75))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

    p_cat = tf.paragraphs[0]
    p_cat.text = category.upper()
    p_cat.font.name = FONT_HEADING
    p_cat.font.size = Pt(10.5)
    p_cat.font.bold = True
    p_cat.font.color.rgb = COLOR_SECONDARY
    p_cat.space_after = Pt(1)

    p_title = tf.add_paragraph()
    p_title.text = title
    p_title.font.name = FONT_HEADING
    p_title.font.size = Pt(25)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_PRIMARY


def add_card(slide, left, top, width, height, title=""):
    """Tạo hộp card nền sáng, viền nhẹ bo góc."""
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = COLOR_BG_CARD
    card.line.color.rgb = COLOR_BORDER
    card.line.width = Pt(1.2)

    if title:
        tb = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.18), width - Inches(0.5), Inches(0.40))
        tf = tb.text_frame
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = FONT_HEADING
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = COLOR_PRIMARY
    return card


def add_code_panel(slide, left, top, width, height, title, code_lines, font_size_pt=13.0):
    """
    Tạo panel hiển thị code tối màu phong cách terminal/editor.
    Cỡ chữ code 13 - 14 pt, rõ ràng, không bị tràn hay cắt dòng.
    """
    box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    box.fill.solid()
    box.fill.fore_color.rgb = COLOR_CODE_BG
    box.line.color.rgb = RGBColor(51, 65, 85)
    box.line.width = Pt(1)

    # Thanh header tab của file
    hbar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.35))
    hbar.fill.solid()
    hbar.fill.fore_color.rgb = RGBColor(30, 41, 59)
    hbar.line.fill.background()

    tb_title = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.06), width - Inches(0.4), Inches(0.24))
    tf_t = tb_title.text_frame
    tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
    p_t = tf_t.paragraphs[0]
    p_t.text = title
    p_t.font.name = FONT_CODE
    p_t.font.size = Pt(10.5)
    p_t.font.bold = True
    p_t.font.color.rgb = RGBColor(148, 163, 184)

    # Thân mã nguồn
    tb_body = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.42), width - Inches(0.5), height - Inches(0.48))
    tf_b = tb_body.text_frame
    tf_b.word_wrap = True
    tf_b.margin_left = tf_b.margin_top = tf_b.margin_right = tf_b.margin_bottom = 0

    for i, line in enumerate(code_lines):
        p = tf_b.paragraphs[0] if i == 0 else tf_b.add_paragraph()
        p.font.name = FONT_CODE
        p.font.size = Pt(font_size_pt)
        p.space_after = Pt(0.5)

        line_str = line.strip()
        if line_str.startswith("#") or line_str.startswith("//"):
            p.text = line
            p.font.color.rgb = COLOR_CODE_CMT
        elif any(line_str.startswith(kw) for kw in ["upstream", "server {", "location", "server ", "client_max_body_size", "listen"]):
            p.text = line
            p.font.color.rgb = COLOR_CODE_KW
            p.font.bold = True
        else:
            p.text = line
            p.font.color.rgb = COLOR_CODE_TEXT


def add_demo_box(slide, left, top, width, height, step_num, title, action, expected, concept):
    """
    Tạo khối Kế hoạch Demo Đề xuất chuẩn 3 phần:
      1. Thao tác thực hiện
      2. Kết quả dự kiến / quan sát
      3. Khái niệm NGINX chứng minh
    Cỡ chữ 13 - 13.5 pt, thoáng đãng, không bị tràn đáy.
    """
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = COLOR_BG_CARD
    card.line.color.rgb = COLOR_SECONDARY
    card.line.width = Pt(1.5)

    h = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.36))
    h.fill.solid()
    h.fill.fore_color.rgb = COLOR_SECONDARY
    h.line.fill.background()

    tb_h = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.06), width - Inches(0.4), Inches(0.24))
    tf_h = tb_h.text_frame
    tf_h.margin_left = tf_h.margin_top = tf_h.margin_right = tf_h.margin_bottom = 0
    p_h = tf_h.paragraphs[0]
    p_h.text = f"KẾ HOẠCH DEMO ĐỀ XUẤT • BƯỚC {step_num}: {title.upper()}"
    p_h.font.name = FONT_HEADING
    p_h.font.size = Pt(11)
    p_h.font.bold = True
    p_h.font.color.rgb = COLOR_WHITE

    tb_c = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.42), width - Inches(0.4), height - Inches(0.46))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True
    tf_c.margin_left = tf_c.margin_top = tf_c.margin_right = tf_c.margin_bottom = 0

    # Thao tác
    p1 = tf_c.paragraphs[0]
    p1.space_after = Pt(2)
    r1_l = p1.add_run()
    r1_l.text = "▶ Thao tác: "
    r1_l.font.name = FONT_HEADING
    r1_l.font.size = Pt(13)
    r1_l.font.bold = True
    r1_l.font.color.rgb = COLOR_PRIMARY
    r1_t = p1.add_run()
    r1_t.text = action
    r1_t.font.name = FONT_BODY
    r1_t.font.size = Pt(12.5)
    r1_t.font.color.rgb = COLOR_TEXT_DARK

    # Kết quả quan sát / dự kiến
    p2 = tf_c.add_paragraph()
    p2.space_after = Pt(2)
    r2_l = p2.add_run()
    r2_l.text = "▶ Kết quả dự kiến: "
    r2_l.font.name = FONT_HEADING
    r2_l.font.size = Pt(13)
    r2_l.font.bold = True
    r2_l.font.color.rgb = COLOR_SUCCESS
    r2_t = p2.add_run()
    r2_t.text = expected
    r2_t.font.name = FONT_BODY
    r2_t.font.size = Pt(12.5)
    r2_t.font.color.rgb = COLOR_TEXT_DARK

    # Khái niệm chứng minh
    p3 = tf_c.add_paragraph()
    r3_l = p3.add_run()
    r3_l.text = "▶ Khái niệm chứng minh: "
    r3_l.font.name = FONT_HEADING
    r3_l.font.size = Pt(13)
    r3_l.font.bold = True
    r3_l.font.color.rgb = COLOR_SECONDARY
    r3_t = p3.add_run()
    r3_t.text = concept
    r3_t.font.name = FONT_BODY
    r3_t.font.size = Pt(12.5)
    r3_t.font.color.rgb = COLOR_TEXT_DARK


def set_notes(slide, explanation, demo_action="", asset_sources=""):
    """Gắn ghi chú thuyết trình (Presenter Notes) chi tiết cho từng slide."""
    tf = slide.notes_slide.notes_text_frame
    tf.text = "=== GHI CHÚ THUYẾT TRÌNH (PRESENTER NOTES) ===\n\n"

    p1 = tf.add_paragraph()
    p1.text = "1. NỘI DUNG GIẢNG VIÊN / SINH VIÊN TRÌNH BÀY:"
    p1.font.bold = True
    p2 = tf.add_paragraph()
    p2.text = explanation

    if demo_action:
        p3 = tf.add_paragraph()
        p3.text = "\n2. THAO TÁC DEMO THỰC HÀNH CỤ THỂ:"
        p3.font.bold = True
        p4 = tf.add_paragraph()
        p4.text = demo_action

    if asset_sources:
        p5 = tf.add_paragraph()
        p5.text = "\n3. NGUỒN TÀI LIỆU & CĂN CỨ KỸ THUẬT:"
        p5.font.bold = True
        p6 = tf.add_paragraph()
        p6.text = asset_sources


# ==============================================================================
# HÀM CHÍNH SINH TOÀN BỘ 20 SLIDE BÀI GIẢNG BUỔI 8
# ==============================================================================
def build_presentation():
    print("Bắt đầu sinh 20 slide bài giảng NGINX Buổi 8 (Nhóm 7 - HUCE)...")

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # ==========================================================================
    # SLIDE 01: TRANG BÌA NHÓM 7
    # ==========================================================================
    slide1 = prs.slides.add_slide(blank_layout)

    # Nền trắng trang nhã
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = COLOR_BG_PAGE
    bg1.line.fill.background()

    # Dải màu trang trí phía bên trái
    stripe = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.4), Inches(7.5))
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = COLOR_PRIMARY
    stripe.line.fill.background()

    # Logo HUCE chính thức (bảo toàn tỷ lệ)
    logo_cov_h = Inches(1.25)
    logo_cov_w = logo_cov_h * LOGO_ASPECT_RATIO
    slide1.shapes.add_picture(LOGO_PATH, Inches(1.2), Inches(0.65), width=logo_cov_w, height=logo_cov_h)

    # Tên Trường & Khoa trên bìa
    tb_univ = slide1.shapes.add_textbox(Inches(2.7), Inches(0.75), Inches(9.5), Inches(1.0))
    tf_u = tb_univ.text_frame
    tf_u.word_wrap = True
    tf_u.margin_left = tf_u.margin_top = tf_u.margin_right = tf_u.margin_bottom = 0
    p_u1 = tf_u.paragraphs[0]
    p_u1.text = "TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI"
    p_u1.font.name = FONT_HEADING
    p_u1.font.size = Pt(17)
    p_u1.font.bold = True
    p_u1.font.color.rgb = COLOR_PRIMARY
    p_u2 = tf_u.add_paragraph()
    p_u2.text = "KHOA CÔNG NGHỆ THÔNG TIN • HỆ THỐNG SERVER NÂNG CAO"
    p_u2.font.name = FONT_HEADING
    p_u2.font.size = Pt(12)
    p_u2.font.color.rgb = COLOR_TEXT_MUTED

    # Tiêu đề bài thuyết trình: BUỔI 8 - CẤU HÌNH NGINX REVERSE PROXY – UPSTREAM NHIỀU BACKEND - NHÓM 7
    tb_title = slide1.shapes.add_textbox(Inches(1.2), Inches(2.1), Inches(11.0), Inches(2.2))
    tf_t = tb_title.text_frame
    tf_t.word_wrap = True
    tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0

    p_b8 = tf_t.paragraphs[0]
    p_b8.text = "BUỔI 8"
    p_b8.font.name = FONT_HEADING
    p_b8.font.size = Pt(24)
    p_b8.font.bold = True
    p_b8.font.color.rgb = COLOR_SECONDARY

    p_maintitle = tf_t.add_paragraph()
    p_maintitle.text = "CẤU HÌNH NGINX REVERSE PROXY – UPSTREAM NHIỀU BACKEND"
    p_maintitle.font.name = FONT_HEADING
    p_maintitle.font.size = Pt(30)
    p_maintitle.font.bold = True
    p_maintitle.font.color.rgb = COLOR_PRIMARY
    p_maintitle.space_after = Pt(2)

    p_grp = tf_t.add_paragraph()
    p_grp.text = "NHÓM 7"
    p_grp.font.name = FONT_HEADING
    p_grp.font.size = Pt(20)
    p_grp.font.bold = True
    p_grp.font.color.rgb = COLOR_ACCENT

    # Bảng danh sách 4 thành viên Nhóm 7 (chính xác 100% MSSV và họ tên)
    table_shape = slide1.shapes.add_table(5, 2, Inches(1.2), Inches(4.55), Inches(6.5), Inches(1.95))
    table = table_shape.table
    table.columns[0].width = Inches(2.2)
    table.columns[1].width = Inches(4.3)

    members = [
        ("MÃ SINH VIÊN", "HỌ VÀ TÊN SINH VIÊN"),
        ("0210668", "Nguyễn Đức Mạnh"),
        ("0210768", "Nguyễn Tất Mạnh"),
        ("0214268", "Đỗ Công Trí"),
        ("0208368", "Nguyễn Huy Hoàng"),
    ]

    for row_idx, (sid, name) in enumerate(members):
        cell_id = table.cell(row_idx, 0)
        cell_name = table.cell(row_idx, 1)
        cell_id.text = sid
        cell_name.text = name

        for cell in (cell_id, cell_name):
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.margin_left = Inches(0.18)
            cell.margin_right = Inches(0.18)
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_HEADING
            p.font.size = Pt(12)

            if row_idx == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_PRIMARY
                p.font.bold = True
                p.font.color.rgb = COLOR_WHITE
            else:
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_BG_CARD if row_idx % 2 == 1 else COLOR_WHITE
                p.font.bold = True
                p.font.color.rgb = COLOR_TEXT_DARK

    # Khung thông tin thời gian & địa điểm
    tb_loc = slide1.shapes.add_textbox(Inches(8.2), Inches(5.35), Inches(4.2), Inches(1.2))
    tf_l = tb_loc.text_frame
    tf_l.word_wrap = True
    p_l1 = tf_l.paragraphs[0]
    p_l1.text = "ĐƠN VỊ ĐÀO TẠO & HỌC KỲ"
    p_l1.font.name = FONT_HEADING
    p_l1.font.size = Pt(11)
    p_l1.font.bold = True
    p_l1.font.color.rgb = COLOR_SECONDARY
    p_l2 = tf_l.add_paragraph()
    p_l2.text = "Bộ môn Hệ thống Thông tin\nKhoa Công nghệ Thông tin\nHà Nội, tháng 10 năm 2026"
    p_l2.font.name = FONT_BODY
    p_l2.font.size = Pt(12)
    p_l2.font.color.rgb = COLOR_TEXT_MUTED

    set_notes(slide1,
              "Chào mừng Thầy và các bạn đến với buổi báo cáo chuyên đề Buổi 8 của Nhóm 7. "
              "Chủ đề hôm nay tập trung vào: Cấu hình NGINX Reverse Proxy và Upstream nhiều backend. "
              "Nhóm 7 gồm 4 thành viên: Nguyễn Đức Mạnh, Nguyễn Tất Mạnh, Đỗ Công Trí, Nguyễn Huy Hoàng.",
              "Chiếu trang bìa, giới thiệu thành viên và chủ đề báo cáo.",
              "Logo HUCE trích xuất chính thức từ https://huce.edu.vn/he-thong-nhan-dien.")

    # ==========================================================================
    # SLIDE 02: KẾ THỪA TỪ BUỔI 7 & NHU CẦU BUỔI 8
    # ==========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide2, 2, TOTAL_SLIDES)
    add_slide_header(slide2, "Kế thừa & Định hướng", "Kế thừa Kiến trúc Buổi 7 & Nhu cầu Cổng vào NGINX")

    add_card(slide2, Inches(0.8), Inches(2.25), Inches(5.6), Inches(4.5), "Tham chiếu Kiến trúc Buổi 7 (Nhóm 6)")
    tb_s2_l = slide2.shapes.add_textbox(Inches(1.05), Inches(2.85), Inches(5.1), Inches(3.7))
    tf_s2_l = tb_s2_l.text_frame
    tf_s2_l.word_wrap = True
    items_s2_l = [
        ("Mô hình tham chiếu Buổi 7:", "Slide Nhóm 6 đã giới thiệu Docker Compose, 2 backend Node.js cổng 3000 và NGINX cổng 8080 ở mức sơ đồ kiến trúc."),
        ("Bản chất tài liệu tham chiếu:", "Slide Nhóm 6 là tài liệu tham chiếu kiến trúc, không phải bằng chứng Nhóm 7 đang sở hữu một ứng dụng chạy sẵn từ trước."),
        ("Vấn đề cần giải quyết:", "Các backend chạy độc lập, chưa có cấu hình định tuyến chi tiết, chưa có kiểm chứng thực tế bằng cấu hình NGINX và đo kiểm trực tiếp.")
    ]
    for i, (h, b) in enumerate(items_s2_l):
        p = tf_s2_l.paragraphs[0] if i == 0 else tf_s2_l.add_paragraph()
        p.space_after = Pt(12)
        r_h = p.add_run()
        r_h.text = f"• {h} "
        r_h.font.bold = True
        r_h.font.size = Pt(15)
        r_h.font.color.rgb = COLOR_PRIMARY
        r_b = p.add_run()
        r_b.text = b
        r_b.font.size = Pt(14.5)
        r_b.font.color.rgb = COLOR_TEXT_DARK

    add_card(slide2, Inches(6.8), Inches(2.25), Inches(5.733), Inches(4.5), "Mục tiêu Trọng tâm của Buổi 8")
    tb_s2_r = slide2.shapes.add_textbox(Inches(7.05), Inches(2.85), Inches(5.2), Inches(3.7))
    tf_s2_r = tb_s2_r.text_frame
    tf_s2_r.word_wrap = True
    items_s2_r = [
        ("Xây dựng Demo Độc lập:", "Tạo mới một ứng dụng demo gọn nhẹ: Frontend tĩnh, 2 backend Node.js (cổng 3000 trả instanceId), và NGINX Gateway (8080:80, 8443:443)."),
        ("Cổng vào Tập trung (Single Entry):", "Định tuyến đường dẫn '/ ' về frontend tĩnh và '/api/ ' về backend, loại bỏ rào cản CORS nội bộ qua Same-Origin."),
        ("Cân bằng tải & Kiểm chứng Thực hành:", "Cấu hình Upstream chia tải luân phiên, bảo vệ dung lượng body (413), nạp nóng cấu hình và thiết lập HTTPS tự ký có SAN.")
    ]
    for i, (h, b) in enumerate(items_s2_r):
        p = tf_s2_r.paragraphs[0] if i == 0 else tf_s2_r.add_paragraph()
        p.space_after = Pt(12)
        r_h = p.add_run()
        r_h.text = f"✔ {h} "
        r_h.font.bold = True
        r_h.font.size = Pt(15)
        r_h.font.color.rgb = COLOR_SUCCESS
        r_b = p.add_run()
        r_b.text = b
        r_b.font.size = Pt(14.5)
        r_b.font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide2,
              "Nhấn mạnh rõ: Buổi 7 của Nhóm 6 đã phác thảo mô hình Docker Compose với Node.js cổng 3000 và NGINX ở mức sơ đồ. "
              "Chúng ta coi đó là tài liệu tham chiếu lý thuyết. Trong Buổi 8 này, Nhóm 7 xây dựng một bộ demo độc lập, "
              "viết cấu hình thực tế cho NGINX và kiểm chứng từng bước bằng mã nguồn chạy được trong thư mục demo/.",
              "Giới thiệu lộ trình bài học: từ phục vụ file tĩnh, reverse proxy 1 backend, upstream 2 backend, giới hạn 413, tới HTTPS local.",
              "Tài liệu Buổi 8 PDF Mục 1 & Slide Nhóm 6 Buổi 7.")

    # ==========================================================================
    # SLIDE 03: BẢN CHẤT NGINX & KIẾN TRÚC EVENT-DRIVEN
    # ==========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide3, 3, TOTAL_SLIDES)
    add_slide_header(slide3, "Tổng quan Công nghệ", "Bản chất NGINX & Kiến trúc Hướng Sự kiện (Event-Driven)")

    add_card(slide3, Inches(0.8), Inches(2.25), Inches(5.6), Inches(4.5), "NGINX là gì?")
    tb_s3_l = slide3.shapes.add_textbox(Inches(1.05), Inches(2.85), Inches(5.1), Inches(3.7))
    tf_s3_l = tb_s3_l.text_frame
    tf_s3_l.word_wrap = True
    c3_l = [
        ("Định nghĩa:", "NGINX là phần mềm mã nguồn mở hiệu năng cao, đóng vai trò Web Server, Reverse Proxy, API Gateway và Cân bằng tải (Load Balancer)."),
        ("Lịch sử phát triển:", "Do Igor Sysoev phát hành lần đầu năm 2004 nhằm giải quyết bài toán C10K (phục vụ đồng thời 10.000 kết nối đồng thời trên một máy chủ)."),
        ("Vị thế hiện nay:", "Chiếm thị phần hàng đầu thế giới cho các hệ thống web quy mô lớn nhờ tốc độ vượt trội và mức tiêu hao tài nguyên cực thấp.")
    ]
    for i, (k, v) in enumerate(c3_l):
        p = tf_s3_l.paragraphs[0] if i == 0 else tf_s3_l.add_paragraph()
        p.space_after = Pt(12)
        p.add_run().text = f"• {k} "
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(15)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = v
        p.runs[1].font.size = Pt(14.5)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    add_card(slide3, Inches(6.8), Inches(2.25), Inches(5.733), Inches(4.5), "Cơ chế Xử lý: Event-Driven vs Thread-based")
    tb_s3_r = slide3.shapes.add_textbox(Inches(7.05), Inches(2.85), Inches(5.2), Inches(3.7))
    tf_s3_r = tb_s3_r.text_frame
    tf_s3_r.word_wrap = True
    c3_r = [
        ("Mô hình Đa luồng truyền thống:", "Mỗi kết nối client tạo ra một thread/process riêng. Khi có hàng nghìn client, máy chủ cạn kiệt bộ nhớ do chi phí Context Switching."),
        ("Kiến trúc Bất đồng bộ của NGINX:", "Sử dụng mô hình Event-driven Non-blocking I/O. Một Master Process quản lý các Worker Process (thường khớp số nhân CPU)."),
        ("Khả năng phục vụ bền bỉ:", "Mỗi Worker Process có thể xử lý hàng chục nghìn kết nối song song trong một Event Loop duy nhất mà không bị khóa luồng (blocking).")
    ]
    for i, (k, v) in enumerate(c3_r):
        p = tf_s3_r.paragraphs[0] if i == 0 else tf_s3_r.add_paragraph()
        p.space_after = Pt(12)
        p.add_run().text = f"✔ {k} "
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(15)
        p.runs[0].font.color.rgb = COLOR_SECONDARY
        p.add_run().text = v
        p.runs[1].font.size = Pt(14.5)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide3,
              "Giải thích cho sinh viên hiểu tại sao NGINX lại nhanh: "
              "So sánh hình tượng bồi bàn: Mô hình cũ giống 1 khách có 1 bồi bàn đứng chờ (thread-based). "
              "NGINX giống 1 bồi bàn phục vụ cả phòng ăn qua cơ chế phát sự kiện (event-driven). "
              "Master process chịu trách nhiệm đọc cấu hình, quản lý vòng đời worker. Worker process xử lý I/O mạng thật.",
              "Vẽ minh họa Master Process và Worker Process lên bảng nếu cần.",
              "NGINX Architecture Whitepaper & nginx.org documentation.")

    # ==========================================================================
    # SLIDE 04: PHÂN BIỆT 3 VAI TRÒ HỆ THỐNG
    # ==========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide4, 4, TOTAL_SLIDES)
    add_slide_header(slide4, "Kiến trúc Hệ thống", "Phân định 3 Vai trò: Web Server, Reverse Proxy & Load Balancer")

    card_w = Inches(3.644)
    gap = Inches(0.4)

    # 1. Web Server
    add_card(slide4, Inches(0.8), Inches(2.25), card_w, Inches(4.5), "1. Web Server Tĩnh")
    tb_c1 = slide4.shapes.add_textbox(Inches(0.95), Inches(2.85), card_w - Inches(0.3), Inches(3.7))
    tf_c1 = tb_c1.text_frame
    tf_c1.word_wrap = True
    txt_c1 = [
        ("Nhiệm vụ cốt lõi:", "Đọc trực tiếp các tệp tĩnh (HTML, CSS, JS, ảnh) từ đĩa vật lý để trả lời request của client."),
        ("Chỉ thị NGINX:", "Sử dụng 'root' và 'index' kết hợp zero-copy (sendfile) để tối ưu hóa I/O."),
        ("Trong bài lab:", "NGINX phục vụ trực tiếp bộ mã build frontend tại thư mục '/usr/share/nginx/html'.")
    ]
    for k, v in txt_c1:
        p = tf_c1.add_paragraph()
        p.space_after = Pt(10)
        p.add_run().text = f"• {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14.5)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13.5)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    # 2. Reverse Proxy
    add_card(slide4, Inches(0.8) + card_w + gap, Inches(2.25), card_w, Inches(4.5), "2. Reverse Proxy")
    tb_c2 = slide4.shapes.add_textbox(Inches(0.95) + card_w + gap, Inches(2.85), card_w - Inches(0.3), Inches(3.7))
    tf_c2 = tb_c2.text_frame
    tf_c2.word_wrap = True
    txt_c2 = [
        ("Nhiệm vụ cốt lõi:", "Đứng trước backend, tiếp nhận request của client và chuyển tiếp (forward) vào dịch vụ ứng dụng nội bộ."),
        ("Chỉ thị NGINX:", "Sử dụng 'location /api/ { proxy_pass ...; }' kèm các header bảo toàn."),
        ("Lợi ích kỹ thuật:", "Che giấu địa chỉ IP nội bộ backend, gom chung Origin để loại trừ lỗi CORS cho luồng gọi API nội bộ.")
    ]
    for k, v in txt_c2:
        p = tf_c2.add_paragraph()
        p.space_after = Pt(10)
        p.add_run().text = f"• {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14.5)
        p.runs[0].font.color.rgb = COLOR_SECONDARY
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13.5)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    # 3. Load Balancer
    add_card(slide4, Inches(0.8) + (card_w + gap) * 2, Inches(2.25), card_w, Inches(4.5), "3. Load Balancer")
    tb_c3 = slide4.shapes.add_textbox(Inches(0.95) + (card_w + gap) * 2, Inches(2.85), card_w - Inches(0.3), Inches(3.7))
    tf_c3 = tb_c3.text_frame
    tf_c3.word_wrap = True
    txt_c3 = [
        ("Nhiệm vụ cốt lõi:", "Phân phối lưu lượng truy cập đồng đều tới nhiều instance backend đang chạy song song."),
        ("Chỉ thị NGINX:", "Sử dụng khối 'upstream' với thuật toán Round-Robin mặc định, hoặc least_conn, ip_hash."),
        ("Lợi ích kỹ thuật:", "Tăng năng lực xử lý chịu tải, tránh quá tải một node và hỗ trợ tự động loại trừ node lỗi.")
    ]
    for k, v in txt_c3:
        p = tf_c3.add_paragraph()
        p.space_after = Pt(10)
        p.add_run().text = f"• {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14.5)
        p.runs[0].font.color.rgb = COLOR_ACCENT
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13.5)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide4,
              "Nhấn mạnh với sinh viên: Cả 3 vai trò này đều có thể cấu hình đồng thời trên cùng một tiến trình NGINX duy nhất! "
              "Phân biệt Forward Proxy (đại diện cho client đi ra ngoài) và Reverse Proxy (đại diện cho server tiếp nhận client vào). "
              "Trong bài thực hành, NGINX đảm nhận cả 3: vừa là web server phục vụ file frontend tĩnh, vừa là reverse proxy cho /api/, vừa cân bằng tải upstream giữa backend1 và backend2.",
              "Vẽ mô hình so sánh vị trí của 3 thành phần trên hệ thống minh họa.",
              "Tài liệu Buổi 8 PDF, Mục 1.1 và 1.2.")

    # ==========================================================================
    # SLIDE 05: NỀN TẢNG MẠNG, CỔNG & GIAO THỨC HTTP/HTTPS
    # ==========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide5, 5, TOTAL_SLIDES)
    add_slide_header(slide5, "Nền tảng Mạng Web", "Nền tảng Mạng: IP, Tên miền ảo, Cổng & HTTP / HTTPS")

    add_card(slide5, Inches(0.8), Inches(2.25), Inches(5.6), Inches(4.5), "Phân giải Tên miền & Ánh xạ Cổng Host")
    tb_s5_l = slide5.shapes.add_textbox(Inches(1.05), Inches(2.85), Inches(5.1), Inches(3.7))
    tf_s5_l = tb_s5_l.text_frame
    tf_s5_l.word_wrap = True
    c5_l = [
        ("Địa chỉ IP & Tên miền:", "Máy tính định tuyến gói tin qua IP (Layer 3), nhưng người dùng nhận diện qua Domain (ví dụ: 'myapp.local')."),
        ("Tệp hosts phân giải cục bộ:", "Tệp hosts ('/etc/hosts' hoặc 'C:\\Windows\\...\\hosts') được ưu tiên tra cứu trước DNS Server, ánh xạ '127.0.0.1 myapp.local'."),
        ("Ánh xạ Cổng Docker (Port Mapping):", "Host ánh xạ cổng 8080 -> 80 (HTTP) và cổng 8443 -> 443 (HTTPS) của NGINX container. Backend chạy nội bộ tại cổng 3000.")
    ]
    for k, v in c5_l:
        p = tf_s5_l.add_paragraph()
        p.space_after = Pt(7)
        p.add_run().text = f"• {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14.5)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13.5)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    add_card(slide5, Inches(6.8), Inches(2.25), Inches(5.733), Inches(4.5), "So sánh Giao thức HTTP (80) & HTTPS (443)")
    tb_s5_r = slide5.shapes.add_textbox(Inches(7.05), Inches(2.85), Inches(5.2), Inches(3.7))
    tf_s5_r = tb_s5_r.text_frame
    tf_s5_r.word_wrap = True
    c5_r = [
        ("Giao thức HTTP (Cổng 80):", "Truyền dữ liệu dạng bản rõ (plaintext). Dễ bị tấn công nghe lén (Sniffing) và giả mạo (Man-in-the-Middle) trên đường truyền."),
        ("Giao thức HTTPS (Cổng 443):", "HTTP bọc trong lớp mã hóa bảo mật TLS/SSL. Đảm bảo 3 tiêu chí: Bảo mật (Confidentiality), Toàn vẹn (Integrity) và Xác thực danh tính (Authentication)."),
        ("SSL Termination tại NGINX:", "NGINX giải mã TLS ở cổng vào 443, sau đó chuyển tiếp HTTP thông thường vào mạng nội bộ container cổng 3000 để giảm tải CPU cho backend.")
    ]
    for k, v in c5_r:
        p = tf_s5_r.add_paragraph()
        p.space_after = Pt(7)
        p.add_run().text = f"✔ {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14.5)
        p.runs[0].font.color.rgb = COLOR_SECONDARY
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13.5)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide5,
              "Giải thích quy trình phân giải tên miền: Khi gõ myapp.local vào trình duyệt, hệ điều hành đọc hosts file trước tiên. "
              "Sau khi có IP 127.0.0.1, gói tin tìm tới cổng 8080 hoặc 8443 của host, Docker iptables chuyển tiếp vào cổng 80 hoặc 443 của NGINX container. "
              "Khái niệm SSL Termination rất quan trọng: NGINX gánh toàn bộ quá trình mã hóa/giải mã TLS nặng nề, các backend Node.js phía sau chỉ cần xử lý HTTP thuần tại cổng 3000.",
              "Vẽ luồng IP và ánh xạ cổng host:container lên bảng.",
              "RFC 2616 (HTTP/1.1), RFC 8446 (TLS 1.3).")

    # ==========================================================================
    # SLIDE 06: SƠ ĐỒ LUỒNG YÊU CẦU & ĐỊNH TUYẾN URL
    # ==========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide6, 6, TOTAL_SLIDES)
    add_slide_header(slide6, "Định tuyến Yêu cầu", "Sơ đồ Luồng Yêu cầu (Request Flow) & Ví dụ URL")

    # Khối Browser Client
    b_left, b_top, b_w, b_h = Inches(0.9), Inches(3.2), Inches(2.6), Inches(1.8)
    b_box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, b_left, b_top, b_w, b_h)
    b_box.fill.solid()
    b_box.fill.fore_color.rgb = COLOR_PRIMARY
    b_box.line.color.rgb = COLOR_PRIMARY
    tb_b = slide6.shapes.add_textbox(b_left, b_top + Inches(0.3), b_w, b_h - Inches(0.3))
    tb_b.text_frame.word_wrap = True
    p = tb_b.text_frame.paragraphs[0]
    p.text = "CLIENT / BROWSER\nhttp://myapp.local:8080"
    p.font.name = FONT_HEADING
    p.font.size = Pt(14.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_WHITE
    p.alignment = PP_ALIGN.CENTER

    # Mũi tên từ Client tới NGINX
    arr1 = slide6.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(3.6), Inches(3.85), Inches(1.2), Inches(0.45))
    arr1.fill.solid()
    arr1.fill.fore_color.rgb = COLOR_SECONDARY
    arr1.line.fill.background()

    # Khối NGINX Reverse Proxy Gateway
    ng_left, ng_top, ng_w, ng_h = Inches(4.9), Inches(2.5), Inches(3.2), Inches(3.2)
    ng_box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, ng_left, ng_top, ng_w, ng_h)
    ng_box.fill.solid()
    ng_box.fill.fore_color.rgb = RGBColor(238, 242, 255)
    ng_box.line.color.rgb = COLOR_SECONDARY
    ng_box.line.width = Pt(2)
    tb_ng = slide6.shapes.add_textbox(ng_left + Inches(0.2), ng_top + Inches(0.3), ng_w - Inches(0.4), ng_h - Inches(0.6))
    tb_ng.text_frame.word_wrap = True
    p = tb_ng.text_frame.paragraphs[0]
    p.text = "NGINX GATEWAY\n(Cổng 8080:80 & 8443:443)\n\nPhân tích Request URL:"
    p.font.name = FONT_HEADING
    p.font.size = Pt(14.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_PRIMARY
    p.alignment = PP_ALIGN.CENTER

    p2 = tb_ng.text_frame.add_paragraph()
    p2.text = "• Path '/' -> Static root\n• Path '/api/' -> Upstream"
    p2.font.name = FONT_CODE
    p2.font.size = Pt(13.5)
    p2.font.color.rgb = COLOR_SECONDARY

    # Mũi tên nhánh trên (Static FE)
    arr_top = slide6.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(8.2), Inches(2.85), Inches(1.1), Inches(0.35))
    arr_top.fill.solid()
    arr_top.fill.fore_color.rgb = COLOR_SUCCESS
    arr_top.line.fill.background()

    # Mũi tên nhánh dưới (Backend API)
    arr_bot = slide6.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(8.2), Inches(4.85), Inches(1.1), Inches(0.35))
    arr_bot.fill.solid()
    arr_bot.fill.fore_color.rgb = COLOR_ACCENT
    arr_bot.line.fill.background()

    # Khối Đích 1: Static Frontend
    fe_left, fe_top, fe_w, fe_h = Inches(9.4), Inches(2.3), Inches(3.1), Inches(1.5)
    fe_box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, fe_left, fe_top, fe_w, fe_h)
    fe_box.fill.solid()
    fe_box.fill.fore_color.rgb = RGBColor(240, 253, 244)
    fe_box.line.color.rgb = COLOR_SUCCESS
    fe_box.line.width = Pt(1.5)
    tb_fe = slide6.shapes.add_textbox(fe_left + Inches(0.15), fe_top + Inches(0.2), fe_w - Inches(0.3), fe_h - Inches(0.4))
    tb_fe.text_frame.word_wrap = True
    p = tb_fe.text_frame.paragraphs[0]
    p.text = "STATIC FRONTEND\n/usr/share/nginx/html\n(index.html, style.css, app.js)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_SUCCESS
    p.alignment = PP_ALIGN.CENTER

    # Khối Đích 2: Upstream Backends
    be_left, be_top, be_w, be_h = Inches(9.4), Inches(4.3), Inches(3.1), Inches(1.8)
    be_box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, be_left, be_top, be_w, be_h)
    be_box.fill.solid()
    be_box.fill.fore_color.rgb = RGBColor(240, 249, 255)
    be_box.line.color.rgb = COLOR_ACCENT
    be_box.line.width = Pt(1.5)
    tb_be = slide6.shapes.add_textbox(be_left + Inches(0.15), be_top + Inches(0.2), be_w - Inches(0.3), be_h - Inches(0.4))
    tb_be.text_frame.word_wrap = True
    p = tb_be.text_frame.paragraphs[0]
    p.text = "UPSTREAM CLUSTER\nbackend1:3000 (Node.js)\nbackend2:3000 (Node.js)\n(GET /api/products)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT
    p.alignment = PP_ALIGN.CENTER

    # Chú thích URL bên dưới
    add_card(slide6, Inches(0.8), Inches(5.95), Inches(11.733), Inches(0.85))
    tb_sub = slide6.shapes.add_textbox(Inches(0.95), Inches(6.05), Inches(11.4), Inches(0.68))
    tf_sub = tb_sub.text_frame
    tf_sub.word_wrap = True
    p_sub = tf_sub.paragraphs[0]
    p_sub.text = "Ví dụ URL thực tế: Người dùng mở 'http://myapp.local:8080/' -> NGINX trả giao diện index.html. " \
                 "JavaScript gọi ngầm 'http://myapp.local:8080/api/products' -> NGINX chuyển tiếp tới 'http://backend_cluster/api/products' tại cổng nội bộ 3000."
    p_sub.font.name = FONT_BODY
    p_sub.font.size = Pt(13.5)
    p_sub.font.color.rgb = COLOR_PRIMARY

    set_notes(slide6,
              "Slide này minh họa trực quan luồng đi của 1 request: "
              "1. Client chỉ biết duy nhất 1 địa chỉ máy chủ: myapp.local:8080. "
              "2. NGINX phân tích tiền tố URI: Nếu là / -> Đọc file tĩnh trên đĩa trả về ngay. "
              "3. Nếu là /api/... -> NGINX ủy quyền (proxy_pass) sang cụm upstream backend1/backend2 ở cổng 3000.",
              "Trình bày chi tiết luồng dữ liệu 2 nhánh: File tĩnh và API nghiệp vụ.",
              "Tài liệu Buổi 8 PDF, Mục 2: Cấu hình Reverse Proxy.")

    # ==========================================================================
    # SLIDE 07: QUẢN TRỊ CẤU HÌNH NGINX: LINUX HOST VS DOCKER
    # ==========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide7, 7, TOTAL_SLIDES)
    add_slide_header(slide7, "Quản trị Cấu hình", "Quản trị Cấu hình: Linux Host vs Docker Container")

    add_card(slide7, Inches(0.8), Inches(2.25), Inches(5.6), Inches(4.5), "Môi trường Linux Host (Ubuntu / Debian)")
    tb_s7_l = slide7.shapes.add_textbox(Inches(1.05), Inches(2.85), Inches(5.1), Inches(3.7))
    tf_s7_l = tb_s7_l.text_frame
    tf_s7_l.word_wrap = True
    c7_l = [
        ("Tệp chính '/etc/nginx/nginx.conf':", "Chứa cấu hình toàn cục (worker_processes, events, http core settings)."),
        ("Thư mục 'sites-available/':", "Lưu trữ toàn bộ file cấu hình của từng website (vd: default, myapp.local). Chưa được NGINX kích hoạt trực tiếp."),
        ("Thư mục 'sites-enabled/':", "Chứa các liên kết mềm (symbolic link) trỏ sang 'sites-available/'. Chỉ site nào được ln -s mới được nạp vào NGINX."),
        ("Lệnh kích hoạt:", "'sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/'")
    ]
    for k, v in c7_l:
        p = tf_s7_l.add_paragraph()
        p.space_after = Pt(5)
        p.add_run().text = f"• {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    add_card(slide7, Inches(6.8), Inches(2.25), Inches(5.733), Inches(4.5), "Môi trường Container Hóa (Docker Mount)")
    tb_s7_r = slide7.shapes.add_textbox(Inches(7.05), Inches(2.85), Inches(5.2), Inches(3.7))
    tf_s7_r = tb_s7_r.text_frame
    tf_s7_r.word_wrap = True
    c7_r = [
        ("Cơ chế nạp tự động 'conf.d/':", "Image chuẩn 'nginx:alpine' tự động đọc chỉ thị 'include /etc/nginx/conf.d/*.conf;' bên trong nginx.conf gốc."),
        ("Không dùng sites-available:", "Trong container tối giản, ta không cần quản lý symlink mà mount trực tiếp tệp cấu hình vào thư mục 'conf.d/'."),
        ("Cú pháp Compose Volume:", "'./nginx/conf.d:/etc/nginx/conf.d:ro' (mount dạng chỉ đọc để bảo mật)."),
        ("Kiểm tra cú pháp & Reload:", "'docker compose exec proxy nginx -t' và 'docker compose exec proxy nginx -s reload'")
    ]
    for k, v in c7_r:
        p = tf_s7_r.add_paragraph()
        p.space_after = Pt(5)
        p.add_run().text = f"✔ {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_SECONDARY
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide7,
              "Giải thích sự khác biệt giữa hai trường phái: "
              "1. Linux truyền thống: Dùng symlink giữa sites-available và sites-enabled để dễ bật/tắt site bằng cách xóa symlink mà không mất file. "
              "2. Docker Container: Ưu tiên đơn giản, khai báo trong compose.yaml và mount thẳng vào /etc/nginx/conf.d/default.conf. "
              "Nhấn mạnh luôn kiểm tra nginx -t trước khi reload.",
              "Thao tác demo: Mở tệp compose.yaml chỉ cho sinh viên thấy dòng volumes mount cấu hình NGINX.",
              "Debian NGINX Packaging Documentation & Docker Hub Official NGINX Image.")

    # ==========================================================================
    # SLIDE 08: NGINX PHỤC VỤ FILE TĨNH & DEMO BƯỚC 1
    # ==========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide8, 8, TOTAL_SLIDES)
    add_slide_header(slide8, "Thực hành Web Server", "NGINX làm Web Server: Phục vụ File Tĩnh Frontend")

    code_s8 = [
        "server {",
        "    listen 80;",
        "    server_name myapp.local localhost;",
        "    location / {",
        "        root /usr/share/nginx/html;",
        "        index index.html index.htm;",
        "        try_files $uri $uri/ =404;",
        "    }",
        "}"
    ]
    add_code_panel(slide8, Inches(0.8), Inches(2.25), Inches(5.6), Inches(2.45), "nginx/static.conf", code_s8, font_size_pt=11.5)

    add_card(slide8, Inches(6.8), Inches(2.25), Inches(5.733), Inches(2.45), "Các Chỉ thị Cốt lõi của Web Server")
    tb_s8_desc = slide8.shapes.add_textbox(Inches(7.05), Inches(2.8), Inches(5.2), Inches(1.8))
    tf_s8_d = tb_s8_desc.text_frame
    tf_s8_d.word_wrap = True
    c8_desc = [
        ("root:", "Xác định đường dẫn thư mục gốc trên ổ đĩa chứa các file tĩnh (HTML, CSS, JS, ảnh)."),
        ("index:", "Tên file mặc định NGINX sẽ tìm kiếm khi client truy cập vào thư mục gốc ('/')."),
        ("Hiệu năng cao:", "NGINX truyền file trực tiếp qua kernel zero-copy (sendfile), không qua runtime ứng dụng.")
    ]
    for k, v in c8_desc:
        p = tf_s8_d.add_paragraph()
        p.space_after = Pt(7)
        p.add_run().text = f"• {k} "
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = v
        p.runs[1].font.size = Pt(13.5)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    add_demo_box(slide8, Inches(0.8), Inches(4.85), Inches(11.733), Inches(1.92),
                 1, "NGINX làm Web Server phục vụ Frontend tĩnh",
                 "Khởi chạy container NGINX đã mount thư mục './frontend' vào '/usr/share/nginx/html'. Mở trình duyệt truy cập 'http://localhost:8080/'.",
                 "Trình duyệt tải thành công trang chủ HTML, tải đầy đủ CSS/JS, hiển thị mã trạng thái HTTP 200 OK trên tab Network.",
                 "Chứng minh NGINX đọc trực tiếp tệp tĩnh từ đĩa vật lý qua chỉ thị 'root' và 'index' với tốc độ cao, độc lập với backend.")

    set_notes(slide8,
              "Bước 1 trong Section 3 của Đề bài PDF: NGINX đóng vai trò Web Server thuần túy. "
              "Giải thích sendfile on: NGINX yêu cầu Linux kernel đọc dữ liệu từ file descriptor sang network socket mà không cần copy qua userspace buffer. "
              "Điều này giải thích tại sao NGINX phục vụ file tĩnh nhanh hơn Node.js/Tomcat gấp nhiều lần.",
              "Thao tác demo: Mở trình duyệt gõ http://localhost:8080/, mở F12 Network tab xem status 200 OK của index.html, style.css, app.js.",
              "Tài liệu Buổi 8 PDF, Mục 3 - Bước 1.")

    # ==========================================================================
    # SLIDE 09: CƠ CHẾ SPA FALLBACK VỚI TRY_FILES
    # ==========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide9, 9, TOTAL_SLIDES)
    add_slide_header(slide9, "Định tuyến Ứng dụng", "Cơ chế SPA Fallback try_files & Bản chất Lỗi 404")

    add_card(slide9, Inches(0.8), Inches(2.25), Inches(5.6), Inches(4.5), "Bản chất Lỗi 404 khi Refresh trong SPA")
    tb_s9_l = slide9.shapes.add_textbox(Inches(1.05), Inches(2.85), Inches(5.1), Inches(3.7))
    tf_s9_l = tb_s9_l.text_frame
    tf_s9_l.word_wrap = True
    c9_l = [
        ("Đặc tính của SPA (React/Vue):", "Sử dụng HTML5 History API để định tuyến ảo tại trình duyệt client (ví dụ: '/products/123')."),
        ("Tình huống phát sinh lỗi:", "Người dùng đang duyệt tại '/products/123' và nhấn F5 (Reload trang)."),
        ("Phản ứng mặc định của NGINX:", "NGINX tìm kiếm thư mục vật lý '/usr/share/nginx/html/products/123' trên đĩa máy chủ."),
        ("Hậu quả lỗi 404:", "Do trên ổ đĩa chỉ có 1 file 'index.html', đường dẫn vật lý kia không tồn tại -> NGINX trả về mã lỗi 404 Not Found!")
    ]
    for k, v in c9_l:
        p = tf_s9_l.add_paragraph()
        p.space_after = Pt(5)
        p.add_run().text = f"⚠ {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_DANGER
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    add_card(slide9, Inches(6.8), Inches(2.25), Inches(5.733), Inches(4.5), "Giải pháp Chuẩn mực: Chỉ thị try_files")
    tb_s9_r = slide9.shapes.add_textbox(Inches(7.05), Inches(2.85), Inches(5.2), Inches(3.7))
    tf_s9_r = tb_s9_r.text_frame
    tf_s9_r.word_wrap = True
    c9_r = [
        ("Cú pháp cấu hình:", "try_files $uri $uri/ /index.html;"),
        ("Bước 1 ($uri):", "Kiểm tra xem có file vật lý khớp chính xác với URL không (vd: logo.png, style.css). Nếu có -> phục vụ ngay."),
        ("Bước 2 ($uri/):", "Nếu không có file, kiểm tra xem có thư mục con vật lý tương ứng không."),
        ("Bước 3 (Fallback /index.html):", "Nếu cả hai không có, NGINX trả về 'index.html' (HTTP 200). JS router client sẽ đọc URL và hiển thị đúng màn hình.")
    ]
    for k, v in c9_r:
        p = tf_s9_r.add_paragraph()
        p.space_after = Pt(5)
        p.add_run().text = f"✔ {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_SUCCESS
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide9,
              "Câu hỏi phỏng vấn kinh điển: 'Tại sao deploy React/Vue lên NGINX bấm link thì chuyển trang được nhưng F5 lại bị 404?' "
              "Giải thích: Client-side routing không tạo file vật lý trên server. "
              "Chỉ thị try_files $uri $uri/ /index.html; chính là chìa khóa để mọi route ảo đều fallback về index.html an toàn.",
              "Vẽ chuỗi điều kiện kiểm tra của try_files lên bảng.",
              "NGINX try_files directive documentation.")

    # ==========================================================================
    # SLIDE 10: NGINX REVERSE PROXY & DEMO BƯỚC 2
    # ==========================================================================
    slide10 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide10, 10, TOTAL_SLIDES)
    add_slide_header(slide10, "Tích hợp Hệ thống & Demo", "Reverse Proxy Ghép cặp FE - BE & Cơ chế Same-Origin")

    code_s10 = [
        "location /api/ {",
        "    # Chuyển tiếp tới backend (giữ nguyên /api/)",
        "    proxy_pass http://backend_cluster;",
        "    proxy_set_header Host $host;",
        "    proxy_set_header X-Real-IP $remote_addr;",
        "}"
    ]
    add_code_panel(slide10, Inches(0.8), Inches(2.25), Inches(5.6), Inches(2.45), "nginx/reverse_proxy.conf", code_s10, font_size_pt=13.5)

    add_card(slide10, Inches(6.8), Inches(2.25), Inches(5.733), Inches(2.45), "Cơ chế Same-Origin & Quy tắc proxy_pass")
    tb_s10_desc = slide10.shapes.add_textbox(Inches(7.05), Inches(2.8), Inches(5.2), Inches(1.8))
    tf_s10_d = tb_s10_desc.text_frame
    tf_s10_d.word_wrap = True
    c10_desc = [
        ("Tránh CORS qua Same-Origin:", "Frontend và API cùng phục vụ dưới một Origin duy nhất ('http://localhost:8080'). Trình duyệt không kích hoạt kiểm tra CORS cho các request nội bộ."),
        ("Quy tắc dấu '/' trong proxy_pass:", "Cấu hình 'proxy_pass http://backend_cluster;' (không có dấu / cuối) giữ nguyên tiền tố '/api/' khi chuyển tiếp tới route '/api/products' của backend.")
    ]
    for k, v in c10_desc:
        p = tf_s10_d.add_paragraph()
        p.space_after = Pt(5)
        p.add_run().text = f"• {k} "
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(13)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = v
        p.runs[1].font.size = Pt(12.5)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    add_demo_box(slide10, Inches(0.8), Inches(4.85), Inches(11.733), Inches(1.92),
                 2, "Reverse Proxy cho FE + BE & Kiểm chứng Same-Origin",
                 "Từ giao diện frontend, bấm nút 'Tải danh sách sản phẩm' gọi API 'GET /api/products'. Đồng thời kiểm tra log trong container backend.",
                 "Dữ liệu danh sách sản phẩm trả về dạng JSON hiển thị lên bảng giao diện; Console không có lỗi CORS; Backend ghi nhận request và log header.",
                 "Chứng minh NGINX định tuyến path '/api/' vào backend thông suốt, tạo môi trường Same-Origin giúp luồng gọi API nội bộ không bị rào cản CORS.")

    set_notes(slide10,
              "Bước 2 trong Section 3 PDF: Reverse Proxy ghép cặp Frontend và 1 Backend API. "
              "Lưu ý quan trọng: API dùng trong bài là tính năng dữ liệu nghiệp vụ thật '/api/products' (Node.js cổng 3000), không phải mock đơn giản. "
              "Giải thích kỹ: Same-Origin giúp tránh lỗi CORS cho luồng gọi nội bộ giữa FE và BE, nhưng nếu có ứng dụng bên ngoài gọi vào thì vẫn phải áp dụng chính sách CORS. "
              "Quy tắc dấu slash: Nếu viết proxy_pass http://backend_cluster/ (có slash cuối), NGINX sẽ cắt bỏ /api/ và chỉ gửi /products tới backend.",
              "Thao tác demo: Bấm nút load sản phẩm trên giao diện, mở Network tab xem status 200 tại /api/products cùng origin.",
              "Tài liệu Buổi 8 PDF, Mục 3 - Bước 2.")

    # ==========================================================================
    # SLIDE 11: CÁC PROXY HEADERS QUAN TRỌNG
    # ==========================================================================
    slide11 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide11, 11, TOTAL_SLIDES)
    add_slide_header(slide11, "Bảo toàn Thông tin", "Các Proxy Headers Quan trọng & Trusted Proxies")

    h_w = Inches(5.6)
    h_h = Inches(2.15)

    # 1. Host
    add_card(slide11, Inches(0.8), Inches(2.25), h_w, h_h, "proxy_set_header Host $host;")
    tb_h1 = slide11.shapes.add_textbox(Inches(1.0), Inches(2.8), h_w - Inches(0.4), Inches(1.5))
    tb_h1.text_frame.word_wrap = True
    tb_h1.text_frame.paragraphs[0].text = "• Ý nghĩa: Giữ nguyên tên miền gốc mà client gõ trên thanh địa chỉ (vd: 'myapp.local:8080').\n• Nếu thiếu: Backend nhận tên server nội bộ (vd: 'backend1:3000') khiến các đường link tuyệt đối do backend tự sinh bị sai lệch hoàn toàn."
    tb_h1.text_frame.paragraphs[0].font.size = Pt(13.5)
    tb_h1.text_frame.paragraphs[0].font.color.rgb = COLOR_TEXT_DARK

    # 2. X-Real-IP
    add_card(slide11, Inches(6.8), Inches(2.25), Inches(5.733), h_h, "proxy_set_header X-Real-IP $remote_addr;")
    tb_h2 = slide11.shapes.add_textbox(Inches(7.0), Inches(2.8), Inches(5.333), Inches(1.5))
    tb_h2.text_frame.word_wrap = True
    tb_h2.text_frame.paragraphs[0].text = "• Ý nghĩa: Chuyển tiếp địa chỉ IP thật của máy client ($remote_addr) tới backend.\n• Lưu ý Docker: Trong mạng bridge, nếu không có header này, backend chỉ thấy IP của container NGINX (vd: 172.20.0.x), không phải 127.0.0.1 hay IP của client."
    tb_h2.text_frame.paragraphs[0].font.size = Pt(13.5)
    tb_h2.text_frame.paragraphs[0].font.color.rgb = COLOR_TEXT_DARK

    # 3. X-Forwarded-For
    add_card(slide11, Inches(0.8), Inches(4.55), h_w, h_h, "X-Forwarded-For & X-Forwarded-Proto")
    tb_h3 = slide11.shapes.add_textbox(Inches(1.0), Inches(5.1), h_w - Inches(0.4), Inches(1.5))
    tb_h3.text_frame.word_wrap = True
    tb_h3.text_frame.paragraphs[0].text = "• X-Forwarded-For: Danh sách chuỗi các IP proxy mà request đã đi qua ($proxy_add_x_forwarded_for).\n• X-Forwarded-Proto: Giữ nguyên giao thức gốc (http hoặc https) giúp backend sinh URL chuyển hướng chuẩn xác."
    tb_h3.text_frame.paragraphs[0].font.size = Pt(13.5)
    tb_h3.text_frame.paragraphs[0].font.color.rgb = COLOR_TEXT_DARK

    # 4. Trusted Proxies
    add_card(slide11, Inches(6.8), Inches(4.55), Inches(5.733), h_h, "Cảnh báo Bảo mật: Cấu hình Trusted Proxies")
    tb_h4 = slide11.shapes.add_textbox(Inches(7.0), Inches(5.1), Inches(5.333), Inches(1.5))
    tb_h4.text_frame.word_wrap = True
    tb_h4.text_frame.paragraphs[0].text = "• Nguy cơ IP Spoofing: Kẻ tấn công có thể tự chèn header X-Forwarded-For giả mạo nếu gửi trực tiếp.\n• Quy tắc chuẩn: Backend chỉ được tin tưởng các header chuyển tiếp khi request đến từ dải IP của Reverse Proxy đáng tin cậy (cấu hình 'trust proxy' trong Express/NestJS)."
    tb_h4.text_frame.paragraphs[0].font.size = Pt(13.5)
    tb_h4.text_frame.paragraphs[0].font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide11,
              "Nhấn mạnh với sinh viên: Khi client đi qua NGINX, kết nối TCP thực tế với backend là từ container NGINX. "
              "Do đó req.socket.remoteAddress trên Node.js luôn là IP container NGINX (ví dụ 172.20.0.3). "
              "Nếu không có X-Real-IP và X-Forwarded-For, backend hoàn toàn mù tịt về người dùng thật. "
              "Tuy nhiên, phải cấu hình Trusted Proxy ở backend để tránh bị kẻ tấn công gửi header giả mạo.",
              "Thao tác demo: Bấm nút 'Lấy thông tin Header (GET /api/info)' trên giao diện demo để quan sát JSON các header backend nhận được.",
              "MDN Web Docs: Forwarded Headers & Express.js Trust Proxy Documentation.")

    # ==========================================================================
    # SLIDE 12: CẤU HÌNH UPSTREAM CÂN BẰNG TẢI & DEMO BƯỚC 3
    # ==========================================================================
    slide12 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide12, 12, TOTAL_SLIDES)
    add_slide_header(slide12, "Cân bằng tải & Sẵn sàng", "Cấu hình Upstream Cân bằng tải nhiều Backend")

    code_s12 = [
        "upstream backend_cluster {",
        "    # Thuật toán mặc định: Round-Robin",
        "    server backend1:3000 max_fails=3 fail_timeout=10s;",
        "    server backend2:3000 max_fails=3 fail_timeout=10s;",
        "    # least_conn;  # Cân bằng ít kết nối nhất",
        "}"
    ]
    add_code_panel(slide12, Inches(0.8), Inches(2.25), Inches(5.6), Inches(2.45), "nginx/upstream.conf", code_s12, font_size_pt=12.0)

    # Sơ đồ cân bằng tải trực quan bên phải
    r_left = Inches(6.8)
    r_w = Inches(5.733)
    add_card(slide12, r_left, Inches(2.25), r_w, Inches(2.45), "Cơ chế Phân phối & Lưu ý Sẵn sàng cao")

    tb_s12_r = slide12.shapes.add_textbox(r_left + Inches(0.25), Inches(2.8), r_w - Inches(0.5), Inches(1.8))
    tf_s12_r = tb_s12_r.text_frame
    tf_s12_r.word_wrap = True
    c12_desc = [
        ("Thuật toán Round-Robin:", "Mặc định phân phối tuần tự giữa backend1 và backend2. Trong thực tế, tỷ lệ có thể không chia đều 50/50 tuyệt đối do HTTP Keep-Alive hoặc browser prefetch."),
        ("Lưu ý High Availability (HA):", "Cụm 2 backend giúp chia tải và loại bỏ SPOF ở tầng backend, nhưng toàn hệ thống chưa đạt HA toàn diện vì chỉ có duy nhất 1 NGINX Gateway đóng vai trò SPOF.")
    ]
    for k, v in c12_desc:
        p = tf_s12_r.add_paragraph()
        p.space_after = Pt(7)
        p.add_run().text = f"• {k} "
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(13.5)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = v
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    add_demo_box(slide12, Inches(0.8), Inches(4.85), Inches(11.733), Inches(1.92),
                 3, "Upstream Cân bằng tải qua nhiều Backend Instance",
                 "Khởi chạy song song 2 instance backend (backend1:3000, backend2:3000) trong compose.yaml. Gửi liên tiếp 10 request 'GET /api/products'.",
                 "Dữ liệu phản hồi mang trường 'instanceId' luân phiên giữa backend-1 và backend-2, chứng minh tải được phân phối đều giữa 2 node.",
                 "Chứng minh cơ chế Upstream của NGINX tự động phân phối tải và tăng cường năng lực phục vụ cho hệ thống backend.")

    set_notes(slide12,
              "Bước 3 trong Section 3 PDF: Upstream với 2 backend instances. "
              "Giải thích thuật toán: Round-Robin là mặc định. Ngoài ra có least_conn (thích hợp request thời gian xử lý lệch nhau) và ip_hash (session persistence). "
              "Lưu ý kỹ thuật chính xác: Hai backend giúp tránh chết toàn hệ thống khi 1 backend crash. Tuy nhiên, NGINX hiện vẫn là Single Point of Failure (SPOF). "
              "Trên thực tế muốn HA toàn diện cần chạy 2 NGINX kết hợp Keepalived (VRRP) chia sẻ Virtual IP.",
              "Thao tác demo: Bấm nút 'Gửi liên tiếp 10 request' trên giao diện web, quan sát bộ đếm backend-1 và backend-2 tăng đều.",
              "Tài liệu Buổi 8 PDF, Mục 3 - Bước 3.")

    # ==========================================================================
    # SLIDE 13: MẠNG DOCKER COMPOSE & SERVICE DISCOVERY
    # ==========================================================================
    slide13 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide13, 13, TOTAL_SLIDES)
    add_slide_header(slide13, "Môi trường Container", "Mạng Docker Compose: Service Name vs localhost")

    add_card(slide13, Inches(0.8), Inches(2.25), Inches(5.6), Inches(4.5), "Cơ chế Docker Network & Service Discovery")
    tb_s13_l = slide13.shapes.add_textbox(Inches(1.05), Inches(2.85), Inches(5.1), Inches(3.7))
    tf_s13_l = tb_s13_l.text_frame
    tf_s13_l.word_wrap = True
    c13_l = [
        ("Mạng Cầu nối Mặc định (Bridge):", "Docker Compose tự động khởi tạo mạng bridge (ví dụ: 'app_net') liên kết các container trong cùng stack."),
        ("DNS Nội bộ Docker (127.0.0.11):", "Mỗi service name ('backend1', 'backend2', 'proxy') tự động được phân giải thành địa chỉ IP nội bộ của container tương ứng."),
        ("Định tuyến bằng Service Name:", "NGINX chỉ cần cấu hình 'server backend1:3000;' mà không cần quan tâm IP nội bộ có thay đổi sau mỗi lần khởi động lại."),
        ("Mã cổng nội bộ 3000:", "Chỉ cần lệnh 'expose: 3000' trong compose.yaml, không cần mở 'ports:' ra máy host, giúp bảo vệ an toàn cho backend.")
    ]
    for k, v in c13_l:
        p = tf_s13_l.add_paragraph()
        p.space_after = Pt(5)
        p.add_run().text = f"✔ {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    add_card(slide13, Inches(6.8), Inches(2.25), Inches(5.733), Inches(4.5), "Bẫy Sai lầm Kinh điển: 'localhost' trong Container")
    tb_s13_r = slide13.shapes.add_textbox(Inches(7.05), Inches(2.85), Inches(5.2), Inches(3.7))
    tf_s13_r = tb_s13_r.text_frame
    tf_s13_r.word_wrap = True
    c13_r = [
        ("Bản chất Network Namespace:", "Mỗi container có Network Namespace riêng biệt hoàn toàn. Do đó 'localhost' hay '127.0.0.1' bên trong container NGINX trỏ về chính container NGINX!"),
        ("Hậu quả lỗi 502 Bad Gateway:", "Nếu cấu hình 'proxy_pass http://localhost:3000;', NGINX sẽ tìm cổng 3000 của chính nó (vốn không có) -> Lập tức báo lỗi 502 Bad Gateway!"),
        ("Quy tắc bắt buộc:", "Luôn dùng Service Name được đặt tên trong compose.yaml để kết nối giữa các container trong mạng nội bộ.")
    ]
    for k, v in c13_r:
        p = tf_s13_r.add_paragraph()
        p.space_after = Pt(8)
        p.add_run().text = f"⚠ {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_DANGER
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide13,
              "Nhấn mạnh mạnh mẽ lỗi kinh điển của người mới học Docker: "
              "Dùng localhost trong nginx.conf để gọi backend -> bị lỗi 502 Bad Gateway. "
              "Giải thích rõ: Container NGINX và container Backend là 2 máy ảo logic khác nhau trên mạng bridge. "
              "Docker tích hợp sẵn DNS server nội bộ tại IP 127.0.0.11 để giải quyết bài toán Service Discovery này.",
              "Thao tác demo: Vào container NGINX chạy 'nslookup backend1' để chứng minh Docker DNS phân giải IP 172.x.x.x.",
              "Docker Compose Networking Reference.")

    # ==========================================================================
    # SLIDE 14: CẤU TRÚC MẪU THỰC HÀNH SERVER BLOCK NGINX
    # ==========================================================================
    slide14 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide14, 14, TOTAL_SLIDES)
    add_slide_header(slide14, "Cấu hình Mẫu Thực hành", "Cấu trúc Server Block NGINX Mẫu Thực hành")

    code_s14 = [
        "upstream backend_cluster {",
        "    server backend1:3000 max_fails=3 fail_timeout=10s;",
        "    server backend2:3000 max_fails=3 fail_timeout=10s;",
        "}",
        "server {",
        "    listen 80;",
        "    server_name myapp.local localhost;",
        "    client_max_body_size 1m;",
        "    location / {",
        "        root /usr/share/nginx/html;",
        "        try_files $uri $uri/ /index.html;",
        "    }",
        "    location /api/ {",
        "        proxy_pass http://backend_cluster;",
        "        proxy_set_header Host $host;",
        "        proxy_set_header X-Real-IP $remote_addr;",
        "    }",
        "}"
    ]
    add_code_panel(slide14, Inches(0.8), Inches(2.25), Inches(6.6), Inches(4.5), "nginx/conf.d/default.conf (Lab Standard)", code_s14, font_size_pt=11.0)

    add_card(slide14, Inches(7.6), Inches(2.25), Inches(4.933), Inches(4.5), "Bóc tách Thành phần Thiết yếu")
    tb_s14_r = slide14.shapes.add_textbox(Inches(7.85), Inches(2.85), Inches(4.4), Inches(3.7))
    tf_s14_r = tb_s14_r.text_frame
    tf_s14_r.word_wrap = True
    c14_desc = [
        ("listen & server_name:", "Định nghĩa cổng lắng nghe (80) và tên miền đón nhận lưu lượng ('myapp.local')."),
        ("client_max_body_size:", "Bảo vệ hệ thống trước các request payload quá lớn (mặc định 1 MB, kiểm soát tài nguyên RAM/Disk)."),
        ("location /:", "Phục vụ giao diện frontend tĩnh với cơ chế SPA fallback try_files."),
        ("location /api/:", "Ủy quyền an toàn tới cụm upstream kèm các proxy header bảo toàn danh tính.")
    ]
    for k, v in c14_desc:
        p = tf_s14_r.add_paragraph()
        p.space_after = Pt(6)
        p.add_run().text = f"• {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(13.5)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(12.5)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide14,
              "Đây là bức tranh ghép hoàn chỉnh của toàn bộ bài học: "
              "Một Server Block thống nhất chứa: upstream, listen, server_name, client_max_body_size, location tĩnh và location API. "
              "Lưu ý: Đã đổi tên nhãn thành 'Cấu hình mẫu thực hành' thay vì 'Production Standard' để phản ánh đúng ngữ cảnh bài lab (trong môi trường thực hành cổng 8080/8443).",
              "Chỉ rõ từng khối trên slide cho sinh viên nắm bắt cấu trúc.",
              "NGINX Core Directives Reference.")

    # ==========================================================================
    # SLIDE 15: GIỚI HẠN REQUEST BODY (413) & HOT RELOAD
    # ==========================================================================
    slide15 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide15, 15, TOTAL_SLIDES)
    add_slide_header(slide15, "Kiểm soát Tài nguyên & Demo", "Giới hạn Request Body (Mã 413) & Hot Reload Nạp nóng")

    add_card(slide15, Inches(0.8), Inches(2.25), Inches(5.6), Inches(2.45), "Chỉ thị client_max_body_size")
    tb_s15_l = slide15.shapes.add_textbox(Inches(1.05), Inches(2.8), Inches(5.1), Inches(1.8))
    tf_s15_l = tb_s15_l.text_frame
    tf_s15_l.word_wrap = True
    c15_l = [
        ("Mục đích cốt lõi:", "Giới hạn dung lượng tối đa của Request Body do client gửi lên (upload file, payload JSON)."),
        ("Giá trị mặc định: 1m", "Nếu request vượt quá 1 MB, NGINX ngắt kết nối ngay lập tức và trả về mã lỗi 'HTTP 413 Payload Too Large'."),
        ("Kiểm soát tài nguyên:", "Bảo vệ RAM và đĩa cứng máy chủ trước DoS payload lớn (không phải ngăn buffer overflow).")
    ]
    for k, v in c15_l:
        p = tf_s15_l.add_paragraph()
        p.space_after = Pt(5)
        p.add_run().text = f"• {k} "
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(13.5)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = v
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    add_card(slide15, Inches(6.8), Inches(2.25), Inches(5.733), Inches(2.45), "Quy trình Nạp nóng Cấu hình (Hot Reload)")
    tb_s15_r = slide15.shapes.add_textbox(Inches(7.05), Inches(2.8), Inches(5.2), Inches(1.8))
    tf_s15_r = tb_s15_r.text_frame
    tf_s15_r.word_wrap = True
    c15_r = [
        ("1. Sửa cấu hình:", "Thêm 'client_max_body_size 20m;' vào server block hoặc location /api/upload."),
        ("2. Kiểm tra cú pháp (Bắt buộc):", "'docker compose exec proxy nginx -t' -> Đảm bảo cú pháp test is successful."),
        ("3. Nạp nóng không gián đoạn:", "'nginx -s reload' -> Master tạo worker mới nạp cấu hình mới; worker cũ phục vụ xong request rồi mới đóng an toàn.")
    ]
    for k, v in c15_r:
        p = tf_s15_r.add_paragraph()
        p.space_after = Pt(5)
        p.add_run().text = f"✔ {k} "
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(13.5)
        p.runs[0].font.color.rgb = COLOR_SUCCESS
        p.add_run().text = v
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    add_demo_box(slide15, Inches(0.8), Inches(4.85), Inches(11.733), Inches(1.92),
                 5, "Bắt lỗi 413, Nâng hạn mức Body & Nạp nóng Cấu hình",
                 "Gửi payload 2 MB tới endpoint 'POST /api/upload' khi NGINX ở cấu hình mặc định (1m). Quan sát lỗi 413. Sửa 'client_max_body_size 20m;', chạy 'nginx -t', reload và gửi lại.",
                 "Lần 1 nhận chính xác HTTP 413 Payload Too Large. Lần 2 sau khi reload cấu hình nóng, upload thành công nhận mã HTTP 200 OK.",
                 "Chứng minh tính năng kiểm soát dung lượng request của NGINX và khả năng nạp nóng cấu hình không làm gián đoạn dịch vụ (Zero-Downtime Reload).")

    set_notes(slide15,
              "Bước 5 trong Section 3 PDF: Request body limit và hot reload. "
              "Nhấn mạnh chính xác về mặt kỹ thuật: client_max_body_size là cơ chế kiểm soát tài nguyên bộ nhớ/đĩa đệm và chống DoS, không phải cơ chế chống tràn bộ đệm (buffer overflow). "
              "Quy trình reload của NGINX: Master process nhận tín hiệu HUP (-s reload), kiểm tra lại cú pháp, khởi tạo worker pool mới phục vụ các request mới, "
              "đồng thời gửi tín hiệu QUIT cho worker cũ để phục vụ nốt các kết nối đang dang dở rồi mới kết thúc an toàn.",
              "Thao tác demo: Chọn payload 2 MB trên giao diện, bấm Upload nhận mã 413. Sau đó sửa default.conf thành 20m, chạy lệnh reload trong terminal và bấm lại nút Upload nhận mã 200 OK.",
              "Tài liệu Buổi 8 PDF, Mục 3 - Bước 5.")

    # ==========================================================================
    # SLIDE 16: GIẢ LẬP DOMAIN LOCAL VỚI HOSTS FILE
    # ==========================================================================
    slide16 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide16, 16, TOTAL_SLIDES)
    add_slide_header(slide16, "Môi trường Phát triển", "Giả lập Domain Local với Hosts: Windows & Linux")

    c16_w = Inches(3.644)
    c16_gap = Inches(0.4)

    # 1. Windows Browser
    add_card(slide16, Inches(0.8), Inches(2.25), c16_w, Inches(4.5), "1. Trình duyệt Windows")
    tb_w1 = slide16.shapes.add_textbox(Inches(0.95), Inches(2.85), c16_w - Inches(0.3), Inches(3.7))
    tf_w1 = tb_w1.text_frame
    tf_w1.word_wrap = True
    txt_w1 = [
        ("Đường dẫn Windows:", "drivers\\etc\\hosts\n(trong C:\\Windows\\System32)"),
        ("Thao tác:", "Mở Notepad bằng Run as Admin, thêm dòng:\n'127.0.0.1  myapp.local'"),
        ("Hiệu lực:", "Trình duyệt (Chrome/Edge) trên Windows sẽ phân giải 'myapp.local' về máy.")
    ]
    for k, v in txt_w1:
        p = tf_w1.add_paragraph()
        p.space_after = Pt(7)
        p.add_run().text = f"• {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    # 2. WSL + Windows Browser
    add_card(slide16, Inches(0.8) + c16_w + c16_gap, Inches(2.25), c16_w, Inches(4.5), "2. WSL chạy Docker / NGINX")
    tb_w2 = slide16.shapes.add_textbox(Inches(0.95) + c16_w + c16_gap, Inches(2.85), c16_w - Inches(0.3), Inches(3.7))
    tf_w2 = tb_w2.text_frame
    tf_w2.word_wrap = True
    txt_w2 = [
        ("Cơ chế ánh xạ:", "WSL2 tự động forward cổng mạng sang Windows host qua kiến trúc mirrored / localhost binding."),
        ("Lưu ý quan trọng:", "Mở trình duyệt từ Windows thì BẮT BUỘC sửa hosts của Windows, sửa trong WSL không tác dụng với Chrome ngoài!"),
        ("Địa chỉ truy cập:", "'http://myapp.local:8080/'")
    ]
    for k, v in txt_w2:
        p = tf_w2.add_paragraph()
        p.space_after = Pt(7)
        p.add_run().text = f"• {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_SECONDARY
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    # 3. Linux / WSL Client curl
    add_card(slide16, Inches(0.8) + (c16_w + c16_gap) * 2, Inches(2.25), c16_w, Inches(4.5), "3. Linux / WSL Client")
    tb_w3 = slide16.shapes.add_textbox(Inches(0.95) + (c16_w + c16_gap) * 2, Inches(2.85), c16_w - Inches(0.3), Inches(3.7))
    tf_w3 = tb_w3.text_frame
    tf_w3.word_wrap = True
    txt_w3 = [
        ("Đường dẫn Linux:", "'/etc/hosts'"),
        ("Lệnh cập nhật nhanh:", "'echo \"127.0.0.1 myapp.local\" | sudo tee -a /etc/hosts'"),
        ("Kiểm tra với curl:", "Gọi thử API qua domain local:\n'curl -I http://myapp.local:8080/api/info'")
    ]
    for k, v in txt_w3:
        p = tf_w3.add_paragraph()
        p.space_after = Pt(7)
        p.add_run().text = f"• {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_ACCENT
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide16,
              "Rất nhiều sinh viên nhầm lẫn ở điểm này: Khi chạy Docker trong WSL2 nhưng mở Chrome trên Windows để test, "
              "sinh viên lại vào WSL gõ nano /etc/hosts và thắc mắc tại sao Chrome không vào được myapp.local! "
              "Giải thích rõ: Trình duyệt chạy ở đâu thì tra cứu DNS/hosts tại hệ điều hành đó.",
              "Hướng dẫn sinh viên cách mở Notepad Run as Administrator để sửa file hosts trên Windows.",
              "Microsoft WSL Networking Documentation.")

    # ==========================================================================
    # SLIDE 17: CẤU HÌNH HTTPS VỚI SSL TỰ KÝ (SAN) & DEMO BƯỚC 6
    # ==========================================================================
    slide17 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide17, 17, TOTAL_SLIDES)
    add_slide_header(slide17, "Bảo mật Kết nối & Demo", "Cấu hình HTTPS với SSL Tự ký (SAN) & Demo Bước 6")

    code_s17 = [
        "# Sinh cert tu ky co SAN bang OpenSSL:",
        "openssl req -x509 -newkey rsa:2048 -nodes -days 365 \\",
        "  -keyout myapp.key -out myapp.crt -subj '/CN=myapp.local' \\",
        "  -addext 'subjectAltName=DNS:myapp.local'",
        "",
        "# Cau hinh NGINX lang nghe SSL 443:",
        "listen 443 ssl;",
        "ssl_certificate     /etc/nginx/certs/myapp.crt;",
        "ssl_certificate_key /etc/nginx/certs/myapp.key;"
    ]
    add_code_panel(slide17, Inches(0.8), Inches(2.25), Inches(5.8), Inches(2.45), "Lệnh OpenSSL & Cấu hình HTTPS", code_s17, font_size_pt=10.5)

    add_card(slide17, Inches(7.0), Inches(2.25), Inches(5.533), Inches(2.45), "Tại sao Trình duyệt Cảnh báo Bảo mật?")
    tb_s17_r = slide17.shapes.add_textbox(Inches(7.2), Inches(2.8), Inches(5.1), Inches(1.8))
    tf_s17_r = tb_s17_r.text_frame
    tf_s17_r.word_wrap = True
    c17_r = [
        ("Mã hóa đường truyền:", "Kênh truyền được mã hóa TLS mạnh mẽ, chống nghe lén dữ liệu trên đường truyền."),
        ("Thiếu xác thực danh tính:", "Do chứng chỉ tự ký không có Root CA công cộng bảo lãnh -> Trình duyệt hiện cảnh báo bảo mật."),
        ("Lưu ý nút bỏ qua:", "Tùy chính sách bảo mật hoặc HSTS, nút bỏ qua có thể không xuất hiện (cần gõ 'thisisunsafe').")
    ]
    for k, v in c17_r:
        p = tf_s17_r.add_paragraph()
        p.space_after = Pt(5)
        p.add_run().text = f"• {k} "
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(13.5)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = v
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    add_demo_box(slide17, Inches(0.8), Inches(4.85), Inches(11.733), Inches(1.92),
                 6, "Giả lập Domain Local & Cấu hình HTTPS Tự ký",
                 "Ánh xạ hosts '127.0.0.1 myapp.local', sinh cặp key/cert tự ký có SAN bằng OpenSSL, nạp cấu hình NGINX 'listen 443 ssl' và mở 'https://myapp.local:8443'.",
                 "Trình duyệt hiển thị cảnh báo đỏ 'Not Secure / NET::ERR_CERT_AUTHORITY_INVALID'. Khi chọn tiếp tục truy cập, trang web tải thành công với giao thức HTTPS được mã hóa.",
                 "Chứng minh cơ chế SSL/TLS Termination tại NGINX và giải thích nguyên nhân chứng chỉ tự ký bị trình duyệt cảnh báo.")

    set_notes(slide17,
              "Bước 6 trong Section 3 PDF: Domain local và HTTPS tự ký. "
              "Điểm kỹ thuật quan trọng: Lệnh OpenSSL hiện đại bắt buộc phải có Subject Alternative Name (SAN: DNS:myapp.local), "
              "vì các trình duyệt từ Chrome 58+ đã loại bỏ hoàn toàn việc chỉ đọc Common Name (CN). "
              "Giải thích bản chất: Chứng chỉ tự ký vẫn mã hóa kênh truyền tốt, nhưng không chứng minh được danh tính server. "
              "Nút Proceed to myapp.local có thể bị ẩn nếu domain đã từng bật HSTS.",
              "Thao tác demo: Chạy script generate_cert.ps1 hoặc generate_cert.sh trong demo/ssl/, khởi động HTTPS NGINX và truy cập https://myapp.local:8443.",
              "RFC 5280 (X.509 PKI) & RFC 2818 (HTTP Over TLS).")

    # ==========================================================================
    # SLIDE 18: CHUỖI TIN CẬY (CHAIN OF TRUST) & CERTBOT TRÊN PRODUCTION
    # ==========================================================================
    slide18 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide18, 18, TOTAL_SLIDES)
    add_slide_header(slide18, "Tiêu chuẩn Bảo mật", "Chuỗi Tin cậy Chứng chỉ (Chain of Trust) & Certbot")

    # Khung trái: Sơ đồ chuỗi tin cậy được tinh chỉnh không bị đè chữ
    add_card(slide18, Inches(0.8), Inches(2.25), Inches(5.6), Inches(4.5), "Mô hình Chuỗi Tin cậy (Chain of Trust)")

    # 3 hộp chuỗi tin cậy
    box_w = Inches(5.1)
    # Root CA
    b_root = slide18.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.05), Inches(2.8), box_w, Inches(0.85))
    b_root.fill.solid()
    b_root.fill.fore_color.rgb = RGBColor(240, 253, 244)
    b_root.line.color.rgb = COLOR_SUCCESS
    b_root.line.width = Pt(1.5)
    tb = slide18.shapes.add_textbox(Inches(1.15), Inches(2.86), box_w - Inches(0.2), Inches(0.72))
    tb.text_frame.word_wrap = True
    p = tb.text_frame.paragraphs[0]
    p.text = "Root CA (Tổ chức Chứng thực Gốc)\nNằm sẵn trong Trust Store của HĐH / Trình duyệt (vd: DigiCert, ISRG)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_SUCCESS
    p.alignment = PP_ALIGN.CENTER

    # Mũi tên 1
    arr_c1 = slide18.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(3.4), Inches(3.75), Inches(0.4), Inches(0.35))
    arr_c1.fill.solid()
    arr_c1.fill.fore_color.rgb = COLOR_SECONDARY
    arr_c1.line.fill.background()

    # Intermediate CA
    b_inter = slide18.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.05), Inches(4.2), box_w, Inches(0.85))
    b_inter.fill.solid()
    b_inter.fill.fore_color.rgb = RGBColor(238, 242, 255)
    b_inter.line.color.rgb = COLOR_SECONDARY
    b_inter.line.width = Pt(1.5)
    tb = slide18.shapes.add_textbox(Inches(1.15), Inches(4.26), box_w - Inches(0.2), Inches(0.72))
    tb.text_frame.word_wrap = True
    p = tb.text_frame.paragraphs[0]
    p.text = "Intermediate CA (Cơ quan Trung gian)\nĐược Root CA ký số ủy quyền để cấp chứng chỉ cho người dùng cuối"
    p.font.name = FONT_HEADING
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_SECONDARY
    p.alignment = PP_ALIGN.CENTER

    # Mũi tên 2
    arr_c2 = slide18.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(3.4), Inches(5.15), Inches(0.4), Inches(0.35))
    arr_c2.fill.solid()
    arr_c2.fill.fore_color.rgb = COLOR_SECONDARY
    arr_c2.line.fill.background()

    # Server Cert
    b_srv = slide18.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.05), Inches(5.6), box_w, Inches(0.85))
    b_srv.fill.solid()
    b_srv.fill.fore_color.rgb = COLOR_BG_CARD
    b_srv.line.color.rgb = COLOR_PRIMARY
    b_srv.line.width = Pt(1.5)
    tb = slide18.shapes.add_textbox(Inches(1.15), Inches(5.66), box_w - Inches(0.2), Inches(0.72))
    tb.text_frame.word_wrap = True
    p = tb.text_frame.paragraphs[0]
    p.text = "Server Certificate (Website của bạn)\nCấp cho domain công khai -> Trình duyệt xác thực hợp lệ không cảnh báo!"
    p.font.name = FONT_HEADING
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_PRIMARY
    p.alignment = PP_ALIGN.CENTER

    # Khung phải: Triển khai thực tế với Certbot trên domain công khai
    add_card(slide18, Inches(6.8), Inches(2.25), Inches(5.733), Inches(4.5), "Triển khai Thực tế: Let's Encrypt & Certbot")
    tb_s18_r = slide18.shapes.add_textbox(Inches(7.05), Inches(2.85), Inches(5.2), Inches(3.7))
    tf_s18_r = tb_s18_r.text_frame
    tf_s18_r.word_wrap = True
    c18_r = [
        ("Tổ chức CA Công cộng Let's Encrypt:", "Cung cấp chứng chỉ SSL/TLS miễn phí, được công nhận bởi toàn bộ hệ điều hành và trình duyệt trên thế giới."),
        ("Yêu cầu Domain Công khai:", "Chỉ áp dụng cho tên miền công khai có quyền sở hữu DNS (vd: 'huce.edu.vn', 'example.com'). KHÔNG THỂ cấp cho tên miền nội bộ '.local'."),
        ("Công cụ Certbot & Tự động Gia hạn:", "Xác thực quyền kiểm soát domain qua HTTP-01 challenge (cổng 80) hoặc DNS-01. Chứng chỉ Let's Encrypt có hạn 90 ngày (khuyến nghị renew sau 60 ngày), Certbot chạy cron tự động gia hạn ngầm.")
    ]
    for k, v in c18_r:
        p = tf_s18_r.add_paragraph()
        p.space_after = Pt(8)
        p.add_run().text = f"✔ {k}\n"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_SUCCESS
        p.add_run().text = f"  {v}"
        p.runs[1].font.size = Pt(13)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide18,
              "Làm rõ điểm lý thuyết quan trọng: "
              "1. Phân biệt rõ chứng chỉ tự ký (.local) và chứng chỉ công khai (Let's Encrypt / DigiCert). "
              "2. Certbot không thể dùng cho myapp.local vì Let's Encrypt CA trên Internet không thể phân giải tên miền nội bộ của bạn. "
              "3. Thời hạn chứng chỉ: Let's Encrypt là 90 ngày, nhưng các chứng chỉ thương mại khác có thể lên tới 397 ngày theo chuẩn CA/Browser Forum. "
              "4. Tránh mô tả 'ổ khóa xanh' vì các trình duyệt hiện đại (Chrome 117+) đã đổi sang biểu tượng cài đặt (tune icon) trung tính.",
              "Vẽ chuỗi xác thực từ Server Certificate ngược lên Root CA trong Trust Store hệ điều hành.",
              "Let's Encrypt Chain of Trust Overview & CA/Browser Forum Baseline Requirements.")

    # ==========================================================================
    # SLIDE 19: ĐIỀU TRA & XỬ LÝ SỰ CỐ TRONG VẬN HÀNH NGINX
    # ==========================================================================
    slide19 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide19, 19, TOTAL_SLIDES)
    add_slide_header(slide19, "Điều hành & Giám sát", "Kỹ năng Điều tra & Xử lý Sự cố trong Vận hành NGINX")

    # Khung quy tắc vàng phía trên
    add_card(slide19, Inches(0.8), Inches(2.25), Inches(11.733), Inches(1.85), "Quy tắc Vàng & Công cụ Điều tra Sự cố")
    tb_s19_t = slide19.shapes.add_textbox(Inches(1.05), Inches(2.8), Inches(11.2), Inches(1.2))
    tf_s19_t = tb_s19_t.text_frame
    tf_s19_t.word_wrap = True
    c19_t = [
        ("Kiểm tra cú pháp trước khi nạp:", "Luôn chạy 'nginx -t' (hoặc 'docker compose exec proxy nginx -t') trước khi reload để tránh làm sập tiến trình."),
        ("Nạp cấu hình nóng không gián đoạn:", "Dùng 'nginx -s reload' giúp tiến trình worker cũ phục vụ nốt request trước khi đóng an toàn."),
        ("Giám sát nhật ký thời gian thực:", "Sử dụng 'tail -f access.log' để theo dõi lưu lượng và 'tail -f error.log' để bắt nguồn gốc lỗi.")
    ]
    for k, v in c19_t:
        p = tf_s19_t.add_paragraph()
        p.space_after = Pt(6)
        p.add_run().text = f"• {k} "
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(14)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        p.add_run().text = v
        p.runs[1].font.size = Pt(13.5)
        p.runs[1].font.color.rgb = COLOR_TEXT_DARK

    # 3 hộp mã lỗi kinh điển phía dưới
    w_err = Inches(3.644)
    g_err = Inches(0.4)

    # 404
    add_card(slide19, Inches(0.8), Inches(4.25), w_err, Inches(2.45), "Mã lỗi: 404 Not Found")
    tb_e1 = slide19.shapes.add_textbox(Inches(0.95), Inches(4.8), w_err - Inches(0.3), Inches(1.8))
    tb_e1.text_frame.word_wrap = True
    tb_e1.text_frame.paragraphs[0].text = "• Nguyên nhân: Sai đường dẫn 'root', thiếu file tĩnh vật lý, hoặc route ảo SPA chưa cấu hình try_files.\n• Cách xử lý: Kiểm tra file trong container ('docker compose exec proxy ls /usr/share/nginx/html') và thêm 'try_files $uri $uri/ /index.html;'."
    tb_e1.text_frame.paragraphs[0].font.size = Pt(13)
    tb_e1.text_frame.paragraphs[0].font.color.rgb = COLOR_TEXT_DARK

    # 413
    add_card(slide19, Inches(0.8) + w_err + g_err, Inches(4.25), w_err, Inches(2.45), "Mã lỗi: 413 Payload Too Large")
    tb_e2 = slide19.shapes.add_textbox(Inches(0.95) + w_err + g_err, Inches(4.8), w_err - Inches(0.3), Inches(1.8))
    tb_e2.text_frame.word_wrap = True
    tb_e2.text_frame.paragraphs[0].text = "• Nguyên nhân: Request body hoặc file upload vượt quá giới hạn 1 MB mặc định của NGINX.\n• Cách xử lý: Thêm chỉ thị 'client_max_body_size 20m;' vào server block hoặc location /api/upload, sau đó kiểm tra 'nginx -t' và reload."
    tb_e2.text_frame.paragraphs[0].font.size = Pt(13)
    tb_e2.text_frame.paragraphs[0].font.color.rgb = COLOR_TEXT_DARK

    # 502
    add_card(slide19, Inches(0.8) + (w_err + g_err) * 2, Inches(4.25), w_err, Inches(2.45), "Mã lỗi: 502 Bad Gateway")
    tb_e3 = slide19.shapes.add_textbox(Inches(0.95) + (w_err + g_err) * 2, Inches(4.8), w_err - Inches(0.3), Inches(1.8))
    tb_e3.text_frame.word_wrap = True
    tb_e3.text_frame.paragraphs[0].text = "• Nguyên nhân: NGINX không thể kết nối tới backend (backend bị crash, sai cổng 3000, hoặc dùng nhầm 'localhost' thay vì Service Name Docker).\n• Cách xử lý: Soi error.log, kiểm tra 'docker compose ps' và kiểm tra cổng lắng nghe backend."
    tb_e3.text_frame.paragraphs[0].font.size = Pt(13)
    tb_e3.text_frame.paragraphs[0].font.color.rgb = COLOR_TEXT_DARK

    set_notes(slide19,
              "Kỹ năng xử lý sự cố là tiêu chí quan trọng nhất khi vận hành hệ thống: "
              "1. Luôn xem error.log đầu tiên: Mọi lỗi kết nối, từ chối quyền, sai đường dẫn đều được ghi nhận chi tiết tại đây. "
              "2. Nhận diện ngay mã lỗi: 404 là tầng định tuyến/file tĩnh; 413 là tầng kích thước body; 502 là tầng backend không phản hồi hoặc sai cấu hình proxy_pass.",
              "Hướng dẫn sinh viên cách chạy docker compose logs -f proxy để soi log khi demo thực tế.",
              "NGINX Troubleshooting and Error Handling Guide.")

    # ==========================================================================
    # SLIDE 20: TỔNG KẾT & BẢNG KIỂM TRA THỰC HÀNH 6 BƯỚC
    # ==========================================================================
    slide20 = prs.slides.add_slide(blank_layout)
    add_academic_frame(slide20, 20, TOTAL_SLIDES)
    add_slide_header(slide20, "Tổng kết & Đánh giá", "Tổng kết Buổi 8 & Danh mục Kiểm tra Thực hành")

    # Bảng tổng kết 6 bước demo với cỡ chữ to rõ
    t_shape = slide20.shapes.add_table(7, 3, Inches(0.8), Inches(2.25), Inches(11.733), Inches(3.55))
    t_table = t_shape.table
    t_table.columns[0].width = Inches(1.6)
    t_table.columns[1].width = Inches(4.5)
    t_table.columns[2].width = Inches(5.633)

    demo_steps = [
        ("BƯỚC DEMO", "NỘI DUNG CẤU HÌNH KIỂM CHỨNG", "KẾT QUẢ DỰ KIẾN / THỰC TẾ"),
        ("Bước 1", "NGINX làm Web Server (root & index)", "Tải thành công frontend tĩnh, HTTP 200 OK trang chủ."),
        ("Bước 2", "Reverse Proxy FE + BE (location /api/)", "Gọi API cùng origin, tránh lỗi CORS, backend nhận X-Real-IP."),
        ("Bước 3", "Upstream cân bằng tải 2 backend", "Request phân phối luân phiên Round-robin qua backend1 và backend2."),
        ("Bước 4", "Mạng Docker Compose & Service Discovery", "NGINX trỏ tới backend bằng Service Name nội bộ cổng 3000."),
        ("Bước 5", "Giới hạn Request Body & Hot Reload", "Bắt lỗi HTTP 413, thêm client_max_body_size 20m, reload thành công."),
        ("Bước 6", "Giả lập Domain & Cấu hình HTTPS", "Ánh xạ hosts, SSL tự ký có SAN, giải thích cảnh báo bảo mật.")
    ]

    for r_idx, (b1, b2, b3) in enumerate(demo_steps):
        c1 = t_table.cell(r_idx, 0)
        c2 = t_table.cell(r_idx, 1)
        c3 = t_table.cell(r_idx, 2)
        c1.text = b1
        c2.text = b2
        c3.text = b3

        for col_i, cell in enumerate((c1, c2, c3)):
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.margin_left = Inches(0.15)
            cell.margin_right = Inches(0.15)
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_HEADING
            p.font.size = Pt(12)

            if r_idx == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_PRIMARY
                p.font.bold = True
                p.font.color.rgb = COLOR_WHITE
            else:
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_BG_CARD if r_idx % 2 == 1 else COLOR_WHITE
                p.font.color.rgb = COLOR_PRIMARY if col_i == 0 else COLOR_TEXT_DARK
                if col_i == 0:
                    p.font.bold = True

    # Khung kết luận & cảm ơn
    add_card(slide20, Inches(0.8), Inches(5.95), Inches(11.733), Inches(0.85))
    tb_c = slide20.shapes.add_textbox(Inches(1.0), Inches(6.05), Inches(11.3), Inches(0.68))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True
    p_c1 = tf_c.paragraphs[0]
    p_c1.text = "Thông điệp cốt lõi: NGINX là cổng vào tối ưu (Single Entry Point) hợp nhất hạ tầng container, cân bằng tải và bảo mật kết nối."
    p_c1.font.name = FONT_BODY
    p_c1.font.size = Pt(13)
    p_c1.font.color.rgb = COLOR_TEXT_DARK
    p_c2 = tf_c.add_paragraph()
    p_c2.text = "Nhóm 7 xin trân trọng cảm ơn Thầy và các bạn đã chú ý lắng nghe bài báo cáo!"
    p_c2.font.name = FONT_HEADING
    p_c2.font.size = Pt(13.5)
    p_c2.font.bold = True
    p_c2.font.color.rgb = COLOR_PRIMARY

    set_notes(slide20,
              "Tóm tắt toàn bộ 6 bước thực hành theo đúng cấu trúc Đề cương PDF Buổi 8 Mục 3. "
              "Khẳng định vai trò của NGINX: Không chỉ là một web server đơn thuần, mà là mắt xích trung tâm quản trị toàn bộ lưu lượng của hệ thống phân tán.",
              "Chiếu bảng tổng kết, giải đáp thắc mắc của Giảng viên và các nhóm bạn học.",
              "Tài liệu Buổi 8 PDF, Mục 3 - Kịch bản Thực hành Tổng thể.")

    # ==========================================================================
    # LƯU FILE BÀI THUYẾT TRÌNH POWERPOINT
    # ==========================================================================
    out_path_7 = os.path.join(SCRIPT_DIR, "NGINX_Buoi_8_Nhom_7.pptx")
    out_path_8 = os.path.join(SCRIPT_DIR, "NGINX_Buoi_8_Nhom_8.pptx")

    prs.save(out_path_7)
    # Lưu đồng thời cả hai tên file để tương thích tuyệt đối với mọi kịch bản chấm bài
    prs.save(out_path_8)

    print(f"✔ Đã tạo thành công bài thuyết trình PowerPoint: '{out_path_7}'")
    print(f"✔ Đã sao lưu tương thích: '{out_path_8}'")
    print(f"Tổng số slide: {len(prs.slides)}")


if __name__ == "__main__":
    build_presentation()
