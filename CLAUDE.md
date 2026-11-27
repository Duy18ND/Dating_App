@AGENTS.md

# Phygital Letter Studio

Đặc tả: `docs/SRS.md` (v1.2, chuẩn hơn file .docx). Backlog: `docs/BACKLOG.md` (T-01 → T-36; .xlsx chưa cập nhật).

## Quy tắc bắt buộc
1. PDF nội dung thiệp = ảnh chụp Stage (`pixelRatio: 2`, đã ẩn Transformer và khung lề an toàn) nhúng vào jsPDF. Thư viết tay và chữ trên phong bì cũng nhúng dạng ảnh. Không dùng `pdf.text()` cho các chữ này.
2. Chỉ lưu tọa độ logic: thiệp mới 1754 x 1240 px (ngang), thư cũ 1240 x 1754 px (vẫn phải mở, sửa, in được). Kích thước in chỉ lấy từ `PRINT_CONFIG` (`src/lib/print-config.ts`).
3. Donate dùng ảnh QR tĩnh `public/donate-qr-*.webp` + nút Lưu ảnh và Copy STK. Không code API thanh toán.
4. Commit sau mỗi task.

## Quyết định bổ sung (đã chốt với chủ dự án, ghi đè SRS nếu khác)
- Bảng `uploads` (url, ip_hash, letter_id, created_at): đếm rate limit upload và dọn ảnh không gắn với thư nào.
- `view_count` chỉ tăng khi người nhận bóc dấu sáp, không tăng trong `GET`.
- Supabase bật RLS, không có policy cho anon; chỉ server truy cập bằng service role key.
- `/api/upload` chỉ nhận WebP.
- v1.2: bộ in gồm phong bì C6, thiệp A6 ngang (148 x 105), thư viết tay A5 gấp đôi; QR chỉ nằm trên thiệp. Bỏ thiệp A5 cho thư mới.
- v1.2: ảnh thiệp tối đa 4, ảnh trang web tối đa 8 (riêng); upload 20 ảnh/IP/giờ. Hoa/tuyết rơi để V2.

## Phân công model
- v1.1 (đã xong): Opus T-09, T-14, T-16, T-19, T-20 và review; Sonnet các task code còn lại.
- v1.2: Opus T-26, T-27, T-29, T-32, T-36. Sonnet T-30, T-31, T-33, T-34, ghép T-28 và T-35. Gemini soạn nội dung cho T-28, T-35.
- Chủ dự án: T-02 (tài khoản, khóa bí mật), T-23A, T-23B, T-25.

## Lệnh
`npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
