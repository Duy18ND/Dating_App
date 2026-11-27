# Bàn giao

> Cập nhật sau các task Opus: T-09, T-14, T-16, T-19, T-20 đã xong. Các mục "Cho T-…" bên dưới giữ lại để tham khảo. Review: `docs/REVIEW_OPUS.md`. Prompt Gemini: `docs/GEMINI_PROMPTS.md`.

# Bàn giao sau các task Sonnet

## Cho T-09 (trình thiết kế)
Thay `src/app/editor/page.tsx` và `EditorPlaceholder.tsx` (trang tạm).

- Panel trong `src/components/editor/`: `AddTextButton`, `TextPanel`, `ImagePanel`, `BackgroundPanel`, `StickerPanel`, `QrPanel`, `AudioPanel`, `WebPanel`. Tất cả đọc/ghi thẳng `useEditorStore`.
- Canvas: `<LetterView hiddenElementId={editingTextId} onSelect={select} onEdit={setEditingText} overlay={(scale) => <TextEditOverlay scale={scale} />} />`.
- Nút xuất bản: `<PublishDialog />` trong `src/components/share/`.
- `?template=<loại>`: `load(createFromTemplate(type))` từ `src/lib/templates.ts`.
- `?edit=<editToken>` (nút "Chỉnh sửa thư" ở trang quản lý): lấy thư bằng `getManagedLetter`, rồi gọi `load(payload, { slug, editToken })` để lần lưu sau cập nhật đúng thư cũ. `payload` chỉ gồm `template_type`, `title`, `canvas_data`, `web_config`.
- Store đã khóa mã QR vuông và >= 240px.

## Cho T-14
Chưa có công cụ thêm `lined_area` hay vẽ tay trong panel. Phần vẽ đã có trong `ElementNode`.

## Cho T-19
Truyền `onDownloadPdf(size)` vào `<PublishDialog />` và vào `SharePanel` ở `ManageDashboard` (chưa có thì nút PDF ẩn). Trang quản lý không dựng Stage nên cần tự dựng khi xuất. Cờ ẩn nền: `printHideBackground` trong store. Chưa cài `jspdf`.

## Cho T-20
Bọc `<LetterContent />` (`src/components/viewer/`) sau phong bì trong `src/app/l/[slug]/page.tsx`. Khi bóc dấu sáp: gọi `audio.play()` ngay trong click handler (URL từ `trackUrl()`), rồi `recordView(slug)`. Hiện lượt mở chưa được ghi nhận. Lọc `?to=` đã có ở `sanitizeRecipient`.

## Cho review của Opus
Lệnh xóa của T-24: `src/lib/server/cleanup.ts`, `deleteExpiredLetters`, `takeOrphanUploads`.

## Việc của chủ dự án
- Nhạc: chọn bài có quyền sử dụng, tải lên R2 tại `audio/<id>.mp3` (danh sách id ở `src/lib/audio-tracks.ts`), đổi `label` cho khớp.
- Donate: thêm `public/donate-qr-bank.webp` và/hoặc `public/donate-qr-zalo.webp`, điền ba biến `NEXT_PUBLIC_DONATE_*`.
- Chạy `supabase/migrations/0002_upload_orphaned_at.sql` trên Supabase (sau 0001).
- Đặt `NEXT_PUBLIC_SITE_URL` và `CRON_SECRET` trên Vercel. Cron khai trong `vercel.json`, chạy 19:00 UTC (02:00 giờ Việt Nam). Đây là Vercel Cron thay cho cron Supabase trong backlog, vì cần xóa file trên R2.
- Sticker: 25 hình tự vẽ trong `public/stickers/memes/`, sinh lại bằng `node scripts/make-stickers.mjs`. Có thể thay bằng bộ do designer làm, giữ nguyên tên file.
