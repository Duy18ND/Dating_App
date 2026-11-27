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


# Review bảo mật tài khoản (T-41, 27/11/2026)

Phạm vi: T-38 → T-40 (đăng nhập Supabase, `/api/me/*`, Thiệp của tôi).

## Đã sửa
| Mức | Chỗ | Vấn đề | Cách sửa |
|---|---|---|---|
| Trung bình | Mọi trang | Không có header chống nhúng khung: trang lạ nhúng `/thiep-cua-toi` vào iframe tàng hình để lừa bấm "Xóa thiệp" (clickjacking). | `next.config.ts`: `X-Frame-Options: SAMEORIGIN`, `frame-ancestors 'self'`, `nosniff`, `Referrer-Policy`. Đã kiểm tra bằng curl. |
| Thấp | `/auth/callback` | Nhận cả `?token_hash=`: link do kẻ xấu gửi đăng nhập nạn nhân vào tài khoản của kẻ gửi (login CSRF). | Chỉ nhận luồng PKCE `?code=`. Có test. |

## Đã kiểm tra, có test
- **Truy cập chéo tài khoản:** GET/PATCH/DELETE `/api/me/letters/[id]` của người khác trả 404 giống thiệp không tồn tại; không gọi cập nhật, xóa hay gắn ảnh. Danh sách lọc theo `owner_id`. Truy vấn sửa/xóa lọc `id` **và** `owner_id` (phòng khi tầng trên sót).
- **Ảnh:** `set_letter_uploads` chỉ gắn ảnh có `owner_id` trùng chủ thư (PGlite test với ảnh của người khác và ảnh vô chủ).
- **CSRF:** mọi API thay đổi dữ liệu kiểm tra `Origin` cùng site (thiếu Origin cũng bị từ chối); cookie phiên `SameSite=Lax`.
- **Chuyển hướng:** `safeNext` chặn `//`, `/\`, URL tuyệt đối, `javascript:`, ký tự điều khiển; dùng ở proxy, trang đăng nhập và `/auth/callback`.
- **Phiên:** API xác minh bằng `supabase.auth.getUser()` (hỏi máy chủ Auth), không tin cookie. Proxy chỉ là kiểm tra lạc quan.
- **Khóa bí mật:** build với giá trị đánh dấu cho `SUPABASE_SERVICE_ROLE_KEY`, R2, `IP_HASH_SALT`, `CRON_SECRET`, `TURNSTILE_SECRET_KEY`; không giá trị nào có trong `.next/static`. Chỉ anon key (công khai theo thiết kế) có mặt.
- **Xóa tài khoản:** cần gõ chuỗi xác nhận; xóa `auth.users` → thư và phản hồi xóa theo, ảnh thành vô chủ cho cron dọn (PGlite test).
- **Lộ dữ liệu:** API công khai không trả `owner_id`, IP hash; thông báo lỗi đăng nhập không cho biết email đã tồn tại.

## Chủ dự án phải cấu hình trên Supabase (code không tự làm được)
1. Authentication → URL Configuration: Site URL = domain thật; Redirect URLs chỉ gồm `https://<domain>/auth/callback` (và `http://localhost:3000/auth/callback` khi dev).
2. Authentication → Providers → Email: bật Confirm email; độ dài mật khẩu tối thiểu **8**.
3. Authentication → Attack Protection: bật CAPTCHA **Turnstile** với secret của Turnstile (site key dùng chung với `NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
4. Authentication → SMTP: cấu hình SMTP riêng trước khi ra mắt (SMTP mặc định giới hạn vài email/giờ).
5. Providers → Google: nhập Client ID/Secret; trong Google Cloud thêm redirect `https://<project>.supabase.co/auth/v1/callback`.
6. Chạy `0003_accounts.sql` **sau khi xóa thư thử** (`DELETE FROM letters; DELETE FROM uploads;`), vì thư cũ không có chủ.

## Còn mở
- Ba mục "Chưa sửa" ở trên (quét slug, hostname Turnstile, IP từ header) vẫn còn nguyên.
- Chưa thử đăng nhập thật (email, Google, đặt lại mật khẩu) vì máy này chưa có project Supabase: cần chủ dự án thử ở T-23B.
