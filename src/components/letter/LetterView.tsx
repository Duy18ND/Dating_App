"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PRINT_CONFIG } from "@/lib/print-config";
import type { LetterStageProps } from "./LetterStage";

// Konva cần window nên không render phía server.
const LetterStage = dynamic(() => import("./LetterStage"), { ssr: false });

const { width: W, height: H } = PRINT_CONFIG.CANVAS;

type Props = Omit<LetterStageProps, "scale"> & {
  /** Lớp HTML đặt trên canvas, ví dụ ô sửa chữ. */
  overlay?: (scale: number) => ReactNode;
};

/** Tự tính scale theo bề rộng khung chứa. */
export function LetterView({ overlay, height = H, ...stage }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const element = ref.current!;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / W));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative w-full" style={{ aspectRatio: `${W} / ${height}` }}>
      {scale > 0 && (
        <>
          <LetterStage {...stage} height={height} scale={scale} />
          {overlay?.(scale)}
        </>
      )}
    </div>
  );
}
