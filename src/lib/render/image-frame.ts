import type { ImageFilter, ImageFocus, ImageFrame } from "@/types/letter";

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

/** Cắt ảnh nguồn cho vừa kín khung đích theo điểm giữ focus (mặc định giữa 0.5, 0.5). */
export function coverCrop(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  focus?: ImageFocus,
) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const width = dstW / scale;
  const height = dstH / scale;
  const fx = Math.min(1, Math.max(0, focus?.x ?? 0.5));
  const fy = Math.min(1, Math.max(0, focus?.y ?? 0.5));
  return { x: (srcW - width) * fx, y: (srcH - height) * fy, width, height };
}

function traceHeart(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const topY = y + h * 0.3;
  ctx.moveTo(x + w * 0.5, y + h * 0.96);
  ctx.bezierCurveTo(x + w * 0.05, y + h * 0.68, x - w * 0.02, y + h * 0.28, x + w * 0.22, y + h * 0.1);
  ctx.bezierCurveTo(x + w * 0.36, y, x + w * 0.47, y + h * 0.12, x + w * 0.5, topY);
  ctx.bezierCurveTo(x + w * 0.53, y + h * 0.12, x + w * 0.64, y, x + w * 0.78, y + h * 0.1);
  ctx.bezierCurveTo(x + w * 1.02, y + h * 0.28, x + w * 0.95, y + h * 0.68, x + w * 0.5, y + h * 0.96);
  ctx.closePath();
}

function traceArch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = Math.min(w / 2, h * 0.52);
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.ellipse(x + w / 2, y + r, w / 2, r, 0, Math.PI, 0, false);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function traceStar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const spikes = 5;
  const outerX = w * 0.5;
  const outerY = h * 0.5;
  const innerX = w * 0.22;
  const innerY = h * 0.22;
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const rx = i % 2 === 0 ? outerX : innerX;
    const ry = i % 2 === 0 ? outerY : innerY;
    const px = cx + Math.cos(angle) * rx;
    const py = cy + Math.sin(angle) * ry;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function traceScallop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const petals = 12;
  ctx.ellipse(cx, cy, w * 0.4, h * 0.4, 0, 0, Math.PI * 2);
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    const px = cx + Math.cos(angle) * w * 0.37;
    const py = cy + Math.sin(angle) * h * 0.37;
    ctx.moveTo(px + w * 0.13, py);
    ctx.ellipse(px, py, w * 0.13, h * 0.13, 0, 0, Math.PI * 2);
  }
}

function clipShape(
  ctx: CanvasRenderingContext2D,
  frame: ImageFrame,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.beginPath();
  if (frame === "circle") {
    ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (frame === "rounded" || frame === "tape") {
    ctx.roundRect(x, y, w, h, Math.min(w, h) * (frame === "tape" ? 0.04 : 0.12));
  } else if (frame === "cloud") {
    ctx.ellipse(cx, cy, w * 0.38, h * 0.38, 0, 0, Math.PI * 2);
    const bumps = 10;
    for (let i = 0; i < bumps; i++) {
      const angle = (i / bumps) * Math.PI * 2;
      const bx = cx + Math.cos(angle) * w * 0.34;
      const by = cy + Math.sin(angle) * h * 0.34;
      ctx.moveTo(bx + w * 0.16, by);
      ctx.ellipse(bx, by, w * 0.16, h * 0.16, 0, 0, Math.PI * 2);
    }
  } else if (frame === "heart") {
    traceHeart(ctx, x, y, w, h);
  } else if (frame === "arch") {
    traceArch(ctx, x, y, w, h);
  } else if (frame === "star") {
    traceStar(ctx, x, y, w, h);
  } else if (frame === "scallop") {
    traceScallop(ctx, x, y, w, h);
  } else {
    ctx.rect(x, y, w, h);
  }
}

/** Độ dày viền khung mặc định theo kích thước ảnh (px logic). */
export const defaultImageBorder = (width: number, height: number) =>
  Math.max(8, Math.round(Math.min(width, height) * 0.032));

function drawWashiTape(ctx: CanvasRenderingContext2D, cx: number, cy: number, len: number, thick: number, angle: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(232, 206, 170, 0.82)";
  ctx.fillRect(-len / 2, -thick / 2, len, thick);
  ctx.strokeStyle = "rgba(180, 145, 102, 0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-len / 2, -thick / 2, len, thick);
  ctx.restore();
}

/** Trả về canvas kích thước (width x height) * ratio, đã áp khung viền và bộ lọc. */
export function renderFramedImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  frame: ImageFrame,
  filter: ImageFilter,
  ratio: number,
  focus?: ImageFocus,
  borderWidth?: number,
  borderColor = "#FFFFFF",
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  const ctx = canvas.getContext("2d", { willReadFrequently: filter !== "none" })!;
  ctx.scale(ratio, ratio);

  const short = Math.min(width, height);
  const rawBorder = borderWidth === undefined ? defaultImageBorder(width, height) : borderWidth;
  const thinBorder = Math.min(Math.max(0, rawBorder), Math.round(short * 0.2));
  let area = {
    x: thinBorder,
    y: thinBorder,
    width: Math.max(1, width - thinBorder * 2),
    height: Math.max(1, height - thinBorder * 2),
  };
  if (frame === "polaroid") {
    const edge = short * 0.05;
    area = { x: edge, y: edge, width: width - edge * 2, height: height - edge - short * 0.18 };
  } else if (frame === "stamp") {
    const edge = short * 0.08;
    area = { x: edge, y: edge, width: width - edge * 2, height: height - edge * 2 };
  } else if (frame === "film") {
    const side = Math.max(18, short * 0.12);
    const padY = Math.max(10, short * 0.06);
    area = { x: side, y: padY, width: Math.max(1, width - side * 2), height: Math.max(1, height - padY * 2) };
  } else if (frame === "tape") {
    const pad = Math.max(10, short * 0.06);
    area = { x: pad, y: pad, width: Math.max(1, width - pad * 2), height: Math.max(1, height - pad * 2) };
  }

  const photo = document.createElement("canvas");
  photo.width = Math.max(1, Math.round(area.width * ratio));
  photo.height = Math.max(1, Math.round(area.height * ratio));
  const photoCtx = photo.getContext("2d", { willReadFrequently: filter !== "none" })!;
  const crop = coverCrop(image.naturalWidth, image.naturalHeight, area.width, area.height, focus);
  photoCtx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, photo.width, photo.height);
  if (filter !== "none") {
    const data = photoCtx.getImageData(0, 0, photo.width, photo.height);
    applyFilter(data.data, filter);
    photoCtx.putImageData(data, 0, 0);
  }

  if (frame === "polaroid" || frame === "stamp") {
    ctx.fillStyle = borderColor;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(photo, area.x, area.y, area.width, area.height);
  } else if (frame === "film") {
    ctx.fillStyle = borderColor === "#FFFFFF" ? "#1E1B1A" : borderColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, Math.min(width, height) * 0.03);
    ctx.fill();
    ctx.drawImage(photo, area.x, area.y, area.width, area.height);
    // Đục lỗ cuộn phim hai bên mép
    const holeW = area.x * 0.48;
    const holeH = Math.max(10, short * 0.055);
    const count = Math.max(4, Math.floor(height / (holeH * 1.9)));
    const gap = height / count;
    ctx.fillStyle = "#F9F6F1";
    for (let i = 0; i < count; i++) {
      const hy = gap * (i + 0.5) - holeH / 2;
      ctx.beginPath();
      ctx.roundRect((area.x - holeW) / 2, hy, holeW, holeH, 3);
      ctx.roundRect(width - (area.x + holeW) / 2, hy, holeW, holeH, 3);
      ctx.fill();
    }
  } else if (frame === "tape") {
    const pad = area.x;
    ctx.fillStyle = borderColor;
    ctx.beginPath();
    ctx.roundRect(pad * 0.45, pad * 0.45, width - pad * 0.9, height - pad * 0.9, short * 0.03);
    ctx.fill();
    ctx.drawImage(photo, area.x, area.y, area.width, area.height);
    const tapeLen = short * 0.34;
    const tapeThick = Math.max(12, short * 0.075);
    drawWashiTape(ctx, width * 0.18, pad * 0.95, tapeLen, tapeThick, -0.52);
    drawWashiTape(ctx, width * 0.82, pad * 0.95, tapeLen, tapeThick, 0.52);
  } else if (thinBorder > 0) {
    clipShape(ctx, frame, 0, 0, width, height);
    ctx.fillStyle = borderColor;
    ctx.fill();
    ctx.save();
    clipShape(ctx, frame, area.x, area.y, area.width, area.height);
    ctx.clip();
    ctx.drawImage(photo, area.x, area.y, area.width, area.height);
    ctx.restore();
  } else {
    ctx.save();
    clipShape(ctx, frame, 0, 0, width, height);
    ctx.clip();
    ctx.drawImage(photo, 0, 0, width, height);
    ctx.restore();
  }

  if (frame === "stamp") {
    ctx.globalCompositeOperation = "destination-out";
    const radius = short * 0.025;
    const punch = (px: number, py: number) => {
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
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
