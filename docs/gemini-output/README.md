# Gemini Deliverables Handoff (`docs/gemini-output/`)

Thư mục này lưu trọn bộ đầu ra v1.3 từ Gemini (đã kiểm chứng tự động tọa độ, giới hạn ký tự và test) để **Claude (Sonnet)** hoặc các model AI khác đọc trực tiếp và ghép vào code mà không cần copy-paste qua chat.

## Danh sách file

| Task | File | Trạng thái | Ghi chú tích hợp |
|---|---|---|---|
| **T-28** | [`T-28-mini-templates.md`](./T-28-mini-templates.md) | Sẵn sàng ghép code | 4 mẫu thiệp mini hai mặt (`front` + `inside`), canvas `1760 × 1240 px`, lề an toàn `84 px`, kèm `envelope`, `envelopeColor`, `waxSealColor`, `web` và bảng chứng minh không chồng lấn. |
| **T-35** | [`T-35-scroll-web-defaults.json`](./T-35-scroll-web-defaults.json) | Sẵn sàng import / ghép code | JSON hợp lệ chứa nội dung mặc định trang web cuộn dọc cho 4 mẫu (`confession`, `wedding`, `dinner`, `holiday`), đúng thứ tự section và giới hạn ký tự. |
| **T-25** | [`T-25-threads-launch-script.md`](./T-25-threads-launch-script.md) | Sẵn sàng quay & đăng | Kịch bản clip dọc 9:16 (18–20 giây) bản v1.3 (**thiệp mini gập 10,5 × 7,4 cm trong phong bì C7**), 3 hook, 3 caption Threads (≤ 300 ký tự), bình luận ghim và mẹo quét QR. |
| **T-13** | [`T-13-icons-preview-5x4.svg`](./T-13-icons-preview-5x4.svg) | Đã ghép vào repo | File SVG lưới 5 × 4 xem trước 20 icon đã cập nhật trong `src/lib/icons.ts` (và 25 sticker chibi WebP ≤ 15 KB trong `public/stickers/memes/*.webp` sinh từ `scripts/make-stickers.mjs`). |

## Ghi chú cho Claude (Sonnet)

1. `src/lib/icons.ts`, `scripts/make-stickers.mjs`, và 25 file `public/stickers/memes/*.webp` (T-13) **đã được cập nhật trực tiếp trong repo** và pass toàn bộ `npm test` (86/86), `npm run typecheck`, `npm run lint`.
2. `src/lib/templates.ts` hiện vẫn giữ bản v1 (A6 một mặt `1240 × 1754`) để không làm hỏng schema hiện tại. Khi triển khai **T-28**, hãy đọc `T-28-mini-templates.md` và ánh xạ tên trường khớp với schema mới.
3. Khi triển khai **T-35**, có thể đọc/import trực tiếp `T-35-scroll-web-defaults.json` và đổi tên trường nếu schema cuối có khác biệt nhỏ.
