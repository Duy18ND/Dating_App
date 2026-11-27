@AGENTS.md

# Phygital Letter Studio

Đặc tả: `docs/SRS.md` (v1.3, chuẩn hơn file .docx). Backlog: `docs/BACKLOG.md` (T-01 → T-37; .xlsx chưa cập nhật).

## Quy tắc bắt buộc
1. PDF nội dung thiệp = ảnh chụp Stage (`pixelRatio: 2`, đã ẩn Transformer và khung lề an toàn) nhúng vào jsPDF. Thư viết tay và chữ trên phong bì cũng nhúng dạng ảnh. Không dùng `pdf.text()` cho các chữ này.
2. Chỉ lưu tọa độ logic: mỗi mặt thiệp 1760 x 1240 px (= 105 x 74 mm). Không còn hỗ trợ khổ cũ. Kích thước in chỉ lấy từ `PRINT_CONFIG` (`src/lib/print-config.ts`).
3. Donate dùng ảnh QR tĩnh `public/donate-qr-*.webp` + nút Lưu ảnh và Copy STK. Không code API thanh toán.
4. Commit sau mỗi task.

## Quyết định bổ sung (đã chốt với chủ dự án, ghi đè SRS nếu khác)
- Bảng `uploads` (url, ip_hash, letter_id, created_at): đếm rate limit upload và dọn ảnh không gắn với thư nào.
- `view_count` chỉ tăng khi người nhận bóc dấu sáp, không tăng trong `GET`.
- Supabase bật RLS, không có policy cho anon; chỉ server truy cập bằng service role key.
- `/api/upload` chỉ nhận WebP.
- v1.3: bộ in mini: phong bì C7, thiệp gập có bìa 105 x 74 (in một mặt, cắt dán lưng), thư gấp 3; QR chỉ ở trang Lời mời trong thiệp; tràn màu 2mm; một màu phong bì cho web và bản in. Chưa có thư thật nên không cần tương thích khổ cũ.
- v1.2: ảnh thiệp tối đa 4, ảnh trang web tối đa 8 (riêng); upload 20 ảnh/IP/giờ. Hoa/tuyết rơi để V2.

## Phân công model
- v1.1 (đã xong): Opus T-09, T-14, T-16, T-19, T-20 và review; Sonnet các task code còn lại.
- v1.3: Opus T-26, T-27, T-29, T-32, T-36. Sonnet T-30, T-31, T-33, T-34, T-37, ghép T-28 và T-35. Gemini soạn nội dung cho T-28, T-35.
- Chủ dự án: T-02 (tài khoản, khóa bí mật), T-23A, T-23B, T-25.

## Lệnh
`npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
