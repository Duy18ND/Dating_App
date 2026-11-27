# Review của Opus (27/11/2026)

Phạm vi theo CLAUDE.md: bảo mật T-04..T-07, state T-08, lệnh xóa T-24.

## Đã sửa
| Mức | Chỗ | Vấn đề | Cách sửa |
|---|---|---|---|
| Cao | T-24 `take_orphan_uploads` | Ảnh mồ côi tính hạn theo lúc tải lên. Gỡ một ảnh cũ khỏi thư rồi lưu, cron đêm đó xóa file ngay; hoàn tác và lưu lại thì báo lỗi và mất ảnh. | `supabase/migrations/0002_upload_orphaned_at.sql`: thêm `orphaned_at`, tính 24 giờ từ lúc gỡ. Có test. **Chủ dự án phải chạy file này trên Supabase.** |
| Thấp | T-08 `load` | Mở thư khác vẫn giữ cờ ẩn nền in và công cụ đang dùng. | `load` đặt lại cả hai. |
| Thấp | T-08 nhân bản | Nhân bản mã QR tạo mã thứ hai, trong khi panel QR chỉ quản lý một mã. | Chặn nhân bản QR ở thanh công cụ và Ctrl+D. |
| Thấp | Link bí mật | `/editor?edit=<token>` có thể bị gửi qua Referer hoặc bị lập chỉ mục. | Trang editor đặt `noindex` và `referrer: no-referrer` (trang quản lý đã có). |

## Chưa sửa, cần chủ dự án quyết
1. **Quét slug (trung bình).** `GET /api/letters/[slug]` và trang `/l/[slug]` không giới hạn tốc độ. Slug 6 ký tự a-z0-9 khoảng 2,2 tỷ tổ hợp; quét hết tốn kém, nhưng thư ít người dùng sẽ dễ bị đoán trúng hơn. Đề xuất: bật giới hạn theo IP ở Vercel Firewall cho `/l/*` và `/api/letters/*`, hoặc tăng slug lên 8 ký tự (không đổi được cho thư đã in).
2. **Turnstile không kiểm tra hostname (thấp).** Token lấy từ site khác cùng site key vẫn qua. Đề xuất so `hostname` trong kết quả siteverify với domain thật khi đã có domain cố định.
3. **IP lấy từ header (thấp).** `x-real-ip` chỉ đáng tin trên Vercel. Nếu deploy nơi khác phải đặt proxy ghi đè header này, không thì giới hạn tốc độ bị lách được.

## Đã kiểm tra, không thấy lỗi
- `edit_token` không bao giờ ra API công khai (`toPublicLetter` liệt kê từng trường); so token bằng `timingSafeEqual`.
- Ảnh trong thư phải là ảnh đã tải lên qua `/api/upload` và chưa thuộc thư khác (`set_letter_uploads` khóa dòng); sticker chỉ nhận đường dẫn trong kho.
- `/api/upload` kiểm tra cả MIME khai báo lẫn chữ ký file WebP, giới hạn 500KB trước khi đọc body.
- RLS bật, không có policy cho `anon`; hàm SQL thu quyền `PUBLIC`.
- `?to=` được lọc ký tự trước khi hiển thị; link bản đồ chỉ nhận `http(s)`.
- Cron dọn rác: sai hoặc thiếu `CRON_SECRET` thì không xóa gì; `SKIP LOCKED` tránh xóa ảnh đang được gắn vào thư; R2 lỗi thì ghi lại bản ghi để lần sau xóa tiếp.
- Store: lịch sử là bản chụp bất biến, gộp bước theo khóa, giữ 50 bước (yêu cầu tối thiểu 20).
