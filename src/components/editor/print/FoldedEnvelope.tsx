"use client";

import { useCallback } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { foldedEnvelope, type Point } from "@/lib/print/layout";
import { PRINT_CONFIG } from "@/lib/print-config";
import { drawEnvelopeFront, renderEnvelopeFlap } from "@/lib/print/render-envelope";
import { RenderedCanvas } from "./RenderedCanvas";

const PX_PER_MM = 8;

function trace(ctx: CanvasRenderingContext2D, points: Point[], close = true) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  if (close) ctx.closePath();
}

/**
 * Phong bì gấp xong: hình dáng lật từ chính phôi in, chữ nắp vẽ bằng hàm dùng cho PDF.
 */
export function FoldedEnvelope() {
  const decor = useEditorStore((s) => s.doc.canvas_data.envelope);
  const color = useEditorStore((s) => s.doc.web_config.envelopeColor);
  const shape = foldedEnvelope();

  const draw = useCallback(async () => {
    const folded = foldedEnvelope();
    const flapText = await renderEnvelopeFlap(
      { decor, color },
      { pxPerMm: PX_PER_MM, background: false, bleedMm: 0 },
    );
    const canvas = document.createElement("canvas");
    canvas.width = folded.width * PX_PER_MM;
    canvas.height = folded.height * PX_PER_MM;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(PX_PER_MM, PX_PER_MM);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, folded.width, folded.height);

    const layer = (points: Point[], shade: number) => {
      ctx.save();
      trace(ctx, points);
      ctx.shadowColor = "rgba(0,0,0,0.22)";
      ctx.shadowBlur = 1.6 * PX_PER_MM;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowColor = "transparent";
      // Phủ tối nhẹ để phân biệt các lớp giấy cùng màu.
      ctx.fillStyle = `rgba(0,0,0,${shade})`;
      ctx.fill();
      ctx.lineWidth = 0.2;
      ctx.strokeStyle = "rgba(43,38,35,0.45)";
      ctx.stroke();
      ctx.restore();
    };
    for (const side of folded.sides) layer(side, 0.08);
    layer(folded.bottomFlap, 0.03);

    // Nắp trên: phần tai cài qua khe nằm dưới nắp đáy nên không thấy.
    ctx.save();
    ctx.beginPath();
    ctx.rect(-2, -2, folded.width + 4, folded.slitY + 2);
    ctx.clip();
    layer(folded.topFlap, 0);
    ctx.drawImage(flapText.canvas, 0, 0, folded.width, folded.flapHeight);
    ctx.restore();

    trace(ctx, folded.slit, false);
    ctx.lineWidth = 0.35;
    ctx.strokeStyle = "rgba(43,38,35,0.8)";
    ctx.stroke();
    return canvas;
  }, [decor, color]);

  return (
    <RenderedCanvas
      draw={draw}
      label="Phong bì sau khi gấp"
      ratio={shape.width / shape.height}
      className="rounded-md border shadow-sm"
    />
  );
}

const { bodyWidth, bodyHeight } = PRINT_CONFIG.ENVELOPE_C7_FLAT_MM;

/** Mặt trước phong bì thành phẩm (mặt không có nắp), vẽ chữ bằng hàm dùng cho bản in. */
export function EnvelopeFront() {
  const decor = useEditorStore((s) => s.doc.canvas_data.envelope);
  const color = useEditorStore((s) => s.doc.web_config.envelopeColor);
  const recipient = useEditorStore((s) => s.doc.web_config.recipientName);

  const draw = useCallback(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = bodyWidth * PX_PER_MM;
    canvas.height = bodyHeight * PX_PER_MM;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(PX_PER_MM, PX_PER_MM);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, bodyWidth, bodyHeight);
    await drawEnvelopeFront(
      ctx,
      PX_PER_MM,
      { x: 0, y: 0, width: bodyWidth, height: bodyHeight },
      { decor, color, recipient },
    );
    return canvas;
  }, [decor, color, recipient]);

  return (
    <RenderedCanvas
      draw={draw}
      label="Mặt trước phong bì"
      ratio={bodyWidth / bodyHeight}
      className="rounded-md border shadow-sm"
    />
  );
}
