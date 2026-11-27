"use client";

import { useEffect, useRef, useState } from "react";
import {
  PART_SIZE_MM,
  type PrintPartId,
  type RenderOptions,
  type RenderedPart,
} from "@/lib/print/parts";
import { cn } from "@/lib/utils";

const PREVIEW_PX_PER_MM = 6;

/**
 * Xem trước một phần in bằng chính hàm vẽ dùng cho PDF, nên thấy sao in vậy (không tràn màu).
 * `render` phải được bọc useCallback; đổi hàm thì vẽ lại.
 */
export function PartPreview({
  part,
  render,
  label,
  className,
  children,
}: {
  part: PrintPartId;
  render: (options: RenderOptions) => Promise<RenderedPart>;
  label: string;
  className?: string;
  /** Lớp phủ, ví dụ vạch gấp. */
  children?: React.ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const size = PART_SIZE_MM[part];

  useEffect(() => {
    let active = true;
    render({ pxPerMm: PREVIEW_PX_PER_MM, background: true, bleedMm: 0 }).then(
      ({ canvas }) => {
        if (!active || !host.current) return;
        canvas.className = "block size-full";
        host.current.replaceChildren(canvas);
        setFailed(false);
      },
      (cause) => {
        console.error(cause);
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [render]);

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative w-full overflow-hidden rounded-sm border bg-muted", className)}
      style={{ aspectRatio: `${size.width} / ${size.height}` }}
    >
      <div ref={host} className="absolute inset-0" />
      {children}
      {failed && (
        <p role="alert" className="absolute inset-0 p-2 text-xs text-destructive">
          Không vẽ được bản xem trước.
        </p>
      )}
    </div>
  );
}
