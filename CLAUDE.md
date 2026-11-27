@AGENTS.md

# Phygital Letter Studio

Đặc tả: `docs/SRS.md` (v1.5, chuẩn hơn file .docx). Backlog: `docs/BACKLOG.md` (T-01 → T-43; .xlsx chưa cập nhật).

## Quy tắc bắt buộc
1. PDF nội dung thiệp = ảnh chụp Stage (`pixelRatio: 2`, đã ẩn Transformer và khung lề an toàn) nhúng vào jsPDF. Thư viết tay và chữ trên phong bì cũng nhúng dạng ảnh. Không dùng `pdf.text()` cho các chữ này.
2. Chỉ lưu tọa độ logic: mỗi mặt thiệp 1760 x 1240 px (= 105 x 74 mm). Không còn hỗ trợ khổ cũ. Kích thước in chỉ lấy từ `PRINT_CONFIG` (`src/lib/print-config.ts`).
3. Donate dùng ảnh QR tĩnh `public/donate-qr-*.webp` + nút Lưu ảnh và Copy STK. Không code API thanh toán.
4. Commit sau mỗi task.

## Quyết định bổ sung (đã chốt với chủ dự án, ghi đè SRS nếu khác)
- v1.5: giữ hạn xóa 60 ngày; thêm tải bản kỷ niệm ZIP (FR-15), tạo ở trình duyệt, không kèm nhạc nếu giấy phép không cho phép, ảnh thiệp trong ZIP không còn mã QR.
- v1.4: người tạo thiệp **bắt buộc đăng nhập** (email + mật khẩu, Google); người nhận không cần. Bỏ edit_token và /manage, thay bằng /thiep-cua-toi. Đường dẫn công khai giữ slug ngẫu nhiên, không đánh số. Thư vẫn hết hạn sau 60 ngày. Code hiện tại còn theo kiểu cũ cho tới T-38 → T-40.
- Bảng `uploads` (url, ip_hash, letter_id, created_at): đếm rate limit upload và dọn ảnh không gắn với thư nào.
- `view_count` chỉ tăng khi người nhận bóc dấu sáp, không tăng trong `GET`.
- Supabase bật RLS, không có policy cho anon; chỉ server truy cập bằng service role key.
- `/api/upload` chỉ nhận WebP.
- v1.3: bộ in mini: phong bì C7, thiệp gập có bìa 105 x 74 (in một mặt, cắt dán lưng), thư gấp 3; QR chỉ ở trang Lời mời trong thiệp; tràn màu 2mm; một màu phong bì cho web và bản in. Chưa có thư thật nên không cần tương thích khổ cũ.
- v1.2: ảnh thiệp tối đa 4, ảnh trang web tối đa 8 (riêng); upload 20 ảnh/IP/giờ. Hoa/tuyết rơi để V2.

## Phân công model
- v1.1 (đã xong): Opus T-09, T-14, T-16, T-19, T-20 và review; Sonnet các task code còn lại.
- v1.3–v1.4: Opus T-26, T-27, T-29, T-32, T-36, T-38, T-41. Sonnet T-30, T-31, T-33, T-34, T-37, T-39, T-40, T-42, T-43, ghép T-28 và T-35. Gemini soạn nội dung cho T-28, T-35.
- Chủ dự án: T-02 (dịch vụ, khóa bí mật, cấu hình đăng nhập Google và SMTP), T-23A, T-23B, T-25.

## Lệnh
`npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
