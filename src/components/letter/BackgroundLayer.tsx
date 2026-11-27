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

const { width: W, height: H } = PRINT_CONFIG.CANVAS;

function PresetBackground({ preset }: { preset: BackgroundPreset }) {
  const style = PRESET_STYLES[preset];
  return (
    <>
      <Rect width={W} height={H} fill={style.base} />
      {style.pattern && (
        <Shape
          listening={false}
          sceneFunc={(context) => {
            const ctx = context._context;
            const { step, color, lineWidth } = style.pattern!;
            ctx.save();
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
            ctx.restore();
          }}
        />
      )}
    </>
  );
}

function PhotoBackground({ background }: { background: BackgroundConfig }) {
  const image = useImage(background.value);
  const ref = useRef<Konva.Image>(null);
  const blur = background.blur ?? 0;
  const crop = useMemo(
    () => image && coverCrop(image.naturalWidth, image.naturalHeight, W, H),
    [image],
  );

  // Bộ lọc của Konva chỉ chạy trên node đã cache. pixelRatio 1 đủ cho ảnh đã làm mờ.
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
}: {
  background: BackgroundConfig;
  hidden?: boolean;
}) {
  return (
    <Layer name="background" visible={!hidden} listening={false}>
      {background.type === "preset" && (
        <PresetBackground preset={background.value as BackgroundPreset} />
      )}
      {background.type === "color" && <Rect width={W} height={H} fill={background.value} />}
      {background.type === "image" && <PhotoBackground background={background} />}
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
