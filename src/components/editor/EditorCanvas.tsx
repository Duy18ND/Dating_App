"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { currentHeight, useEditorStore } from "@/lib/editor/store";
import { PRINT_CONFIG } from "@/lib/print-config";
import { TextEditOverlay } from "./TextEditOverlay";

// Konva cần window nên không render phía server.
const EditorStage = dynamic(() => import("./EditorStage"), { ssr: false });

const { width: W } = PRINT_CONFIG.CANVAS;

/** Khung chứa canvas: tự tính scale để tờ thư vừa cả chiều ngang lẫn chiều dọc. */
export function EditorCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const tool = useEditorStore((s) => s.tool);
  const H = useEditorStore(currentHeight);

  useEffect(() => {
    const element = ref.current!;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.max(0, Math.min(width / W, height / H)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [H]);

  return (
    <div
      ref={ref}
      // touch-action: none để kéo/vẽ trên điện thoại không làm cuộn trang.
      className="flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden bg-canvas p-3 select-none md:p-6"
      onPointerDown={(event) => {
        // Chạm vào vùng xám quanh tờ thư thì bỏ chọn.
        if (event.target === event.currentTarget) useEditorStore.getState().select(null);
      }}
    >
      {scale > 0 && (
        <div
          className="relative shadow-md"
          style={{
            width: W * scale,
            height: H * scale,
            cursor: tool === "pen" ? "crosshair" : tool === "eraser" ? "cell" : undefined,
          }}
        >
          <EditorStage scale={scale} />
          <TextEditOverlay scale={scale} />
        </div>
      )}
    </div>
  );
}
