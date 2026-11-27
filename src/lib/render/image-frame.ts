import type { ImageFilter, ImageFrame } from "@/types/letter";

// Vẽ khung và lọc màu bằng Canvas 2D thuần. Không dùng ctx.filter vì Safari không hỗ trợ.

export function applyFilter(pixels: Uint8ClampedArray, filter: ImageFilter): void {
  if (filter === "none") return;
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    if (filter === "bw") {
      pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
    } else {
      // vintage: ngả ấm kiểu sepia, giữ lại 40% màu gốc, hơi nhấc vùng tối
      pixels[i] = r * 0.4 + gray * 0.6 * 1.12 + 14;
      pixels[i + 1] = g * 0.4 + gray * 0.6 * 0.98 + 8;
      pixels[i + 2] = b * 0.4 + gray * 0.6 * 0.76 + 6;
    }
  }
}

/** Cắt giữa ảnh nguồn cho vừa kín khung đích (như object-fit: cover). */
export function coverCrop(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const width = dstW / scale;
  const height = dstH / scale;
  return { x: (srcW - width) / 2, y: (srcH - height) / 2, width, height };
}

function clipShape(ctx: CanvasRenderingContext2D, frame: ImageFrame, w: number, h: number) {
  ctx.beginPath();
  if (frame === "circle") {
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (frame === "rounded") {
    ctx.roundRect(0, 0, w, h, Math.min(w, h) * 0.1);
  } else if (frame === "cloud") {
    // Elip giữa cộng các "múi" tròn quanh viền
    ctx.ellipse(w / 2, h / 2, w * 0.38, h * 0.38, 0, 0, Math.PI * 2);
    const bumps = 10;
    for (let i = 0; i < bumps; i++) {
      const angle = (i / bumps) * Math.PI * 2;
      const x = w / 2 + Math.cos(angle) * w * 0.34;
      const y = h / 2 + Math.sin(angle) * h * 0.34;
      ctx.moveTo(x + w * 0.16, y);
      ctx.ellipse(x, y, w * 0.16, h * 0.16, 0, 0, Math.PI * 2);
    }
  } else {
    ctx.rect(0, 0, w, h);
  }
}

/** Trả về canvas kích thước (width x height) * ratio, đã áp khung và bộ lọc. */
export function renderFramedImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  frame: ImageFrame,
  filter: ImageFilter,
  ratio: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  const ctx = canvas.getContext("2d", { willReadFrequently: filter !== "none" })!;
  ctx.scale(ratio, ratio);

  const short = Math.min(width, height);
  let area = { x: 0, y: 0, width, height };
  if (frame === "polaroid") {
    const edge = short * 0.05;
    area = { x: edge, y: edge, width: width - edge * 2, height: height - edge - short * 0.18 };
  } else if (frame === "stamp") {
    const edge = short * 0.08;
    area = { x: edge, y: edge, width: width - edge * 2, height: height - edge * 2 };
  }

  // Ảnh (đã lọc) được vẽ trên canvas phụ rồi mới cắt theo khung.
  const photo = document.createElement("canvas");
  photo.width = Math.max(1, Math.round(area.width * ratio));
  photo.height = Math.max(1, Math.round(area.height * ratio));
  const photoCtx = photo.getContext("2d", { willReadFrequently: filter !== "none" })!;
  const crop = coverCrop(image.naturalWidth, image.naturalHeight, area.width, area.height);
  photoCtx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, photo.width, photo.height);
  if (filter !== "none") {
    const data = photoCtx.getImageData(0, 0, photo.width, photo.height);
    applyFilter(data.data, filter);
    photoCtx.putImageData(data, 0, 0);
  }

  if (frame === "polaroid" || frame === "stamp") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
  } else if (frame !== "none") {
    clipShape(ctx, frame, width, height);
    ctx.clip();
  }
  ctx.drawImage(photo, area.x, area.y, area.width, area.height);

  if (frame === "stamp") {
    // Đục các lỗ răng cưa quanh mép
    ctx.globalCompositeOperation = "destination-out";
    const radius = short * 0.025;
    const punch = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };
    const countX = Math.max(2, Math.round(width / (radius * 3)));
    const countY = Math.max(2, Math.round(height / (radius * 3)));
    for (let i = 0; i <= countX; i++) {
      punch((i * width) / countX, 0);
      punch((i * width) / countX, height);
    }
    for (let i = 0; i <= countY; i++) {
      punch(0, (i * height) / countY);
      punch(width, (i * height) / countY);
    }
  }
  return canvas;
}
