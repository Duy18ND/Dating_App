"use client";

import { QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { ICONS } from "@/lib/icons";
import { PRINT_CONFIG } from "@/lib/print-config";
import { createQrBlob, isScannableColor, previewQrUrl, quietZone } from "@/lib/render/qr";
import { ColorField } from "./ColorField";
import { Field, inputClass, Section, Slider } from "./ui";

const QR_COLORS = ["#2B2623", "#8E2424", "#2F4A3A", "#243B5A", "#4A2C5E"];
const MAX_QR_PX = 600;
const { width: W, height: H, minQrPx, defaultQrPx } = PRINT_CONFIG.CANVAS;

/** Chiều rộng in thật (mm) trên thiệp, để người dùng biết mã có đủ lớn không. */
const printedMm = (px: number) => Math.round((px / W) * PRINT_CONFIG.CARD_FACE_MM.width);

function QrPreview({ color, iconId }: { color: string; iconId?: string }) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    createQrBlob({
      url: previewQrUrl(window.location.origin),
      size: 320,
      color,
      iconId,
      margin: quietZone(320),
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
  }, [color, iconId]);

  return (
    <figure className="space-y-1">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh blob tạo ngay trên trình duyệt
        <img src={src} alt="Xem trước mã QR" className="size-40 rounded-md border bg-white" />
      ) : (
        <div className="size-40 rounded-md border bg-muted" />
      )}
      <figcaption className="text-xs text-muted-foreground">
        Mã xem trước. Link thật được gắn khi xuất bản.
      </figcaption>
    </figure>
  );
}

/** Mã QR đổi màu, chèn icon giữa. Mỗi thiệp có một mã, luôn ở trang Lời mời (mặt inside). */
export function QrPanel() {
  const element = useEditorStore((s) =>
    s.doc.canvas_data.faces.inside.elements.find((el) => el.type === "qr_code"),
  );
  const setFace = useEditorStore((s) => s.setFace);
  const addElement = useEditorStore((s) => s.addElement);
  const update = useEditorStore((s) => s.updateElement);
  const select = useEditorStore((s) => s.select);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const [colorError, setColorError] = useState(false);

  if (!element) {
    return (
      <Section title="Mã QR">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFace("inside");
            // Đặt ở nửa phải trang Lời mời, chừa nửa trái cho lời nhắn.
            addElement({
              type: "qr_code",
              x: Math.round(W * 0.67 - defaultQrPx / 2),
              y: Math.round((H - defaultQrPx) / 2),
              width: defaultQrPx,
              height: defaultQrPx,
              fill: QR_COLORS[0],
            });
          }}
        >
          <QrCode /> Thêm mã QR
        </Button>
        <p className="text-xs text-muted-foreground">
          Mã QR được đặt ở trang Lời mời bên trong thiệp.
        </p>
      </Section>
    );
  }

  const color = element.fill ?? QR_COLORS[0];
  const size = element.width ?? defaultQrPx;

  return (
    <Section title="Mã QR">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setFace("inside");
          select(element.id);
        }}
      >
        Chọn mã trên thiệp
      </Button>
      <QrPreview color={color} iconId={element.iconId} />

      <ColorField
        label="Màu mã"
        colors={QR_COLORS}
        value={color}
        onChange={(fill, custom) => {
          const ok = isScannableColor(fill);
          setColorError(!ok);
          if (ok) update(element.id, { fill }, custom ? `qr-color:${element.id}` : undefined);
        }}
        onCommit={endCoalesce}
      />
      {colorError && (
        <p role="alert" className="text-sm text-destructive">
          Màu này quá nhạt, camera sẽ khó quét. Hãy chọn màu đậm hơn.
        </p>
      )}

      <Field label="Icon ở giữa">
        <select
          className={inputClass}
          value={element.iconId ?? ""}
          onChange={(event) => update(element.id, { iconId: event.target.value || undefined })}
        >
          <option value="">Không có</option>
          {ICONS.map((icon) => (
            <option key={icon.id} value={icon.id}>
              {icon.label}
            </option>
          ))}
        </select>
      </Field>

      <Slider
        label="Kích thước"
        min={minQrPx}
        max={MAX_QR_PX}
        step={4}
        value={size}
        format={(px) => `${Math.round(px)}px (~${printedMm(px)} mm khi in)`}
        onChange={(px) => update(element.id, { width: px, height: px }, `qr-size:${element.id}`)}
        onCommit={endCoalesce}
      />
    </Section>
  );
}
