import { PX_PER_MM } from "@/lib/print-config";
import { inkOn } from "@/lib/render/ink";
import { PRESET_STYLES } from "@/lib/render/presets";
import type { BackgroundConfig, BackgroundPreset, EnvelopeDecor } from "@/types/letter";
import { fillTextMm, fillWithBleed, loadFont, measureMm } from "./draw";
import { fitText, flapWidthAt } from "./guides";
import { createPartCanvas, type PartRenderer } from "./parts";

// Vị trí trong nắp tam giác 114 x 45 mm: chân nắp ở y = 0, mũi ở y = 45.
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
