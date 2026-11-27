# Bàn giao

## Sau T-30, T-31, T-28 (cho Opus làm T-29)

Hàm vẽ đã có, đều theo `PartRenderer` trong `src/lib/print/parts.ts` (gọi với `pxPerMm: PRINT_PX_PER_MM`, `background` theo công tắc, bleed mặc định 2 mm):

| Phần | Hàm | Đầu vào |
|---|---|---|
| writingPage | `renderWritingPage` (`render-letter.ts`) | `canvas_data.writingPage` |
| letter | `renderLetterSheet` (`render-letter.ts`) | `{ letter, recipient: web_config.recipientName }` |
| cardBack | `renderCardBack` (`render-envelope.ts`) | `{ decor: canvas_data.envelope, frontBackground: faces.front.background }` |
| envelopeFlap | `renderEnvelopeFlap` (`render-envelope.ts`) | `{ decor: canvas_data.envelope, color: web_config.envelopeColor }` |

- Dòng kẻ và chữ vẫn in khi `background: false` (kết quả là PNG trong suốt, `opaque: false`).
- `envelopeFlap` vẽ xuôi (mũi nắp ở dưới), phủ kín hình chữ nhật 114 x 45 mm + bleed: T-29 xoay 180° rồi cắt theo hình nắp bo tròn. Chữ được xếp theo nắp **tam giác**; nếu bo tròn đầu nắp thì chữ vẫn nằm trong (dòng cuối ở y = 24,5 mm trên 45 mm).
- Nền phong bì (thân, tai, đáy) tô bằng `web_config.envelopeColor`, tràn 2 mm.
- Mới thử vẽ ở độ phân giải xem trước (6 px/mm, không bleed); **chưa chạy ở 14 px/mm có bleed**.
- Thanh công cụ dưới trên điện thoại giờ có 9 mục, phải vuốt ngang để thấy Thư, Phong bì, QR & Web. T-37 nên cân nhắc gom lại theo cấu trúc tab Bản in / Trang web (SRS 2.3).

## Sau T-26, T-27 (cho Sonnet làm T-30, T-31, T-37 và Opus làm T-29)

- Dữ liệu: `canvas_data` v2 trong `src/types/letter.ts` (`faces.front`, `faces.inside`, `writingPage`, `letter`, `envelope`). Store có `face` (mặt đang sửa), `currentElements`, `selectedElement`, `setFace`, `setWritingPage`, `setLetter`, `setEnvelope`; tất cả đi qua Undo/Redo.
- Hợp đồng hàm vẽ: `src/lib/print/parts.ts`. Mỗi hàm vẽ trả `RenderedPart` (canvas phủ cả vùng tràn màu, đường cắt ở `(bleed, bleed)`). Dùng `createPartCanvas(part, options)` để có canvas và hệ trục mm. `PRINT_PX_PER_MM = 14` cho phần vẽ bằng Canvas 2D (giữ dưới giới hạn canvas của Safari iOS).
  - T-30: `writingPage` và `letter` (thư gấp 3, ô 105 x 74, vạch gấp `letterSheet().folds`).
  - T-31: `cardBack` (chữ lồng nhỏ) và `envelopeFlap` (114 x 45 mm, vẽ xuôi; T-29 xoay 180°). Màu giấy phong bì là `web_config.envelopeColor`.
  - Font: phải chờ `document.fonts.load(...)` trước khi vẽ chữ lên canvas (xem `useFontsKey` trong `src/components/letter/hooks.ts`).
- Hình học A4: `src/lib/print/layout.ts` (`envelopeC7`, `cardStrips` với 4 ô `back/front/writing/inside` đã xoay 90° theo chiều kim đồng hồ, `letterSheet`).
- PDF tạm: `src/lib/client/export-pdf.tsx` đã ra 3 trang, đặt bìa trước và trang Lời mời đúng ô. T-29 bổ sung bìa sau, trang viết tay, thư, phong bì nắp bo tròn + vùng dán + chữ nắp, tràn màu và 3 công tắc nền.
- Bố cục 4 mẫu trong `src/lib/templates.ts` là bản tạm; T-28 thay bằng kết quả Gemini (Prompt 1). Test `templates.test.ts` kiểm tra lề an toàn, cỡ chữ, QR.

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
