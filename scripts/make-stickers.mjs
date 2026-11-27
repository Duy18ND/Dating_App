// Sinh 25 sticker chibi phong cách doodle Việt Nam (100% nguyên bản, không dùng hình bên thứ ba)
// ra public/stickers/memes/*.webp (400x400, nền trong suốt, viền trắng dày, <= 30KB).
// Chạy: node scripts/make-stickers.mjs
import { mkdir, readFile } from "node:fs/promises";
import sharp from "sharp";

const list = JSON.parse(await readFile(new URL("../src/lib/stickers.json", import.meta.url), "utf8"));
const OUT = new URL("../public/stickers/memes/", import.meta.url);
const INK = "#2B2623";

const stroke = (d, width = 8, color = INK, extra = "") =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const dot = (x, y, r = 9.5, fill = INK) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const heart = (x, y, s = 1, fill = "#E8556D", outlined = false) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 16 C-13 7 -19 1 -19 -6 C-19 -13 -14 -17 -8.5 -17 C-4.5 -17 -1.8 -14.5 0 -11 C1.8 -14.5 4.5 -17 8.5 -17 C14 -17 19 -13 19 -6 C19 1 13 7 0 16Z" fill="${fill}"${outlined ? ` stroke="${INK}" stroke-width="${5 / s}" stroke-linejoin="round"` : ""}/>`;
const sparkle4 = (x, y, s = 1, fill = "#F5B841") =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -18 Q2.5 -2.5 18 0 Q2.5 2.5 0 18 Q-2.5 2.5 -18 0 Q-2.5 -2.5 0 -18Z" fill="${fill}"/>`;

// 4 nhân vật chibi gốc: cat (mèo béo), bear (gấu tròn), bunny (thỏ tai mềm), mochi (bé bánh mochi)
const CHAR_SPECIES = {
  "yeu-qua": "cat",
  "nho-ban": "bunny",
  "di-an-hong": "bear",
  "chot-keo": "cat",
  "chuc-mung": "bunny",
  "sinh-nhat": "bear",
  "doi-qua": "mochi",
  "met-xiu": "cat",
  "ngu-day": "bear",
  "bat-ngo": "bunny",
  "ngau": "cat",
  "gian-roi": "mochi",
  "xin-loi": "bunny",
  "cam-on": "bear",
  "thuong-lam": "cat",
  "nho-den-nha": "mochi",
  "khong-gap-khong-ve": "bear",
  "iu-iu": "bunny",
  "hong-be-oi": "cat",
  "dong-y-di": "bunny",
  "hehe": "cat",
  "xinh-xiu": "bunny",
  "qua-da": "mochi",
  "buon-nhe": "mochi",
  "giang-sinh": "bear",
};

const BODY_PATH =
  "M200 84 C278 84 316 142 316 206 C316 266 276 298 200 298 C124 298 84 266 84 206 C84 142 122 84 200 84 Z";

function speciesOutline(species, id) {
  if (id === "buon-nhe") return [];
  switch (species) {
    case "cat":
      return [
        "M108 134 L94 64 Q128 70 154 96 Z",
        "M292 134 L306 64 Q272 70 246 96 Z",
      ];
    case "bear":
      return [
        "M118 68 C140 68 154 84 150 108 C134 114 110 116 98 100 C92 84 102 68 118 68 Z",
        "M282 68 C260 68 246 84 250 108 C266 114 290 116 302 100 C308 84 298 68 282 68 Z",
      ];
    case "bunny":
      return [
        "M148 98 C126 42 138 22 158 26 C178 30 182 68 176 92 Z",
        "M252 98 C274 42 262 22 242 26 C222 30 218 68 224 92 Z",
      ];
    case "mochi":
      return ["M200 84 Q190 54 176 48 Q196 46 202 68 Q214 48 228 56 Q212 66 205 84 Z"];
  }
}

function speciesDetails(species, color, id) {
  const ears = speciesOutline(species, id)
    .map((d) => `<path d="${d}" fill="${species === "mochi" ? "#8AC47E" : color}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>`)
    .join("");
  const inner =
    species === "cat"
      ? `<path d="M113 120 L105 80 Q126 84 140 101 Z" fill="#F4A5B5" opacity="0.75"/>
         <path d="M287 120 L295 80 Q274 84 260 101 Z" fill="#F4A5B5" opacity="0.75"/>`
      : species === "bear"
        ? `<circle cx="122" cy="92" r="14" fill="#F4B2B8" opacity="0.6"/>
           <circle cx="278" cy="92" r="14" fill="#F4B2B8" opacity="0.6"/>`
        : species === "bunny"
          ? `<path d="M152 88 C141 52 147 38 157 40 C167 42 169 68 166 86 Z" fill="#F6ACBC" opacity="0.8"/>
             <path d="M248 88 C259 52 253 38 243 40 C233 42 231 68 234 86 Z" fill="#F6ACBC" opacity="0.8"/>`
          : "";
  const whiskers =
    species === "cat"
      ? stroke("M68 194 L94 198 M66 212 L94 210 M332 194 L306 198 M334 212 L306 210", 5.5)
      : "";
  const muzzle =
    species === "bear"
      ? `<ellipse cx="200" cy="224" rx="44" ry="30" fill="#FFF8EE" opacity="0.72"/>`
      : "";
  return { ears, inner, whiskers, muzzle };
}

const EYES = {
  dots:
    dot(156, 182, 10.5) + dot(244, 182, 10.5) + dot(152, 178, 3.2, "#fff") + dot(240, 178, 3.2, "#fff"),
  happy:
    stroke("M136 184 Q156 158 176 184", 8.5) + stroke("M224 184 Q244 158 264 184", 8.5),
  love: heart(156, 182, 1.05, "#E84C68") + heart(244, 182, 1.05, "#E84C68"),
  wink:
    dot(156, 182, 10.5) + dot(152, 178, 3.2, "#fff") + stroke("M224 182 Q244 166 264 182", 8.5),
  cry:
    `<path d="M144 190 Q134 226 146 244 Q162 248 160 226 Z M256 190 Q266 226 254 244 Q238 248 240 226 Z" fill="#7AC3EE" opacity="0.9"/>` +
    stroke("M136 178 Q156 188 174 176", 8) + stroke("M226 176 Q244 188 264 178", 8),
  shock:
    `<circle cx="156" cy="180" r="21" fill="#fff" stroke="${INK}" stroke-width="6.5"/>` +
    `<circle cx="244" cy="180" r="21" fill="#fff" stroke="${INK}" stroke-width="6.5"/>` +
    dot(156, 180, 7.5) + dot(244, 180, 7.5) + dot(152, 175, 2.8, "#fff") + dot(240, 175, 2.8, "#fff"),
  sleepy:
    stroke("M136 182 Q156 196 176 182", 7.5) + stroke("M224 182 Q244 196 264 182", 7.5),
  cool:
    `<path d="M116 164 H192 Q189 208 154 208 Q119 208 116 164 Z M208 164 H284 Q281 208 246 208 Q211 208 208 164 Z" fill="${INK}"/>` +
    stroke("M188 172 H212", 7.5) +
    stroke("M130 176 L146 196 M222 176 L238 196", 4.5, "#FFFFFF"),
  star:
    `<circle cx="156" cy="180" r="16" fill="${INK}"/>` +
    `<circle cx="244" cy="180" r="16" fill="${INK}"/>` +
    sparkle4(156, 180, 0.72, "#FFF5CC") + sparkle4(244, 180, 0.72, "#FFF5CC"),
  angry:
    stroke("M132 156 L178 172", 8) + stroke("M268 156 L222 172", 8) +
    dot(158, 186, 10) + dot(242, 186, 10),
};

const MOUTHS = {
  smile: stroke("M176 222 Q200 246 224 222", 7.5),
  grin:
    `<path d="M168 214 H232 Q228 258 200 258 Q172 258 168 214 Z" fill="#C94B5C" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>` +
    `<path d="M180 246 Q200 234 220 246 Q210 256 200 256 Q190 256 180 246 Z" fill="#F28FA0"/>`,
  o: `<ellipse cx="200" cy="232" rx="15" ry="19" fill="#C94B5C" stroke="${INK}" stroke-width="6.5"/>`,
  sad: stroke("M176 240 Q200 218 224 240", 7.5),
  cat: stroke("M172 222 Q186 240 200 224 Q214 240 228 222", 7.2),
  tongue:
    stroke("M174 218 Q200 240 226 218", 7.2) +
    `<path d="M190 230 Q192 260 214 252 Q222 242 212 226 Z" fill="#F07B93" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`,
  flat: stroke("M178 232 H222", 7.5),
};

// Tay chibi và đạo cụ riêng theo từng sticker để 25 hình đều có cá tính riêng!
function propsFor(id, color) {
  const paw = (cx, cy, rot = 0) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="22" ry="16" transform="rotate(${rot} ${cx} ${cy})" fill="${color}" stroke="${INK}" stroke-width="7"/>`;
  switch (id) {
    case "yeu-qua":
      return (
        heart(200, 272, 1.55, "#E84C68", true) +
        paw(162, 274, 24) + paw(238, 274, -24) +
        heart(68, 86, 1.15, "#E84C68") + heart(332, 74, 0.95, "#F27890") + heart(344, 154, 0.72, "#E84C68")
      );
    case "nho-ban":
      return (
        `<g transform="translate(158 248) rotate(-8)">
           <rect x="0" y="0" width="84" height="54" rx="10" fill="#FFFDF8" stroke="${INK}" stroke-width="6.5"/>
           ${stroke("M4 6 L42 32 L80 6", 6)}
           ${heart(42, 31, 0.52, "#E84C68")}
         </g>` +
        paw(152, 276, 15) + paw(248, 272, -15)
      );
    case "di-an-hong":
      return (
        `<g transform="translate(274 214)">
           ${stroke("M10 -12 Q6 -28 16 -38 M32 -14 Q28 -30 38 -40", 5, "#C7A78A")}
           <path d="M-12 8 H74 Q70 54 31 54 Q-8 54 -12 8 Z" fill="#FFF8EE" stroke="${INK}" stroke-width="6.5" stroke-linejoin="round"/>
           <path d="M-6 8 Q31 -10 68 8 Z" fill="#F4C05A" stroke="${INK}" stroke-width="5.5"/>
           ${stroke("M14 4 L64 -26 M26 4 L70 -16", 6, "#8D5B3E")}
         </g>` +
        paw(112, 258, -18) + sparkle4(66, 98, 0.95) + sparkle4(344, 96, 0.8)
      );
    case "chot-keo":
      return (
        `<g transform="translate(292 226)">
           <path d="M0 24 C0 6 12 -18 22 -18 C32 -18 32 4 28 12 L48 12 C56 12 56 26 48 28 C54 32 52 44 44 46 C48 52 44 60 34 60 L12 60 C2 60 0 46 0 24 Z" fill="${color}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
         </g>` +
        sparkle4(68, 96, 1.05) + sparkle4(342, 108, 0.85)
      );
    case "chuc-mung":
      return (
        `<path d="M200 22 L162 94 L238 94 Z" fill="#E8556D" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>` +
        stroke("M177 68 L223 68 M188 46 L212 46", 5.5, "#FFE07D") +
        dot(200, 22, 11, "#FFE07D") +
        `<circle cx="200" cy="22" r="11" fill="none" stroke="${INK}" stroke-width="5.5"/>` +
        sparkle4(68, 108, 1) + sparkle4(336, 98, 0.9) + dot(82, 152, 7, "#6EB5E8") + dot(324, 154, 7, "#E8556D")
      );
    case "sinh-nhat":
      return (
        `<g transform="translate(262 232)">
           <rect x="0" y="16" width="68" height="40" rx="10" fill="#FFF3D6" stroke="${INK}" stroke-width="6.5"/>
           <path d="M0 26 Q14 36 26 26 Q38 36 50 26 Q60 36 68 26 V16 H0 Z" fill="#F27890" stroke="${INK}" stroke-width="5.5"/>
           <rect x="29" y="-6" width="10" height="22" rx="3" fill="#7AC3EE" stroke="${INK}" stroke-width="5"/>
           <path d="M34 -26 Q44 -14 34 -6 Q24 -14 34 -26 Z" fill="#F7B733" stroke="${INK}" stroke-width="4"/>
         </g>` +
        paw(112, 260, -18) + sparkle4(72, 108, 0.95) + sparkle4(334, 104, 0.95)
      );
    case "doi-qua":
      return (
        `<g transform="translate(152 258)">
           <path d="M0 0 H96 Q90 42 48 42 Q6 42 0 0 Z" fill="#FFFDF8" stroke="${INK}" stroke-width="6.5" stroke-linejoin="round"/>
         </g>` +
        stroke("M58 176 Q46 196 58 214 M342 176 Q354 196 342 214", 6, "#D67A5C") +
        paw(144, 266, 20) + paw(256, 266, -20)
      );
    case "met-xiu":
      return (
        `<path d="M300 96 Q280 132 300 144 Q320 132 300 96 Z" fill="#7AC3EE" stroke="${INK}" stroke-width="5.5"/>` +
        `<path d="M64 114 C64 84 96 84 96 114 L96 146 L86 138 L78 146 L70 138 L64 146 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="5.5" stroke-linejoin="round"/>` +
        dot(75, 112, 3.2) + dot(85, 112, 3.2)
      );
    case "ngu-day":
      return (
        `<path d="M126 106 Q192 26 276 82 Q244 106 126 106 Z" fill="#7FA6D9" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>` +
        `<circle cx="284" cy="84" r="14" fill="#FFFFFF" stroke="${INK}" stroke-width="6"/>` +
        `<text x="296" y="138" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="900" fill="${INK}">zZ</text>`
      );
    case "bat-ngo":
      return (
        paw(76, 178, -32) + paw(324, 178, 32) +
        stroke("M52 104 L76 122 M348 104 L324 122 M200 12 L200 32", 7, "#F0A830") +
        sparkle4(64, 148, 0.78) + sparkle4(338, 148, 0.78)
      );
    case "ngau":
      return (
        paw(102, 256, -26) + paw(298, 256, 26) +
        sparkle4(72, 98, 1.05) + sparkle4(334, 96, 0.85)
      );
    case "gian-roi":
      return (
        stroke("M290 92 Q302 104 290 116 M318 92 Q306 104 318 116 M292 88 Q304 100 316 88 M292 120 Q304 108 316 120", 6, "#E04848") +
        paw(168, 272, 16) + paw(232, 272, -16)
      );
    case "xin-loi":
      return (
        paw(182, 272, 22) + paw(218, 272, -22) +
        `<path d="M308 118 Q290 150 308 162 Q326 150 308 118 Z" fill="#7AC3EE" stroke="${INK}" stroke-width="5.5"/>`
      );
    case "cam-on":
      return (
        `<g transform="translate(298 206)">
           ${stroke("M12 18 L4 66", 7, "#5B9A62")}
           <circle cx="12" cy="4" r="10" fill="#FFFDF6" stroke="${INK}" stroke-width="5"/>
           <circle cx="24" cy="14" r="10" fill="#FFFDF6" stroke="${INK}" stroke-width="5"/>
           <circle cx="19" cy="28" r="10" fill="#FFFDF6" stroke="${INK}" stroke-width="5"/>
           <circle cx="5" cy="28" r="10" fill="#FFFDF6" stroke="${INK}" stroke-width="5"/>
           <circle cx="0" cy="14" r="10" fill="#FFFDF6" stroke="${INK}" stroke-width="5"/>
           <circle cx="12" cy="16" r="8" fill="#F5BE41" stroke="${INK}" stroke-width="4.5"/>
         </g>` +
        heart(74, 108, 0.95, "#E8556D") + heart(332, 92, 0.8, "#F27890")
      );
    case "thuong-lam":
      return (
        paw(92, 228, -32) + paw(308, 228, 32) +
        heart(70, 96, 1.05, "#E8556D") + heart(330, 88, 1.05, "#E8556D") + heart(200, 46, 0.9, "#F27890")
      );
    case "nho-den-nha":
      return (
        paw(296, 246, -12) +
        sparkle4(72, 104, 1.0) + sparkle4(334, 104, 0.9) + heart(336, 166, 0.72, "#E8556D")
      );
    case "khong-gap-khong-ve":
      return (
        `<g transform="translate(274 202) rotate(-10)">
           <rect x="0" y="16" width="52" height="58" rx="10" fill="#F7C752" stroke="${INK}" stroke-width="6.5"/>
           <path d="M52 28 H64 Q70 28 70 44 Q70 60 64 60 H52" fill="none" stroke="${INK}" stroke-width="6.5"/>
           <path d="M-4 18 Q10 0 26 10 Q42 0 56 18 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="5.5"/>
         </g>` +
        stroke("M110 206 L122 216 M124 206 L136 216 M264 206 L276 216 M278 206 L290 216", 4.5, "#E87A8E") +
        sparkle4(72, 104, 0.9)
      );
    case "iu-iu":
      return (
        paw(168, 272, 28) + paw(232, 272, -28) +
        heart(200, 260, 0.92, "#E84C68") +
        heart(74, 108, 0.95, "#F27890") + heart(332, 104, 1.05, "#E84C68")
      );
    case "hong-be-oi":
      return (
        `<g transform="translate(284 218)">
           <ellipse cx="26" cy="34" rx="26" ry="30" fill="${color}" stroke="${INK}" stroke-width="7"/>
           ${stroke("M16 14 V32 M26 10 V32 M36 14 V32", 5.5)}
         </g>` +
        `<path d="M74 114 Q58 144 74 156 Q90 144 74 114 Z" fill="#7AC3EE" stroke="${INK}" stroke-width="5.5"/>`
      );
    case "dong-y-di":
      return (
        paw(174, 272, 24) + paw(226, 272, -24) +
        heart(70, 96, 1.0, "#E84C68") + heart(332, 96, 1.0, "#E84C68") + sparkle4(340, 174, 0.78)
      );
    case "hehe":
      return (
        paw(236, 262, -28) +
        sparkle4(72, 104, 0.9) + sparkle4(332, 112, 0.8)
      );
    case "xinh-xiu":
      return (
        sparkle4(68, 96, 1.15) + sparkle4(336, 94, 1.15) + sparkle4(344, 184, 0.8) + sparkle4(58, 188, 0.75) +
        paw(112, 260, 24) + paw(288, 260, -24)
      );
    case "qua-da":
      return (
        paw(78, 168, -38) + paw(322, 168, 38) +
        sparkle4(68, 92, 1.1) + sparkle4(334, 92, 1.1) + dot(102, 74, 7, "#E8556D") + dot(298, 74, 7, "#6EB5E8")
      );
    case "buon-nhe":
      return (
        `<path d="M148 60 C140 60 136 50 144 44 C146 30 166 26 176 36 C186 24 210 26 218 38 C230 32 248 42 242 56 C250 62 244 72 234 72 L154 72 C144 72 142 64 148 60 Z" fill="#C4D4E6" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
        stroke("M168 80 L164 92 M198 82 L194 94 M226 80 L222 92", 5.5, "#6FAEDB")
      );
    case "giang-sinh":
      return (
        `<path d="M132 104 Q198 16 278 78 Q242 106 132 104 Z" fill="#C9383E" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>` +
        `<rect x="122" y="92" width="144" height="22" rx="11" fill="#FFFFFF" stroke="${INK}" stroke-width="6"/>` +
        `<circle cx="284" cy="80" r="14" fill="#FFFFFF" stroke="${INK}" stroke-width="6"/>` +
        `<rect x="148" y="272" width="104" height="20" rx="10" fill="#C9383E" stroke="${INK}" stroke-width="6"/>` +
        `<rect x="220" y="280" width="22" height="20" rx="6" fill="#C9383E" stroke="${INK}" stroke-width="6"/>` +
        sparkle4(68, 108, 0.95) + sparkle4(340, 134, 0.85)
      );
    default:
      return "";
  }
}

const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function svg(sticker) {
  const { id, label, color, eyes, mouth } = sticker;
  const species = CHAR_SPECIES[id] ?? "mochi";
  const fontSize = label.length >= 16 ? 30 : label.length >= 12 ? 35 : 41;
  const { ears, inner, whiskers, muzzle } = speciesDetails(species, color, id);
  const earHalo = speciesOutline(species, id)
    .map((d) => `<path d="${d}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="26" stroke-linejoin="round"/>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <!-- Viền trắng die-cut kiểu sticker dán -->
  <g>
    ${earHalo}
    <path d="${BODY_PATH}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="28" stroke-linejoin="round"/>
    <rect x="22" y="310" width="356" height="76" rx="38" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="18"/>
  </g>

  <!-- Tai & thân nhân vật chibi -->
  ${ears}
  ${inner}
  <path d="${BODY_PATH}" fill="${color}" stroke="${INK}" stroke-width="8.5" stroke-linejoin="round"/>
  <!-- Highlight sáng nhẹ đỉnh đầu & bóng pastel đáy -->
  <path d="M138 112 Q186 92 238 106" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" opacity="0.55"/>
  <path d="M114 268 Q200 296 286 268 Q266 294 200 294 Q134 294 114 268 Z" fill="${INK}" opacity="0.06"/>
  ${muzzle}

  <!-- Má hồng & râu mèo -->
  <ellipse cx="122" cy="216" rx="22" ry="12" fill="#F28A9E" opacity="0.65"/>
  <ellipse cx="278" cy="216" rx="22" ry="12" fill="#F28A9E" opacity="0.65"/>
  ${whiskers}

  <!-- Biểu cảm & đạo cụ -->
  ${EYES[eyes]}
  ${MOUTHS[mouth]}
  ${propsFor(id, color)}

  <!-- Nhãn chữ tiếng Việt rõ nét -->
  <rect x="26" y="314" width="348" height="68" rx="34" fill="#FFFFFF" stroke="${INK}" stroke-width="7"/>
  <text x="200" y="${348 + fontSize * 0.34}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="${fontSize}" fill="${INK}">${escapeXml(label)}</text>
</svg>`;
}

await mkdir(OUT, { recursive: true });
for (const sticker of list) {
  const outFile = decodeURIComponent(new URL(`${sticker.id}.webp`, OUT).pathname).replace(/^\/([A-Za-z]:)/, "$1");
  const info = await sharp(Buffer.from(svg(sticker)))
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(outFile);
  console.log(sticker.id.padEnd(20), `${(info.size / 1024).toFixed(1)}KB`);
}
