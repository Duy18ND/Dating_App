# T-28 — 4 mẫu thiệp mini hai mặt (`1760 × 1240 px`)

- **Phiên bản**: v1.3 (thiệp gập mini mỗi mặt `10,5 × 7,4 cm`, bỏ vừa phong bì C7 `11,4 × 8,1 cm`).
- **Canvas logic mỗi mặt**: `1760 × 1240 px`, gốc `(0, 0)` góc trên trái (`1 mm ≈ 16,76 px`).
- **Lề an toàn**: `84 px` → mọi phần tử (tính cả viền trắng `+10%` mỗi phía của mã QR) đều nằm trong `x ∈ [84, 1676]`, `y ∈ [84, 1156]`.
- **Đã kiểm chứng tự động**:
  - `front`: 0 mã QR, tối đa 3 khối chữ, không chồng lấn.
  - `inside`: đúng 1 mã QR (`400 × 400 px`, viền trắng `+40 px`/phía, màu tương phản cao ≥ 4.5 trên nền trắng), tối đa 3 khối chữ, không chồng lấn.
  - Mọi `fontSize >= 48`, tiêu đề `104..160`, icon `>= 70 px`, sticker vuông `380 px` (`300..400 px`).
  - `description <= 90` ký tự, `envelope.monogram <= 12` ký tự, `envelope.line <= 80` ký tự, `yesText / noText <= 40` ký tự.

---

## Code TypeScript (giữ đúng chữ ký helper `text`, `icon`, `sticker`, `qr`)

```ts
// Helper signatures expected by this template definition:
//   text(y, "nội dung", fontSize, "Font", "#màu", { x, width })
//   icon("id", x, y, size, "#màu")
//   sticker("id", x, y, size, rotation?)
//   qr(x, y, size, "#màu", "iconId giữa mã"?)

export const TEMPLATES = [
  {
    type: "confession",
    name: "Tỏ tình / Kỷ niệm",
    description: "Thiệp mini gập ngang: bìa tim nhỏ gọn, mặt trong mở nhạc và lời tỏ tình.",
    title: "Gửi cậu một điều nhỏ",
    front: {
      background: { type: "preset", value: "cream", overlayOpacity: 0 },
      elements: [
        icon("sparkle", 660, 176, 80, "#C8A882"),
        icon("heart", 800, 146, 160, "#8E2424"),
        icon("sparkle", 1020, 176, 80, "#C8A882"),
        text(380, "Gửi cậu\nmột điều nhỏ", 160, "Charm", "#8E2424", { x: 180, width: 1400 }),
        text(876, "Chỉ dành riêng cho người đang cầm tấm thiệp này", 54, "Cormorant Garamond", "#5C524B", {
          x: 180,
          width: 1400,
        }),
        icon("heart-line", 840, 996, 80, "#C8A882"),
      ],
    },
    inside: {
      background: { type: "preset", value: "cream", overlayOpacity: 0 },
      elements: [
        text(240, "Có một bản nhạc\nvà câu hỏi nhỏ", 104, "Charm", "#8E2424", { x: 120, width: 920 }),
        text(
          580,
          "Quét mã bên cạnh để mở phong bì online\nvà nghe điều mình chưa dám nói trực tiếp.",
          50,
          "Cormorant Garamond",
          "#5C524B",
          { x: 120, width: 920 },
        ),
        text(790, "Bật loa nhỏ thôi nha · Đọc xong bấm trả lời", 48, "Be Vietnam Pro", "#7A7067", {
          x: 120,
          width: 920,
        }),
        icon("music-note", 520, 920, 100, "#C8A882"),
        qr(1190, 420, 400, "#8E2424", "heart"),
      ],
    },
    envelope: {
      monogram: "u ♡",
      line: "Mở nhẹ thôi nha, có điều nhỏ muốn nói.",
    },
    envelopeColor: "#DFC7A9",
    waxSealColor: "#8E2424",
    web: {
      audio: { enabled: false, trackId: "romantic-1", startTime: 0, volume: 0.4 },
      blocks: {
        acceptButton: {
          enabled: true,
          question: "Mình chính thức hẹn hò nha?",
          yesText: "Đồng ý luôn",
          noText: "Cho suy nghĩ thêm xíu",
          dodgeNo: true,
        },
      },
    },
  },
  {
    type: "wedding",
    name: "Mời cưới / Đính hôn",
    description: "Thiệp cưới mini tông kem – đỏ rượu vang, bìa tên đôi uyên ương, trong có QR.",
    title: "Thiệp mời thành hôn",
    front: {
      background: { type: "color", value: "#FBF6EE", overlayOpacity: 0 },
      elements: [
        icon("rings", 805, 130, 150, "#6E1F2A"),
        text(320, "TRÂN TRỌNG KÍNH MỜI", 56, "Cormorant Garamond", "#6E1F2A", { x: 180, width: 1400 }),
        icon("branch", 110, 520, 180, "#A8894F"),
        text(440, "Tên cô dâu\n&\nTên chú rể", 136, "Playfair Display", "#6E1F2A", { x: 330, width: 1100 }),
        icon("leaf", 1470, 530, 170, "#A8894F"),
        icon("wreath", 830, 1020, 100, "#A8894F"),
      ],
    },
    inside: {
      background: { type: "color", value: "#FBF6EE", overlayOpacity: 0 },
      elements: [
        text(210, "Tiệc thành hôn", 112, "Playfair Display", "#6E1F2A", { x: 120, width: 920 }),
        text(
          416,
          "17:30 · Chủ nhật, 10.01.2027\nTrung tâm Tiệc cưới (Tên địa điểm)\nSố nhà, Đường, Quận, TP (ví dụ)",
          52,
          "Cormorant Garamond",
          "#2B2623",
          { x: 120, width: 920 },
        ),
        text(700, "Quét mã để xác nhận tham dự\nvà xem bản đồ chỉ đường", 48, "Be Vietnam Pro", "#7A7067", {
          x: 120,
          width: 920,
        }),
        icon("branch", 510, 900, 140, "#A8894F"),
        qr(1190, 420, 400, "#6E1F2A", "rings"),
      ],
    },
    envelope: {
      monogram: "A & B",
      line: "Trân trọng kính mời đến chung vui cùng chúng mình.",
    },
    envelopeColor: "#F4E9DA",
    waxSealColor: "#6E1F2A",
    web: {
      audio: { enabled: false, trackId: "wedding-1", startTime: 0, volume: 0.4 },
      blocks: {
        rsvp: {
          enabled: true,
          eventDate: "2027-01-10T17:30",
          locationName: "Trung tâm Tiệc cưới (Tên địa điểm)",
          mapsUrl: "",
        },
      },
    },
  },
  {
    type: "dinner",
    name: "Mời ăn / Hẹn hò",
    description: "Vé mời đi ăn mini kèm 1 sticker meme, mặt trong hẹn lịch và bình chọn món.",
    title: "Vé mời đi ăn",
    front: {
      background: { type: "preset", value: "kraft", overlayOpacity: 0 },
      elements: [
        text(140, "★ VÉ HẸN VIP · ĐÃ THANH TOÁN TẤM LÒNG ★", 48, "Be Vietnam Pro", "#8E2424", {
          x: 120,
          width: 1520,
        }),
        text(320, "VÉ MỜI\nĐI ĂN", 160, "Mali", "#2B2623", { x: 120, width: 960 }),
        text(810, "Có giá trị cho 01 buổi no nê\nvà nói xấu cả thế giới", 52, "Be Vietnam Pro", "#4E433C", {
          x: 120,
          width: 960,
        }),
        icon("toast", 530, 996, 120, "#8E2424"),
        sticker("di-an-hong", 1180, 400, 380, 6),
        icon("star", 1220, 840, 80, "#C9A227"),
        icon("star", 1440, 840, 80, "#C9A227"),
      ],
    },
    inside: {
      background: { type: "preset", value: "cream", overlayOpacity: 0 },
      elements: [
        text(200, "Chốt lịch nha!", 120, "Mali", "#8E2424", { x: 120, width: 920 }),
        text(426, "Thời gian: 19:00 · Thứ Bảy (ví dụ)\nĐịa điểm: [Tên quán quen]", 52, "Mali", "#2B2623", {
          x: 120,
          width: 920,
        }),
        text(660, "Quét mã để vote món ăn\nvà xác nhận kèo tối nay!", 50, "Be Vietnam Pro", "#5C524B", {
          x: 120,
          width: 920,
        }),
        icon("squiggle", 440, 890, 140, "#8E2424"),
        qr(1190, 420, 400, "#2B2623", "toast"),
      ],
    },
    envelope: {
      monogram: "VIP ✦",
      line: "Vé chính chủ — không đổi trả, không bùng kèo!",
    },
    envelopeColor: "#C9A97E",
    waxSealColor: "#8E2424",
    web: {
      audio: { enabled: false, trackId: "fun-1", startTime: 0, volume: 0.4 },
      blocks: {
        poll: {
          enabled: true,
          question: "Tối nay tụi mình ăn gì cho đã?",
          options: ["Lẩu cay", "Thịt nướng", "Bún đậu mắm tôm"],
        },
        acceptButton: {
          enabled: true,
          question: "Chốt lịch hẹn này luôn nha?",
          yesText: "Chốt đơn liền",
          noText: "Hôm khác đi mà",
          dodgeNo: true,
        },
      },
    },
  },
  {
    type: "holiday",
    name: "Sinh nhật / Giáng sinh",
    description: "Thiệp chúc mini kẹp hộp quà: bìa sticker vui mắt, mặt trong quét QR mở quà.",
    title: "Chúc ngày thật vui",
    front: {
      background: { type: "preset", value: "plaid", overlayOpacity: 0 },
      elements: [
        icon("sparkle", 140, 150, 90, "#C9A227"),
        icon("sparkle", 1530, 150, 90, "#C9A227"),
        text(300, "Chúc cậu\nmột ngày\nthật rực rỡ!", 136, "Dancing Script", "#8E2424", { x: 120, width: 940 }),
        text(910, "GỬI KÈM NHIỀU NIỀM VUI NHỎ", 48, "Be Vietnam Pro", "#2F4A3A", { x: 120, width: 940 }),
        sticker("chuc-mung", 1160, 410, 380, -4),
        icon("star", 1310, 860, 90, "#C9A227"),
      ],
    },
    inside: {
      background: { type: "preset", value: "cream", overlayOpacity: 0 },
      elements: [
        text(240, "Mở món quà nhỏ\nở bên cạnh nhé", 112, "Charm", "#2F4A3A", { x: 120, width: 920 }),
        text(
          610,
          "Quét mã QR để nghe nhạc\nvà xem lại mấy khoảnh khắc đáng nhớ.",
          50,
          "Cormorant Garamond",
          "#5C524B",
          { x: 120, width: 920 },
        ),
        text(820, "Giữ tấm thiệp mini này kẹp sổ tay nha", 48, "Be Vietnam Pro", "#7A7067", {
          x: 120,
          width: 920,
        }),
        icon("crown", 520, 950, 110, "#C9A227"),
        qr(1190, 420, 400, "#2F4A3A", "star"),
      ],
    },
    envelope: {
      monogram: "HPBD ★",
      line: "Kẹp kèm thật nhiều niềm vui nhỏ gửi cậu.",
    },
    envelopeColor: "#E8DEC8",
    waxSealColor: "#2F4A3A",
    web: {
      audio: { enabled: false, trackId: "festive-1", startTime: 0, volume: 0.4 },
      blocks: {
        acceptButton: {
          enabled: true,
          question: "Nhận hết lời chúc và niềm vui này nha?",
          yesText: "Nhận luôn nè!",
          noText: "Xin thêm chút may mắn",
          dodgeNo: false,
        },
      },
    },
  },
];
```

---

## Bảng chứng minh tọa độ & không chồng lấn (`x: 84..1676`, `y: 84..1156`)

| Mẫu | Mặt | Phần tử | x | y | Rộng | Cao ước tính | Mép phải | Mép dưới |
|---|---|---|---:|---:|---:|---:|---:|---:|
| `confession` | front | `icon("sparkle")` trái | 660 | 176 | 80 | 80.0 | 740 | 256.0 |
| `confession` | front | `icon("heart")` | 800 | 146 | 160 | 160.0 | 960 | 306.0 |
| `confession` | front | `icon("sparkle")` phải | 1020 | 176 | 80 | 80.0 | 1100 | 256.0 |
| `confession` | front | `text` tiêu đề (160px, 2 dòng) | 180 | 380 | 1400 | 432.0 | 1580 | 812.0 |
| `confession` | front | `text` phụ đề (54px, 1 dòng) | 180 | 876 | 1400 | 72.9 | 1580 | 948.9 |
| `confession` | front | `icon("heart-line")` | 840 | 996 | 80 | 80.0 | 920 | 1076.0 |
| `confession` | inside | `text` tiêu đề (104px, 2 dòng) | 120 | 240 | 920 | 280.8 | 1040 | 520.8 |
| `confession` | inside | `text` lời mời (50px, 2 dòng) | 120 | 580 | 920 | 135.0 | 1040 | 715.0 |
| `confession` | inside | `text` ghi chú (48px, 1 dòng) | 120 | 790 | 920 | 64.8 | 1040 | 854.8 |
| `confession` | inside | `icon("music-note")` | 520 | 920 | 100 | 100.0 | 620 | 1020.0 |
| `confession` | inside | `qr` 400px (+40px quiet zone) | 1150 | 380 | 480 | 480.0 | 1630 | 860.0 |
| `wedding` | front | `icon("rings")` | 805 | 130 | 150 | 150.0 | 955 | 280.0 |
| `wedding` | front | `text` "TRÂN TRỌNG..." (56px, 1 dòng) | 180 | 320 | 1400 | 75.6 | 1580 | 395.6 |
| `wedding` | front | `icon("branch")` trái | 110 | 520 | 180 | 180.0 | 290 | 700.0 |
| `wedding` | front | `text` tên đôi (136px, 3 dòng) | 330 | 440 | 1100 | 550.8 | 1430 | 990.8 |
| `wedding` | front | `icon("leaf")` phải | 1470 | 530 | 170 | 170.0 | 1640 | 700.0 |
| `wedding` | front | `icon("wreath")` | 830 | 1020 | 100 | 100.0 | 930 | 1120.0 |
| `wedding` | inside | `text` "Tiệc thành hôn" (112px, 1 dòng) | 120 | 210 | 920 | 151.2 | 1040 | 361.2 |
| `wedding` | inside | `text` ngày & địa điểm (52px, 3 dòng) | 120 | 416 | 920 | 210.6 | 1040 | 626.6 |
| `wedding` | inside | `text` hướng dẫn QR (48px, 2 dòng) | 120 | 700 | 920 | 129.6 | 1040 | 829.6 |
| `wedding` | inside | `icon("branch")` | 510 | 900 | 140 | 140.0 | 650 | 1040.0 |
| `wedding` | inside | `qr` 400px (+40px quiet zone) | 1150 | 380 | 480 | 480.0 | 1630 | 860.0 |
| `dinner` | front | `text` dòng vé VIP (48px, 1 dòng) | 120 | 140 | 1520 | 64.8 | 1640 | 204.8 |
| `dinner` | front | `text` "VÉ MỜI\nĐI ĂN" (160px, 2 dòng) | 120 | 320 | 960 | 432.0 | 1080 | 752.0 |
| `dinner` | front | `text` mô tả vé (52px, 2 dòng) | 120 | 810 | 960 | 140.4 | 1080 | 950.4 |
| `dinner` | front | `icon("toast")` | 530 | 996 | 120 | 120.0 | 650 | 1116.0 |
| `dinner` | front | `sticker("di-an-hong")` (xoay +6°) | 1180 | 400 | 380 | 380.0 | 1560 | 780.0 |
| `dinner` | front | `icon("star")` trái | 1220 | 840 | 80 | 80.0 | 1300 | 920.0 |
| `dinner` | front | `icon("star")` phải | 1440 | 840 | 80 | 80.0 | 1520 | 920.0 |
| `dinner` | inside | `text` "Chốt lịch nha!" (120px, 1 dòng) | 120 | 200 | 920 | 162.0 | 1040 | 362.0 |
| `dinner` | inside | `text` giờ & địa điểm (52px, 2 dòng) | 120 | 426 | 920 | 140.4 | 1040 | 566.4 |
| `dinner` | inside | `text` hướng dẫn QR (50px, 2 dòng) | 120 | 660 | 920 | 135.0 | 1040 | 795.0 |
| `dinner` | inside | `icon("squiggle")` | 440 | 890 | 140 | 140.0 | 580 | 1030.0 |
| `dinner` | inside | `qr` 400px (+40px quiet zone) | 1150 | 380 | 480 | 480.0 | 1630 | 860.0 |
| `holiday` | front | `icon("sparkle")` trái | 140 | 150 | 90 | 90.0 | 230 | 240.0 |
| `holiday` | front | `icon("sparkle")` phải | 1530 | 150 | 90 | 90.0 | 1620 | 240.0 |
| `holiday` | front | `text` lời chúc (136px, 3 dòng) | 120 | 300 | 940 | 550.8 | 1060 | 850.8 |
| `holiday` | front | `text` phụ đề (48px, 1 dòng) | 120 | 910 | 940 | 64.8 | 1060 | 974.8 |
| `holiday` | front | `sticker("chuc-mung")` (xoay -4°) | 1160 | 410 | 380 | 380.0 | 1540 | 790.0 |
| `holiday` | front | `icon("star")` | 1310 | 860 | 90 | 90.0 | 1400 | 950.0 |
| `holiday` | inside | `text` tiêu đề (112px, 2 dòng) | 120 | 240 | 920 | 302.4 | 1040 | 542.4 |
| `holiday` | inside | `text` lời mời QR (50px, 2 dòng) | 120 | 610 | 920 | 135.0 | 1040 | 745.0 |
| `holiday` | inside | `text` gợi ý kẹp sổ (48px, 1 dòng) | 120 | 820 | 920 | 64.8 | 1040 | 884.8 |
| `holiday` | inside | `icon("crown")` | 520 | 950 | 110 | 110.0 | 630 | 1060.0 |
| `holiday` | inside | `qr` 400px (+40px quiet zone) | 1150 | 380 | 480 | 480.0 | 1630 | 860.0 |
