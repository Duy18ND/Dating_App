> **SRS v1.6 — nguồn chuẩn hiện hành** (không dùng số 1.5: bản đó đã hủy). Bản gốc trích từ SRS_Phygital_Letter_Studio_V1.docx (v1.1); các thay đổi sau đó được sửa trực tiếp trong file này. File .docx và .xlsx **chưa cập nhật**, khi lệch thì file .md này là chuẩn. Quyết định bổ sung nằm ở CLAUDE.md.

SOFTWARE REQUIREMENTS SPECIFICATION (SRS) — VERSION 1.6  
NỀN TẢNG TẠO THƯ ĐIỆN TỬ LAI THƯ TAY(PHYGITAL LETTER STUDIO)  
Trình thiết kế bộ quà mini (phong bì C7, thiệp gập có bìa, thư viết tay gấp 3) tự cắt dán tại nhà, kèm trang web bày tỏ dạng cuộn dọc mở bằng mã QR.  
  
Thông tin tài liệu | Chi tiết  
Tên sản phẩm | Phygital Letter Studio  
Phiên bản tài liệu | v1.6 — Làm web trước; bộ phong cách & hiệu ứng; hiển thị nhất quán PC và điện thoại  
Ngày cập nhật | 27/11/2026  
Mô hình vận hành | 100% Miễn phí (Free) + Ủng hộ tự nguyện bằng Ảnh QR Ngân hàng / ZaloPay tĩnh  
Kênh ra mắt mục tiêu | Threads (clip mở phong bì mini, lật thiệp, quét QR phát nhạc)  
Kế hoạch thực thi | Sprint 7 ngày (Kiến trúc Gemini + Code Claude Sonnet / Opus / Haiku trong IDE)  
Công nghệ cốt lõi | Next.js (App Router), TypeScript, Tailwind CSS, React-Konva, Supabase, Cloudflare R2  
NHỮNG CẬP NHẬT CHÍNH Ở PHIÊN BẢN V1.6 (chốt ngày 27/11/2026)  
1. **Làm bản web trước** (trang người nhận), thử trên PC và điện thoại đạt rồi mới tới thiết kế/xuất/in thiệp, sau đó tài khoản và ra mắt.  
2. Trang web có **bộ phong cách và hiệu ứng** tùy chỉnh (FR-15). Đợt đầu: 4 phong cách, thiết kế để thêm dần tới 8.  
3. Quy tắc **hiển thị nhất quán PC và điện thoại** (FR-16). Cuộn tự do, chưa làm kiểu từng màn.  
4. Hiệu ứng hạt (tim, sao, cánh hoa) vào MVP.  
  
NHỮNG CẬP NHẬT CHÍNH Ở PHIÊN BẢN V1.4 (chốt ngày 27/11/2026)  
1. **Người tạo thiệp bắt buộc đăng nhập** (email + mật khẩu tự đăng ký, hoặc Google). Mỗi thiệp thuộc về một tài khoản (FR-14).  
2. Trang **Thiệp của tôi** thay trang quản lý bằng link bí mật. Bỏ hoàn toàn edit_token và /manage/[editToken] (chưa có thư thật nên không cần tương thích).  
3. **Người nhận không cần đăng nhập.** Đường dẫn công khai giữ mã ngẫu nhiên /l/[slug], không dùng số thứ tự đoán được.  
  
NHỮNG CẬP NHẬT CHÍNH Ở PHIÊN BẢN V1.3 (chốt ngày 27/11/2026)  
1. Cả bộ in thu về cỡ mini: phong bì **C7 114 x 81 mm**, thiệp và thư đã gấp **105 x 74 mm**. Bỏ toàn bộ khổ C6, A6 phẳng, A5.  
2. **Thiệp gập có bìa**, mở như cuốn sách: in một mặt 2 dải 210 x 74 mm, cắt, dán lưng vào nhau, gấp đôi.  
3. Thư viết tay là dải 105 x 222 mm **gấp 3**.  
4. PDF 3 trang A4, màu tràn 2 mm ngoài đường cắt; phong bì có vùng dán keo.  
5. Một màu phong bì dùng chung cho web và bản in; xem trước cả bộ trên màn hình.  
6. Không còn hỗ trợ thiệp đứng cỡ cũ (chưa có thư thật nào được phát hành).  
  
Giữ từ v1.2: tách bản in và trang web; trang web cuộn dọc (FR-10) với tối đa 8 ảnh riêng; upload 20 ảnh/IP/giờ; (hiệu ứng nền: xem FR-15). Giữ từ v1.1: ?to=..., ảnh QR Donate tĩnh.  
1.  TỔNG QUAN DỰ ÁN & PHẠM VI SẢN PHẨM  
1.1. Mục đích & Giá trị Cốt lõi  
Tài liệu này là nguồn chuẩn duy nhất (Single Source of Truth) đặc tả toàn bộ yêu cầu chức năng, phi chức năng, hệ thống giao diện (UI/UX), chuẩn kích thước in ấn, kiến trúc cơ sở dữ liệu và API cho phiên bản MVP V1.1 của Phygital Letter Studio. Sản phẩm kết hợp sự ấm áp của tấm thiệp nhỏ gọn cầm tay trong phong bì giấy Kraft đóng dấu sáp với trải nghiệm web tương tác phát nhạc khi quét mã QR.  
1.2. Đối tượng người dùng & Chiến lược ra mắt  
Tệp người dùng mục tiêu: Gen Z, sinh viên và người trẻ tại Việt Nam (18–28 tuổi) trên nền tảng Threads — nhóm thích tự tay cá nhân hóa quà tặng theo gu riêng (từ tối giản lãng mạn đến tấu hài bằng Meme).  
Kịch bản sử dụng: Thiệp tỏ tình/kỷ niệm nhỏ gọn kẹp hoa hoặc hộp quà, thiệp mời cưới gửi bạn bè thân thiết, vé mời đi ăn/hẹn hò, thiệp sinh nhật & Giáng sinh.  
Vòng lặp lan truyền (Organic Viral Loop): Người nhận mở thư không cần đăng nhập; cuối trang xem thư (/l/[slug]) có dòng credit dẫn về trang tạo thư miễn phí (người tạo đăng nhập để bắt đầu); hiển thị khung Donate QR tĩnh ngay khi xuất bản thành công.  
1.3. Phân tách phạm vi MVP (V1.1) và Mở rộng (V2)  
Hạng mục | Trong phạm vi MVP (V1.1 — Làm ngay) | Ngoài phạm vi MVP (Để sang V2)  
Hệ sinh thái mẫu | 4 mẫu dựng sẵn, mỗi mẫu gồm bìa trước, trang Lời mời + QR và bộ phần web mặc định: Tỏ tình, Mời cưới, Mời ăn/Hẹn hò, Sinh nhật/Giáng sinh. | Mở rộng: Mời họp lớp, Thiệp Tết, Group Letter.  
Cá nhân hóa (Customize) | Mini-Canva Responsive PC & Mobile; Custom Background (Preset/Màu/Ảnh + Blur/Overlay), Ảnh WebP (khung Polaroid/Tem/Tròn/Đám mây + filter), 20 Icon SVG đổi màu, 25 Sticker Meme WebP, Ghi tay 2 chế độ, đổi màu phong bì/dấu sáp/QR. | AI tự động tách nền ảnh tải lên, hiệu ứng chữ uốn cong/3D, upload font cá nhân.  
Cá nhân hóa người nhận | Nhập tên người gửi/nhận mặc định + hỗ trợ đổi tên từng khách qua tham số URL (?to=Ten-Khach) kèm ô tạo nhanh link theo tên. | Mail Merge tạo hàng loạt hàng trăm thiệp PDF từ file Excel/CSV.  
Xuất bản & In ấn | Mã QR động (/l/[slug]); PDF 3 trang A4 (phong bì C7, thiệp gập, thư gấp 3) có đường cắt, đường gấp, vùng dán; tắt nền để in giấy màu. | Mô phỏng gấp 3D, các khổ khác, in hai mặt.  
Trải nghiệm Web & Nhạc | Bóc dấu sáp phát nhạc, trang cuộn dọc kể chuyện (FR-10), Block tương tác (Đồng ý, RSVP + Maps, Poll). | Thẻ cào, câu đố mở khóa, ghi âm giọng nói, cuộn kiểu từng màn (story), hồi âm hai chiều, upload MP3 riêng, kéo thả tự do trên trang web.  
Quản lý & Vận hành | Tài khoản bắt buộc cho người tạo (email + mật khẩu, Google); trang Thiệp của tôi; Free + Donate ảnh QR tĩnh; thư tự hết hạn sau 60 ngày. | Dashboard thống kê chi tiết, gói trả phí (lưu vĩnh viễn/bỏ credit), đăng nhập mạng xã hội khác, nhiều người cùng sửa một thiệp.  
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
2.2. Chuẩn Kích thước Bộ in Mini (PRINT_CONFIG)  
Mọi thứ in một mặt trên A4, người dùng tự cắt, gấp, dán. Thiệp đóng và thư đã gấp cùng cỡ 105 x 74 mm, hở 9 mm chiều dài và 7 mm chiều cao so với phong bì 114 x 81 mm.  
Hạng mục | Thông số chuẩn | Quy tắc triển khai  
Mặt thiệp (đơn vị thiết kế) | 105 x 74 mm = canvas logic **1760 x 1240 px** (~16,76 px/mm) | Mỗi mặt thiết kế là một canvas riêng. Chỉ lưu tọa độ logic.  
Các mặt thiệp | Bìa trước (thiết kế tự do); Trang Lời mời + QR (thiết kế tự do, bên phải khi mở); Trang viết tay (bên trái: dòng kẻ mờ / chấm bi / trơn); Bìa sau (tự động in chữ lồng tên nhỏ) | Mã QR chỉ nằm trên trang Lời mời + QR, đúng 1 mã.  
Thiệp gập (Trang 2 PDF) | 2 dải 210 x 74 mm: ngoài = [Bìa sau \| Bìa trước], trong = [Trang viết tay \| Lời mời + QR] | Xoay 90° cùng chiều, đặt đứng cạnh nhau trên A4 dọc: dải 74 x 210, cách nhau 14 mm, lề trái 24 mm, y = 43,5 mm. Mỗi dải có dấu cắt 4 góc và vạch gấp giữa (ngoài vùng in). Cắt, bôi keo mặt trắng, dán lưng vào nhau, gấp đôi, mở như cuốn sách.  
Thư viết tay (Trang 3 PDF) | 105 x 222 mm, 3 ô 105 x 74; A4 offset x = 52,5, y = 37,5; vạch gấp y = 111,5 và 185,5 mm | Gấp cuộn, mặt in vào trong. Dòng kẻ cách 8 mm (~18–20 dòng viết), không đè vạch gấp.  
Phong bì C7 (Trang 1 PDF) | Thành phẩm 114 x 81 mm; tai bên 15, nắp đáy 62, nắp trên 45 (đầu bo tròn); trải phẳng 144 x 188 mm, A4 offset x = 33, y = 54,5 | Nét liền cắt, nét đứt gấp. **Vùng dán** gạch chéo ghi 'Bôi keo' trên hai tai bên, chỉ ở phần bị nắp đáy che. Nắp trên in chữ lồng tên + một câu, **xoay 180°**. Thứ tự: gấp hai tai → bôi keo → gấp nắp đáy → bỏ thiệp và thư → gấp nắp trên, dán sticker hoặc sáp.  
Tràn màu (bleed) | 2 mm ngoài mọi đường cắt có màu hoặc ảnh nền | Cắt lệch nhẹ không lộ viền trắng. Dấu cắt nằm ngoài vùng tràn.  
Lề an toàn | 84 px (5 mm) | Khung nét đứt trên Editor, không in.  
Mã QR | Mặc định 380 px (~22,7 mm). Tối thiểu 340 px (~20,3 mm) | Khóa trong store; nền sáng Quiet Zone 10% cạnh mỗi phía.  
Cỡ chữ tối thiểu | 48 px (~2,9 mm, ~8 pt) | Áp dụng cho chữ trên thiệp.  
Chất lượng xuất PDF | pixelRatio 2 (mặt thiệp 3520 x 2480 px) | Mọi nội dung có chữ vẽ thành ảnh rồi nhúng vào jsPDF; chỉ nét cắt, gấp, dấu và vùng dán vẽ vector.  
Giấy gợi ý | Thiệp 150–180 gsm (dán 2 lớp). Thư 80–100 gsm. Phong bì 120–150 gsm | Hiện trong Modal tải PDF, kèm nhắc in 100% (không 'Vừa trang') và các bước cắt dán.  
Màu in | Màu phong bì dùng chung với web (web_config.envelopeColor) | 3 công tắc riêng khi xuất: tắt nền thiệp / phong bì / thư để in giấy màu hoặc Kraft. Màu in có thể lệch nhẹ so với màn hình.  
2.3. Thiết kế Thích ứng PC & Điện thoại (Responsive UX)  
Hạng mục UX | PC (Desktop >= 768px) | Điện thoại (Mobile < 768px)  
Thanh công cụ chính | Hai tab lớn **Bản in** và **Trang web**. Trong Bản in: Bìa trước, Lời mời + QR (hai mặt dùng bộ công cụ canvas), Trang viết tay & Thư, Phong bì, Xem cả bộ. | Cùng cấu trúc; khi sửa mặt thiệp dùng Bottom Bar + Bottom Sheet.  
Chỉnh thuộc tính | Thanh công cụ ngang phía trên Canvas (font, màu, cỡ, opacity, lớp z-index, khóa, xóa). | Floating Toolbar cuộn ngang nhỏ tự hiện phía trên Bottom Bar khi chạm chọn vật thể.  
Thao tác Canvas | Kéo chuột, giữ Shift giữ tỷ lệ, phím tắt Ctrl+Z/Y, Delete, mũi tên. | Kéo 1 ngón di chuyển, 2 ngón zoom/xoay; bật touch-action: none chống trượt trang.  
Modal Xuất bản & Donate | 2 cột: Trái (QR + Link + link ?to= + Tải PDF bộ in kèm 3 công tắc nền); Phải (QR Donate + Lưu/Copy). | Xếp dọc 1 cột, ưu tiên Tải PDF & Copy Link.  
3.  YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)  
FR-01 — Hệ sinh thái 4 Mẫu thư Đa mục đích  
Loại mẫu | Thiệp mini (Bìa trước + Lời mời & QR) | Phần web bật sẵn, theo thứ tự (FR-10)  
Tỏ tình / Kỷ niệm (confession) | Bìa: tiêu đề ngắn, tim. Trong: một câu mời, QR. | Mở đầu → Ngày đầu tiên → Kỷ niệm → Điều mình thích ở bạn → Đếm số ngày → Lời bày tỏ → Câu hỏi 'Đồng ý' → Lời kết.  
Mời cưới / Đính hôn (wedding) | Bìa: tên hai người, nhẫn, tông kem/rượu vang. Trong: ngày giờ, địa điểm, QR. | Mở đầu (ảnh đôi) → Đếm ngược → Chuyện tình → Lịch lễ & Maps + RSVP → Lời kết. Hỗ trợ ?to=.  
Mời ăn / Hẹn hò (dinner) | Bìa: 'Vé mời' + sticker. Trong: thời gian, địa điểm, QR. | Mở đầu → Đếm ngược → Quán & bản đồ → Bình chọn món/giờ → 'Chốt kèo' → Lời kết.  
Sinh nhật / Giáng sinh (holiday) | Bìa: lời chúc ngắn + sticker. Trong: một câu, QR. | Mở đầu → Lời chúc → Album kỷ niệm → Lời kết.  
FR-02 — Lõi Trình thiết kế Mini-Canva (Cá nhân hóa tự do)  
Quản lý đối tượng & Lịch sử: Chọn, di chuyển, resize, xoay, nhân bản, khóa vị trí (lock), đổi thứ tự lớp (z-index) và Undo/Redo tối thiểu 20 bước qua Zustand. Hiện khung lề an toàn 94 px mờ trên Canvas.  
Công cụ Chữ (Text): Double-click sửa trực tiếp tiếng Việt, đổi font, cỡ chữ, màu mực, căn lề và độ rộng khung chữ.  
Công cụ Ảnh cá nhân (Image): Thiệp tối đa 4 ảnh cho cả hai mặt thiết kế (tính cả ảnh nền). Trang web có hạn mức riêng 8 ảnh (FR-10). Nén phía client sang WebP (<= 200KB, cạnh dài tối đa 1200px) trước khi tải lên R2. 6 kiểu khung và 3 bộ lọc.  
FR-03 — Tùy chỉnh Nền (Custom Background) & Hàng rào An toàn UX  
3 lớp chọn nền: (1) Preset giấy mỹ thuật (Kraft nâu, Kem Washi, Giấy vở ô ly, Kẻ caro), (2) Màu trơn tự chọn (Color Picker + bảng pastel), (3) Tải ảnh nền cá nhân (nén WebP).  
Hàng rào 1 — Thanh kéo Làm mờ & Phủ dịu: Tự động phủ lớp trắng/kem mờ (overlayOpacity mặc định 0.35, chỉnh 0 -> 0.8) và độ nhòe (blur 0–10px) khi chọn ảnh nền cá nhân để chữ bên trên luôn rõ nét.  
Hàng rào 2 — Vùng an toàn mã QR (Quiet Zone): Mọi mã QR trên Canvas tự động nằm trên thẻ nền sáng bo góc có lề đệm >= 12 px, không bao giờ bị chìm vào ảnh nền tối/rối.  
Hàng rào 3 — Nút gạt in giấy Kraft/giấy màu: Tạm ẩn layer nền ảo khi chụp xuất PDF, chỉ in chữ, ảnh, nét vẽ, dấu cắt và mã QR nhằm tiết kiệm mực và không làm xỉn màu giấy Kraft thật.  
FR-04 — Kho Icon SVG & Bộ Sticker Meme (Sticker Packs)  
Phân tách 4 bộ sưu tập riêng biệt: (1) Tối giản & Cưới (SVG đổi màu trực tiếp), (2) Hoa khô & Dấu sáp (SVG), (3) Doodle vẽ tay (SVG), và (4) Meme & Tấu hài (20–30 ảnh WebP tách nền trong suốt ~15–30KB/ảnh lưu trong public/stickers/memes/).  
Gợi ý theo ngữ cảnh: Mẫu Mời cưới mặc định mở tab Tối giản & Cưới; mẫu Mời ăn/Sinh nhật ưu tiên mở thêm tab Meme & Tấu hài.  
FR-05 — Tính năng Ghi tay 2 Chế độ  
Print-to-Write (Vùng viết bút thật): Trang viết tay trong thiệp và tờ Thư viết tay (FR-11). Trên mặt thiết kế vẫn thả được khối dòng kẻ hoặc chấm bi.  
Digital Ink (Bút vẽ tay trực tiếp): Hỗ trợ chuột, cảm ứng và bút stylus (chọn màu mực, độ dày 2–8px, xóa nét). Lưu dạng mảng tọa độ vector (points) giúp xuất PDF sắc nét không vỡ.  
FR-06 — Nhạc nền & Khối Tương tác Web (Interactive Blocks)  
Kho nhạc & Chọn điệp khúc: 6–8 bài MP3 nén nhẹ (128kbps) lưu trên Cloudflare R2 theo 4 gu cảm xúc; cho nghe thử, kéo chọn giây bắt đầu (startTime) và âm lượng mặc định 0.4.  
Vượt chặn Autoplay trên iOS/Android: Gọi HTMLAudioElement.play() trực tiếp trong sự kiện click/tap khi người nhận chạm vào con dấu sáp mở phong bì. Kèm nút đĩa nhạc xoay góc trên phải để tắt/bật.  
3 Block lắp ghép: (1) AcceptButton (câu hỏi + nút Đồng ý tung hoa + nút Từ chối tùy chọn né chuột), (2) RSVP & LocationMap (thời gian, địa điểm, Google Maps, form xác nhận số người & lời chúc), (3) Poll (bình chọn món ăn/giờ hẹn tối đa 4 lựa chọn).  
FR-07 — Xuất bản, Mã QR Động & Xuất PDF Bộ in Mini (3 trang)  
Mã QR Động: Sinh slug 6 ký tự duy nhất (/l/[slug]) lưu JSON vào Supabase; cho phép quay lại sửa nội dung web mà không cần in lại mã QR trên tờ thiệp giấy.  
Xuất PDF 3 trang A4 theo bảng 2.2: Trang 1 phong bì C7; Trang 2 hai dải thiệp gập; Trang 3 thư gấp 3. PDF **luôn vẽ lại từ thiết kế đã lưu** tại lúc bấm: đổi màu, chữ, ảnh thì bản in đổi theo; đường cắt, gấp, dán cố định theo PRINT_CONFIG. Ảnh chụp mặt thiệp phải ẩn Transformer và khung lề. Có công tắc tắt nền cho từng phần.  
FR-08 — Trang Người nhận (/l/[slug]) & Cá nhân hóa theo URL (?to=...)  
Ghi đè tên khách mời linh hoạt: Nếu URL có tham số ?to=Minh-Anh (decode URI, chuyển dấu gạch ngang thành khoảng trắng, giới hạn tối đa 50 ký tự và lọc XSS), hệ thống tự động hiển thị tên này trên vỏ phong bì và lời chào thay cho recipientName mặc định.  
Hiệu ứng mở thư & Gửi phản hồi: Chạm dấu sáp → mở nắp (màu phong bì giống bản in) → bật nhạc từ startTime → trang web cuộn (FR-10) → phản hồi lưu vào bảng responses. view_count chỉ tăng khi bóc dấu sáp.  
FR-09 — Modal Xuất bản, Chia sẻ & Ảnh QR Donate Tĩnh  
Tạo nhanh link cá nhân hóa theo khách: Trong Modal Xuất bản và trang chi tiết thiệp, ô 'Tên người nhận riêng' tự sinh và copy link https://domain.com/l/[slug]?to=...  
Sau khi xuất bản, modal dẫn tới trang chi tiết thiệp trong Thiệp của tôi (không còn link quản lý bí mật).  
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
Lời kết | ending | Câu kết, chữ ký, nút 'Xem lại tấm thiệp' (hiện bìa trước và trang Lời mời khi bấm), dòng credit.  
Ảnh web: tối đa 8 ảnh cho toàn trang (hero + first_day + memories), tách khỏi 4 ảnh của thiệp. URL phải là ảnh đã tải qua /api/upload và được gắn với thư đó (nếu không, cron sẽ xóa).  
Yêu cầu: dùng được tốt trên màn hình 360px; ảnh tải lười; tôn trọng prefers-reduced-motion (hiện ngay, không trượt); nội dung văn bản là chữ thật (không nằm trong canvas) để đọc được bằng trình đọc màn hình. Chữ người dùng nhập luôn hiển thị dạng văn bản thuần.  
Editor tab 'Trang web': danh sách phần (bật/tắt, đổi thứ tự bằng nút lên/xuống), ô nhập cho từng phần, khung xem trước cỡ điện thoại.  
FR-11 — Thư viết tay & Trang viết tay (v1.3)  
Dải 105 x 222 mm gấp 3. Dòng 'Gửi ...' ở ô đầu (sửa được, mặc định theo tên người nhận), chỗ ký tên ở ô cuối (sửa được), phần còn lại **để trống cho viết bút**. Tùy chọn: dòng kẻ / chấm bi / trơn, hoa văn góc (icon SVG hoặc không), phông, màu mực, màu giấy. Trang viết tay trong thiệp (bên trái) chọn: dòng kẻ / chấm bi / trơn, màu nền. Không có mã QR. Không kéo thả.  
FR-12 — Trang trí phong bì & bìa sau (v1.3)  
Người tạo nhập chữ lồng (tối đa 12 ký tự, ví dụ 'u ♡') và một câu ngắn (tối đa 80 ký tự), chọn phông; màu giấy là web_config.envelopeColor (đổi một chỗ, web và bản in cùng đổi). Chữ lồng cũng in nhỏ ở bìa sau thiệp. Có xem trước. Không kéo thả.  
FR-13 — Xem trước cả bộ (v1.3)  
Một màn hình hiện phong bì (gấp xong và trải phẳng), thiệp (bìa trước, mặt trong, bìa sau) và thư, vẽ bằng **cùng hàm** dùng để xuất PDF; thay đổi hiện ngay, không cần tải PDF.  
Có nút **Tải PDF thử** ngay trên màn hình này (mã QR trỏ tới link xem thử), để in kiểm tra khổ giấy mà chưa cần xuất bản.  
FR-14 — Tài khoản & Thiệp của tôi (v1.4)  
Phạm vi bắt buộc đăng nhập: trình thiết kế (/editor), Thiệp của tôi và mọi API tạo, sửa, xóa, tải ảnh, xem phản hồi. **Không** cần đăng nhập: trang chủ, trang người nhận /l/[slug], gửi phản hồi, ghi lượt mở, trang đăng nhập, chính sách riêng tư. Chưa đăng nhập mà vào trang bắt buộc thì chuyển tới /dang-nhap, đăng nhập xong quay lại đúng trang (chỉ nhận đường dẫn nội bộ bắt đầu bằng một dấu '/', chặn chuyển hướng ra ngoài).  
Cách đăng nhập (Supabase Auth): (1) Đăng ký bằng email + mật khẩu (tối thiểu 8 ký tự), xác nhận email, quên và đặt lại mật khẩu; (2) Đăng nhập Google. Chống bot khi đăng ký/đăng nhập bằng captcha Turnstile của Supabase. Thông báo lỗi đăng nhập không tiết lộ email đã tồn tại hay chưa. Production phải cấu hình SMTP riêng để gửi email xác nhận và đặt lại mật khẩu.  
Trình duyệt nhúng (Threads, Messenger, Instagram, Zalo...): Google thường chặn đăng nhập. Khi phát hiện, ẩn hoặc tắt nút Google, hướng dẫn 'Mở bằng Chrome/Safari' kèm nút sao chép link; đăng nhập email vẫn dùng được.  
Thiệp của tôi (/thiep-cua-toi): danh sách thiệp của chính tài khoản, mới nhất trước. Mỗi thiệp có tên (hoặc 'Thiệp N' theo thứ tự tạo), ảnh bìa trước, ngày tạo, ngày hết hạn, lượt mở, số phản hồi. Thao tác: Sửa (/editor?id=<id>), Xem thử, Xem & tải mã QR (PNG), Tải PDF bộ in, Chia sẻ link ?to=, Xóa (hỏi xác nhận). Trang chi tiết /thiep-cua-toi/[id] có danh sách phản hồi và lời chúc. Sửa thiệp **không đổi slug**, mã QR đã in vẫn dùng được.  
Chủ thiệp xem thử thiệp của mình không làm tăng lượt mở.  
Tài khoản: đăng xuất; xóa tài khoản (hỏi xác nhận) xóa toàn bộ thiệp và phản hồi, ảnh được cron dọn khỏi R2. Trang /chinh-sach-rieng-tu nêu dữ liệu lưu (email, nội dung thiệp, ảnh, phản hồi người nhận), thời hạn lưu và cách xóa.  
Quyền truy cập: server lấy người dùng bằng cách **xác minh phiên với Supabase** (không tin dữ liệu người dùng đọc thẳng từ cookie). Mọi truy vấn của chủ thiệp lọc theo owner_id; thiệp không tồn tại và thiệp của người khác cùng trả 404. Ảnh chỉ gắn được vào thiệp nếu do chính chủ thiệp tải lên. API thay đổi dữ liệu kiểm tra header Origin cùng trang (chống CSRF).  
FR-15 — Bộ phong cách & hiệu ứng của trang web (v1.6)  
Hai tầng: chọn một **phong cách** là đủ bộ màu, phông, nền, khung ảnh và hiệu ứng hợp nhau; sau đó đổi riêng từng mục nếu muốn. Có nút **Gợi ý ngẫu nhiên**. Chỉ áp dụng cho trang web; chọn phong cách thì gợi ý màu phong bì in (không tự đổi nếu người dùng đã tự chọn màu).  
Phong cách đợt 1 | warm_letter 'Thư tay ấm áp' (mặc định tỏ tình, cưới); starry_night 'Đêm sao'; pastel 'Pastel ngọt ngào' (mặc định sinh nhật); doodle 'Doodle vui nhộn' (mặc định mời ăn).  
Phong cách đợt 2 (sau Cửa 1) | Phim cũ; Vườn hoa (khi có thì làm mặc định cưới); Tối giản thanh lịch; Lễ hội.  
Mục tùy chỉnh | Lựa chọn đợt 1 | Thêm ở đợt 2  
Mở thư (open) | wax_seal Bóc dấu sáp; ribbon Kéo nơ; hold_heart Nhấn giữ tim | Vuốt xé mép phong bì  
Chữ xuất hiện (textReveal) | slide Trượt nhẹ; typewriter Gõ từng chữ; lines Hiện từng dòng | Mờ rồi rõ  
Ảnh (photo) | polaroid Polaroid nghiêng; flip Lật xem lời nhắn; drop Thả xuống bàn | Dải phim ngang  
Hiệu ứng nền (particle) | none; hearts Tim bay; stars Sao; petals Cánh hoa | Tuyết, đom đóm, bong bóng  
Con số (counter) | count_up Đếm tăng; flip_calendar Lịch lật | Vòng tròn chạy  
Khi bấm Đồng ý (celebrate) | confetti Hoa giấy; fireworks Pháo hoa; heart_rain Mưa tim | —  
Màu & phông | Màu nhấn tự chọn (phải đủ tương phản với nền), 6 phông tiếng Việt | —  
Độ sôi động (intensity) | light Nhẹ; medium Vừa (mặc định); rich Rực rỡ — chỉnh cùng lúc số hạt và cường độ chuyển động | —  
Dữ liệu: web_config.style = { theme; intensity; accent?; font?; open?; textReveal?; photo?; particle?; counter?; celebrate? }. Mục để trống thì theo phong cách. Giá trị chỉ nhận trong danh sách trên; thư không có style dùng warm_letter.  
Hiệu năng & dễ dùng: mỗi lúc tối đa một lớp hạt, tạm dừng khi tab ẩn; số hạt trên điện thoại ít hơn; ưu tiên transform/opacity; không dùng 3D nặng; mượt trên điện thoại tầm trung. prefers-reduced-motion: tắt hạt, gõ chữ và chuyển động, nội dung hiện ngay. Hiệu ứng không được che nút bấm hay cản việc đọc; chữ gõ dần vẫn đọc được đầy đủ bằng trình đọc màn hình. Cách 'Nhấn giữ' và 'Kéo nơ' phải có cách bấm thay thế bằng bàn phím. Mọi cách mở thư đều phải gọi phát nhạc ngay trong thao tác chạm của người dùng (iOS).  
FR-16 — Hiển thị nhất quán PC & điện thoại (v1.6)  
Thiệp: mặt thiệp là khung cố định 1760 x 1240, mọi máy chỉ phóng/thu đều cả khung. Mọi thành phần trừ vùng dòng kẻ **giữ tỷ lệ khi kéo giãn** (chữ, ảnh, sticker, icon, QR, nét vẽ không bị bóp méo). Ảnh trong khung được cắt cho vừa chứ không kéo giãn; người dùng **chọn điểm cần giữ** (focus x, y từ 0 đến 1, mặc định giữa). Trang người nhận cho **chạm để phóng to thiệp**.  
Trang web: bố cục tự xếp lại theo màn hình, không dùng khung cố định. Điện thoại một cột; PC cột nội dung ở giữa, có thể đặt ảnh cạnh chữ, nền và hiệu ứng phủ toàn màn hình. Ảnh không bao giờ bị kéo méo; **mặc định hiện trọn ảnh**; chỗ cần phủ kín khung (ảnh bìa) thì cắt theo điểm giữ đã chọn. Chữ tự xuống dòng, không thu nhỏ cả trang. Tránh tai thỏ và thanh trình duyệt (safe-area, đơn vị dvh).  
Trình thiết kế tab Trang web có nút xem thử **Điện thoại | PC**.  
Nghiệm thu ở bề ngang 360, 390, 768, 1366, 1920 px, và trên iPhone (Safari) cùng Android (Chrome) thật.  
4.  YÊU CẦU PHI CHỨC NĂNG & QUẢN TRỊ RỦI RO  
Hạng mục | Tiêu chuẩn & Ràng buộc Kỹ thuật  
Hiệu năng & Tương thích | Trang /l/[slug] hiện phong bì dưới 2 giây trên 4G; ảnh phần web tải lười; mở phong bì và cuộn mượt 60fps; iOS Safari 16+, Chrome Android, Chrome/Edge/Safari Desktop.  
Chi phí hạ tầng (~0đ) | Ảnh WebP <= 200KB; mỗi thư tối đa 4 ảnh thiệp + 8 ảnh web; R2 cho ảnh & nhạc; xuất PDF ở trình duyệt.  
Tự động dọn rác (60 ngày) | Thư tự hết hạn sau 60 ngày (expires_at). Cron xóa bản ghi quá hạn trên Supabase và file ảnh trên R2. Trang chủ, Modal Xuất bản và chính sách riêng tư nói rõ **mã QR trên thiệp giấy ngừng hoạt động sau 60 ngày**. Không có chức năng tải bản lưu: Lời kết của trang người nhận và trang chi tiết thiệp gợi ý **quay màn hình để giữ làm kỷ niệm**, kèm ngày thư bị xóa; Thiệp của tôi cảnh báo khi còn <= 7 ngày. Tài khoản không bị xóa theo thư.  
Bảo mật & Chống Spam | Bắt buộc phiên đăng nhập cho API của người tạo; kiểm tra chủ sở hữu và Origin (FR-14). Turnstile cho upload, tạo thư và đăng ký/đăng nhập. Giới hạn theo **tài khoản và IP**: 5 thư/ngày, 20 ảnh/giờ (IP hash SHA-256). Kiểm tra MIME & <= 500KB phía server; sanitize ?to=; API public không trả owner_id hay IP hash; mọi URL ảnh phải thuộc bảng uploads của đúng thư và đúng chủ.  
Bản quyền & Pháp lý | Bộ Meme dựng sẵn chỉ dùng doodle/chibi mở hoặc nguồn miễn phí thương mại; đặt ghi chú người dùng tự chịu trách nhiệm với ảnh cá nhân tải lên.  
5.  KIẾN TRÚC HỆ THỐNG, DỮ LIỆU & ĐẶC TẢ API  
5.1. Hằng số In ấn Chuẩn (lib/print-config.ts)  
export const PRINT_CONFIG = {  CANVAS: { width: 1760, height: 1240, safeMarginPx: 84, minQrPx: 340, defaultQrPx: 380, minFontPx: 48 },  PAPER_A4_MM: { width: 210, height: 297 },  BLEED_MM: 2,  CARD_FACE_MM: { width: 105, height: 74 },  CARD_STRIPS_MM: { length: 210, height: 74, gap: 14, marginX: 24, y: 43.5 },  LETTER_MM: { width: 105, height: 222, offsetX: 52.5, offsetY: 37.5, panelHeight: 74, lineGap: 8 },  ENVELOPE_C7_FLAT_MM: { bodyWidth: 114, bodyHeight: 81, sideFlap: 15, bottomFlap: 62, topFlap: 45, offsetX: 33, offsetY: 54.5 },  EXPORT_PIXEL_RATIO: 2,} as const;  
5.2. Thiết kế Cơ sở dữ liệu (Supabase / PostgreSQL)  
CREATE TABLE letters (  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  slug VARCHAR(12) UNIQUE NOT NULL,  edit_token VARCHAR(32) UNIQUE NOT NULL,  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('confession','wedding','dinner','holiday')),  title VARCHAR(120),  canvas_data JSONB NOT NULL,  web_config JSONB NOT NULL,  view_count INT DEFAULT 0,  creator_ip_hash VARCHAR(64),  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 days'),  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE INDEX idx_letters_slug ON letters(slug);CREATE INDEX idx_letters_expires_at ON letters(expires_at);CREATE TABLE responses (  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,  responder_name VARCHAR(100),  action_type VARCHAR(20) NOT NULL, -- 'accept' | 'rsvp' | 'poll'  status VARCHAR(30),               -- 'yes' | 'no' | 'attending' | 'not_attending'  guest_count INT DEFAULT 1,  poll_option VARCHAR(120),  message TEXT,  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE INDEX idx_responses_letter_id ON responses(letter_id);  
**v1.4 (migration 0003):** letters thêm owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE kèm index, và **bỏ cột edit_token**; uploads thêm owner_id REFERENCES auth.users(id) ON DELETE SET NULL; set_letter_uploads chỉ nhận ảnh có owner_id trùng chủ thư. RLS vẫn bật và không có policy: trình duyệt chỉ dùng Supabase cho đăng nhập, mọi truy cập bảng qua server bằng service role. Migration không tự xóa dữ liệu; database thử đã có thư thì người vận hành tự xóa trước khi chạy. Biến môi trường mới: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.  
5.3. Chuẩn Dữ liệu JSON (types/letter.ts)  
export interface BackgroundConfig {  type: 'preset' | 'color' | 'image';  value: string;          // 'kraft' | 'cream' | 'grid' | 'plaid' | '#FDE2E4' | 'https://r2.../bg.webp'  overlayColor?: string;  // Mặc định '#FFFFFF'  overlayOpacity: number; // 0 -> 0.8 (mặc định 0.35 khi dùng ảnh nền)  blur?: number;          // 0 -> 10 (px)}export interface CanvasElement {  id: string;  type: 'text' | 'image' | 'svg_icon' | 'sticker_img' | 'handwriting' | 'lined_area' | 'qr_code';  x: number; y: number; width?: number; height?: number;  rotation: number; zIndex: number; locked?: boolean;  text?: string; fontFamily?: string; fontSize?: number; fill?: string; align?: 'left'|'center'|'right';  src?: string; frame?: 'none'|'polaroid'|'stamp'|'rounded'|'circle'|'cloud'; filter?: 'none'|'vintage'|'bw';  iconId?: string;  points?: number[]; strokeWidth?: number; lineStyle?: 'ruled'|'dot_grid';}export interface LetterPayload {  template_type: 'confession' | 'wedding' | 'dinner' | 'holiday';  title: string;  canvas_data: {    width: 1240; height: 1754;    defaultPrintSize: 'A6' | 'A5';    background: BackgroundConfig;    elements: CanvasElement[];  };  web_config: {    recipientName: string; senderName: string;    envelopeColor: string; waxSealColor: string;    audio: { enabled: boolean; trackId: string; startTime: number; volume: number };    blocks: {      acceptButton?: { enabled: boolean; question: string; yesText: string; noText: string; dodgeNo: boolean };      rsvp?: { enabled: boolean; eventDate: string; locationName: string; mapsUrl: string };      poll?: { enabled: boolean; question: string; options: string[] };    };  };}  
**v1.3 thay phần canvas_data ở trên** (không cần migration, vẫn là hai cột JSONB). Tên trường chốt ở T-26:  
canvas_data = { version: 2; width: 1760; height: 1240; faces: { front: { background, elements }; inside: { background, elements } }; writingPage: { paper: 'ruled'|'dot_grid'|'plain'; color }; letter: { paper; greeting; signature; fontFamily; inkColor; paperColor; decorIconId? }; envelope: { monogram; line; fontFamily } }. Không còn defaultPrintSize.  
Giới hạn: tổng phần tử hai mặt <= 300; ảnh hai mặt <= 4; id không trùng giữa hai mặt; QR chỉ ở faces.inside và tối đa 1.  
web_config: thêm sections?: Array<{ id; type: 'hero'|'first_day'|'memories'|'reasons'|'counter'|'message'|'interact'|'ending'; enabled; ...trường riêng theo type }>. Không có sections thì hiển thị thiệp + các Block.  
**v1.6:** web_config thêm style? (FR-15); mỗi ảnh trong sections có fit: 'contain'|'cover' và focus: { x, y }; phần tử ảnh trên thiệp thêm focus?. Mọi trường đều tùy chọn để thư tạo trước đó vẫn hợp lệ.  
5.4. Đặc tả API Routes (Next.js App Router)  
Method | Endpoint | Bảo vệ / Guard | Mô tả xử lý  
POST | /api/upload | Đăng nhập + Origin + Turnstile + 20 ảnh/giờ (tài khoản & IP) | Nhận ảnh WebP (<=500KB), kiểm tra MIME, đẩy lên R2, ghi owner_id -> trả về { url }.  
POST | /api/letters | Đăng nhập + Origin + Turnstile + 5 thư/ngày | Validate Zod -> sinh slug(6) -> lưu với owner_id = người dùng -> trả về { id, slug }.  
GET | /api/letters/[slug] | Public (không trả owner_id, IP hash) | Kiểm tra expires_at -> trả dữ liệu hiển thị. Không tăng view_count.  
POST | /api/letters/[slug]/view | Public + Rate Limit | Tăng view_count khi bóc dấu sáp; bỏ qua nếu người gọi là chủ thiệp.  
POST | /api/letters/[slug]/responses | Public + Rate Limit nhẹ | Lưu phản hồi từ người nhận (Đồng ý / Form RSVP / Bình chọn Poll) vào bảng responses.  
GET | /api/me/letters | Đăng nhập | Danh sách thiệp của tài khoản kèm lượt mở và số phản hồi.  
GET | /api/me/letters/[id] | Đăng nhập + đúng chủ | Chi tiết thiệp để sửa, kèm phản hồi. Không phải chủ -> 404.  
PATCH | /api/me/letters/[id] | Đăng nhập + đúng chủ + Origin | Cập nhật nội dung, giữ nguyên slug.  
DELETE | /api/me/letters/[id] | Đăng nhập + đúng chủ + Origin | Xóa thiệp và phản hồi; ảnh thành mồ côi để cron dọn.  
DELETE | /api/me/account | Đăng nhập + Origin + xác nhận | Xóa tài khoản cùng toàn bộ thiệp.  
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
Bổ sung v1.6: 4 chặng: (1) bản web chạy thử, Cửa 1 duyệt trên PC và điện thoại; (2) tự soạn nội dung web; (3) thiệp, xuất file và in, Cửa 2 in thử; (4) tài khoản và ra mắt. Chi tiết ở docs/BACKLOG.md.  
4 QUY TẮC VÀNG CHỐNG VỠ TIẾN ĐỘ KHI CODE CÙNG CLAUDE IDE1. Xuất PDF qua ảnh chụp Stage (pixelRatio: 2, đã ẩn Transformer & Safe Margin) dán vào jsPDF — tuyệt đối không dùng pdf.text() cho nội dung thiệp.2. Khóa cứng tọa độ logic 1760 x 1240 px và dùng duy nhất hằng số PRINT_CONFIG (mặt thiệp 105x74mm, thư 105x222mm, phong bì C7 trải phẳng 144x188mm).3. Dùng ảnh QR Ngân hàng/ZaloPay tĩnh (public/donate-qr-*.webp) kèm nút Lưu ảnh & Copy STK — không code API thanh toán.4. Git commit ngay sau mỗi task (T-01 -> T-25) và mở khung chat mới mỗi khi chuyển Epic để giữ context Claude sạch nhất.  