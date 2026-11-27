# Prompt cho Gemini

Mỗi prompt dán nguyên khối vào Gemini. Kết quả Gemini trả về thì gửi lại cho Claude (Sonnet) để ghép vào code và chạy test.

| # | Task | Gemini làm gì | Khi nào gửi |
|---|---|---|---|
| 1 | T-28 | 4 thiệp mini, mỗi thiệp 2 mặt (nội dung + bố cục) | Ngay bây giờ |
| 5 | T-35 | Nội dung mặc định cho trang web cuộn | Trước T-35 |
| 4 | T-25 | Kịch bản clip và caption Threads | Trước khi ra mắt |
| 2, 3 | T-13 | Icon SVG và sticker | Không cần gửi lại nếu bạn ưng bộ đang chờ commit |

> Cập nhật v1.3 (27/11/2026): Prompt 1 viết lại cho bộ mini. Các bản cũ không còn dùng. Prompt 4 nhắc tới "thiệp A6": khi gửi, đổi thành "thiệp mini gập 10,5 x 7,4 cm trong phong bì C7".

---|---|---|---|
| 1 | T-17 | Viết lại nội dung chữ và bố cục 4 mẫu thiệp A6 | `src/lib/templates.ts` |
| 2 | T-13 | Vẽ lại 20 icon SVG đẹp hơn | `src/lib/icons.ts` |
| 3 | T-13 (tùy chọn) | Vẽ 25 sticker meme thay bộ tạm | `public/stickers/memes/*.webp` |
| 4 | T-25 | Kịch bản clip 15–20 giây và caption Threads | Không sửa code |

---

## Prompt 1: 4 thiệp mini hai mặt (T-28)

Mẹo: dán kèm `src/lib/templates.ts` hiện tại để Gemini giữ lại phần chữ bạn đã ưng.

```
Bạn là copywriter và designer cho "Phygital Letter Studio". Người dùng tự in, cắt, dán một bộ quà MINI: phong bì 11,4 x 8,1 cm, một thiệp gập mở như cuốn sách (mỗi mặt 10,5 x 7,4 cm, nằm ngang) và một tờ thư viết tay gấp 3. Trong thiệp có mã QR mở trang web có nhạc. Người dùng là Gen Z Việt Nam 18–28 tuổi. Phong cách: NHỎ NHẮN, XINH XẮN, thoáng, ít chữ.

Mỗi mẫu gồm 2 mặt:
- front (bìa trước): một tiêu đề ngắn và vài hình trang trí. Không có QR.
- inside (trang bên phải khi mở thiệp): một lời mời ngắn và đúng 1 mã QR. (Trang bên trái là chỗ viết tay, bạn KHÔNG thiết kế.)

4 mẫu:
1. confession – Tỏ tình / Kỷ niệm: bìa có tiêu đề ngắn và tim.
2. wedding – Mời cưới: tông kem + đỏ rượu vang (#6E1F2A). Bìa: "Tên cô dâu & Tên chú rể". Trong: thời gian, địa điểm (ghi rõ là ví dụ), QR.
3. dinner – Mời đi ăn / hẹn hò: bìa kiểu "VÉ MỜI" với 1 sticker. Trong: thời gian, địa điểm, QR.
4. holiday – Sinh nhật / Giáng sinh: bìa lời chúc ngắn + 1 sticker.

Tiếng Việt có dấu, tự nhiên, ấm áp, không sến, không dùng tên người thật.

RÀNG BUỘC KỸ THUẬT (code có test tự động):
- Mỗi mặt là canvas 1760 x 1240 px, gốc (0,0) góc trên trái; 1 mm ≈ 16,76 px. Lề an toàn 84 px: mọi phần tử nằm trong x 84..1676, y 84..1156.
- Chữ: chiều cao ≈ số dòng x fontSize x 1.35; xuống dòng bằng "\n". Ghi rõ x và width cho từng khối chữ. fontSize NHỎ NHẤT 48. Tiêu đề nên 120–200. Mỗi mặt tối đa 3 khối chữ. Mỗi dòng đủ ngắn để không tự xuống dòng.
- Font: "Be Vietnam Pro", "Cormorant Garamond", "Playfair Display", "Charm", "Dancing Script", "Mali". Màu "#RRGGBB".
- Icon id: heart, heart-line, rings, star, sparkle, envelope, toast, flower, leaf, branch, tulip, wax-seal, wreath, squiggle, scribble-circle, arrow, underline, smile, crown, music-note. Icon nhỏ nhất 70 px.
- Sticker id: yeu-qua, nho-ban, di-an-hong, chot-keo, chuc-mung, sinh-nhat, doi-qua, met-xiu, ngu-day, bat-ngo, ngau, gian-roi, xin-loi, cam-on, thuong-lam, nho-den-nha, khong-gap-khong-ve, iu-iu, hong-be-oi, dong-y-di, hehe, xinh-xiu, qua-da, buon-nhe, giang-sinh. Vuông, 300–400 px (nhỏ hơn thì chữ trên sticker khó đọc).
- QR chỉ ở inside, đúng 1 mã, cạnh 340–440 px. Viền trắng rộng thêm 10% cạnh mỗi phía, viền cũng phải nằm trong lề an toàn. Màu QR đậm.
- Không phần tử nào đè nhau.
- Nền mỗi mặt: preset ("kraft" | "cream" | "grid" | "plaid") hoặc "#RRGGBB".
- Gợi ý thêm cho mỗi mẫu: màu phong bì (envelopeColor), chữ lồng ≤ 12 ký tự (ví dụ "u ♡"), một câu ngắn in trên nắp phong bì ≤ 80 ký tự.
- Khối web: acceptButton { question, yesText ≤40, noText ≤40, dodgeNo }, rsvp { eventDate "YYYY-MM-DDTHH:mm", locationName, mapsUrl "" }, poll { question, options 2–4 phương án khác nhau }.

TRẢ VỀ: một khối TypeScript dùng các hàm:
  text(y, "nội dung", fontSize, "Font", "#màu", { x, width })
  icon("id", x, y, size, "#màu")
  sticker("id", x, y, size, rotation?)
  qr(x, y, size, "#màu", "iconId giữa mã"?)
export const TEMPLATES = [ { type, name, description (≤90 ký tự), title,
  front: { background: { type, value, overlayOpacity: 0 }, elements: [...] },
  inside: { background: {...}, elements: [...] },
  envelope: { monogram, line }, envelopeColor, waxSealColor,
  web: { audio: { enabled: false, trackId, startTime: 0, volume: 0.4 }, blocks: {...} } }, ... ]
trackId lần lượt: romantic-1, wedding-1, fun-1, festive-1.
(Lập trình viên có thể đổi tên trường cho khớp code.)

Sau code, lập bảng cho từng phần tử: mặt, x, y, rộng, cao ước tính, mép phải, mép dưới, để chứng minh nằm trong lề an toàn và không chồng nhau.
```

---

## Prompt 2: 20 icon SVG (T-13)

```
Bạn là designer icon. Hãy vẽ lại 20 icon cho một web làm thiệp tay (tông ấm, tối giản, nét mềm như vẽ tay), dùng để dán lên thiệp và đổi màu tự do.

YÊU CẦU KỸ THUẬT:
- viewBox 0 0 24 24, mỗi icon là MỘT chuỗi path "d" duy nhất (có thể nhiều subpath M...Z).
- Icon "filled: true" được tô đặc bằng 1 màu; icon không có filled chỉ vẽ nét (stroke-width 1.4, bo tròn đầu nét). Đừng trộn: icon nét thì đừng dựa vào vùng tô.
- Nằm trong khoảng 1..23 của cả hai trục, cân giữa, nhìn rõ ở cỡ 32 px và đẹp khi in to 200 px.
- Không dùng transform, không dùng arc dạng phức tạp nếu có thể thay bằng đường cong C/Q.

GIỮ NGUYÊN id, label, category, filled như danh sách này:
minimal (Tối giản & Cưới): heart "Trái tim" (filled), heart-line "Tim viền", rings "Nhẫn cưới", star "Ngôi sao" (filled), sparkle "Lấp lánh" (filled), envelope "Phong thư", toast "Cụng ly"
flora (Hoa khô & Dấu sáp): flower "Bông hoa", leaf "Chiếc lá", branch "Cành lá", tulip "Tulip", wax-seal "Dấu sáp", wreath "Vòng lá"
doodle (Doodle vẽ tay): squiggle "Nét lượn", scribble-circle "Vòng khoanh", arrow "Mũi tên", underline "Gạch chân", smile "Mặt cười", crown "Vương miện", music-note "Nốt nhạc"

ĐỊNH DẠNG TRẢ VỀ: chỉ một khối TypeScript:
export const ICONS: LetterIcon[] = [
  { id: "heart", label: "Trái tim", category: "minimal", filled: true, d: "M..." },
  ... đủ 20 mục, đúng thứ tự trên
];
Sau đó gửi thêm một file SVG xem trước ghép 20 icon thành lưới 5 x 4 để tôi kiểm tra bằng mắt.
```

---

## Prompt 3 (tùy chọn): 25 sticker meme (T-13)

Bộ sticker hiện tại là hình tạm do Claude tự vẽ. Chỉ dùng prompt này nếu Gemini tạo được ảnh.

```
Vẽ 25 sticker chibi phong cách doodle Việt Nam, nền trong suốt, mỗi ảnh 400 x 400 px PNG, viền trắng dày quanh hình như sticker dán, nét mực nâu đậm #2B2623, màu pastel. Mỗi sticker có một nhân vật biểu cảm và một nhãn chữ tiếng Việt có dấu, rõ, ở dưới. Không dùng nhân vật, logo hay meme có bản quyền, không dùng mặt người thật.

Tên file (giữ đúng) và chữ trên nhãn:
yeu-qua "Yêu quá!", nho-ban "Nhớ bạn", di-an-hong "Đi ăn hông?", chot-keo "Chốt kèo!", chuc-mung "Chúc mừng!", sinh-nhat "HPBD nha!", doi-qua "Đói quá", met-xiu "Mệt xỉu", ngu-day "Buồn ngủ ghê", bat-ngo "Bất ngờ chưa!", ngau "Ngầu chưa", gian-roi "Giận rồi đó", xin-loi "Xin lỗi mà", cam-on "Cảm ơn nha", thuong-lam "Thương lắm", nho-den-nha "Nhớ đến nha", khong-gap-khong-ve "Không say không về", iu-iu "Iu iu", hong-be-oi "Hông bé ơi", dong-y-di "Đồng ý đi!", hehe "Hehe", xinh-xiu "Xinh xỉu", qua-da "Quá đã!", buon-nhe "Buồn nhẹ", giang-sinh "Noel vui vẻ"

Kiểm tra kỹ dấu tiếng Việt trên nhãn trước khi xuất.
```

Sau khi có ảnh: đổi sang WebP ≤ 30KB, đặt vào `public/stickers/memes/` với đúng tên, rồi chạy `npm test` (test kiểm tra đủ file và dung lượng).

---

## Prompt 4: Kịch bản clip ra mắt Threads (T-25)

```
Viết kịch bản quay clip dọc 9:16 dài 15–20 giây để ra mắt "Phygital Letter Studio" trên Threads, cho Gen Z Việt Nam.

Sản phẩm: web miễn phí, tự thiết kế thiệp A6, in ra giấy, bỏ vào phong bì Kraft đóng dấu sáp đỏ. Trên thiệp có mã QR; quét mã thì điện thoại hiện phong bì ảo, chạm vào con dấu thì nắp mở, nhạc phát đúng đoạn điệp khúc, lá thư trượt ra, có nút "Đồng ý" tung hoa giấy.

Đạo cụ có sẵn: 1 thiệp A6 in thật, 1 phong bì Kraft, sáp đỏ, 1 điện thoại, ánh sáng tự nhiên trên bàn gỗ. Quay bằng điện thoại, một người.

Trả về:
1. Bảng cảnh theo giây: thời gian, góc máy, hành động tay, chữ trên màn hình (tiếng Việt, ≤ 6 chữ mỗi cảnh), âm thanh.
2. 3 phương án hook cho 2 giây đầu.
3. 3 caption Threads (≤ 300 ký tự, giọng tự nhiên, không hashtag spam, có lời mời "link ở bình luận").
4. 1 bình luận ghim kèm link demo (để chỗ trống [LINK]).
5. Mẹo để mã QR trên thiệp quét được ngay trong clip (khoảng cách, ánh sáng, tránh lóa).
```

---

## Prompt 5: Nội dung mặc định cho trang web cuộn (T-35)

```
Bạn là copywriter cho "Phygital Letter Studio". Người nhận quét mã QR trên thiệp, bóc dấu sáp, nhạc phát, rồi LƯỚT DỌC một trang web trên điện thoại để nghe người gửi bày tỏ. Thư viết tay trên giấy là phần riêng tư, nên web KHÔNG lặp lại một bức thư mà dẫn người nhận đi qua kỷ niệm rồi đến câu hỏi. Người dùng là Gen Z Việt Nam.

Viết nội dung gợi ý (người tạo sẽ sửa lại) cho 4 mẫu, đúng thứ tự phần:
- confession: hero → first_day → memories (3 mục) → reasons (5 câu) → counter → message → interact → ending
- wedding: hero → counter (đếm ngược) → memories (3 mục chuyện tình) → interact → ending
- dinner: hero → counter → interact → ending
- holiday: hero → message → memories (4 mục) → ending

Giới hạn ký tự: hero.lead ≤ 200; first_day.text ≤ 500; memories[].caption ≤ 200; reasons[] ≤ 200, tối đa 8 câu; message.title ≤ 100, message.body ≤ 5000 (viết khoảng 400–600, chia đoạn bằng dòng trống); counter.label ≤ 80; ending.text ≤ 200.

Quy tắc giọng văn: gần gũi, thật, không sáo rỗng, câu ngắn dễ đọc trên điện thoại. Chỗ người tạo phải tự thay thì viết trong ngoặc vuông, ví dụ "[tên quán]". Không dùng tên người thật, không trích lời bài hát hay thơ có bản quyền.

Trả về JSON: { "confession": [ { "type": "hero", "lead": "..." }, { "type": "first_day", "text": "..." }, { "type": "memories", "items": [ { "caption": "..." } ] }, { "type": "reasons", "items": ["..."] }, { "type": "counter", "label": "...", "mode": "since" | "until" }, { "type": "message", "title": "...", "body": "..." }, { "type": "interact" }, { "type": "ending", "text": "..." } ], "wedding": [...], "dinner": [...], "holiday": [...] }
Tên trường có thể được lập trình viên đổi cho khớp code; hãy giữ nguyên cấu trúc.
```

