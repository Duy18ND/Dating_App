# Prompt cho Gemini

Mỗi prompt dán nguyên khối vào Gemini. Kết quả Gemini trả về thì gửi lại cho Claude (Sonnet) để ghép vào code và chạy test.

| # | Task | Gemini làm gì | File sẽ thay |
|---|---|---|---|
| 1 | T-17 | Viết lại nội dung chữ và bố cục 4 mẫu thiệp A6 | `src/lib/templates.ts` |
| 2 | T-13 | Vẽ lại 20 icon SVG đẹp hơn | `src/lib/icons.ts` |
| 3 | T-13 (tùy chọn) | Vẽ 25 sticker meme thay bộ tạm | `public/stickers/memes/*.webp` |
| 4 | T-25 | Kịch bản clip 15–20 giây và caption Threads | Không sửa code |

---

## Prompt 1: Nội dung và bố cục 4 mẫu thiệp A6 (T-17)

```
Bạn là copywriter và designer cho "Phygital Letter Studio": web tạo thiệp giấy khổ A6 (105 x 148 mm), in ra, bỏ vào phong bì Kraft đóng dấu sáp; trên thiệp có mã QR mở bản web có nhạc. Người dùng là Gen Z Việt Nam 18–28 tuổi.

Hãy soạn 4 mẫu thiệp, viết bằng tiếng Việt có dấu, tự nhiên, ấm áp, không sến, không dùng tên người thật:
1. confession – Tỏ tình / Kỷ niệm. Bố cục: 35% trên là tiêu đề (hoặc chỗ dán ảnh Polaroid), 45% giữa là 6–8 dòng kẻ để viết tay, 20% dưới là mã QR + một câu nhắn quét mã.
2. wedding – Mời cưới / Đính hôn. Trang trọng, tông kem và đỏ rượu vang (#6E1F2A), có tên cô dâu chú rể, thời gian, địa điểm (dùng tên ví dụ rõ ràng là ví dụ, ví dụ "Tên cô dâu & Tên chú rể").
3. dinner – Vé mời ăn / Hẹn hò. Vui nhộn, dạng vé (ticket), có chỗ cho 2 sticker meme.
4. holiday – Sinh nhật / Giáng sinh. Dạng bưu thiếp, có vùng chấm bi để viết lời chúc, có 1 sticker.

RÀNG BUỘC KỸ THUẬT (bắt buộc đúng, code sẽ chạy test tự động):
- Canvas logic 1240 x 1754 px, gốc (0,0) ở góc trên trái. Lề an toàn 94 px: mọi phần tử phải nằm trong khung x từ 94 đến 1146, y từ 94 đến 1660.
- Chữ: chiều cao ước tính = số dòng x fontSize x 1.35. Xuống dòng bằng "\n". Chữ căn giữa trong khung rộng mặc định x=94, width=1052.
- Font chỉ được dùng: "Be Vietnam Pro", "Cormorant Garamond", "Playfair Display", "Charm", "Dancing Script", "Mali". Màu chữ dạng "#RRGGBB".
- Icon chỉ được dùng các id: heart, heart-line, rings, star, sparkle, envelope, toast, flower, leaf, branch, tulip, wax-seal, wreath, squiggle, scribble-circle, arrow, underline, smile, crown, music-note.
- Sticker chỉ được dùng các id: yeu-qua, nho-ban, di-an-hong, chot-keo, chuc-mung, sinh-nhat, doi-qua, met-xiu, ngu-day, bat-ngo, ngau, gian-roi, xin-loi, cam-on, thuong-lam, nho-den-nha, khong-gap-khong-ve, iu-iu, hong-be-oi, dong-y-di, hehe, xinh-xiu, qua-da, buon-nhe, giang-sinh. Sticker vuông, cạnh tối đa 400 px.
- Mỗi mẫu có đúng 1 mã QR, cạnh từ 240 đến 300 px. QR có viền trắng phụ thêm ra ngoài 10% cạnh (tối thiểu 12 px) mỗi phía, viền này cũng phải nằm trong lề an toàn. Màu QR phải đậm (tương phản cao trên nền trắng).
- Vùng viết tay: lined_area với lineStyle "ruled" (dòng kẻ, cách nhau 80 px) hoặc "dot_grid" (chấm bi, cách 46 px).
- Nền: preset ("kraft" | "cream" | "grid" | "plaid") hoặc màu "#RRGGBB".
- Khối web: acceptButton { question, yesText (≤40 ký tự), noText (≤40), dodgeNo }, rsvp { eventDate "YYYY-MM-DDTHH:mm", locationName, mapsUrl "" }, poll { question, options: 2–4 phương án khác nhau }.

ĐỊNH DẠNG TRẢ VỀ: chỉ trả một khối TypeScript, giữ đúng các hàm trợ giúp sau (đã có sẵn trong code):
  text(y, "nội dung", fontSize, "Font", "#màu", { x, width }?)
  icon("id", x, y, size, "#màu")
  sticker("id", x, y, size, rotation?)
  qr(x, y, size, "#màu", "iconId giữa mã"?)
  { type: "lined_area", x, y, width, height, lineStyle: "ruled" | "dot_grid" }

Dạng:
export const TEMPLATES: Template[] = [
  {
    type: "confession",
    name: "...", description: "...(≤ 90 ký tự)", title: "...",
    background: { type: "preset", value: "cream", overlayOpacity: 0 },
    elements: [ ...các lời gọi hàm ở trên, theo thứ tự từ dưới lên trên ],
    web: { audio: { enabled: false, trackId: "romantic-1", startTime: 0, volume: 0.4 }, blocks: { ... } },
  },
  ...3 mẫu còn lại (trackId lần lượt: wedding-1, fun-1, festive-1)
];

Sau khối code, liệt kê ngắn cho từng phần tử: y bắt đầu, chiều cao ước tính, y kết thúc, để chứng minh không chồng lấn và nằm trong lề an toàn.
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
