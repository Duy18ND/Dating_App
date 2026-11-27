import { findIcon, ICON_VIEWBOX } from "@/lib/icons";

/**
 * Quy ước: width/height của phần tử qr_code là kích thước MÃ QR (>= 240px).
 * Thẻ nền sáng (quiet zone) vẽ thêm ra ngoài một khoảng quietZone().
 */
export const quietZone = (qrSize: number) => Math.max(12, Math.round(qrSize * 0.1));

export const QR_CARD_COLOR = "#FFFFFF";

/** URL tạm để xem trước. Khi đã xuất bản, renderer nhận URL thật nên QR tự đúng. */
export const previewQrUrl = (origin: string) => `${origin}/l/xemthu`;

export const letterUrl = (origin: string, slug: string) => `${origin}/l/${slug}`;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Màu QR phải đủ đậm trên nền trắng thì camera mới quét được. */
export const isScannableColor = (hex: string) => 1.05 / (luminance(hex) + 0.05) >= 4.5;

function iconDataUrl(iconId: string, color: string): string | undefined {
  const icon = findIcon(iconId);
  if (!icon) return undefined;
  const paint = icon.filled
    ? `fill="${color}"`
    : `fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}"><path d="${icon.d}" ${paint}/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function createQrBlob(options: {
  url: string;
  size: number;
  color: string;
  iconId?: string;
  margin?: number;
}): Promise<Blob> {
  // Thư viện cần window nên chỉ import khi chạy trên trình duyệt.
  const { default: QRCodeStyling } = await import("qr-code-styling");
  const image = options.iconId ? iconDataUrl(options.iconId, options.color) : undefined;
  const qr = new QRCodeStyling({
    width: options.size,
    height: options.size,
    type: "canvas",
    data: options.url,
    margin: options.margin ?? 0,
    image,
    // Có icon che giữa thì cần mức sửa lỗi cao nhất.
    qrOptions: { errorCorrectionLevel: image ? "H" : "M" },
    imageOptions: { imageSize: 0.3, margin: 6, hideBackgroundDots: true },
    dotsOptions: { type: "rounded", color: options.color },
    cornersSquareOptions: { type: "extra-rounded", color: options.color },
    cornersDotOptions: { type: "dot", color: options.color },
    backgroundOptions: { color: QR_CARD_COLOR },
  });
  const data = await qr.getRawData("png");
  if (!(data instanceof Blob)) throw new Error("Không tạo được mã QR");
  return data;
}
