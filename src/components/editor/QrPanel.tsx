"use client";

import { Eraser, QrCode, Type } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor/store";
import { ICONS } from "@/lib/icons";
import { PRINT_CONFIG } from "@/lib/print-config";
import { createQrBlob, isScannableColor, previewQrUrl, quietZone } from "@/lib/render/qr";
import { ColorField } from "./ColorField";
import { Field, inputClass, Section, Slider } from "./ui";

const QR_COLORS = ["#2B2623", "#8E2424", "#2F4A3A", "#243B5A", "#4A2C5E"];
const MAX_QR_PX = 520;
const { width: W, height: H, safeMarginPx: M, minQrPx, defaultQrPx } = PRINT_CONFIG.CANVAS;
const CORNER_INSET = M + 8;

const CORNERS = [
  { id: "tl", label: "Góc trên trái" },
  { id: "tr", label: "Góc trên phải" },
  { id: "bl", label: "Góc dưới trái" },
  { id: "br", label: "Góc dưới phải" },
] as const;

type CornerId = (typeof CORNERS)[number]["id"];

function cornerPosition(corner: CornerId, size: number) {
  const pad = quietZone(size);
  const left = CORNER_INSET + pad;
  const right = W - CORNER_INSET - pad - size;
  const top = CORNER_INSET + pad;
  const bottom = H - CORNER_INSET - pad - size;
  return {
    tl: { x: left, y: top },
    tr: { x: right, y: top },
    bl: { x: left, y: bottom },
    br: { x: right, y: bottom },
  }[corner];
}

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

/** Mã QR đổi màu, chèn icon giữa. Mỗi thiệp có một mã, luôn ở mặt sau (inside). */
export function QrPanel() {
  const element = useEditorStore((s) =>
    s.doc.canvas_data.faces.inside.elements.find((el) => el.type === "qr_code"),
  );
  const hasOtherOnInside = useEditorStore((s) =>
    s.doc.canvas_data.faces.inside.elements.some((el) => el.type !== "qr_code"),
  );
  const setFace = useEditorStore((s) => s.setFace);
  const addElement = useEditorStore((s) => s.addElement);
  const update = useEditorStore((s) => s.updateElement);
  const select = useEditorStore((s) => s.select);
  const setEditingText = useEditorStore((s) => s.setEditingText);
  const clearInsideForHandwriting = useEditorStore((s) => s.clearInsideForHandwriting);
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
            const pos = cornerPosition("br", defaultQrPx);
            addElement({
              type: "qr_code",
              ...pos,
              width: defaultQrPx,
              height: defaultQrPx,
              fill: QR_COLORS[0],
            });
          }}
        >
          <QrCode /> Thêm mã QR ở góc
        </Button>
        <p className="text-xs text-muted-foreground">
          Mã QR được đặt gọn ở góc mặt sau để chừa chỗ gõ lời nhắn hoặc viết tay.
        </p>
      </Section>
    );
  }

  const color = element.fill ?? QR_COLORS[0];
  const size = element.width ?? defaultQrPx;

  function addMessageBox() {
    setFace("inside");
    const id = addElement({
      type: "text",
      x: 120,
      y: 130,
      width: 1120,
      text: "Viết lời nhắn của bạn ở đây...",
      fontFamily: "Cormorant Garamond",
      fontSize: 54,
      fill: "#2B2623",
      align: "left",
    });
    setEditingText(id);
  }

  return (
    <Section title="Mã QR">
      <div className="flex flex-wrap gap-2">
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
      </div>
      <QrPreview color={color} iconId={element.iconId} />

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Đặt nhanh vào góc</p>
        <div className="grid grid-cols-2 gap-1.5">
          {CORNERS.map((corner) => (
            <Button
              key={corner.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFace("inside");
                update(element.id, cornerPosition(corner.id, size));
                select(element.id);
              }}
            >
              {corner.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 rounded-lg border bg-accent/40 p-2.5">
        <p className="text-xs font-medium">Kiểu mặt sau thiệp</p>
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasOtherOnInside}
            onClick={clearInsideForHandwriting}
          >
            <Eraser /> Để trống viết tay (chỉ giữ QR)
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addMessageBox}>
            <Type /> Thêm khung gõ chữ trên app
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Bạn có thể gõ lời nhắn ngay trên mặt sau hoặc để trống để in ra tự viết tay (bấm Ctrl+Z để
          hoàn tác).
        </p>
      </div>

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
