# Backlog v1.3 (chốt 27/11/2026)

Nguồn chuẩn là file này và `docs/SRS.md` v1.3. File .xlsx chưa cập nhật. Backlog v1.1 gốc ở cuối file để tra cứu.

## Trạng thái T-01 → T-25

| Task | Trạng thái |
|---|---|
| T-01, T-04 → T-08, T-18, T-21, T-22, T-24 | Đã có code, chưa thử với Supabase/R2 thật. |
| T-03, T-09, T-10 → T-16 | Đã chuyển sang bộ mini (T-26, T-27). |
| T-26, T-27, T-28, T-30, T-31 | **Xong** (nhánh `feat/mini-print`). Đã thử trên trình duyệt với dữ liệu giả; chưa in thử. Tiếp theo: T-29 (Opus). |
| T-17 | Có code; 4 bố cục được thay ở T-28. |
| T-19 | Có code PDF 2 trang; được thay bằng T-29. |
| T-20 | Phong bì + nhạc xong; phần sau khi mở được thay bằng T-33. |
| T-02 | Chủ dự án. Gồm chạy `0001_init.sql` rồi `0002_upload_orphaned_at.sql`, thêm nhạc và ảnh QR donate. |
| T-23 | Chủ dự án, tách thành T-23A, T-23B. |
| T-25 | Chủ dự án, làm cuối cùng. |

## Đợt A: Bộ in mini

| Task | Nội dung | Tiêu chí hoàn thành | Phụ trách | Giờ | Sau |
|---|---|---|---|---|---|
| T-26 | Hợp đồng dữ liệu v2: types, `PRINT_CONFIG` mini, Zod, store theo từng mặt thiệp, hợp đồng hàm vẽ các phần in | Đúng SRS 5.1, 5.3; Undo/Redo chạy qua cả hai mặt và cấu hình in; giới hạn ảnh/phần tử/QR tính trên cả hai mặt; QR khóa >= 340px; bỏ hẳn khổ cũ; chuyển tạm 4 mẫu sang cấu trúc mới để test vẫn đạt; định nghĩa chữ ký hàm vẽ (phong bì, mặt thiệp, bìa sau, trang viết tay, thư) trả ảnh theo mm kèm tràn màu, để T-29/30/31/37 dùng chung | **Opus** | 3 | — |
| T-27 | Trình thiết kế và trang xem cho thiệp mini hai mặt | Chuyển giữa Bìa trước / Lời mời + QR; không còn số đo viết cứng; công cụ đặt phần tử đúng giữa; chữ không nhỏ hơn 48px; PC và mobile dùng được; trang chủ và trang người nhận hiển thị đúng | **Opus** | 2.5 | T-26 |
| T-30 | Thư gấp 3 và trang viết tay (FR-11): hàm vẽ + panel + xem trước | Đúng 3 ô 105x74; dòng kẻ 8mm không đè vạch gấp; phần viết để trống; chữ tiếng Việt đúng font; ảnh >= 300 DPI | **Sonnet** | 2.5 | T-26 |
| T-31 | Phong bì và bìa sau (FR-12): hàm vẽ phần trang trí + panel + xem trước | Chữ lồng và câu ngắn đúng giới hạn; màu dùng chung `envelopeColor`; có bản ảnh cho nắp trên (T-29 xoay 180°) | **Sonnet** | 2 | T-26 |
| T-28 | 4 mẫu mini (mỗi mẫu 2 mặt) | Nội dung và tọa độ từ Gemini (Prompt 1); test lề an toàn, cỡ chữ, QR đạt; kiểm tra bằng ảnh chụp | **Gemini** soạn → **Sonnet** ghép | 2 | T-27 |
| T-29 | PDF 3 trang theo SRS 2.2 | Số đo đúng (có test hình học); tràn màu 2mm; dấu cắt ngoài vùng tràn; vùng "Bôi keo" bị nắp đáy che hết; chữ nắp xoay 180°; hai dải thiệp cùng chiều xoay nên dán lưng đúng mặt; 3 công tắc nền; không `pdf.text()` cho chữ người dùng; kiểm tra file PDF xuất ra | **Opus** | 3.5 | T-27, T-30, T-31 |
| T-37 | Xem trước cả bộ (FR-13) | Dùng đúng hàm vẽ của PDF; đổi màu, chữ hiện ngay; mượt trên mobile | **Sonnet** | 1.5 | T-29 |
| T-23A | In thử trên giấy thật | In 100%, cắt, dán, gấp: hai dải khít nhau; thiệp + thư bỏ vào và rút ra phong bì dễ (không quá dày); chữ nắp đọc xuôi; không lộ keo; quét được QR bằng 2 điện thoại; chữ nhỏ đọc được | **Chủ dự án** | 2 | T-28, T-37 |

## Đợt B: Trang web bày tỏ

| Task | Nội dung | Tiêu chí hoàn thành | Phụ trách | Giờ | Sau |
|---|---|---|---|---|---|
| T-32 | Ảnh cho trang web: tối đa 8, upload 20 ảnh/giờ, gắn ảnh vào thư | URL trong `sections` và hai mặt thiệp cùng được đưa vào `set_letter_uploads` ở cả tạo và sửa, **kể cả khi PATCH chỉ đổi web_config hoặc chỉ canvas_data** (thiếu một bên là cron xóa nhầm ảnh); từ chối URL lạ; có test | **Opus** | 2 | T-26 |
| T-33 | Trang web cuộn (FR-10) | Đẹp ở 360px; hiện dần khi cuộn; tôn trọng reduced-motion; phần trống tự ẩn; nhạc không ngắt; "Xem lại tấm thiệp"; thư không có `sections` vẫn hiển thị | **Sonnet** | 4 | T-27 |
| T-34 | Tab "Trang web" trong trình thiết kế | Bật/tắt, đổi thứ tự, nhập nội dung, tải ảnh, xem trước cỡ điện thoại; Undo/Redo; dùng được trên mobile | **Sonnet** | 3.5 | T-32, T-33 |
| T-35 | Phần web mặc định cho 4 mẫu | Nội dung từ Gemini (Prompt 5), đúng thứ tự FR-01, qua validation | **Gemini** soạn → **Sonnet** ghép | 1.5 | T-33 |
| T-36 | Review đợt B | Chữ người dùng hiển thị an toàn; URL ảnh; dọn rác không xóa nhầm; thử lại toàn luồng | **Opus** | 1.5 | T-34, T-35 |
| T-23B | Thử trên iPhone và Android thật | Nhạc, cuộn, `?to=`, phản hồi, tải PDF và ảnh QR | **Chủ dự án** | 1.5 | T-36 |

## Phân việc

| Phụ trách | Task | Giờ (ước lượng) |
|---|---|---|
| Claude Opus | T-26, T-27, T-29, T-32, T-36 | 12.5 |
| Claude Sonnet | T-30, T-31, T-37, T-33, T-34, ghép T-28 và T-35 | 17 |
| Gemini | Soạn nội dung cho T-28 (Prompt 1), T-35 (Prompt 5); kịch bản T-25 (Prompt 4) | tính chung ở trên |
| Chủ dự án | T-02, T-23A, T-23B, T-25 | — |

## Thứ tự và câu lệnh giao việc

Đổi model bằng `/model`, rồi gửi câu lệnh. Làm lần lượt từ trên xuống.

| Lượt | Model | Câu lệnh |
|---|---|---|
| 0 | Chủ dự án | Quyết định các thay đổi icon/sticker/mẫu chưa commit: commit hoặc bỏ. Gửi Prompt 1 cho Gemini. |
| 1 | `/model opus` | `Làm T-26 và T-27 trong docs/BACKLOG.md theo docs/SRS.md v1.3. Commit sau mỗi task.` |
| 2 | `/model sonnet` | `Làm T-30 và T-31 trong docs/BACKLOG.md. Commit sau mỗi task.` |
| 3 | `/model sonnet` | `Ghép kết quả Gemini này cho T-28.` (dán kết quả) |
| 4 | `/model opus` | `Làm T-29 trong docs/BACKLOG.md.` |
| 5 | `/model sonnet` | `Làm T-37 trong docs/BACKLOG.md.` |
| 6 | Chủ dự án | T-23A. **In thử đạt mới sang đợt B.** |
| 7 | `/model opus` | `Làm T-32.` |
| 8 | `/model sonnet` | `Làm T-33, T-34, T-35 trong docs/BACKLOG.md.` |
| 9 | `/model opus` | `Làm T-36.` |
| 10 | Chủ dự án | T-02 (nếu chưa), T-23B, T-25. |

---

# Phụ lục: Backlog v1.1 gốc (lịch sử, số đo đã cũ)

> Bản trích tự động từ Base_Task_Backlog_Phygital_Letter.xlsx. Mỗi dòng là một hàng; chữ cái là cột.

=== Dashboard  
A=DASHBOARD TIẾN ĐỘ DỰ ÁN — PHYGITAL LETTER STUDIO (V1.1)  
A=Tự động đồng bộ từ tab Base_Tasks • Chuẩn in A6/C6 • Cá nhân hóa ?to=... • Free + Ảnh QR Donate tĩnh  
A=TỔNG SỐ TASK | C=TỔNG GIỜ ƯỚC LƯỢNG | E=ĐÃ HOÀN THÀNH | G=TIẾN ĐỘ HOÀN THÀNH  
A= | C= | E= | G=  
A=1. PHÂN BỔ KHỐI LƯỢNG THEO EPIC  
A=Epic | B=Số Task | C=Tổng Giờ | D=Hoàn thành | E=% Tiến độ  
A=Epic 0: Khởi tạo | B= | C= | D= | E=  
A=Epic 1: Backend APIs | B= | C= | D= | E=  
A=Epic 2: Lõi Editor PC | B= | C= | D= | E=  
A=Epic 3: Sticker, Ghi tay & Mobile | B= | C= | D= | E=  
A=Epic 4: Mẫu, Nhạc & PDF | B= | C= | D= | E=  
A=Epic 5: Trang Người nhận | B= | C= | D= | E=  
A=Epic 6: Test & Ra mắt | B= | C= | D= | E=  
A=TỔNG CỘNG | B= | C= | D= | E=  
A=2. PHÂN BỔ THEO MODEL AI & PHỤ TRÁCH  
A=Model AI / Phụ trách | B=Số Task | C=Tổng Giờ | D=Tỷ trọng Giờ  
A=Claude Sonnet | B= | C= | D=  
A=Claude Opus | B= | C= | D=  
A=Gemini + Sonnet | B= | C= | D=  
A=Thủ công | B= | C= | D=  
A=TỔNG CỘNG | B= | C= | D=  
=== Base_Tasks  
A=BASE TASK BACKLOG V1.1 — PHYGITAL LETTER STUDIO (CHUẨN A6/C6 • ?to=... • STATIC QR DONATE)  
A=Mã Task | B=Epic | C=Tên Chức năng / Task | D=Mô tả chi tiết & Tiêu chí hoàn thành (Acceptance Criteria) | E=Phân hệ | F=Ưu tiên | G=Ngày Sprint | H=Ước lượng (Giờ) | I=Model AI / Phụ trách | J=Trạng thái | K=Ghi chú kỹ thuật  
A=T-01 | B=Epic 0: Khởi tạo | C=Khởi tạo Repo Next.js & Design Tokens | D=Tạo dự án Next.js App Router + TS + Tailwind + shadcn/ui; nhúng Google Fonts tiếng Việt (Be Vietnam Pro, Cormorant Garamond, Charm, Mali) và bảng màu Warm Minimalist. | E=Setup / FE | F=Cao | G=Ngày 1 | H=1.5 | I=Claude Sonnet | J=Chưa bắt đầu | K=Kiểm tra render đủ dấu tiếng Việt trên Chrome & Safari  
A=T-02 | B=Epic 0: Khởi tạo | C=Thiết lập Supabase DB, R2 & Ảnh Donate tĩnh | D=Chạy SQL tạo 2 bảng letters & responses kèm index; cấu hình bucket R2 public domain + CORS; chuẩn bị ảnh QR ngân hàng/ZaloPay tĩnh (public/donate-qr-*.webp). | E=Infra / DB | F=Cao | G=Ngày 1 | H=1.5 | I=Thủ công | J=Chưa bắt đầu | K=Cắt gọn ảnh QR Donate, che SĐT cá nhân nếu cần  
A=T-03 | B=Epic 0: Khởi tạo | C=Định nghĩa Types, PRINT_CONFIG & Zod Schema | D=Tạo types/letter.ts, lib/print-config.ts (Canvas 1240x1754, A6 105x148mm, A5 148x210mm, C6 trải phẳng 192x274mm, Safe Margin 94px) và lib/validation.ts. | E=Shared | F=Cao | G=Ngày 1 | H=1 | I=Claude Sonnet | J=Chưa bắt đầu | K=Khóa cứng tọa độ logic & defaultPrintSize='A6'  
A=T-04 | B=Epic 1: Backend APIs | C=API Upload ảnh lên Cloudflare R2 | D=Viết POST /api/upload kiểm tra MIME (webp/png/jpg) và dung lượng <=500KB; đẩy file lên R2 qua AWS S3 SDK và trả về public URL. | E=Backend | F=Cao | G=Ngày 1 | H=2 | I=Claude Sonnet | J=Chưa bắt đầu | K=Đặt tên file UUID tránh trùng lặp  
A=T-05 | B=Epic 1: Backend APIs | C=API CRUD Lá thư (Tạo, Đọc, Sửa) | D=Viết POST /api/letters (nanoid 6 ký tự cho slug, 24 ký tự cho edit_token), GET /api/letters/[slug] (tăng view_count, ẩn token), PATCH /api/letters/[slug]. | E=Backend | F=Cao | G=Ngày 1 | H=2 | I=Claude Sonnet | J=Chưa bắt đầu | K=Kiểm tra expires_at trước khi trả dữ liệu GET  
A=T-06 | B=Epic 1: Backend APIs | C=API Phản hồi & Quản lý bí mật | D=Viết POST /api/letters/[slug]/responses lưu Đồng ý/RSVP/Poll và GET /api/manage/[editToken] trả về chi tiết thư + danh sách phản hồi. | E=Backend | F=Cao | G=Ngày 1 | H=1.5 | I=Claude Sonnet | J=Chưa bắt đầu | K=Validate action_type theo enum chuẩn  
A=T-07 | B=Epic 1: Backend APIs | C=Tích hợp Cloudflare Turnstile & Rate Limit | D=Gắn xác thực Turnstile token ở API tạo thư/upload; chặn spam theo IP hash SHA-256 (tối đa 5 thư/ngày, 10 ảnh/giờ). | E=Security | F=Cao | G=Ngày 1 | H=1.5 | I=Claude Sonnet | J=Chưa bắt đầu | K=Lưu IP hash + salt bí mật trong .env  
A=T-08 | B=Epic 2: Lõi Editor PC | C=Zustand Store & Undo/Redo Stack | D=Xây dựng store quản lý elements, background, selectedId, defaultPrintSize, webConfig; hỗ trợ Undo/Redo tối thiểu 20 bước và z-index ordering. | E=Frontend | F=Cao | G=Ngày 2 | H=2 | I=Claude Sonnet | J=Chưa bắt đầu | K=Tách riêng UI transient state khỏi history snapshot  
A=T-09 | B=Epic 2: Lõi Editor PC | C=Khung Konva Stage 1240x1754 & Safe Margin | D=Dựng react-konva Stage tự động tính scale theo màn hình; gắn Konva Transformer (kéo, xoay, resize, khóa, xóa) và khung nét đứt lề an toàn 94px (~8mm A6). | E=Frontend | F=Cao | G=Ngày 2 | H=2.5 | I=Claude Opus | J=Chưa bắt đầu | K=Dynamic import ssr:false; ẩn Safe Margin khi xuất PDF  
A=T-10 | B=Epic 2: Lõi Editor PC | C=Công cụ Chữ (Text) trên Canvas | D=Thêm chữ, double-click nhập tiếng Việt, thanh thuộc tính chỉnh font, cỡ chữ, màu mực, căn lề và chiều rộng khung. | E=Frontend | F=Cao | G=Ngày 2 | H=2 | I=Claude Sonnet | J=Chưa bắt đầu | K=Tạo textarea overlay khớp tọa độ khi sửa chữ  
A=T-11 | B=Epic 2: Lõi Editor PC | C=Công cụ Ảnh cá nhân, 6 Khung & 3 Filter | D=Nén ảnh client sang WebP (<=200KB) -> /api/upload -> hỗ trợ 6 khung (Gốc, Polaroid, Tem răng cưa, Bo góc, Tròn, Đám mây) và 3 bộ lọc màu (Gốc, Vintage, B&W). | E=Frontend | F=Cao | G=Ngày 2 | H=2.5 | I=Claude Sonnet | J=Chưa bắt đầu | K=Giới hạn tối đa 4 ảnh upload mỗi lá thư  
A=T-12 | B=Epic 2: Lõi Editor PC | C=Tùy chỉnh Nền (Custom Background) & Blur/Overlay | D=Panel chọn nền 3 lớp (Preset Kraft/Kem/Ô ly/Caro, Color Picker, Ảnh nền cá nhân) kèm thanh kéo Overlay Opacity (mặc định 0.35) và Blur (0-10px). | E=Frontend | F=Cao | G=Ngày 2 | H=2 | I=Claude Sonnet | J=Chưa bắt đầu | K=Tách riêng Layer Background để bật/tắt khi in Kraft  
A=T-13 | B=Epic 3: Sticker, Ghi tay & Mobile | C=Kho 20 Icon SVG đổi màu & 25 Sticker Meme | D=Tạo 20 icon SVG nội bộ đổi màu trực tiếp (Tối giản/Cưới/Hoa/Dấu sáp) và 20-30 sticker Meme WebP tách nền chia 4 tab riêng trong Sidebar. | E=Frontend / Design | F=Trung bình | G=Ngày 3 | H=2.5 | I=Gemini + Sonnet | J=Chưa bắt đầu | K=Gemini tạo mã SVG chuẩn; nén Meme WebP ~20KB  
A=T-14 | B=Epic 3: Sticker, Ghi tay & Mobile | C=Tính năng Ghi tay 2 chế độ (Print & Digital Ink) | D=Thêm khối vùng dòng kẻ/chấm bi mờ (Print-to-Write cho thiệp A6) và bút vẽ tay tự do lưu mảng points (chọn màu, độ dày 2-8px, xóa nét). | E=Frontend | F=Cao | G=Ngày 3 | H=2.5 | I=Claude Opus | J=Chưa bắt đầu | K=Xử lý mượt cả chuột PC và touch/stylus trên Mobile  
A=T-15 | B=Epic 3: Sticker, Ghi tay & Mobile | C=Khối Mã QR Nghệ thuật & Quiet Zone | D=Dùng qr-code-styling tạo QR đổi màu/chèn icon giữa; khóa kích thước tối thiểu 240px (mặc định 280px ~24mm trên A6) và bọc nền sáng Quiet Zone >=12px. | E=Frontend | F=Cao | G=Ngày 3 | H=2 | I=Claude Sonnet | J=Chưa bắt đầu | K=Hiển thị QR preview trước khi xuất bản thật  
A=T-16 | B=Epic 3: Sticker, Ghi tay & Mobile | C=Giao diện Editor Responsive cho Mobile | D=Chuyển Sidebar thành Bottom Bar + Bottom Sheet trượt lên (<768px); Floating Toolbar khi chọn vật thể; hỗ trợ kéo/zoom 2 ngón và chặn cuộn trang. | E=Frontend / UX | F=Cao | G=Ngày 3 | H=3 | I=Claude Opus | J=Chưa bắt đầu | K=Bật touch-action: none trên container của Stage  
A=T-17 | B=Epic 4: Mẫu, Nhạc & PDF | C=Trang chủ (/) & 4 Cấu hình Mẫu JSON (Chuẩn A6) | D=Dựng Landing Page Warm Minimalist và 4 mẫu JSON tối ưu bố cục nhỏ gọn A6 (Tỏ tình 35/45/20, Mời cưới, Vé Mời ăn, Postcard Noel/Sinh nhật). | E=Frontend / Design | F=Cao | G=Ngày 4 | H=2.5 | I=Gemini + Sonnet | J=Chưa bắt đầu | K=Gemini soạn sẵn copywriting & tọa độ mẫu A6  
A=T-18 | B=Epic 4: Mẫu, Nhạc & PDF | C=Panel Nhạc nền (startTime) & Block Tương tác | D=Upload 6-8 bài MP3 nhẹ lên R2; trình nghe thử + thanh kéo chọn giây bắt đầu điệp khúc và form bật/tắt AcceptButton, RSVP, Poll, màu phong bì/dấu sáp. | E=Frontend | F=Cao | G=Ngày 4 | H=2.5 | I=Claude Sonnet | J=Chưa bắt đầu | K=Mặc định âm lượng 0.4; có nút nghe thử tại chỗ  
A=T-19 | B=Epic 4: Mẫu, Nhạc & PDF | C=Xuất PDF 2 trang (Phôi C6 + Thiệp A6/A5) & Kraft | D=Dùng PRINT_CONFIG: Trang 1 vẽ vector phôi phong bì C6 (192x274mm, nét cắt liền/gấp đứt); Trang 2 nhúng Stage pixelRatio=2 đúng cỡ A6 (hoặc A5) kèm dấu cắt góc + nút ẩn nền Kraft. | E=Frontend | F=Cao | G=Ngày 4 | H=3 | I=Claude Opus | J=Chưa bắt đầu | K=Ẩn Transformer & Safe Margin trước khi toDataURL()  
A=T-20 | B=Epic 5: Trang Người nhận | C=Hiệu ứng mở Phong bì, ?to=... & Nhạc (/l/[slug]) | D=Dựng khung dọc Mobile: đọc query ?to=Ten-Khach (sanitize XSS) đè tên người nhận lên phong bì -> chạm bóc dấu sáp mở nắp đồng thời trigger audio.play() từ startTime. | E=Frontend / UX | F=Cao | G=Ngày 5 | H=3 | I=Claude Opus | J=Chưa bắt đầu | K=Gọi audio.play() trực tiếp trong click handler để chạy trên Safari iOS  
A=T-21 | B=Epic 5: Trang Người nhận | C=Render Nội dung thư & 3 Khối Tương tác | D=Render tờ thư từ JSON (nền/blur/ảnh/meme/nét viết tay); nối nút Đồng ý (tung hoa + né chuột), Form RSVP + Google Maps, Poll tới POST /responses + credit footer. | E=Frontend | F=Cao | G=Ngày 5 | H=2.5 | I=Claude Sonnet | J=Chưa bắt đầu | K=Footer dẫn về trang tạo thư miễn phí kéo viral  
A=T-22 | B=Epic 5: Trang Người nhận | C=Modal Xuất bản, Link ?to=..., QR Donate tĩnh & Quản lý | D=Hoàn thiện Modal Xuất bản (QR tải PNG, Link ngắn, ô tạo nhanh link riêng ?to=..., nút PDF A6/A5 + gợi ý định lượng giấy, khung Ảnh QR Ngân hàng/Zalo tĩnh kèm nút Lưu & Copy STK) và trang /manage/[editToken]. | E=Frontend | F=Cao | G=Ngày 5 | H=2.5 | I=Claude Sonnet | J=Chưa bắt đầu | K=Hỗ trợ 2 tab nhỏ Ngân hàng / ZaloPay nếu dùng cả hai  
A=T-23 | B=Epic 6: Test & Ra mắt | C=Kiểm thử Thiết bị & In giấy thật A6 + Phong bì C6 | D=Test toàn luồng iOS Safari & Android Chrome (nhạc, ?to=..., tải ảnh Donate QR); in thử PDF ra giấy A4 thật, cắt gấp phong bì C6 + thiệp A6 và quét QR kiểm tra độ nhạy. | E=QA / Testing | F=Cao | G=Ngày 6 | H=3 | I=Thủ công | J=Chưa bắt đầu | K=Kiểm tra khoảng hở rút thiệp A6 trong phong bì C6  
A=T-24 | B=Epic 6: Test & Ra mắt | C=Tối ưu SEO, OpenGraph & Cron Dọn rác 60 ngày | D=Cấu hình thẻ OG preview đẹp khi gửi link qua Messenger/Zalo; thiết lập cron job Supabase xóa thư quá hạn 60 ngày và file ảnh tương ứng trên R2. | E=DevOps / SEO | F=Trung bình | G=Ngày 6 | H=2 | I=Claude Sonnet | J=Chưa bắt đầu | K=Hiển thị tiêu đề động trên OG nếu có ?to=...  
A=T-25 | B=Epic 6: Test & Ra mắt | C=Deploy Production & Quay clip ra mắt Threads | D=Deploy Vercel, trỏ domain, kiểm tra rate limit & ảnh QR Donate; tự in 1 thiệp A6 + phong bì giấy Kraft đóng sáp thật rồi quay clip 15-20s mở thư & quét QR đăng Threads. | E=Launch | F=Cao | G=Ngày 7 | H=3 | I=Thủ công | J=Chưa bắt đầu | K=Ghim sẵn link demo mẫu ngay dưới bình luận Threads  
A=TỔNG CỘNG | B= | H= | J=  
=== Sprint_7_Ngay  
A=KẾ HOẠCH THỰC THI SPRINT 7 NGÀY (V1.1 — PHỐI HỢP GEMINI & CLAUDE SONNET / OPUS)  
A=Ngày Sprint | B=Mục tiêu Trọng tâm | C=Số Task | D=Tổng Giờ | E=Đã Hoàn thành | F=Đầu ra kiểm chứng (Deliverables) | G=Mốc Git Commit  
A=Ngày 1 | B=Nền móng, PRINT_CONFIG, DB, R2 & 6 APIs | C= | D= | E= | F=Chạy được API tạo/lấy/sửa thư, ảnh đẩy lên R2 thành công, có sẵn ảnh QR Donate tĩnh. | G=chore: init-v1.1 & feat: backend-apis  
A=Ngày 2 | B=Lõi Editor Canvas (1240x1754) & Custom BG | C= | D= | E= | F=Kéo-thả, xoay Chữ/Ảnh WebP (6 khung), chỉnh nền + Blur/Overlay, khung Safe Margin 94px. | G=feat: konva-editor-core & custom-bg  
A=Ngày 3 | B=Sticker Meme, Ghi tay, QR & Mobile UI | C= | D= | E= | F=Vẽ tay mượt, dán Meme/SVG đổi màu, QR >=240px có Quiet Zone, giao diện Bottom Sheet Mobile. | G=feat: handwriting-stickers-qr-mobile  
A=Ngày 4 | B=4 Mẫu A6, Nhạc nền & Xuất PDF A6/A5 + C6 | C= | D= | E= | F=Chọn 4 mẫu A6 từ trang chủ, nghe thử chọn giây điệp khúc, xuất PDF 2 trang (C6 + A6/A5) & ẩn nền Kraft. | G=feat: templates-audio-pdf-a6-c6  
A=Ngày 5 | B=Trang Người nhận (?to=...) & Donate QR tĩnh | C= | D= | E= | F=Mở /l/[slug]?to=... bóc dấu sáp phát nhạc, bấm Đồng ý/RSVP/Poll lưu DB, Modal link ?to=... & ảnh QR Donate tĩnh. | G=feat: viewer-personalize-static-donate  
A=Ngày 6 | B=Kiểm thử Thực tế, In A6/C6 & Cron 60 ngày | C= | D= | E= | F=In thử ra giấy A4 thật, cắt gấp phong bì C6 + thiệp A6 & quét QR nhạy; test Safari iOS/Android; bật cron. | G=fix: mobile-safari-audio & qa-print-a6  
A=Ngày 7 | B=Deploy Production & Ra mắt Threads | C= | D= | E= | F=Web chạy mượt trên domain thật; quay clip 15-20s mở phong bì giấy Kraft + thiệp A6 + quét QR đăng Threads. | G=release: v1.1.0-mvp-launch  
A=TỔNG 7 NGÀY | B=Hoàn thành toàn bộ bản MVP V1.1 | C= | D= | E=  
=== Print_API_DB_Spec  
A=THAM CHIẾU NHANH: CHUẨN IN A6/C6, API ROUTES & CƠ SỞ DỮ LIỆU (V1.1)  
A=1. THÔNG SỐ IN ẤN CHUẨN (PRINT_CONFIG)  
A=Hạng mục | B=Rộng (Width) | C=Cao (Height) | D=Vị trí / Lề chuẩn | E=Ghi chú cho Claude IDE  
A=Canvas Logic (px) | B=1240 px | C=1754 px | D=Safe Margin: 94 px (~8mm A6) | E=Tỷ lệ cố định 1:1.414; PC/Mobile chỉ scale hiển thị  
A=Giấy in A4 (mm) | B=210 mm | C=297 mm | D=Khổ giấy PDF 2 trang | E=Trang 1: Phôi C6 | Trang 2: Ruột thiệp A6 hoặc A5  
A=Thiệp A6 Mặc định (mm) | B=105 mm | C=148 mm | D=Offset A4: x=52.5, y=74.5 mm | E=Nhỏ gọn cầm tay (6-10 dòng), pixelRatio=2 đạt ~600 DPI  
A=Thiệp A5 Tùy chọn (mm) | B=148 mm | C=210 mm | D=Offset A4: x=31.0, y=43.5 mm | E=Gấp đôi vẫn vừa phong bì C6, pixelRatio=2 đạt ~426 DPI  
A=Phong bì C6 Thành phẩm | B=162 mm | C=114 mm | D=Hở rút thiệp: 14mm W, 9mm H | E=Trải phẳng: 192x274mm (tai 15, đáy 95, nắp 65; lề A4: 9/11.5mm)  
A=Mã QR trên Canvas (px) | B=Mặc định 280 px | C=Tối thiểu 240 px | D=Quiet Zone sáng >= 12 px | E=Đảm bảo kích thước in thật >= 20-24mm trên thiệp A6  
A=2. DANH SÁCH API ENDPOINTS (NEXT.JS APP ROUTER)  
A=Method | B=Endpoint | C=Bảo vệ / Rate Limit | D=Input chính | E=Output / Xử lý  
A=POST | B=/api/upload | C=Turnstile + 10 ảnh/IP/giờ | D=FormData (file WebP <= 500KB) | E=Upload lên Cloudflare R2 -> trả về { url }  
A=POST | B=/api/letters | C=Turnstile + 5 thư/IP/ngày | D=LetterPayload (JSON + Zod) | E=Sinh slug(6) & edit_token(24) -> lưu Supabase -> trả về { slug, edit_token }  
A=GET | B=/api/letters/[slug] | C=Public (ẩn edit_token) | D=Path: slug (FE hỗ trợ ?to=...) | E=Kiểm tra expires_at -> tăng view_count -> trả dữ liệu hiển thị thư  
A=PATCH | B=/api/letters/[slug] | C=Header x-edit-token | D=Partial<LetterPayload> | E=Cập nhật nội dung thư; giữ nguyên slug để mã QR giấy cũ tự cập nhật  
A=POST | B=/api/letters/[slug]/responses | C=Public + Rate Limit nhẹ | D={ responder_name, action_type, status, guest_count, poll_option, message } | E=Lưu phản hồi (Đồng ý / RSVP / Poll) vào bảng responses  
A=GET | B=/api/manage/[editToken] | C=Bí mật theo editToken | D=Path: editToken | E=Trả thông tin thư, view_count, danh sách responses & công cụ tạo link ?to=...  
A=3. CẤU TRÚC BẢNG CƠ SỞ DỮ LIỆU (SUPABASE / POSTGRESQL)  
A=Tên Bảng | B=Tên Cột | C=Kiểu Dữ liệu | D=Ràng buộc / Mặc định | E=Ý nghĩa & Ghi chú  
A=letters | B=id | C=UUID | D=PRIMARY KEY, gen_random_uuid() | E=Khóa chính lá thư  
A=letters | B=slug | C=VARCHAR(12) | D=UNIQUE NOT NULL, INDEX | E=Mã ngắn tạo URL /l/[slug] và mã QR động  
A=letters | B=edit_token | C=VARCHAR(32) | D=UNIQUE NOT NULL | E=Token bí mật cho phép chủ thư sửa nội dung & xem phản hồi  
A=letters | B=template_type | C=VARCHAR(20) | D=CHECK (confession/wedding/dinner/holiday) | E=Phân loại 4 mẫu thư  
A=letters | B=canvas_data | C=JSONB | D=NOT NULL | E=Lưu width=1240, height=1754, defaultPrintSize(A6/A5), background và elements  
A=letters | B=web_config | C=JSONB | D=NOT NULL | E=Lưu tên người nhận/gửi, màu phong bì/sáp, nhạc (startTime) và blocks  
A=letters | B=view_count | C=INT | D=DEFAULT 0 | E=Đếm số lượt mở thư từ QR/link  
A=letters | B=creator_ip_hash | C=VARCHAR(64) | D=NULLABLE | E=SHA-256 IP phục vụ giới hạn 5 thư/IP/ngày  
A=letters | B=expires_at | C=TIMESTAMPTZ | D=DEFAULT NOW() + 60 days, INDEX | E=Thời điểm tự động hết hạn để cron dọn DB & R2  
A=responses | B=id | C=UUID | D=PRIMARY KEY, gen_random_uuid() | E=Khóa chính phản hồi  
A=responses | B=letter_id | C=UUID | D=FK -> letters(id) ON DELETE CASCADE | E=Liên kết lá thư gốc; xóa thư tự xóa phản hồi  
A=responses | B=responder_name | C=VARCHAR(100) | D=NULLABLE | E=Tên người nhận gửi phản hồi (tự điền từ ?to=... nếu có)  
A=responses | B=action_type | C=VARCHAR(20) | D=NOT NULL | E=Loại tương tác: 'accept' | 'rsvp' | 'poll'  
A=responses | B=status / guest_count / poll_option | C=VARCHAR / INT | D=guest_count DEFAULT 1 | E=Kết quả Đồng ý, số khách đi tiệc hoặc món ăn/giờ hẹn đã chọn  
A=responses | B=message | C=TEXT | D=NULLABLE | E=Lời chúc hoặc lời nhắn gửi lại cho người tạo thư  