"use client";

import { useEffect, useMemo, useState } from "react";
import { Circle, Group, Image as KonvaImage, Line, Path, Rect, Text } from "react-konva";
import { findIcon, ICON_VIEWBOX } from "@/lib/icons";
import { PRINT_CONFIG } from "@/lib/print-config";
import { renderFramedImage } from "@/lib/render/image-frame";
import { createQrBlob, QR_CARD_COLOR, quietZone } from "@/lib/render/qr";
import { TEXT_DEFAULTS } from "@/lib/render/text";
import type { CanvasElement } from "@/types/letter";
import { fontFamilyOf, useImage } from "./hooks";

interface Props {
  element: CanvasElement;
  qrUrl: string;
  fontsKey: string;
  hidden?: boolean;
}

function Photo({ element }: { element: CanvasElement }) {
  const image = useImage(element.src);
  const { width = 600, height = 600, frame = "none", filter = "none" } = element;
  const framed = useMemo(
    () =>
      image &&
      renderFramedImage(image, width, height, frame, filter, PRINT_CONFIG.EXPORT_PIXEL_RATIO),
    [image, width, height, frame, filter],
  );
  if (!framed) return <Rect width={width} height={height} fill="#EFECE6" />;
  return (
    <KonvaImage
      image={framed}
      width={width}
      height={height}
      shadowColor="#2B2623"
      shadowBlur={frame === "polaroid" || frame === "stamp" ? 18 : 0}
      shadowOpacity={0.18}
      shadowOffsetY={6}
    />
  );
}

function Sticker({ element }: { element: CanvasElement }) {
  const image = useImage(element.src);
  return image ? (
    <KonvaImage image={image} width={element.width} height={element.height} />
  ) : (
    <Rect width={element.width} height={element.height} fill="rgba(0,0,0,0.05)" />
  );
}

function Icon({ element }: { element: CanvasElement }) {
  const icon = findIcon(element.iconId);
  if (!icon) return null;
  const color = element.fill ?? "#8E2424";
  return (
    <>
      {/* Vùng bắt chuột phủ cả khung, kể cả chỗ trống giữa các nét */}
      <Rect width={element.width} height={element.height} fill="transparent" />
      <Path
        data={icon.d}
        scaleX={(element.width ?? ICON_VIEWBOX) / ICON_VIEWBOX}
        scaleY={(element.height ?? ICON_VIEWBOX) / ICON_VIEWBOX}
        fill={icon.filled ? color : undefined}
        stroke={icon.filled ? undefined : color}
        strokeWidth={1.4}
        lineCap="round"
        lineJoin="round"
      />
    </>
  );
}

function LinedArea({ element }: { element: CanvasElement }) {
  const { width = 1000, height = 400, lineStyle = "ruled" } = element;
  const color = element.fill ?? "#7A7067";
  const gap = lineStyle === "ruled" ? 80 : 46;
  const rows = Array.from({ length: Math.floor(height / gap) }, (_, i) => (i + 1) * gap);
  const columns = Array.from({ length: Math.floor(width / gap) + 1 }, (_, i) => i * gap);
  return (
    <>
      <Rect width={width} height={height} fill="transparent" />
      {lineStyle === "ruled"
        ? rows.map((y) => (
            <Line key={y} points={[0, y, width, y]} stroke={color} strokeWidth={2} opacity={0.45} />
          ))
        : rows.flatMap((y) =>
            columns.map((x) => (
              <Circle key={`${x}-${y}`} x={x} y={y} radius={2.5} fill={color} opacity={0.5} />
            )),
          )}
    </>
  );
}

function QrCode({ element, qrUrl }: { element: CanvasElement; qrUrl: string }) {
  const size = element.width ?? PRINT_CONFIG.CANVAS.defaultQrPx;
  const color = element.fill ?? "#2B2623";
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    createQrBlob({
      url: qrUrl,
      size: Math.round(size * PRINT_CONFIG.EXPORT_PIXEL_RATIO),
      color,
      iconId: element.iconId,
    })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(console.error);
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [qrUrl, size, color, element.iconId]);
  const image = useImage(src);
  const pad = quietZone(size);
  return (
    <>
      <Rect
        x={-pad}
        y={-pad}
        width={size + pad * 2}
        height={size + pad * 2}
        fill={QR_CARD_COLOR}
        cornerRadius={pad}
      />
      {image && <KonvaImage image={image} width={size} height={size} />}
    </>
  );
}

function content({ element, qrUrl, fontsKey }: Props) {
  switch (element.type) {
    case "text":
      return (
        <Text
          key={fontsKey}
          text={element.text ?? ""}
          width={element.width ?? TEXT_DEFAULTS.width}
          fontFamily={fontFamilyOf(element.fontFamily)}
          fontSize={element.fontSize ?? TEXT_DEFAULTS.fontSize}
          lineHeight={TEXT_DEFAULTS.lineHeight}
          fill={element.fill ?? TEXT_DEFAULTS.fill}
          align={element.align ?? "left"}
        />
      );
    case "image":
      return <Photo element={element} />;
    case "sticker_img":
      return <Sticker element={element} />;
    case "svg_icon":
      return <Icon element={element} />;
    case "lined_area":
      return <LinedArea element={element} />;
    case "handwriting":
      return (
        <Line
          points={element.points}
          stroke={element.fill ?? TEXT_DEFAULTS.fill}
          strokeWidth={element.strokeWidth ?? 4}
          hitStrokeWidth={24}
          lineCap="round"
          lineJoin="round"
        />
      );
    case "qr_code":
      return <QrCode element={element} qrUrl={qrUrl} />;
  }
}

export function ElementNode(
  props: Props & { onSelect?: (id: string) => void; onEdit?: (id: string) => void },
) {
  const { element, hidden, onSelect, onEdit } = props;
  return (
    <Group
      id={element.id}
      name="element"
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      visible={!hidden}
      onClick={() => onSelect?.(element.id)}
      onTap={() => onSelect?.(element.id)}
      onDblClick={() => onEdit?.(element.id)}
      onDblTap={() => onEdit?.(element.id)}
    >
      {content(props)}
    </Group>
  );
}
