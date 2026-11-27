@AGENTS.md

# Phygital Letter Studio

Đặc tả: `docs/SRS.md` (v1.1). Backlog: `docs/BACKLOG.md` (T-01 → T-25).

## Quy tắc bắt buộc
1. PDF nội dung thiệp = ảnh chụp Stage (`pixelRatio: 2`, đã ẩn Transformer và khung lề an toàn) nhúng vào jsPDF. Không dùng `pdf.text()` cho nội dung thiệp.
2. Chỉ lưu tọa độ logic 1240 x 1754 px. Kích thước in chỉ lấy từ `PRINT_CONFIG` (`src/lib/print-config.ts`).
3. Donate dùng ảnh QR tĩnh `public/donate-qr-*.webp` + nút Lưu ảnh và Copy STK. Không code API thanh toán.
4. Commit sau mỗi task.

## Quyết định bổ sung (đã chốt với chủ dự án, ghi đè SRS nếu khác)
- Bảng `uploads` (url, ip_hash, letter_id, created_at): đếm rate limit upload và dọn ảnh không gắn với thư nào.
- `view_count` chỉ tăng khi người nhận bóc dấu sáp, không tăng trong `GET`.
- Supabase bật RLS, không có policy cho anon; chỉ server truy cập bằng service role key.
- `/api/upload` chỉ nhận WebP.

## Phân công model
- Opus: T-09, T-14, T-16, T-19, T-20; review bảo mật T-04..T-07, state T-08, lệnh xóa T-24.
- Sonnet: các task còn lại có viết code.
- Chủ dự án: T-02 (tài khoản, khóa bí mật), T-23, T-25.

## Lệnh
`npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
