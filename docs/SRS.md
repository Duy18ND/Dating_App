> **SRS v1.2 — nguồn chuẩn hiện hành.** Bản gốc trích từ SRS_Phygital_Letter_Studio_V1.docx (v1.1); các thay đổi v1.2 được sửa trực tiếp trong file này. File .docx và .xlsx **chưa cập nhật**, khi lệch thì file .md này là chuẩn. Quyết định bổ sung nằm ở CLAUDE.md.

SOFTWARE REQUIREMENTS SPECIFICATION (SRS) — VERSION 1.2  
NỀN TẢNG TẠO THƯ ĐIỆN TỬ LAI THƯ TAY(PHYGITAL LETTER STUDIO)  
Trình thiết kế bộ quà thư tay (phong bì C6, thiệp A6 nằm ngang, thư viết tay) kèm trang web bày tỏ dạng cuộn dọc mở bằng mã QR.  
  
Thông tin tài liệu | Chi tiết  
Tên sản phẩm | Phygital Letter Studio  
Phiên bản tài liệu | v1.2 — Bộ in nằm ngang (phong bì, thiệp, thư viết tay) & trang web bày tỏ dạng cuộn  
Ngày cập nhật | 27/11/2026  
Mô hình vận hành | 100% Miễn phí (Free) + Ủng hộ tự nguyện bằng Ảnh QR Ngân hàng / ZaloPay tĩnh  
Kênh ra mắt mục tiêu | Threads (Viral nội dung mở phong bì giấy Kraft + thiệp A6 + quét QR phát nhạc)  
Kế hoạch thực thi | Sprint 7 ngày (Kiến trúc Gemini + Code Claude Sonnet / Opus / Haiku trong IDE)  
Công nghệ cốt lõi | Next.js (App Router), TypeScript, Tailwind CSS, React-Konva, Supabase, Cloudflare R2  
NHỮNG CẬP NHẬT CHÍNH Ở PHIÊN BẢN V1.2 (chốt ngày 27/11/2026)  
1. Hai sản phẩm tách biệt: **bản in** (cầm trên tay) và **trang web** (lướt để bày tỏ). Thư giấy và web nói hai điều khác nhau.  
2. Bộ in 3 trang A4: phong bì C6 162 x 114 mm có vùng dán keo và nắp đầu bo tròn; thiệp A6 **nằm ngang** 148 x 105 mm có mã QR; thư viết tay A5 148 x 210 mm gấp đôi còn 148 x 105 mm.  
3. Canvas thiệp đổi từ 1240 x 1754 (đứng) sang **1754 x 1240** (ngang). Thư đứng đã tạo trước đó vẫn mở, sửa và in được.  
4. Bỏ tùy chọn thiệp A5 cho thiệp mới (thư viết tay A5 đảm nhận phần viết dài). Chỉ thư đứng cũ còn dùng được A5.  
5. Trang người nhận thành trang cuộn dọc gồm các phần kể chuyện; ảnh web riêng tối đa 8 ảnh; giới hạn tải lên 20 ảnh/IP/giờ.  
6. Hiệu ứng hoa/tuyết rơi chuyển sang V2.  
  
Các cập nhật v1.1 (còn hiệu lực trừ chỗ đã sửa ở v1.2): cá nhân hóa người nhận bằng ?to=..., ảnh QR Donate tĩnh, phân bổ model AI.  
1.  TỔNG QUAN DỰ ÁN & PHẠM VI SẢN PHẨM  
1.1. Mục đích & Giá trị Cốt lõi  
Tài liệu này là nguồn chuẩn duy nhất (Single Source of Truth) đặc tả toàn bộ yêu cầu chức năng, phi chức năng, hệ thống giao diện (UI/UX), chuẩn kích thước in ấn, kiến trúc cơ sở dữ liệu và API cho phiên bản MVP V1.1 của Phygital Letter Studio. Sản phẩm kết hợp sự ấm áp của tấm thiệp nhỏ gọn cầm tay trong phong bì giấy Kraft đóng dấu sáp với trải nghiệm web tương tác phát nhạc khi quét mã QR.  
1.2. Đối tượng người dùng & Chiến lược ra mắt  
Tệp người dùng mục tiêu: Gen Z, sinh viên và người trẻ tại Việt Nam (18–28 tuổi) trên nền tảng Threads — nhóm thích tự tay cá nhân hóa quà tặng theo gu riêng (từ tối giản lãng mạn đến tấu hài bằng Meme).  
Kịch bản sử dụng: Thiệp tỏ tình/kỷ niệm nhỏ gọn kẹp hoa hoặc hộp quà, thiệp mời cưới gửi bạn bè thân thiết, vé mời đi ăn/hẹn hò, thiệp sinh nhật & Giáng sinh.  
Vòng lặp lan truyền (Organic Viral Loop): Thiết kế ngay không cần đăng nhập; cuối trang xem thư (/l/[slug]) có dòng credit tinh tế dẫn về trang tạo thư miễn phí; hiển thị khung Donate QR ngân hàng/ZaloPay tĩnh ngay khoảnh khắc người dùng xuất bản thành công.  
1.3. Phân tách phạm vi MVP (V1.1) và Mở rộng (V2)  
Hạng mục | Trong phạm vi MVP (V1.1 — Làm ngay) | Ngoài phạm vi MVP (Để sang V2)  
Hệ sinh thái mẫu | 4 mẫu dựng sẵn, mỗi mẫu gồm thiệp ngang và bộ phần web mặc định: Tỏ tình, Mời cưới, Mời ăn/Hẹn hò (Ticket), Sinh nhật/Giáng sinh (Postcard). | Mở rộng: Mời họp lớp, Thiệp Tết, Thư ký tên tập thể (Group Letter).  
Cá nhân hóa (Customize) | Mini-Canva Responsive PC & Mobile; Custom Background (Preset/Màu/Ảnh + Blur/Overlay), Ảnh WebP (khung Polaroid/Tem/Tròn/Đám mây + filter), 20 Icon SVG đổi màu, 25 Sticker Meme WebP, Ghi tay 2 chế độ, đổi màu phong bì/dấu sáp/QR. | AI tự động tách nền ảnh tải lên, hiệu ứng chữ uốn cong/3D, upload font cá nhân.  
Cá nhân hóa người nhận | Nhập tên người gửi/nhận mặc định + hỗ trợ đổi tên từng khách qua tham số URL (?to=Ten-Khach) kèm ô tạo nhanh link theo tên. | Mail Merge tạo hàng loạt hàng trăm thiệp PDF từ file Excel/CSV.  
Xuất bản & In ấn | Mã QR động (/l/[slug]), xuất PDF 3 trang (phong bì C6 có vùng dán, thiệp A6 ngang, thư viết tay A5), nút ẩn nền khi in giấy màu/Kraft. | Mô phỏng gấp phong bì 3D, khổ vuông, bản mini C7.  
Trải nghiệm Web & Nhạc | Bóc dấu sáp phát nhạc, trang cuộn dọc kể chuyện (FR-10), Block tương tác (Đồng ý, RSVP + Maps, Poll). | Hiệu ứng hoa/tuyết rơi, thẻ cào, hồi âm hai chiều, upload MP3 riêng, kéo thả tự do trên trang web.  
Quản lý & Vận hành | Không cần tài khoản (link quản lý bí mật /manage/[editToken]); Free + Donate ảnh QR ngân hàng/Zalo tĩnh; tự hết hạn sau 60 ngày. | Tài khoản người dùng, Dashboard thống kê chi tiết, Gói mở rộng trả phí (lưu vĩnh viễn/bỏ credit).  
2.  HỆ THỐNG THIẾT KẾ (UI/UX) & CHUẨN KÍCH THƯỚC IN ẤN  
2.1. Định hướng thẩm mỹ & Design Tokens  
Thành phần | Giá trị chuẩn | Mục đích áp dụng  
Nền chính (Background) | #F9F6F1 (Trắng ngà Washi) | Nền toàn trang dịu mắt, giảm mỏi mắt khi thiết kế lâu.  
Bề mặt thẻ (Surface) | #FFFFFF / viền 1px #E8E1D9 | Panel công cụ, thẻ mẫu và modal gọn nhẹ, không đổ bóng nặng.  
Màu nhấn chính (Primary) | #8E2424 (Đỏ dấu sáp) | Nút CTA chính (Xuất bản, Tải PDF), con dấu sáp mở thư.  
Màu nhấn phụ (Secondary) | #C8A882 (Nâu giấy Kraft) | Vỏ phong bì mặc định, thẻ tag, trạng thái active/hover.  
Màu chữ (Ink & Muted) | #2B2623 / #7A7067 | Chữ chính đậm mềm như mực tàu; chữ phụ nâu xám.  
Font giao diện (UI) | Be Vietnam Pro | Hiển thị chuẩn dấu tiếng Việt ở kích thước nhỏ trên PC & Mobile.  
Font trang trọng (Serif) | Cormorant Garamond, Playfair Display | Tiêu đề thiệp cưới, thư tỏ tình phong cách cổ điển.  
Font viết tay (Script) | Charm, Dancing Script, Mali | Hỗ trợ đầy đủ dấu tiếng Việt trên Canvas, không nhảy font.  
2.2. Chuẩn Kích thước Bộ in (PRINT_CONFIG)  
Cả bộ cầm vừa lòng bàn tay và tự in được trên giấy A4. Thiệp và thư đã gấp cùng cỡ 148 x 105 mm, hở 14 mm chiều dài và 9 mm chiều cao so với phong bì 162 x 114 mm.  
Hạng mục In ấn | Thông số chuẩn chốt | Quy tắc triển khai kỹ thuật  
Khung Canvas logic (thiệp) | 1754 x 1240 px (ngang) | PC và Mobile chỉ đổi hệ số scale, không đổi tọa độ lưu trữ. Thư cũ giữ 1240 x 1754 (đứng): hướng suy ra từ width/height trong canvas_data.  
Thiệp A6 nằm ngang | 148 x 105 mm (Offset A4: x=31.0, y=96.0 mm) | Căn giữa A4 dọc, kèm dấu cắt 4 góc. Mã QR chỉ nằm trên thiệp.  
Thư viết tay A5 gấp đôi | Tờ 148 x 210 mm, gấp ngang còn 148 x 105 mm (Offset A4: x=31.0, y=43.5; vạch gấp y=148.5 mm) | In một mặt, gấp mặt in vào trong. Dấu cắt 4 góc và vạch gấp ngoài mép. Không có mã QR.  
Thiệp đứng (chỉ thư cũ) | A6 105 x 148 (x=52.5, y=74.5) hoặc A5 148 x 210 (x=31.0, y=43.5) | Giữ để thư tạo trước v1.2 vẫn in được.  
Phôi Phong bì C6 (Trang 1 PDF) | Thành phẩm: 162 x 114 mm. Trải phẳng: 192 x 274 mm | Tai bên 15 mm, đáy 95 mm, nắp 65 mm **đầu bo tròn**; lề A4 9.0 / 11.5 mm. **Vùng dán keo** gạch chéo ghi 'Bôi keo' trên hai tai bên, chỉ vẽ ở phần được nắp đáy che sau khi gấp. Trên nắp in chữ lồng tên + tim và một câu ngắn, **xoay 180°** để đọc xuôi khi gấp xuống. Màu nền tùy chọn (bật/tắt để in giấy màu). Thứ tự gấp: hai tai bên → bôi keo → nắp đáy → nắp trên.  
Lề an toàn (Safe Margin) | 94 px (~8 mm) | Khung nét đứt mờ trên Editor, tự ẩn khi xuất PDF.  
Kích thước Mã QR in | Mặc định 280 px (~24 mm). Tối thiểu 240 px (~20 mm) | Khóa giới hạn thu nhỏ trên Canvas, luôn bọc nền sáng (Quiet Zone >= 12 px).  
Chất lượng xuất PDF | pixelRatio: 2 (thiệp 3508 x 2480 px, ~600 DPI) | Mọi nội dung có chữ (thiệp, thư, chữ trên phong bì) vẽ thành ảnh rồi nhúng vào jsPDF; chỉ nét cắt, gấp, dấu và vùng dán vẽ vector.  
Gợi ý định lượng giấy (UX) | Thiệp: 250–300 gsm. Thư viết tay: 100–120 gsm. Phong bì: 120–180 gsm | Hiện trong Modal tải PDF, kèm nhắc in đúng 100% và thứ tự gấp dán.  
2.3. Thiết kế Thích ứng PC & Điện thoại (Responsive UX)  
Hạng mục UX | PC (Desktop >= 768px) | Điện thoại (Mobile < 768px)  
Thanh công cụ chính | Hai tab lớn **Bản in** (Thiệp, Thư viết tay, Phong bì) và **Trang web**. Trong Thiệp giữ sidebar công cụ hiện có. | Cùng hai tab; trong Thiệp dùng Bottom Bar + Bottom Sheet.  
Chỉnh thuộc tính | Thanh công cụ ngang phía trên Canvas (font, màu, cỡ, opacity, lớp z-index, khóa, xóa). | Floating Toolbar cuộn ngang nhỏ tự hiện phía trên Bottom Bar khi chạm chọn vật thể.  
Thao tác Canvas | Kéo chuột, giữ Shift giữ tỷ lệ, phím tắt Ctrl+Z/Y, Delete, mũi tên. | Kéo 1 ngón di chuyển, 2 ngón zoom/xoay; bật touch-action: none chống trượt trang.  
Modal Xuất bản & Donate | 2 cột: Trái (QR + Link ngắn + link ?to= + nút Tải PDF bộ in); Phải (Ảnh QR Donate + Lưu/Copy). | Xếp dọc 1 cột, ưu tiên Tải PDF & Copy Link.  
3.  YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)  
FR-01 — Hệ sinh thái 4 Mẫu thư Đa mục đích  
Loại mẫu | Thiệp in ngang (Offline) | Phần web bật sẵn, theo thứ tự (Online, xem FR-10)  
Tỏ tình / Kỷ niệm (confession) | Lời mời quét mã ngắn, hình trang trí, QR một bên. | Mở đầu → Ngày đầu tiên → Kỷ niệm → Điều mình thích ở bạn → Đếm số ngày → Lời bày tỏ → Câu hỏi 'Đồng ý' → Lời kết.  
Mời cưới / Đính hôn (wedding) | Tông kem/rượu vang, tên hai người, thời gian, địa điểm, QR. | Mở đầu (ảnh đôi) → Đếm ngược → Chuyện tình (Kỷ niệm) → Lịch lễ & Maps + RSVP → Lời kết. Hỗ trợ ?to=.  
Mời ăn / Hẹn hò (dinner) | Vé mời ngang vui nhộn, sticker Meme, QR như cuống vé. | Mở đầu (vé) → Đếm ngược (nếu có ngày hẹn) → Quán & bản đồ → Bình chọn món/giờ → 'Chốt kèo' → Lời kết.  
Sinh nhật / Giáng sinh (holiday) | Bưu thiếp ngang, lời chúc ngắn, QR. | Mở đầu → Lời chúc → Album kỷ niệm → Lời kết. (Hoa/tuyết rơi: V2.)  
FR-02 — Lõi Trình thiết kế Mini-Canva (Cá nhân hóa tự do)  
Quản lý đối tượng & Lịch sử: Chọn, di chuyển, resize, xoay, nhân bản, khóa vị trí (lock), đổi thứ tự lớp (z-index) và Undo/Redo tối thiểu 20 bước qua Zustand. Hiện khung lề an toàn 94 px mờ trên Canvas.  
Công cụ Chữ (Text): Double-click sửa trực tiếp tiếng Việt, đổi font, cỡ chữ, màu mực, căn lề và độ rộng khung chữ.  
Công cụ Ảnh cá nhân (Image): Thiệp in tối đa 4 ảnh (tính cả ảnh nền). Trang web có hạn mức riêng 8 ảnh (FR-10). Nén phía client sang WebP (<= 200KB, cạnh dài tối đa 1200px) trước khi tải lên R2. 6 kiểu khung (Gốc, Polaroid, Tem răng cưa, Bo góc, Tròn, Đám mây) và 3 bộ lọc (Gốc, Vintage, Đen trắng).  
FR-03 — Tùy chỉnh Nền (Custom Background) & Hàng rào An toàn UX  
3 lớp chọn nền: (1) Preset giấy mỹ thuật (Kraft nâu, Kem Washi, Giấy vở ô ly, Kẻ caro), (2) Màu trơn tự chọn (Color Picker + bảng pastel), (3) Tải ảnh nền cá nhân (nén WebP).  
Hàng rào 1 — Thanh kéo Làm mờ & Phủ dịu: Tự động phủ lớp trắng/kem mờ (overlayOpacity mặc định 0.35, chỉnh 0 -> 0.8) và độ nhòe (blur 0–10px) khi chọn ảnh nền cá nhân để chữ bên trên luôn rõ nét.  
Hàng rào 2 — Vùng an toàn mã QR (Quiet Zone): Mọi mã QR trên Canvas tự động nằm trên thẻ nền sáng bo góc có lề đệm >= 12 px, không bao giờ bị chìm vào ảnh nền tối/rối.  
Hàng rào 3 — Nút gạt in giấy Kraft/giấy màu: Tạm ẩn layer nền ảo khi chụp xuất PDF, chỉ in chữ, ảnh, nét vẽ, dấu cắt và mã QR nhằm tiết kiệm mực và không làm xỉn màu giấy Kraft thật.  
FR-04 — Kho Icon SVG & Bộ Sticker Meme (Sticker Packs)  
Phân tách 4 bộ sưu tập riêng biệt: (1) Tối giản & Cưới (SVG đổi màu trực tiếp), (2) Hoa khô & Dấu sáp (SVG), (3) Doodle vẽ tay (SVG), và (4) Meme & Tấu hài (20–30 ảnh WebP tách nền trong suốt ~15–30KB/ảnh lưu trong public/stickers/memes/).  
Gợi ý theo ngữ cảnh: Mẫu Mời cưới mặc định mở tab Tối giản & Cưới; mẫu Mời ăn/Sinh nhật ưu tiên mở thêm tab Meme & Tấu hài.  
FR-05 — Tính năng Ghi tay 2 Chế độ  
Print-to-Write (Vùng viết bút thật): Chính là tờ Thư viết tay (FR-11). Trên thiệp vẫn thả được khối dòng kẻ (ruled) hoặc chấm bi (dot_grid).  
Digital Ink (Bút vẽ tay trực tiếp): Hỗ trợ chuột, cảm ứng và bút stylus (chọn màu mực, độ dày 2–8px, xóa nét). Lưu dạng mảng tọa độ vector (points) giúp xuất PDF sắc nét không vỡ.  
FR-06 — Nhạc nền & Khối Tương tác Web (Interactive Blocks)  
Kho nhạc & Chọn điệp khúc: 6–8 bài MP3 nén nhẹ (128kbps) lưu trên Cloudflare R2 theo 4 gu cảm xúc; cho nghe thử, kéo chọn giây bắt đầu (startTime) và âm lượng mặc định 0.4.  
Vượt chặn Autoplay trên iOS/Android: Gọi HTMLAudioElement.play() trực tiếp trong sự kiện click/tap khi người nhận chạm vào con dấu sáp mở phong bì. Kèm nút đĩa nhạc xoay góc trên phải để tắt/bật.  
3 Block lắp ghép: (1) AcceptButton (câu hỏi + nút Đồng ý tung hoa + nút Từ chối tùy chọn né chuột), (2) RSVP & LocationMap (thời gian, địa điểm, Google Maps, form xác nhận số người & lời chúc), (3) Poll (bình chọn món ăn/giờ hẹn tối đa 4 lựa chọn).  
FR-07 — Xuất bản, Mã QR Động & Xuất PDF Bộ in (3 trang)  
Mã QR Động: Sinh slug 6 ký tự duy nhất (/l/[slug]) lưu JSON vào Supabase; cho phép quay lại sửa nội dung web mà không cần in lại mã QR trên tờ thiệp giấy.  
Xuất PDF 3 trang A4: Trang 1 phong bì C6 (nét liền cắt, nét đứt gấp, vùng dán gạch chéo, nắp bo tròn, chữ trang trí xoay 180°). Trang 2 thiệp A6 ngang: ảnh chụp Stage (pixelRatio 2, đã ẩn Transformer và khung lề) kèm 4 dấu cắt. Trang 3 thư viết tay A5: ảnh vẽ từ cấu hình thư, kèm dấu cắt và vạch gấp. Nút ẩn nền áp dụng cho cả ba trang. Thư đứng cũ in theo khổ đã chọn (A6/A5), chưa có trang thư viết tay trừ khi người tạo bật.  
FR-08 — Trang Người nhận (/l/[slug]) & Cá nhân hóa theo URL (?to=...)  
Ghi đè tên khách mời linh hoạt: Nếu URL có tham số ?to=Minh-Anh (decode URI, chuyển dấu gạch ngang thành khoảng trắng, giới hạn tối đa 50 ký tự và lọc XSS), hệ thống tự động hiển thị tên này trên vỏ phong bì và lời chào thay cho recipientName mặc định.  
Hiệu ứng mở thư & Gửi phản hồi: Chạm dấu sáp → mở nắp → bật nhạc từ startTime → hiện **trang web cuộn** (FR-10) → phản hồi lưu vào bảng responses. view_count chỉ tăng khi bóc dấu sáp.  
FR-09 — Modal Xuất bản, Trang Quản lý (/manage/[editToken]) & Ảnh QR Donate Tĩnh  
Tạo nhanh link cá nhân hóa theo khách: Trong Modal Xuất bản và Trang Quản lý, cung cấp 1 ô nhập nhanh 'Tên người nhận riêng' -> tự sinh và copy link dạng https://domain.com/l/[slug]?to=... để chủ thiệp gửi riêng cho từng người bạn.  
Quản lý không cần đăng nhập: Cấp edit_token bí mật 24 ký tự để xem lượt mở (view_count), bảng phản hồi/lời chúc và nút quay lại Editor chỉnh sửa thư.  
Khung Donate Ảnh QR Tĩnh (Ngân hàng / ZaloPay): Sử dụng trực tiếp ảnh tĩnh tối ưu sẵn (public/donate-qr-bank.webp và/hoặc public/donate-qr-zalo.webp, chia 2 tab nhỏ nếu dùng cả hai). Bắt buộc đặt kèm 2 nút hỗ trợ người dùng điện thoại: (1) Nút 'Lưu ảnh QR' (download 1 chạm) và (2) Nút 'Copy số tài khoản' (hiển thị tên ngân hàng, STK, tên chủ TK; cắt gọn ảnh QR không để lộ SĐT cá nhân).  
FR-10 — Trang web bày tỏ dạng cuộn dọc (v1.2)  
Sau khi bóc dấu sáp, người nhận lướt dọc qua các phần; mỗi phần hiện dần khi cuộn tới, nhạc phát xuyên suốt. Bố cục dựng sẵn, **không kéo thả**. Mỗi phần bật/tắt và đổi thứ tự được; phần bật nhưng để trống thì tự ẩn trên trang người nhận.  
Phần | type | Nội dung & giới hạn  
Mở đầu | hero | Ảnh bìa (tùy chọn), 'Gửi [tên]' (theo ?to=), câu dẫn <= 200 ký tự, mũi tên mời lướt.  
Ngày đầu tiên | first_day | 1 ảnh (tùy chọn), ngày, đoạn <= 500 ký tự.  
Kỷ niệm | memories | Tối đa 8 mục: ảnh, ngày (tùy chọn), chú thích <= 200 ký tự.  
Điều mình thích ở bạn | reasons | Tối đa 8 câu, mỗi câu <= 200 ký tự, hiện lần lượt khi cuộn.  
Con số | counter | Một ngày mốc + nhãn; chế độ đếm số ngày đã qua hoặc đếm ngược. Tính theo ngày trên máy người xem.  
Lời bày tỏ / Lời chúc | message | Tiêu đề + đoạn dài <= 5000 ký tự, xuống đoạn bằng dòng trống.  
Câu hỏi & Tương tác | interact | Hiển thị các Block đang bật ở FR-06 (Đồng ý, RSVP + Maps, Poll).  
Lời kết | ending | Câu kết, chữ ký, nút 'Xem lại tấm thiệp' (thiệp chỉ hiện khi bấm), dòng credit.  
Ảnh web: tối đa 8 ảnh cho toàn trang (hero + first_day + memories), tách khỏi 4 ảnh của thiệp. URL phải là ảnh đã tải qua /api/upload và được gắn với thư đó (nếu không, cron sẽ xóa).  
Yêu cầu: dùng được tốt trên màn hình 360px; ảnh tải lười; tôn trọng prefers-reduced-motion (hiện ngay, không trượt); nội dung văn bản là chữ thật (không nằm trong canvas) để đọc được bằng trình đọc màn hình. Chữ người dùng nhập luôn hiển thị dạng văn bản thuần.  
Editor tab 'Trang web': danh sách phần (bật/tắt, đổi thứ tự bằng nút lên/xuống), ô nhập cho từng phần, khung xem trước cỡ điện thoại.  
FR-11 — Thư viết tay in (v1.2)  
Tờ A5 148 x 210 mm gấp ngang, hai nửa 148 x 105 mm. Có dòng 'Gửi ...' (sửa được, mặc định theo tên người nhận), chỗ ký tên (sửa được), phần giữa **để trống cho viết bút**. Tùy chọn: kiểu giấy (dòng kẻ / chấm bi / trơn), hoa văn góc (dùng bộ icon SVG, hoặc không), phông chữ, màu mực. Dòng kẻ không chạy đè lên vạch gấp. Không có mã QR.  
FR-12 — Trang trí phong bì (v1.2)  
Người tạo nhập chữ lồng (tối đa 12 ký tự, ví dụ 'u ♡') và một câu ngắn (tối đa 80 ký tự), chọn phông và màu nền phong bì; tắt được nền để in giấy màu. Có khung xem trước phong bì.  
4.  YÊU CẦU PHI CHỨC NĂNG & QUẢN TRỊ RỦI RO  
Hạng mục | Tiêu chuẩn & Ràng buộc Kỹ thuật  
Hiệu năng & Tương thích | Trang /l/[slug] hiện phong bì dưới 2 giây trên 4G; ảnh phần web tải lười; mở phong bì và cuộn mượt 60fps; iOS Safari 16+, Chrome Android, Chrome/Edge/Safari Desktop.  
Chi phí hạ tầng (~0đ) | Ảnh WebP <= 200KB; mỗi thư tối đa 4 ảnh thiệp + 8 ảnh web (tối đa ~2,4MB/thư); R2 cho ảnh & nhạc; xuất PDF ở trình duyệt.  
Tự động dọn rác (60 ngày) | Thư miễn phí tự hết hạn sau 60 ngày (expires_at). Cron job định kỳ xóa bản ghi quá hạn trên Supabase và xóa file ảnh tương ứng trên R2.  
Bảo mật & Chống Spam | Turnstile cho API upload và tạo thư; 5 thư/IP/ngày & **20 ảnh/IP/giờ** (IP hash SHA-256); kiểm tra MIME & <= 500KB phía server; sanitize ?to=; ẩn edit_token ở API public; mọi URL ảnh (thiệp và web) phải thuộc bảng uploads của đúng thư.  
Bản quyền & Pháp lý | Bộ Meme dựng sẵn chỉ dùng doodle/chibi mở hoặc nguồn miễn phí thương mại; đặt ghi chú người dùng tự chịu trách nhiệm với ảnh cá nhân tải lên.  
5.  KIẾN TRÚC HỆ THỐNG, DỮ LIỆU & ĐẶC TẢ API  
5.1. Hằng số In ấn Chuẩn (lib/print-config.ts)  
export const PRINT_CONFIG = {  CANVAS: { width: 1754, height: 1240, safeMarginPx: 94, minQrPx: 240, defaultQrPx: 280 },  LEGACY_PORTRAIT_CANVAS: { width: 1240, height: 1754 },  PAPER_A4_MM: { width: 210, height: 297 },  CARD_MM: { width: 148, height: 105, offsetX: 31.0, offsetY: 96.0 },  LETTER_SHEET_MM: { width: 148, height: 210, offsetX: 31.0, offsetY: 43.5, foldY: 105 },  LEGACY_CARD_SIZES_MM: { A6: { width: 105, height: 148, offsetX: 52.5, offsetY: 74.5 }, A5: { width: 148, height: 210, offsetX: 31.0, offsetY: 43.5 } },  ENVELOPE_C6_FLAT_MM: { bodyWidth: 162, bodyHeight: 114, sideFlap: 15, bottomFlap: 95, topFlap: 65, marginX: 9.0, marginY: 11.5 },  EXPORT_PIXEL_RATIO: 2,} as const;  
5.2. Thiết kế Cơ sở dữ liệu (Supabase / PostgreSQL)  
CREATE TABLE letters (  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  slug VARCHAR(12) UNIQUE NOT NULL,  edit_token VARCHAR(32) UNIQUE NOT NULL,  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('confession','wedding','dinner','holiday')),  title VARCHAR(120),  canvas_data JSONB NOT NULL,  web_config JSONB NOT NULL,  view_count INT DEFAULT 0,  creator_ip_hash VARCHAR(64),  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 days'),  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE INDEX idx_letters_slug ON letters(slug);CREATE INDEX idx_letters_expires_at ON letters(expires_at);CREATE TABLE responses (  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,  responder_name VARCHAR(100),  action_type VARCHAR(20) NOT NULL, -- 'accept' | 'rsvp' | 'poll'  status VARCHAR(30),               -- 'yes' | 'no' | 'attending' | 'not_attending'  guest_count INT DEFAULT 1,  poll_option VARCHAR(120),  message TEXT,  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE INDEX idx_responses_letter_id ON responses(letter_id);  
5.3. Chuẩn Dữ liệu JSON (types/letter.ts)  
export interface BackgroundConfig {  type: 'preset' | 'color' | 'image';  value: string;          // 'kraft' | 'cream' | 'grid' | 'plaid' | '#FDE2E4' | 'https://r2.../bg.webp'  overlayColor?: string;  // Mặc định '#FFFFFF'  overlayOpacity: number; // 0 -> 0.8 (mặc định 0.35 khi dùng ảnh nền)  blur?: number;          // 0 -> 10 (px)}export interface CanvasElement {  id: string;  type: 'text' | 'image' | 'svg_icon' | 'sticker_img' | 'handwriting' | 'lined_area' | 'qr_code';  x: number; y: number; width?: number; height?: number;  rotation: number; zIndex: number; locked?: boolean;  text?: string; fontFamily?: string; fontSize?: number; fill?: string; align?: 'left'|'center'|'right';  src?: string; frame?: 'none'|'polaroid'|'stamp'|'rounded'|'circle'|'cloud'; filter?: 'none'|'vintage'|'bw';  iconId?: string;  points?: number[]; strokeWidth?: number; lineStyle?: 'ruled'|'dot_grid';}export interface LetterPayload {  template_type: 'confession' | 'wedding' | 'dinner' | 'holiday';  title: string;  canvas_data: {    width: 1240; height: 1754;    defaultPrintSize: 'A6' | 'A5';    background: BackgroundConfig;    elements: CanvasElement[];  };  web_config: {    recipientName: string; senderName: string;    envelopeColor: string; waxSealColor: string;    audio: { enabled: boolean; trackId: string; startTime: number; volume: number };    blocks: {      acceptButton?: { enabled: boolean; question: string; yesText: string; noText: string; dodgeNo: boolean };      rsvp?: { enabled: boolean; eventDate: string; locationName: string; mapsUrl: string };      poll?: { enabled: boolean; question: string; options: string[] };    };  };}  
Bổ sung v1.2 (không cần migration, vẫn là hai cột JSONB). Tên trường chốt ở T-26:  
canvas_data: width/height là cặp 1754x1240 (mới) hoặc 1240x1754 (cũ); thêm letterSheet?: { enabled; paper: 'ruled'|'dot_grid'|'plain'; greeting; signature; fontFamily; inkColor; decorIconId? } và envelope?: { monogram; line; fontFamily; paperColor; printBackground }.  
web_config: thêm sections?: Array<{ id; type: 'hero'|'first_day'|'memories'|'reasons'|'counter'|'message'|'interact'|'ending'; enabled; ...trường riêng theo type }>. Thư không có sections hiển thị: thiệp + các Block (giao diện v1.1).  
5.4. Đặc tả API Routes (Next.js App Router)  
Method | Endpoint | Bảo vệ / Guard | Mô tả xử lý  
POST | /api/upload | Turnstile + 20 ảnh/IP/giờ | Nhận ảnh WebP (<=500KB), kiểm tra MIME, đẩy lên Cloudflare R2 -> trả về { url }.  
POST | /api/letters | Turnstile + 5 thư/IP/ngày | Validate LetterPayload bằng Zod -> sinh slug(6) & edit_token(24) -> lưu Supabase -> trả về { slug, edit_token }.  
GET | /api/letters/[slug] | Public (ẩn edit_token & IP) | Kiểm tra expires_at -> trả dữ liệu thư. Không tăng view_count.  
POST | /api/letters/[slug]/view | Public + Rate Limit | Tăng view_count khi người nhận bóc dấu sáp.  
PATCH | /api/letters/[slug] | Header x-edit-token khớp DB | Cập nhật nội dung thư (giữ nguyên slug & mã QR giấy cũ).  
POST | /api/letters/[slug]/responses | Public + Rate Limit nhẹ | Lưu phản hồi từ người nhận (Đồng ý / Form RSVP / Bình chọn Poll) vào bảng responses.  
GET | /api/manage/[editToken] | Bí mật theo editToken | Trả về thông tin thư, view_count và danh sách toàn bộ phản hồi cho người gửi.  
6.  CHIẾN LƯỢC TRIỂN KHAI 7 NGÀY & PHÂN BỔ MÔ HÌNH AI  
6.1. Chiến lược chọn Model Claude trong IDE & Phối hợp Gemini  
Mô hình AI | Vai trò | Phạm vi nhiệm vụ khuyến nghị  
Gemini | Designer & Copywriter | Nội dung và tọa độ 4 thiệp ngang, nội dung mặc định phần web, SVG/sticker, kịch bản clip Threads. Prompt ở docs/GEMINI_PROMPTS.md.  
Claude Sonnet | Dev chủ lực (UI, panel, trang) | Thư viết tay, panel phong bì, trang web cuộn, tab soạn trang web, ghép nội dung Gemini.  
Claude Opus | Phần khó và phần có rủi ro mất dữ liệu | Hợp đồng dữ liệu & tương thích thư cũ, canvas ngang, PDF 3 trang, gắn/xóa ảnh web, review bảo mật. Phân công từng task ở docs/BACKLOG.md.  
Claude Haiku | Tinh chỉnh nhanh & Copy | Sửa màu Tailwind, chỉnh câu chữ tiếng Việt, kiểm tra thông báo lỗi, format dữ liệu tĩnh.  
6.2. Lộ trình Sprint 7 Ngày (v1.1, lưu làm lịch sử; số đo trong bảng đã cũ)  
Thời gian | Trọng tâm | Đầu ra bắt buộc (Deliverables)  
Ngày 1 | Nền móng & 6 Backend APIs | Next.js + Design Tokens, PRINT_CONFIG, SQL Supabase, Cloudflare R2, 6 API Routes + Turnstile.  
Ngày 2 | Lõi Editor Canvas (PC) | Zustand Undo/Redo, Konva Stage 1240x1754 + Safe Margin, Chữ, Ảnh WebP (6 khung + 3 filter), Custom BG (Blur/Overlay).  
Ngày 3 | Sticker, Ghi tay, QR & Mobile | 20 Icon SVG + 25 Meme WebP, Ghi tay 2 chế độ, QR có Quiet Zone (>=240px), giao diện Bottom Sheet Mobile.  
Ngày 4 | 4 Mẫu sẵn, Nhạc & PDF A6/C6 | Landing Gallery + 4 mẫu JSON (A6 tỏ tình), kho nhạc + startTime, xuất PDF 2 trang (Phôi C6 + Thiệp A6/A5) & ẩn nền Kraft.  
Ngày 5 | Trang Người nhận & Quản lý | Màn hình /l/[slug] hỗ trợ ?to=..., bóc dấu sáp phát nhạc + 3 Block; Modal Xuất bản + Ảnh QR Donate tĩnh + trang /manage/[editToken].  
Ngày 6 | Kiểm thử Thực tế & In giấy A6 | Test nhạc iOS Safari/Android Chrome; in thử PDF ra giấy thật cắt gấp phong bì C6 + thiệp A6 & quét QR; bật cron 60 ngày.  
Ngày 7 | Deploy & Ra mắt Threads | Deploy Vercel, kiểm tra rate limit & ảnh Donate QR; quay clip 15–20s mở phong bì giấy Kraft + thiệp A6 + quét QR đăng Threads.  
Bổ sung v1.2: làm theo hai đợt, Đợt A (bộ in, kết thúc bằng in thử cắt dán) rồi Đợt B (trang web cuộn), sau đó mới deploy và ra mắt. Chi tiết ở docs/BACKLOG.md.  
4 QUY TẮC VÀNG CHỐNG VỠ TIẾN ĐỘ KHI CODE CÙNG CLAUDE IDE1. Xuất PDF qua ảnh chụp Stage (pixelRatio: 2, đã ẩn Transformer & Safe Margin) dán vào jsPDF — tuyệt đối không dùng pdf.text() cho nội dung thiệp.2. Khóa cứng tọa độ logic 1754 x 1240 px (thư cũ 1240 x 1754) và dùng duy nhất hằng số PRINT_CONFIG (thiệp ngang 148x105mm, thư A5 148x210mm, C6 trải phẳng 192x274mm).3. Dùng ảnh QR Ngân hàng/ZaloPay tĩnh (public/donate-qr-*.webp) kèm nút Lưu ảnh & Copy STK — không code API thanh toán.4. Git commit ngay sau mỗi task (T-01 -> T-25) và mở khung chat mới mỗi khi chuyển Epic để giữ context Claude sạch nhất.  