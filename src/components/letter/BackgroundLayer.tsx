"use client";

import Konva from "konva";
import { useEffect, useMemo, useRef } from "react";
import { Image as KonvaImage, Layer, Rect, Shape } from "react-konva";
import { PRINT_CONFIG } from "@/lib/print-config";
import { coverCrop } from "@/lib/render/image-frame";
import { PRESET_STYLES } from "@/lib/render/presets";
import type { BackgroundConfig, BackgroundPreset } from "@/types/letter";
import { PENDING } from "./ElementNode";
import { useImage } from "./hooks";

const { width: W, height: CARD_H } = PRINT_CONFIG.CANVAS;

function drawTinyHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r);
  ctx.bezierCurveTo(cx - r * 1.4, cy + r * 0.2, cx - r * 1.2, cy - r * 0.9, cx, cy - r * 0.35);
  ctx.bezierCurveTo(cx + r * 1.2, cy - r * 0.9, cx + r * 1.4, cy + r * 0.2, cx, cy + r);
  ctx.fill();
}

function drawTinyStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
}

function PresetBackground({ preset, height: H }: { preset: BackgroundPreset; height: number }) {
  const style = PRESET_STYLES[preset] ?? PRESET_STYLES.cream;
  return (
    <>
      <Rect width={W} height={H} fill={style.base} />
      {style.pattern && (
        <Shape
          listening={false}
          sceneFunc={(context) => {
            const ctx = context._context;
            const { kind, step, color, lineWidth } = style.pattern!;
            ctx.save();
            if (kind === "grid") {
              ctx.strokeStyle = color;
              ctx.lineWidth = lineWidth;
              ctx.beginPath();
              for (let x = step; x < W; x += step) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, H);
              }
              for (let y = step; y < H; y += step) {
                ctx.moveTo(0, y);
                ctx.lineTo(W, y);
              }
              ctx.stroke();
            } else if (kind === "stripes") {
              ctx.fillStyle = color;
              for (let x = 0; x < W; x += step * 2) {
                ctx.fillRect(x, 0, lineWidth, H);
              }
            } else if (kind === "dots") {
              ctx.fillStyle = color;
              for (let y = step / 2, row = 0; y < H; y += step, row++) {
                const offset = row % 2 === 0 ? step / 2 : step;
                for (let x = offset; x < W; x += step) {
                  ctx.beginPath();
                  ctx.arc(x, y, lineWidth, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            } else if (kind === "hearts") {
              ctx.fillStyle = color;
              for (let y = step / 2, row = 0; y < H; y += step, row++) {
                const offset = row % 2 === 0 ? step / 2 : step;
                for (let x = offset; x < W; x += step) {
                  drawTinyHeart(ctx, x, y, 12);
                }
              }
            } else if (kind === "stars") {
              ctx.fillStyle = color;
              for (let y = step / 2, row = 0; y < H; y += step, row++) {
                const offset = row % 2 === 0 ? step * 0.4 : step * 0.9;
                for (let x = offset; x < W; x += step) {
                  drawTinyStar(ctx, x, y, (row + Math.round(x)) % 3 === 0 ? 11 : 6);
                }
              }
            } else if (kind === "frame") {
              ctx.strokeStyle = color;
              ctx.lineWidth = lineWidth;
              ctx.strokeRect(step, step, W - step * 2, H - step * 2);
              ctx.lineWidth = Math.max(1.5, lineWidth * 0.5);
              ctx.strokeRect(step + 14, step + 14, W - (step + 14) * 2, H - (step + 14) * 2);
            }
            ctx.restore();
          }}
        />
      )}
    </>
  );
}

function PhotoBackground({ background, height: H }: { background: BackgroundConfig; height: number }) {
  const image = useImage(background.value);
  const ref = useRef<Konva.Image>(null);
  const blur = background.blur ?? 0;
  const crop = useMemo(
    () => image && coverCrop(image.naturalWidth, image.naturalHeight, W, H),
    [image, H],
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || !image) return;
    if (blur > 0) node.cache({ pixelRatio: 1 });
    else node.clearCache();
    node.getLayer()?.batchDraw();
  }, [image, blur]);

  return (
    <>
      <Rect name={image ? undefined : PENDING} width={W} height={H} fill="#F9F6F1" />
      {image && crop && (
        <KonvaImage
          ref={ref}
          image={image}
          width={W}
          height={H}
          crop={crop}
          filters={blur > 0 ? [Konva.Filters.Blur] : []}
          blurRadius={blur}
        />
      )}
    </>
  );
}

/** Layer nền tách riêng để ẩn được khi in trên giấy Kraft thật. */
export function BackgroundLayer({
  background,
  hidden,
  height: H = CARD_H,
}: {
  background: BackgroundConfig;
  hidden?: boolean;
  height?: number;
}) {
  return (
    <Layer name="background" visible={!hidden} listening={false}>
      {background.type === "preset" && (
        <PresetBackground preset={background.value as BackgroundPreset} height={H} />
      )}
      {background.type === "color" && <Rect width={W} height={H} fill={background.value} />}
      {background.type === "image" && <PhotoBackground background={background} height={H} />}
      {background.overlayOpacity > 0 && (
        <Rect
          width={W}
          height={H}
          fill={background.overlayColor ?? "#FFFFFF"}
          opacity={background.overlayOpacity}
        />
      )}
    </Layer>
  );
}
