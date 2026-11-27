@AGENTS.md

# Phygital Letter Studio

Đặc tả: `docs/SRS.md` (v1.6, chuẩn hơn file .docx). Backlog: `docs/BACKLOG.md` (T-01 → T-49; .xlsx chưa cập nhật).

## Quy tắc bắt buộc
1. PDF nội dung thiệp = ảnh chụp Stage (`pixelRatio: 2`, đã ẩn Transformer và khung lề an toàn) nhúng vào jsPDF. Thư viết tay và chữ trên phong bì cũng nhúng dạng ảnh. Không dùng `pdf.text()` cho các chữ này.
2. Chỉ lưu tọa độ logic: mỗi mặt thiệp 1760 x 1240 px (= 105 x 74 mm). Không còn hỗ trợ khổ cũ. Kích thước in chỉ lấy từ `PRINT_CONFIG` (`src/lib/print-config.ts`).
3. Donate dùng ảnh QR tĩnh `public/donate-qr-*.webp` + nút Lưu ảnh và Copy STK. Không code API thanh toán.
4. Commit sau mỗi task.

## Quyết định bổ sung (đã chốt với chủ dự án, ghi đè SRS nếu khác)
- v1.6: làm bản web trước (Cửa 1) rồi mới tới in (Cửa 2) và tài khoản. Phong cách/hiệu ứng theo FR-15 (đợt 1: 4 phong cách), cuộn tự do; hiển thị PC/điện thoại theo FR-16. Ở chặng 1, sau mỗi bước dừng lại cho chủ dự án duyệt.
- Giữ hạn xóa 60 ngày. **Không** làm tải bản lưu (ZIP/HTML): người dùng tự quay màn hình, web chỉ gợi ý và nhắc hạn.
- v1.4: người tạo thiệp **bắt buộc đăng nhập** (email + mật khẩu, Google); người nhận không cần. Bỏ edit_token và /manage, thay bằng /thiep-cua-toi. Đường dẫn công khai giữ slug ngẫu nhiên, không đánh số. Thư vẫn hết hạn sau 60 ngày. Code hiện tại còn theo kiểu cũ cho tới T-38 → T-40.
- Bảng `uploads` (url, ip_hash, letter_id, created_at): đếm rate limit upload và dọn ảnh không gắn với thư nào.
- `view_count` chỉ tăng khi người nhận bóc dấu sáp, không tăng trong `GET`.
- Supabase bật RLS, không có policy cho anon; chỉ server truy cập bằng service role key.
- `/api/upload` chỉ nhận WebP.
- v1.3: bộ in mini: phong bì C7, thiệp gập có bìa 105 x 74 (in một mặt, cắt dán lưng), thư gấp 3; QR chỉ ở trang Lời mời trong thiệp; tràn màu 2mm; một màu phong bì cho web và bản in. Chưa có thư thật nên không cần tương thích khổ cũ.
- v1.2: ảnh thiệp tối đa 4, ảnh trang web tối đa 8 (riêng); upload 20 ảnh/IP/giờ.

## Phân công model
- Đã xong: các task v1.1, và T-26, T-27, T-28, T-30, T-31.
- Opus: T-45, T-48, T-32, T-29, T-38, T-41, T-36.
- Sonnet: T-44, T-33, T-35, T-46, T-47, T-34, T-37, T-39, T-40.
- Chủ dự án: T-02 (dịch vụ, khóa bí mật), T-49, T-23A, T-23B, T-25.

## Lệnh
`npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
