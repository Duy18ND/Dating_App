# Hướng dẫn cấu hình Supabase & GitHub Actions

Tài liệu này hướng dẫn từng bước để kết nối **Supabase**, chạy tự động **GitHub Actions** (CI + đẩy database migration) và thiết lập môi trường chạy app cho **Phygital Letter Studio**.

---

## 1. Cấu trúc đã được setup sẵn trong repo

| File | Công dụng |
| :--- | :--- |
| `supabase/config.toml` | Cấu hình tối thiểu cho Supabase CLI |
| `supabase/migrations/0001_init.sql` | Tạo 4 bảng (`letters`, `responses`, `uploads`, `rate_events`), 4 hàm RPC, bật RLS chỉ cho `service_role` |
| `supabase/migrations/0002_upload_orphaned_at.sql` | Thêm cột `orphaned_at` và cập nhật hàm giữ ảnh mồ côi 24h |
| `supabase/migrations/0003_accounts.sql` | Bắt buộc tài khoản người tạo (`owner_id` gắn `auth.users`), bỏ `edit_token`, ràng buộc ảnh thuộc đúng chủ sở hữu |
| `.github/workflows/ci.yml` | Tự động chạy `lint` → `typecheck` → `test` (gồm test SQL trên PGlite) → `build` khi push / PR |
| `.github/workflows/supabase-migrations.yml` | Tự động đẩy migration mới lên Supabase khi push file trong `supabase/migrations/**`, hoặc chạy tay (`Run workflow`) có hỗ trợ `dry_run` |

---

## 2. Tạo project Supabase & lấy thông tin

1. Vào [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Đặt tên project (ví dụ `phygital-letter-studio`), chọn Region **Southeast Asia (Singapore)** cho nhanh tại Việt Nam, đặt **Database Password** rồi **lưu lại mật khẩu này** (sẽ dùng ở bước 3).
3. Chờ ~1–2 phút project khởi tạo xong, lấy 4 giá trị sau:

| Giá trị cần lấy | Vị trí trong Supabase Dashboard | Dùng ở đâu |
| :--- | :--- | :--- |
| **`SUPABASE_PROJECT_ID`** (Project Ref, dạng 20 ký tự chữ thường) | **Project Settings → General → Reference ID** (hoặc đoạn sau `/project/` trên thanh URL) | GitHub Secrets |
| **`SUPABASE_DB_PASSWORD`** | Mật khẩu DB bạn vừa đặt ở bước 2 (nếu quên: **Project Settings → Database → Reset database password**) | GitHub Secrets |
| **`SUPABASE_ACCESS_TOKEN`** (Personal Access Token, bắt đầu bằng `sbp_...`) | Bấm Avatar góc trên → **Account Preferences → Access Tokens → Generate new token** | GitHub Secrets |
| **`SUPABASE_URL`**, **`SUPABASE_SERVICE_ROLE_KEY`**, **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | **Project Settings → API** (`Project URL`, khóa `service_role` secret, và khóa `anon` / publishable cho đăng nhập trình duyệt) | `.env.local` & Vercel |

> **Bảo mật:** Tuyệt đối không commit `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`, hay `SUPABASE_ACCESS_TOKEN` vào Git. Khóa `anon` chỉ dùng cho đăng nhập Supabase Auth ở trình duyệt; mọi bảng dữ liệu vẫn khóa bằng RLS, chỉ server (`service_role`) được đọc/ghi.

4. **Cấu hình đăng nhập trong Supabase Auth** (cho tính năng tài khoản ở `0003_accounts.sql`):
   - Vào **Authentication → URL Configuration**: đặt **Site URL** là domain app (ví dụ `http://localhost:3000` khi dev, hoặc `https://your-app.vercel.app`) và thêm `http://localhost:3000/auth/callback` (cùng `http://localhost:3000/auth/callback?*`) và `https://your-app.vercel.app/auth/callback` vào **Redirect URLs**.
   - Vào **Authentication → Providers → Email**: **bật** provider Email, **tắt `Confirm email`** để người dùng đăng ký bằng tên đăng nhập thường (không cần email) dùng được ngay, và đặt mật khẩu tối thiểu **8 ký tự**.
   - *(Khi nào muốn bật thêm Google)*: vào **Authentication → Providers → Google**, nhập Client ID/Secret, rồi đặt `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` trong `.env.local` và Vercel.

---

## 3. Thêm 3 Secret vào GitHub Actions

1. Mở repo trên GitHub: `https://github.com/Duy18ND/Dating_App`
2. Vào **Settings → Secrets and variables → Actions → Repository secrets → New repository secret**.
3. Tạo đúng 3 secret sau (viết đúng tên in hoa):
   - `SUPABASE_ACCESS_TOKEN` = token `sbp_...`
   - `SUPABASE_PROJECT_ID` = Reference ID của project Supabase
   - `SUPABASE_DB_PASSWORD` = mật khẩu database

*(Workflow **CI** trong `.github/workflows/ci.yml` không cần bất kỳ secret nào.)*

---

## 4. Cách sử dụng GitHub Actions

### A. Kiểm tra code tự động (`CI`)
- Mỗi khi bạn **push lên `main`/`master`** hoặc mở **Pull Request**, workflow **CI** tự chạy đủ 4 bước: `eslint`, `next typegen + tsc`, `vitest` (17 file test, có test SQL migration bằng Postgres nhúng), và `next build`.
- Muốn chạy tay: tab **Actions → CI → Run workflow**.

### B. Đẩy database migration lên Supabase (`Deploy Supabase Migrations`)
- **Lần đầu tiên (sau khi thêm xong 3 Secret ở bước 3):**
  1. Vào tab **Actions → Deploy Supabase Migrations → Run workflow**.
  2. Nên tích **`dry_run = true`** chạy thử 1 lần để xem trước SQL sẽ chạy (`0001_init.sql`, `0002_upload_orphaned_at.sql`, `0003_accounts.sql`).
  3. Chạy lại với **`dry_run = false`** để đẩy thật lên Supabase.
  4. Mở Supabase Dashboard → **Table Editor** để xác nhận đã thấy 4 bảng: `letters`, `responses`, `uploads`, `rate_events`.
- **Các lần sau:** mỗi khi có file SQL mới được push vào `supabase/migrations/` trên `main`/`master`, workflow sẽ tự động đẩy lên Supabase.
- **Lưu ý nếu trước đó bạn đã tự dán SQL chạy tay trong Supabase SQL Editor:** không nên chạy lại `0001_init.sql` bằng Actions vì bảng đã tồn tại (sẽ báo lỗi `relation "letters" already exists`). Hãy chọn **1 trong 2 cách**:
  - **Khuyên dùng (DB mới tinh):** để trống DB, chỉ để GitHub Actions đẩy từ đầu.
  - **Nếu đã chạy tay rồi:** cài Supabase CLI ở máy local rồi đánh dấu đã áp dụng:
    ```bash
    npx supabase login
    npx supabase link --project-ref <SUPABASE_PROJECT_ID>
    npx supabase migration repair --status applied 0001 0002 0003
    ```

### C. Quy tắc khi thêm migration mới về sau
- Đặt file mới trong `supabase/migrations/` theo dạng `<YYYYMMDDHHMMSS>_mo_ta_ngan.sql` (hoặc `0003_mo_ta.sql`).
- Nếu muốn test tự động bằng PGlite trong CI, thêm tên file vào danh sách trong `src/lib/server/migration.test.ts` và chạy `npm test` trước khi push.

---

## 5. Cấu hình biến môi trường chạy Local & Deploy Vercel

1. **Chạy ở máy local:**
   - Copy `.env.example` thành `.env.local` (file `.env.local` đã có trong `.gitignore`).
   - Điền các biến từ bảng dưới. Để chạy thử nhanh ở máy dev, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` và `TURNSTILE_SECRET_KEY` có thể để trống.
   - Chạy `npm run dev` và mở `http://localhost:3000`.
2. **Deploy lên Vercel:**
   - Vào [vercel.com](https://vercel.com) → **Add New Project → Import `Duy18ND/Dating_App`**.
   - Vào **Project Settings → Environment Variables**, dán toàn bộ biến môi trường từ `.env.example`:
     - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `NEXT_PUBLIC_R2_PUBLIC_URL` *(nhớ bật CORS cho phép `GET` từ domain app trên Cloudflare R2 để xuất PDF không bị lỗi tainted canvas)*
     - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` *(bắt buộc trên production)*
     - `IP_HASH_SALT`, `CRON_SECRET` *(chuỗi ngẫu nhiên dài, ví dụ sinh bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`; Vercel tự truyền `CRON_SECRET` cho cron trong `vercel.json`)*
     - `NEXT_PUBLIC_SITE_URL` *(domain chính thức, ví dụ `https://your-app.vercel.app`)*
     - Các biến `NEXT_PUBLIC_DONATE_*` *(tùy chọn, để trống sẽ tự ẩn)*
   - Bấm **Deploy**. Vercel sẽ tự động kích hoạt cron dọn ảnh mồ côi hằng ngày (`0 19 * * *` → `/api/cron/cleanup`) theo `vercel.json`.
