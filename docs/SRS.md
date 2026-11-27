> Bản trích tự động từ SRS_Phygital_Letter_Studio_V1.docx (nội dung v1.1). Khi lệch, file .docx là chuẩn; các quyết định bổ sung nằm ở CLAUDE.md.

SOFTWARE REQUIREMENTS SPECIFICATION (SRS) — VERSION 1.1 (UPDATED)  
NỀN TẢNG TẠO THƯ ĐIỆN TỬ LAI THƯ TAY(PHYGITAL LETTER STUDIO)  
Trình thiết kế thiệp & thư cá nhân hóa dạng Mini-Canva chuẩn khổ nhỏ gọn A6/C6, hỗ trợ tự tùy chỉnh nền, ảnh, sticker Meme, ghi tay 2 chế độ, mã QR động, nhạc nền và trải nghiệm web tương tác.  
  
Thông tin tài liệu | Chi tiết  
Tên sản phẩm | Phygital Letter Studio  
Phiên bản tài liệu | v1.1 — Cập nhật chuẩn in A6/C6, Cá nhân hóa khách (?to=...), Ảnh QR Donate tĩnh & Phân bổ Model Claude  
Ngày cập nhật | 27/11/2026  
Mô hình vận hành | 100% Miễn phí (Free) + Ủng hộ tự nguyện bằng Ảnh QR Ngân hàng / ZaloPay tĩnh  
Kênh ra mắt mục tiêu | Threads (Viral nội dung mở phong bì giấy Kraft + thiệp A6 + quét QR phát nhạc)  
Kế hoạch thực thi | Sprint 7 ngày (Kiến trúc Gemini + Code Claude Sonnet / Opus / Haiku trong IDE)  
Công nghệ cốt lõi | Next.js (App Router), TypeScript, Tailwind CSS, React-Konva, Supabase, Cloudflare R2  
NHỮNG CẬP NHẬT CHÍNH Ở PHIÊN BẢN V1.11. Chốt thông số in ấn nhỏ gọn (PRINT_CONFIG): Thiệp mặc định khổ A6 (105 x 148 mm) căn giữa A4, tùy chọn mở rộng A5 gấp đôi (148 x 210 mm), đi kèm phôi phong bì C6 (162 x 114 mm, trải phẳng 192 x 274 mm lọt chuẩn A4).2. Cá nhân hóa linh hoạt từng người nhận (?to=...): Hỗ trợ ghi đè tên người nhận theo URL (VD: /l/abc123?to=Minh-Anh) kèm công cụ tạo nhanh link cá nhân hóa trong Modal Xuất bản & Trang Quản lý.3. Tối giản cơ chế Donate: Thay VietQR động bằng Ảnh QR Ngân hàng / ZaloPay tĩnh (public/donate-qr-bank.webp & donate-qr-zalo.webp) kèm nút 1 chạm Lưu ảnh QR & Copy số tài khoản.4. Phân bổ rõ Model AI (Claude Sonnet / Opus / Haiku) theo độ khó từng nhóm task.  
1.  TỔNG QUAN DỰ ÁN & PHẠM VI SẢN PHẨM  
1.1. Mục đích & Giá trị Cốt lõi  
Tài liệu này là nguồn chuẩn duy nhất (Single Source of Truth) đặc tả toàn bộ yêu cầu chức năng, phi chức năng, hệ thống giao diện (UI/UX), chuẩn kích thước in ấn, kiến trúc cơ sở dữ liệu và API cho phiên bản MVP V1.1 của Phygital Letter Studio. Sản phẩm kết hợp sự ấm áp của tấm thiệp nhỏ gọn cầm tay trong phong bì giấy Kraft đóng dấu sáp với trải nghiệm web tương tác phát nhạc khi quét mã QR.  
1.2. Đối tượng người dùng & Chiến lược ra mắt  
Tệp người dùng mục tiêu: Gen Z, sinh viên và người trẻ tại Việt Nam (18–28 tuổi) trên nền tảng Threads — nhóm thích tự tay cá nhân hóa quà tặng theo gu riêng (từ tối giản lãng mạn đến tấu hài bằng Meme).  
Kịch bản sử dụng: Thiệp tỏ tình/kỷ niệm nhỏ gọn kẹp hoa hoặc hộp quà, thiệp mời cưới gửi bạn bè thân thiết, vé mời đi ăn/hẹn hò, thiệp sinh nhật & Giáng sinh.  
Vòng lặp lan truyền (Organic Viral Loop): Thiết kế ngay không cần đăng nhập; cuối trang xem thư (/l/[slug]) có dòng credit tinh tế dẫn về trang tạo thư miễn phí; hiển thị khung Donate QR ngân hàng/ZaloPay tĩnh ngay khoảnh khắc người dùng xuất bản thành công.  
1.3. Phân tách phạm vi MVP (V1.1) và Mở rộng (V2)  
Hạng mục | Trong phạm vi MVP (V1.1 — Làm ngay) | Ngoài phạm vi MVP (Để sang V2)  
Hệ sinh thái mẫu | 4 mẫu dựng sẵn: Tỏ tình (A6), Mời cưới, Mời ăn/Hẹn hò (Ticket), Sinh nhật/Giáng sinh (Postcard). | Mở rộng: Mời họp lớp, Thiệp Tết, Thư ký tên tập thể (Group Letter).  
Cá nhân hóa (Customize) | Mini-Canva Responsive PC & Mobile; Custom Background (Preset/Màu/Ảnh + Blur/Overlay), Ảnh WebP (khung Polaroid/Tem/Tròn/Đám mây + filter), 20 Icon SVG đổi màu, 25 Sticker Meme WebP, Ghi tay 2 chế độ, đổi màu phong bì/dấu sáp/QR. | AI tự động tách nền ảnh tải lên, hiệu ứng chữ uốn cong/3D, upload font cá nhân.  
Cá nhân hóa người nhận | Nhập tên người gửi/nhận mặc định + hỗ trợ đổi tên từng khách qua tham số URL (?to=Ten-Khach) kèm ô tạo nhanh link theo tên. | Mail Merge tạo hàng loạt hàng trăm thiệp PDF từ file Excel/CSV.  
Xuất bản & In ấn | Mã QR động (/l/[slug]), xuất PDF 2 trang sắc nét (Trang 1 phôi phong bì C6 cắt gấp trên A4; Trang 2 thiệp A6 mặc định hoặc A5 tùy chọn), nút ẩn nền khi in giấy Kraft. | Mô phỏng gấp phong bì 3D tương tác, xuất khổ thiệp vuông 10x10cm hoặc A7 gấp đôi.  
Trải nghiệm Web & Nhạc | Chạm bóc dấu sáp kích hoạt nhạc nền (6–8 bài có sẵn + chọn giây bắt đầu điệp khúc), Block tương tác (Đồng ý, RSVP + Maps, Poll). | Thẻ cào bí mật (Scratch-off Card), Hồi âm hai chiều (Reply Letter), Upload MP3 riêng.  
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
2.2. Chuẩn Kích thước Thiệp Nhỏ gọn A6 & Phôi Phong bì C6 (PRINT_CONFIG)  
Để tấm thiệp cầm vừa lòng bàn tay, đủ chỗ viết tay 6–10 dòng tình cảm (kẹp vừa hoa/hộp quà) mà người dùng vẫn tự in dễ dàng trên giấy A4 phổ thông, hệ thống khóa cứng hệ tọa độ logic Canvas 1240 x 1754 px (tỷ lệ ISO 1 : 1,414) và áp dụng thông số in chuẩn sau:  
Hạng mục In ấn | Thông số chuẩn chốt | Quy tắc triển khai kỹ thuật  
Khung Canvas logic | 1240 x 1754 px | Cố định tỷ lệ chuẩn ISO; PC và Mobile chỉ thay đổi hệ số scale hiển thị, không đổi tọa độ lưu trữ.  
Khổ thiệp mặc định (A6) | 105 x 148 mm(Offset A4: x=52.5, y=74.5 mm) | Cỡ bưu thiếp nhỏ gọn cầm đầm tay; căn giữa tờ giấy in A4 (210 x 297 mm) kèm dấu cắt 4 góc (crop marks).  
Khổ tùy chọn (A5 gấp đôi) | 148 x 210 mm(Offset A4: x=31.0, y=43.5 mm) | Dành cho người viết tâm thư dài; gấp đôi lại thành 105 x 148 mm vẫn bỏ lọt phong bì C6.  
Phôi Phong bì C6 (Trang 1 PDF) | Thành phẩm: 162 x 114 mmTrải phẳng: 192 x 274 mm | 2 tai dán bên 15 mm, đáy 95 mm, nắp tam giác 65 mm -> lọt gọn tờ A4 với lề an toàn 9.0 mm (ngang) & 11.5 mm (dọc). Khoảng hở rút thiệp: 14 mm ngang, 9 mm dọc.  
Lề an toàn (Safe Margin) | 94 px (~8 mm trên A6) | Hiển thị khung nét đứt mờ trên Editor (tự ẩn khi xuất PDF) tránh đặt chữ/QR sát mép cắt.  
Kích thước Mã QR in | Mặc định 280 px (~24 mm)Tối thiểu 240 px (~20 mm) | Khóa giới hạn thu nhỏ trên Canvas, luôn bọc khung nền sáng (Quiet Zone >= 12 px) để quét nhạy 100%.  
Chất lượng xuất PDF | pixelRatio: 2 (2480 x 3508 px) | Đạt ~600 DPI ở khổ A6 và ~426 DPI ở khổ A5; nhúng ảnh vào jsPDF tránh 100% lỗi font tiếng Việt.  
Gợi ý định lượng giấy (UX) | Thiệp A6: 250–300 gsmPhong bì Kraft: 120–180 gsm | Hiển thị dòng mẹo nhỏ trong Modal tải PDF để người dùng chọn đúng giấy khi mang ra tiệm in.  
2.3. Thiết kế Thích ứng PC & Điện thoại (Responsive UX)  
Hạng mục UX | PC (Desktop >= 768px) | Điện thoại (Mobile < 768px)  
Thanh công cụ chính | Sidebar cố định bên trái (280px): Mẫu, Nền, Ảnh, Icon & Meme, Chữ, Vẽ tay, Nhạc & Web. | Bottom Bar dưới đáy (6 icon); chạm mở Bottom Sheet trượt lên 40% chiều cao màn hình.  
Chỉnh thuộc tính | Thanh công cụ ngang phía trên Canvas (font, màu, cỡ, opacity, lớp z-index, khóa, xóa). | Floating Toolbar cuộn ngang nhỏ tự hiện phía trên Bottom Bar khi chạm chọn vật thể.  
Thao tác Canvas | Kéo chuột, giữ Shift giữ tỷ lệ, phím tắt Ctrl+Z/Y, Delete, mũi tên. | Kéo 1 ngón di chuyển, 2 ngón zoom/xoay; bật touch-action: none chống trượt trang.  
Modal Xuất bản & Donate | 2 cột: Trái (QR + Link ngắn + Ô tạo link ?to= + PDF A6/A5); Phải (Ảnh QR Donate Ngân hàng/ZaloPay + nút Lưu/Copy). | Xếp dọc 1 cột ưu tiên nút Tải PDF & Copy Link trên cùng, khung Donate gọn bên dưới có nút Lưu ảnh QR 1 chạm.  
3.  YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)  
FR-01 — Hệ sinh thái 4 Mẫu thư Đa mục đích  
Loại mẫu | Bố cục Bản in giấy (Offline) | Trải nghiệm Bản Web khi quét QR (Online)  
Tỏ tình / Kỷ niệm(confession) | Thiệp A6 nhỏ gọn: 35% trên ảnh Polaroid/tiêu đề, 45% giữa 6–8 dòng kẻ viết tay, 20% dưới QR + lời nhắn. | Bóc dấu sáp -> phát nhạc lãng mạn -> câu hỏi mở khóa -> nút 'Đồng ý' (tung hoa) / 'Để suy nghĩ' (tùy chọn né chuột).  
Mời cưới / Đính hôn(wedding) | Thiệp A6/A5 trang trọng tông kem/rượu vang, phôi phong bì C6 kèm ô ghi tên khách. | Hỗ trợ link riêng ?to=Ten-Khach -> Đếm ngược, Google Maps, Form RSVP (xác nhận đi mấy người + lời chúc).  
Mời ăn / Hẹn hò(dinner) | Thiết kế dạng vé (Ticket) hoặc thực đơn mini vui nhộn, hợp dán bộ Sticker Meme. | Địa điểm quán ăn, Poll bình chọn món ăn/khung giờ rảnh và nút 'Chốt kèo'.  
Sinh nhật / Giáng sinh(holiday) | Dạng bưu thiếp (Postcard) ảnh kỷ niệm + vùng viết tay + mã QR kẹp hộp quà. | Nhạc nền lễ hội, hiệu ứng hoa/tuyết rơi nhẹ và hiển thị trọn bộ ảnh kỷ niệm.  
FR-02 — Lõi Trình thiết kế Mini-Canva (Cá nhân hóa tự do)  
Quản lý đối tượng & Lịch sử: Chọn, di chuyển, resize, xoay, nhân bản, khóa vị trí (lock), đổi thứ tự lớp (z-index) và Undo/Redo tối thiểu 20 bước qua Zustand. Hiện khung lề an toàn 94 px mờ trên Canvas.  
Công cụ Chữ (Text): Double-click sửa trực tiếp tiếng Việt, đổi font, cỡ chữ, màu mực, căn lề và độ rộng khung chữ.  
Công cụ Ảnh cá nhân (Image): Tải tối đa 4 ảnh/lá thư (tính chung cả ảnh nền cá nhân). Tự động nén phía client sang WebP (<= 200KB, cạnh dài tối đa 1200px) bằng browser-image-compression trước khi đẩy lên Cloudflare R2. Hỗ trợ 6 kiểu khung (Gốc, Polaroid, Tem thư răng cưa, Bo góc, Tròn, Đám mây — giúp tự chế sticker mặt bạn bè/thú cưng) và 3 bộ lọc màu (Gốc, Vintage, Đen trắng).  
FR-03 — Tùy chỉnh Nền (Custom Background) & Hàng rào An toàn UX  
3 lớp chọn nền: (1) Preset giấy mỹ thuật (Kraft nâu, Kem Washi, Giấy vở ô ly, Kẻ caro), (2) Màu trơn tự chọn (Color Picker + bảng pastel), (3) Tải ảnh nền cá nhân (nén WebP).  
Hàng rào 1 — Thanh kéo Làm mờ & Phủ dịu: Tự động phủ lớp trắng/kem mờ (overlayOpacity mặc định 0.35, chỉnh 0 -> 0.8) và độ nhòe (blur 0–10px) khi chọn ảnh nền cá nhân để chữ bên trên luôn rõ nét.  
Hàng rào 2 — Vùng an toàn mã QR (Quiet Zone): Mọi mã QR trên Canvas tự động nằm trên thẻ nền sáng bo góc có lề đệm >= 12 px, không bao giờ bị chìm vào ảnh nền tối/rối.  
Hàng rào 3 — Nút gạt in giấy Kraft/giấy màu: Tạm ẩn layer nền ảo khi chụp xuất PDF, chỉ in chữ, ảnh, nét vẽ, dấu cắt và mã QR nhằm tiết kiệm mực và không làm xỉn màu giấy Kraft thật.  
FR-04 — Kho Icon SVG & Bộ Sticker Meme (Sticker Packs)  
Phân tách 4 bộ sưu tập riêng biệt: (1) Tối giản & Cưới (SVG đổi màu trực tiếp), (2) Hoa khô & Dấu sáp (SVG), (3) Doodle vẽ tay (SVG), và (4) Meme & Tấu hài (20–30 ảnh WebP tách nền trong suốt ~15–30KB/ảnh lưu trong public/stickers/memes/).  
Gợi ý theo ngữ cảnh: Mẫu Mời cưới mặc định mở tab Tối giản & Cưới; mẫu Mời ăn/Sinh nhật ưu tiên mở thêm tab Meme & Tấu hài.  
FR-05 — Tính năng Ghi tay 2 Chế độ  
Print-to-Write (Vùng viết bút thật): Thả khối dòng kẻ ngang mờ (ruled) hoặc lưới chấm bi (dot_grid) lên thiệp A6 để in ra cầm bút mực viết tay và ký tên thật.  
Digital Ink (Bút vẽ tay trực tiếp): Hỗ trợ chuột, cảm ứng và bút stylus (chọn màu mực, độ dày 2–8px, xóa nét). Lưu dạng mảng tọa độ vector (points) giúp xuất PDF sắc nét không vỡ.  
FR-06 — Nhạc nền & Khối Tương tác Web (Interactive Blocks)  
Kho nhạc & Chọn điệp khúc: 6–8 bài MP3 nén nhẹ (128kbps) lưu trên Cloudflare R2 theo 4 gu cảm xúc; cho nghe thử, kéo chọn giây bắt đầu (startTime) và âm lượng mặc định 0.4.  
Vượt chặn Autoplay trên iOS/Android: Gọi HTMLAudioElement.play() trực tiếp trong sự kiện click/tap khi người nhận chạm vào con dấu sáp mở phong bì. Kèm nút đĩa nhạc xoay góc trên phải để tắt/bật.  
3 Block lắp ghép: (1) AcceptButton (câu hỏi + nút Đồng ý tung hoa + nút Từ chối tùy chọn né chuột), (2) RSVP & LocationMap (thời gian, địa điểm, Google Maps, form xác nhận số người & lời chúc), (3) Poll (bình chọn món ăn/giờ hẹn tối đa 4 lựa chọn).  
FR-07 — Xuất bản, Mã QR Động & Xuất PDF 2 Trang (A6/A5 + C6)  
Mã QR Động: Sinh slug 6 ký tự duy nhất (/l/[slug]) lưu JSON vào Supabase; cho phép quay lại sửa nội dung web mà không cần in lại mã QR trên tờ thiệp giấy.  
Xuất PDF 2 trang không lỗi dấu tiếng Việt: Cho chọn khổ thiệp A6 (mặc định, 105x148mm) hoặc A5 (148x210mm). Trang 1: Phôi phong bì C6 vẽ bằng đường vector trên jsPDF (nét liền cắt, nét đứt gấp, căn chuẩn lề A4). Trang 2: Ảnh chụp Stage (pixelRatio: 2, đã ẩn Transformer & khung Safe Margin) đặt đúng tọa độ căn giữa A4 kèm 4 dấu cắt góc (crop marks).  
FR-08 — Trang Người nhận (/l/[slug]) & Cá nhân hóa theo URL (?to=...)  
Ghi đè tên khách mời linh hoạt: Nếu URL có tham số ?to=Minh-Anh (decode URI, chuyển dấu gạch ngang thành khoảng trắng, giới hạn tối đa 50 ký tự và lọc XSS), hệ thống tự động hiển thị tên này trên vỏ phong bì và lời chào thay cho recipientName mặc định.  
Hiệu ứng mở thư & Gửi phản hồi: Chạm con dấu sáp -> mở nắp phong bì -> bật nhạc từ startTime -> trượt tờ thư + hiển thị Block tương tác -> lưu kết quả vào bảng responses.  
FR-09 — Modal Xuất bản, Trang Quản lý (/manage/[editToken]) & Ảnh QR Donate Tĩnh  
Tạo nhanh link cá nhân hóa theo khách: Trong Modal Xuất bản và Trang Quản lý, cung cấp 1 ô nhập nhanh 'Tên người nhận riêng' -> tự sinh và copy link dạng https://domain.com/l/[slug]?to=... để chủ thiệp gửi riêng cho từng người bạn.  
Quản lý không cần đăng nhập: Cấp edit_token bí mật 24 ký tự để xem lượt mở (view_count), bảng phản hồi/lời chúc và nút quay lại Editor chỉnh sửa thư.  
Khung Donate Ảnh QR Tĩnh (Ngân hàng / ZaloPay): Sử dụng trực tiếp ảnh tĩnh tối ưu sẵn (public/donate-qr-bank.webp và/hoặc public/donate-qr-zalo.webp, chia 2 tab nhỏ nếu dùng cả hai). Bắt buộc đặt kèm 2 nút hỗ trợ người dùng điện thoại: (1) Nút 'Lưu ảnh QR' (download 1 chạm) và (2) Nút 'Copy số tài khoản' (hiển thị tên ngân hàng, STK, tên chủ TK; cắt gọn ảnh QR không để lộ SĐT cá nhân).  
4.  YÊU CẦU PHI CHỨC NĂNG & QUẢN TRỊ RỦI RO  
Hạng mục | Tiêu chuẩn & Ràng buộc Kỹ thuật  
Hiệu năng & Tương thích | Trang /l/[slug] tải dưới 2 giây trên mạng 4G; hiệu ứng mở phong bì mượt 60fps; tương thích chuẩn iOS Safari 16+, Chrome Android và Chrome/Edge/Safari Desktop.  
Chi phí hạ tầng (~0đ) | Ảnh tải lên ép chuẩn WebP <= 200KB (tối đa 4 ảnh/thư); lưu trữ ảnh & nhạc trên Cloudflare R2 (10GB miễn phí, 0đ băng thông egress); xuất PDF 100% ở phía trình duyệt.  
Tự động dọn rác (60 ngày) | Thư miễn phí tự hết hạn sau 60 ngày (expires_at). Cron job định kỳ xóa bản ghi quá hạn trên Supabase và xóa file ảnh tương ứng trên R2.  
Bảo mật & Chống Spam | Cloudflare Turnstile cho API upload và tạo thư; giới hạn 5 thư/IP/ngày & 10 ảnh/IP/giờ (IP hash SHA-256); kiểm tra MIME & dung lượng <= 500KB phía server; sanitize tham số ?to=... chống XSS; ẩn edit_token ở API public.  
Bản quyền & Pháp lý | Bộ Meme dựng sẵn chỉ dùng doodle/chibi mở hoặc nguồn miễn phí thương mại; đặt ghi chú người dùng tự chịu trách nhiệm với ảnh cá nhân tải lên.  
5.  KIẾN TRÚC HỆ THỐNG, DỮ LIỆU & ĐẶC TẢ API  
5.1. Hằng số In ấn Chuẩn (lib/print-config.ts)  
export const PRINT_CONFIG = {  CANVAS: { width: 1240, height: 1754, safeMarginPx: 94, minQrPx: 240, defaultQrPx: 280 },  PAPER_A4_MM: { width: 210, height: 297 },  CARD_SIZES_MM: {    A6: { width: 105, height: 148, offsetX: 52.5, offsetY: 74.5 }, // Mặc định (nhỏ gọn)    A5: { width: 148, height: 210, offsetX: 31.0, offsetY: 43.5 }, // Tùy chọn (gấp đôi)  },  ENVELOPE_C6_FLAT_MM: {    bodyWidth: 162, bodyHeight: 114,    sideFlap: 15, bottomFlap: 95, topFlap: 65,    marginX: 9.0, marginY: 11.5, // Tổng 192 x 274 mm lọt chuẩn A4  },  EXPORT_PIXEL_RATIO: 2,} as const;  
5.2. Thiết kế Cơ sở dữ liệu (Supabase / PostgreSQL)  
CREATE TABLE letters (  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  slug VARCHAR(12) UNIQUE NOT NULL,  edit_token VARCHAR(32) UNIQUE NOT NULL,  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('confession','wedding','dinner','holiday')),  title VARCHAR(120),  canvas_data JSONB NOT NULL,  web_config JSONB NOT NULL,  view_count INT DEFAULT 0,  creator_ip_hash VARCHAR(64),  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 days'),  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE INDEX idx_letters_slug ON letters(slug);CREATE INDEX idx_letters_expires_at ON letters(expires_at);CREATE TABLE responses (  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,  responder_name VARCHAR(100),  action_type VARCHAR(20) NOT NULL, -- 'accept' | 'rsvp' | 'poll'  status VARCHAR(30),               -- 'yes' | 'no' | 'attending' | 'not_attending'  guest_count INT DEFAULT 1,  poll_option VARCHAR(120),  message TEXT,  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE INDEX idx_responses_letter_id ON responses(letter_id);  
5.3. Chuẩn Dữ liệu JSON (types/letter.ts)  
export interface BackgroundConfig {  type: 'preset' | 'color' | 'image';  value: string;          // 'kraft' | 'cream' | 'grid' | 'plaid' | '#FDE2E4' | 'https://r2.../bg.webp'  overlayColor?: string;  // Mặc định '#FFFFFF'  overlayOpacity: number; // 0 -> 0.8 (mặc định 0.35 khi dùng ảnh nền)  blur?: number;          // 0 -> 10 (px)}export interface CanvasElement {  id: string;  type: 'text' | 'image' | 'svg_icon' | 'sticker_img' | 'handwriting' | 'lined_area' | 'qr_code';  x: number; y: number; width?: number; height?: number;  rotation: number; zIndex: number; locked?: boolean;  text?: string; fontFamily?: string; fontSize?: number; fill?: string; align?: 'left'|'center'|'right';  src?: string; frame?: 'none'|'polaroid'|'stamp'|'rounded'|'circle'|'cloud'; filter?: 'none'|'vintage'|'bw';  iconId?: string;  points?: number[]; strokeWidth?: number; lineStyle?: 'ruled'|'dot_grid';}export interface LetterPayload {  template_type: 'confession' | 'wedding' | 'dinner' | 'holiday';  title: string;  canvas_data: {    width: 1240; height: 1754;    defaultPrintSize: 'A6' | 'A5';    background: BackgroundConfig;    elements: CanvasElement[];  };  web_config: {    recipientName: string; senderName: string;    envelopeColor: string; waxSealColor: string;    audio: { enabled: boolean; trackId: string; startTime: number; volume: number };    blocks: {      acceptButton?: { enabled: boolean; question: string; yesText: string; noText: string; dodgeNo: boolean };      rsvp?: { enabled: boolean; eventDate: string; locationName: string; mapsUrl: string };      poll?: { enabled: boolean; question: string; options: string[] };    };  };}  
5.4. Đặc tả API Routes (Next.js App Router)  
Method | Endpoint | Bảo vệ / Guard | Mô tả xử lý  
POST | /api/upload | Turnstile + 10 ảnh/IP/giờ | Nhận ảnh WebP (<=500KB), kiểm tra MIME, đẩy lên Cloudflare R2 -> trả về { url }.  
POST | /api/letters | Turnstile + 5 thư/IP/ngày | Validate LetterPayload bằng Zod -> sinh slug(6) & edit_token(24) -> lưu Supabase -> trả về { slug, edit_token }.  
GET | /api/letters/[slug] | Public (ẩn edit_token & IP) | Kiểm tra expires_at -> tăng view_count -> trả về dữ liệu thư để render trang người nhận.  
PATCH | /api/letters/[slug] | Header x-edit-token khớp DB | Cập nhật nội dung thư (giữ nguyên slug & mã QR giấy cũ).  
POST | /api/letters/[slug]/responses | Public + Rate Limit nhẹ | Lưu phản hồi từ người nhận (Đồng ý / Form RSVP / Bình chọn Poll) vào bảng responses.  
GET | /api/manage/[editToken] | Bí mật theo editToken | Trả về thông tin thư, view_count và danh sách toàn bộ phản hồi cho người gửi.  
6.  CHIẾN LƯỢC TRIỂN KHAI 7 NGÀY & PHÂN BỔ MÔ HÌNH AI  
6.1. Chiến lược chọn Model Claude trong IDE & Phối hợp Gemini  
Mô hình AI | Vai trò | Phạm vi nhiệm vụ khuyến nghị  
Gemini | Kiến trúc sư & Designer | Chốt SRS/CLAUDE.md, thiết kế SVG icon/dấu sáp, soạn nội dung 4 mẫu thư JSON, review UX & kịch bản clip Threads.  
Claude Sonnet(~80% khối lượng) | Dev chủ lực (CRUD, UI, State) | Dùng cho Setup, Supabase/R2 APIs, Zustand Store, Công cụ Chữ/Ảnh/Nền, Sticker, Trang chủ, Panel Nhạc, Trang Quản lý & Donate QR tĩnh.  
Claude Opus(Thinking Mode) | Xử lý 4 điểm kỹ thuật khó | Chỉ dùng cho: (1) Konva Stage + Transformer scale (T-09), (2) Vẽ tay đa thiết bị (T-14), (3) Responsive Mobile cảm ứng 2 ngón (T-16), (4) Phôi C6 + Xuất PDF A6/A5 chuẩn tọa độ (T-19) và debug Safari audio.  
Claude Haiku | Tinh chỉnh nhanh & Copy | Sửa màu Tailwind, chỉnh câu chữ tiếng Việt, kiểm tra thông báo lỗi, format dữ liệu tĩnh.  
6.2. Lộ trình Sprint 7 Ngày (Tóm tắt)  
Thời gian | Trọng tâm | Đầu ra bắt buộc (Deliverables)  
Ngày 1 | Nền móng & 6 Backend APIs | Next.js + Design Tokens, PRINT_CONFIG, SQL Supabase, Cloudflare R2, 6 API Routes + Turnstile.  
Ngày 2 | Lõi Editor Canvas (PC) | Zustand Undo/Redo, Konva Stage 1240x1754 + Safe Margin, Chữ, Ảnh WebP (6 khung + 3 filter), Custom BG (Blur/Overlay).  
Ngày 3 | Sticker, Ghi tay, QR & Mobile | 20 Icon SVG + 25 Meme WebP, Ghi tay 2 chế độ, QR có Quiet Zone (>=240px), giao diện Bottom Sheet Mobile.  
Ngày 4 | 4 Mẫu sẵn, Nhạc & PDF A6/C6 | Landing Gallery + 4 mẫu JSON (A6 tỏ tình), kho nhạc + startTime, xuất PDF 2 trang (Phôi C6 + Thiệp A6/A5) & ẩn nền Kraft.  
Ngày 5 | Trang Người nhận & Quản lý | Màn hình /l/[slug] hỗ trợ ?to=..., bóc dấu sáp phát nhạc + 3 Block; Modal Xuất bản + Ảnh QR Donate tĩnh + trang /manage/[editToken].  
Ngày 6 | Kiểm thử Thực tế & In giấy A6 | Test nhạc iOS Safari/Android Chrome; in thử PDF ra giấy thật cắt gấp phong bì C6 + thiệp A6 & quét QR; bật cron 60 ngày.  
Ngày 7 | Deploy & Ra mắt Threads | Deploy Vercel, kiểm tra rate limit & ảnh Donate QR; quay clip 15–20s mở phong bì giấy Kraft + thiệp A6 + quét QR đăng Threads.  
4 QUY TẮC VÀNG CHỐNG VỠ TIẾN ĐỘ KHI CODE CÙNG CLAUDE IDE1. Xuất PDF qua ảnh chụp Stage (pixelRatio: 2, đã ẩn Transformer & Safe Margin) dán vào jsPDF — tuyệt đối không dùng pdf.text() cho nội dung thiệp.2. Khóa cứng tọa độ logic 1240 x 1754 px và dùng duy nhất hằng số PRINT_CONFIG (A6 mặc định 105x148mm, C6 trải phẳng 192x274mm).3. Dùng ảnh QR Ngân hàng/ZaloPay tĩnh (public/donate-qr-*.webp) kèm nút Lưu ảnh & Copy STK — không code API thanh toán.4. Git commit ngay sau mỗi task (T-01 -> T-25) và mở khung chat mới mỗi khi chuyển Epic để giữ context Claude sạch nhất.  