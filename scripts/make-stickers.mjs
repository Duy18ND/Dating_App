// Sinh 25 sticker chibi tự vẽ (không dùng ảnh của bên thứ ba) ra public/stickers/memes/*.webp.
// Chạy: node scripts/make-stickers.mjs. Chữ dùng font hệ thống, ảnh kết quả được commit.
import { mkdir, readFile } from "node:fs/promises";
import sharp from "sharp";

const list = JSON.parse(await readFile(new URL("../src/lib/stickers.json", import.meta.url), "utf8"));
const OUT = new URL("../public/stickers/memes/", import.meta.url);
const INK = "#2B2623";

const line = (d, extra = "") =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const dot = (x, y, r = 11) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
const heart = (x, y, s, fill = "#E0455E") =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 18 C-14 8 -20 1 -20 -7 C-20 -14 -15 -18 -9 -18 C-5 -18 -2 -16 0 -12 C2 -16 5 -18 9 -18 C15 -18 20 -14 20 -7 C20 1 14 8 0 18Z" fill="${fill}"/>`;

const EYES = {
  dots: dot(155, 165) + dot(245, 165),
  happy: line("M135 170 Q155 145 175 170") + line("M225 170 Q245 145 265 170"),
  love: heart(155, 165, 1.2) + heart(245, 165, 1.2),
  wink: dot(155, 165) + line("M225 165 Q245 150 265 165"),
  cry:
    line("M135 160 H175") + line("M225 160 H265") +
    `<path d="M148 172 q-12 40 0 52 q16 6 14 -10 z M252 172 q12 40 0 52 q-16 6 -14 -10 z" fill="#6FB7E8"/>`,
  shock:
    `<circle cx="155" cy="162" r="22" fill="#fff" stroke="${INK}" stroke-width="7"/>` +
    `<circle cx="245" cy="162" r="22" fill="#fff" stroke="${INK}" stroke-width="7"/>` +
    dot(155, 162, 7) + dot(245, 162, 7),
  sleepy: line("M135 165 Q155 180 175 165") + line("M225 165 Q245 180 265 165"),
  cool:
    `<path d="M115 145 H190 Q188 192 153 192 Q118 192 115 145Z M210 145 H285 Q282 192 247 192 Q212 192 210 145Z" fill="${INK}"/>` +
    line("M185 150 H215"),
  star:
    ["155", "245"].map((x) =>
      `<path transform="translate(${x} 163)" d="M0 -24 L7 -7 L24 -7 L10 5 L15 22 L0 11 L-15 22 L-10 5 L-24 -7 L-7 -7Z" fill="${INK}"/>`,
    ).join(""),
  angry: line("M130 140 L178 155") + line("M270 140 L222 155") + dot(158, 170) + dot(242, 170),
};

const MOUTHS = {
  smile: line("M170 215 Q200 245 230 215"),
  grin: `<path d="M162 208 H238 Q232 260 200 260 Q168 260 162 208Z" fill="#7A2230" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>`,
  o: `<ellipse cx="200" cy="232" rx="17" ry="22" fill="#7A2230" stroke="${INK}" stroke-width="7"/>`,
  sad: line("M170 238 Q200 208 230 238"),
  cat: line("M168 215 Q184 238 200 218 Q216 238 232 215"),
  tongue: line("M170 213 Q200 240 230 213") + `<path d="M190 229 q4 36 28 22 q8 -14 -2 -26z" fill="#E8718A"/>`,
  flat: line("M175 228 H225"),
};

const star5 = (x, y) =>
  `<path transform="translate(${x} ${y})" d="M0 -20 Q3 -3 20 0 Q3 3 0 20 Q-3 3 -20 0 Q-3 -3 0 -20Z" fill="#F4B740"/>`;
const EXTRAS = {
  none: "",
  blush: "",
  hearts: heart(70, 70, 1.5) + heart(330, 60, 1.1) + heart(350, 140, 0.8),
  sparkle: star5(65, 75) + star5(335, 65) + star5(352, 200),
  sweat: `<path d="M305 105 q-22 34 0 44 q22 -10 0 -44z" fill="#6FB7E8"/>`,
  zzz: `<text x="300" y="90" font-family="Arial" font-size="48" font-weight="bold" fill="${INK}">z Z</text>`,
  party: `<path d="M200 5 L160 85 H240Z" fill="#8E2424"/>` + dot(200, 10, 10) + star5(80, 90) + star5(320, 90),
};

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function svg({ label, color, eyes, mouth, extra }) {
  const size = label.length > 12 ? 36 : 44;
  const body = "M200 55 C300 55 335 130 335 200 C335 275 285 305 200 305 C115 305 65 275 65 200 C65 130 100 55 200 55Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <path d="${body}" fill="none" stroke="#fff" stroke-width="30"/>
  <path d="${body}" fill="${color}" stroke="${INK}" stroke-width="9"/>
  <ellipse cx="120" cy="212" rx="24" ry="14" fill="#F28B9B" opacity="0.65"/>
  <ellipse cx="280" cy="212" rx="24" ry="14" fill="#F28B9B" opacity="0.65"/>
  ${EYES[eyes]}${MOUTHS[mouth]}${EXTRAS[extra]}
  <rect x="25" y="312" width="350" height="72" rx="36" fill="#fff" stroke="${INK}" stroke-width="7"/>
  <text x="200" y="${348 + size * 0.34}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="${size}" fill="${INK}">${escape(label)}</text>
</svg>`;
}

await mkdir(OUT, { recursive: true });
for (const sticker of list) {
  const info = await sharp(Buffer.from(svg(sticker)))
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(decodeURIComponent(new URL(`${sticker.id}.webp`, OUT).pathname).replace(/^\/([A-Za-z]:)/, "$1"));
  console.log(sticker.id, `${Math.round(info.size / 1024)}KB`);
}
