// Sinh ảnh xem trước 1200x630 khi gửi link qua Messenger/Zalo. Chạy: node scripts/make-og-image.mjs
// Dùng ảnh tĩnh để không phải tải font tiếng Việt lúc chạy và không lộ nội dung thư.
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#F9F6F1"/>
  <g transform="translate(375 70)">
    <rect width="450" height="300" rx="14" fill="#C8A882"/>
    <path d="M0 8 L225 175 L450 8" fill="#BC9A72" stroke="#A8865E" stroke-width="3" stroke-linejoin="round"/>
    <path d="M0 296 L170 135 M450 296 L280 135" stroke="#A8865E" stroke-width="3"/>
    <circle cx="225" cy="172" r="52" fill="#8E2424"/>
    <circle cx="225" cy="172" r="39" fill="none" stroke="#B85A5A" stroke-width="3"/>
    <path transform="translate(225 174) scale(1.3)" d="M0 18 C-14 8 -20 1 -20 -7 C-20 -14 -15 -18 -9 -18 C-5 -18 -2 -16 0 -12 C2 -16 5 -18 9 -18 C15 -18 20 -14 20 -7 C20 1 14 8 0 18Z" fill="#F4E9DA"/>
  </g>
  <g text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">
    <text x="600" y="475" font-size="62" font-weight="700" fill="#8E2424">Bạn có một lá thư</text>
    <text x="600" y="540" font-size="32" fill="#7A7067">Chạm để bóc dấu sáp và mở thư</text>
  </g>
</svg>`;

const out = fileURLToPath(new URL("../src/app/opengraph-image.png", import.meta.url));
const info = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(out);
console.log(`${Math.round(info.size / 1024)}KB`);
