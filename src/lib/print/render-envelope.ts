import { PRINT_CONFIG, PX_PER_MM } from "@/lib/print-config";
import { inkOn } from "@/lib/render/ink";
import { PRESET_STYLES } from "@/lib/render/presets";
import type { BackgroundConfig, BackgroundPreset, EnvelopeDecor } from "@/types/letter";
import { fillTextMm, fillWithBleed, loadFont, measureMm } from "./draw";
import { fitText, flapWidthAt } from "./guides";
import { bounds, envelopeC7, type Point, type Rect } from "./layout";
import { createPartCanvas, MAX_CANVAS_PIXELS, type PartRenderer, type RenderOptions } from "./parts";

// Vị trí trong nắp 114 x 45 mm: chân nắp ở y = 0, mũi ở y = 45. Bề rộng tính theo nắp tam giác,
// hẹp hơn nắp vòm của v1.7 nên chữ luôn nằm gọn trong vòm (dưới chân tai cài ở y = 35).
const MONOGRAM = { baseline: 13, size: { max: 9, min: 4, step: 0.25 } };
const LINE = { baselines: [20, 24.5], size: { max: 3.4, min: 2.2, step: 0.1 } };
/** Chừa hai bên để chữ không sát mép cắt xéo. */
const SIDE_GAP_MM = 8;

/** Bề rộng dùng được tại một dòng chữ: đo ở chân chữ, nơi nắp hẹp nhất. */
const widthAt = (baseline: number) => Math.max(10, flapWidthAt(baseline + 1) - SIDE_GAP_MM);

/**
 * Trang trí nắp phong bì, vẽ XUÔI như nhìn thấy khi nắp đã gấp xuống (mũi ở dưới).
 * T-29 xoay 180° khi đặt lên phôi trải phẳng và cắt theo hình nắp bo tròn.
 */
export const renderEnvelopeFlap: PartRenderer<{
  decor: EnvelopeDecor;
  color: string;
}> = async ({ decor, color }, options) => {
  const monogram = decor.monogram.trim();
  const line = decor.line.trim();
  await loadFont(decor.fontFamily, `${monogram}${line}`);

  const { canvas, ctx, size, bleedMm } = createPartCanvas("envelopeFlap", options);
  if (options.background) fillWithBleed(ctx, size, bleedMm, color);
  const ink = inkOn(color);
  const measure = (sizeMm: number) => measureMm(ctx, options.pxPerMm, decor.fontFamily, sizeMm);

  const write = (text: string, baselines: number[], sizes: typeof MONOGRAM.size) => {
    const widths = baselines.map(widthAt);
    const fitted = fitText(text, widths, sizes, measure);
    fitted.lines.forEach((content, i) => {
      // Chỉ một dòng thì đặt ở giữa vùng dành cho nó.
      const baseline =
        fitted.lines.length === 1 && baselines.length > 1
          ? (baselines[0] + baselines[1]) / 2 - 1
          : baselines[i];
      fillTextMm(ctx, options.pxPerMm, {
        text: content,
        x: size.width / 2,
        y: baseline,
        font: decor.fontFamily,
        sizeMm: fitted.size,
        color: ink,
        align: "center",
        maxWidth: widths[i],
      });
    });
  };
  if (monogram) write(monogram, [MONOGRAM.baseline], MONOGRAM.size);
  if (line) write(line, LINE.baselines, LINE.size);

  return {
    canvas,
    widthMm: size.width,
    heightMm: size.height,
    bleedMm,
    opaque: options.background,
  };
};

function tracePolygon(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

/** Giọt keo nhỏ (biểu tượng, không phải chữ), cao `size` mm, tâm tại (x, y). */
function drawGlueDrop(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const r = size * 0.3;
  const cy = y + size / 2 - r; // tâm phần tròn đáy
  ctx.beginPath();
  ctx.moveTo(x, y - size / 2);
  ctx.quadraticCurveTo(x + r * 1.05, cy - r * 0.9, x + r, cy);
  ctx.arc(x, cy, r, 0, Math.PI); // nửa dưới, đi qua đáy giọt
  ctx.quadraticCurveTo(x - r * 1.05, cy - r * 0.9, x, y - size / 2);
  ctx.closePath();
  ctx.stroke();
}

export interface EnvelopeSheet {
  canvas: HTMLCanvasElement;
  /** Vùng trên A4 (mm) mà canvas phủ: bao của phôi cộng tràn màu. */
  area: Rect;
}

/**
 * Phôi phong bì C7 trải phẳng cho bản in 1 trang (T-29), vẽ thành ảnh:
 * - nền màu phong bì phủ cả tràn màu 2 mm quanh mép cắt (tắt được để in giấy màu),
 * - vùng keo: gạch chéo mờ + giọt keo nhỏ, nằm ở phần nắp đáy che,
 * - chữ trang trí nắp trên xoay 180° để đọc xuôi khi gấp xuống.
 * Nét cắt, nét gấp và khe cài vẽ bằng vector trong PDF, đè lên ảnh này.
 * Ngoài phôi là màu trắng (không tốn mực) để nhúng JPEG gọn nhẹ.
 */
export async function renderEnvelopeSheet(
  input: { decor: EnvelopeDecor; color: string },
  options: RenderOptions,
): Promise<EnvelopeSheet> {
  const envelope = envelopeC7();
  const bleedMm = options.bleedMm ?? PRINT_CONFIG.BLEED_MM;
  const outline = bounds(envelope.cut);
  const area: Rect = {
    x: outline.x - bleedMm,
    y: outline.y - bleedMm,
    width: outline.width + bleedMm * 2,
    height: outline.height + bleedMm * 2,
  };
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width * options.pxPerMm);
  canvas.height = Math.round(area.height * options.pxPerMm);
  if (canvas.width * canvas.height > MAX_CANVAS_PIXELS) {
    throw new Error("Ảnh phong bì quá lớn cho trình duyệt, hãy giảm pxPerMm");
  }
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(options.pxPerMm, options.pxPerMm);
  ctx.translate(-area.x, -area.y);

  if (options.background) {
    // Tô kín phôi rồi viền thêm cùng màu dày 2 x tràn: cắt lệch tay vẫn không lộ trắng.
    tracePolygon(ctx, envelope.cut);
    ctx.fillStyle = input.color;
    ctx.fill();
    if (bleedMm > 0) {
      ctx.lineJoin = "round";
      ctx.lineWidth = bleedMm * 2;
      ctx.strokeStyle = input.color;
      ctx.stroke();
    }
  }

  const ink = inkOn(input.color);
  for (const zone of envelope.glue) {
    ctx.save();
    tracePolygon(ctx, zone);
    ctx.clip();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.25;
    const box = bounds(zone);
    for (let d = -box.height; d < box.width + box.height; d += 1.8) {
      ctx.beginPath();
      ctx.moveTo(box.x + d, box.y);
      ctx.lineTo(box.x + d - box.height, box.y + box.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 0.3;
    // Vùng keo là hình thang: trung bình hoành độ 4 đỉnh = giữa bề ngang tại nửa chiều cao.
    const midX = zone.reduce((sum, [x]) => sum + x, 0) / zone.length;
    drawGlueDrop(ctx, midX, box.y + box.height / 2, 3);
    ctx.restore();
  }

  const flap = await renderEnvelopeFlap(input, {
    pxPerMm: options.pxPerMm,
    background: false,
    bleedMm: 0,
  });
  // Ảnh nắp vẽ xuôi (nếp gấp ở trên). Trên phôi trải phẳng nếp gấp ở dưới: xoay 180°.
  const r = envelope.topFlap;
  ctx.save();
  ctx.translate(r.x + r.width, r.y + r.height);
  ctx.rotate(Math.PI);
  ctx.drawImage(flap.canvas, 0, 0, r.width, r.height);
  ctx.restore();

  return { canvas, area };
}

/** Màu nền một màu đại diện cho nền bìa trước (nền ảnh không lặp lại ở bìa sau). */
export function backBaseColor(background: BackgroundConfig): string {
  if (background.type === "color") return background.value;
  if (background.type === "preset") return PRESET_STYLES[background.value as BackgroundPreset].base;
  return "#F9F6F1";
}

/**
 * Bìa sau: tiếp nối nền bìa trước (cùng dải giấy nên màu liền mạch) và chữ lồng tên nhỏ.
 */
export const renderCardBack: PartRenderer<{
  decor: EnvelopeDecor;
  frontBackground: BackgroundConfig;
}> = async ({ decor, frontBackground }, options) => {
  const monogram = decor.monogram.trim();
  await loadFont(decor.fontFamily, monogram);

  const { canvas, ctx, size, bleedMm } = createPartCanvas("cardBack", options);
  const base = backBaseColor(frontBackground);
  if (options.background) {
    fillWithBleed(ctx, size, bleedMm, base);
    if (frontBackground.type === "preset") {
      const pattern = PRESET_STYLES[frontBackground.value as BackgroundPreset].pattern;
      if (pattern) {
        // Cùng bước kẻ với bìa trước, đổi từ px logic sang mm.
        const step = pattern.step / PX_PER_MM;
        const width = pattern.lineWidth / PX_PER_MM;
        ctx.fillStyle = pattern.color;
        for (let x = step; x < size.width + bleedMm; x += step) {
          ctx.fillRect(x - width / 2, -bleedMm, width, size.height + bleedMm * 2);
        }
        for (let y = step; y < size.height + bleedMm; y += step) {
          ctx.fillRect(-bleedMm, y - width / 2, size.width + bleedMm * 2, width);
        }
      }
    }
    if (frontBackground.overlayOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = frontBackground.overlayOpacity;
      fillWithBleed(ctx, size, bleedMm, frontBackground.overlayColor ?? "#FFFFFF");
      ctx.restore();
    }
  }

  if (monogram) {
    const maxWidth = size.width * 0.5;
    const fitted = fitText(monogram, [maxWidth], { max: 5, min: 2.5, step: 0.25 }, (sizeMm) =>
      measureMm(ctx, options.pxPerMm, decor.fontFamily, sizeMm),
    );
    fillTextMm(ctx, options.pxPerMm, {
      text: fitted.lines[0],
      x: size.width / 2,
      y: size.height - 10,
      font: decor.fontFamily,
      sizeMm: fitted.size,
      color: inkOn(base),
      align: "center",
      maxWidth,
    });
  }

  return {
    canvas,
    widthMm: size.width,
    heightMm: size.height,
    bleedMm,
    opaque: options.background,
  };
};
