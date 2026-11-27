"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { dropIndex } from "@/lib/reorder";

/** Cuộn bảng khi kéo tới gần mép trên hoặc dưới. */
const EDGE_PX = 48;
const SCROLL_STEP = 12;

interface DragState {
  from: number;
  to: number;
  /** Quãng mục đang kéo đã đi theo con trỏ (px), gồm cả phần bảng đã cuộn. */
  offset: number;
}

function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
  }
  return null;
}

/**
 * Kéo tay đổi thứ tự trong danh sách, dùng Pointer Events nên chạy cả chuột lẫn ngón tay.
 * Chỉ nút nắm mới kéo được (touch-action: none), phần còn lại vẫn cuộn bình thường.
 * Bàn phím: chọn nút nắm rồi bấm mũi tên lên/xuống.
 */
export function useDragReorder(count: number, move: (from: number, to: number) => void) {
  const list = useRef<HTMLOListElement>(null);
  const start = useRef<{ y: number; middles: number[]; scroll: number; box: HTMLElement | null }>(
    null,
  );
  const [drag, setDrag] = useState<DragState | null>(null);

  function finish(commit: boolean) {
    if (commit && drag && drag.from !== drag.to) move(drag.from, drag.to);
    start.current = null;
    setDrag(null);
  }

  const handleProps = (index: number) => ({
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (event.button !== 0 || !list.current) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.focus();
      const box = scrollParent(list.current);
      start.current = {
        y: event.clientY,
        box,
        scroll: box?.scrollTop ?? 0,
        middles: [...list.current.children].map((child) => {
          const rect = child.getBoundingClientRect();
          return rect.top + rect.height / 2;
        }),
      };
      setDrag({ from: index, to: index, offset: 0 });
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const origin = start.current;
      if (!origin) return;
      const { box } = origin;
      if (box) {
        const rect = box.getBoundingClientRect();
        if (event.clientY < rect.top + EDGE_PX) box.scrollTop -= SCROLL_STEP;
        else if (event.clientY > rect.bottom - EDGE_PX) box.scrollTop += SCROLL_STEP;
      }
      const scrolled = (box?.scrollTop ?? 0) - origin.scroll;
      setDrag({
        from: index,
        to: dropIndex(origin.middles, index, event.clientY + scrolled),
        offset: event.clientY - origin.y + scrolled,
      });
    },
    onPointerUp: () => finish(true),
    onPointerCancel: () => finish(false),
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      if (event.key === "Escape") return finish(false);
      const step = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
      if (!step) return;
      event.preventDefault();
      const to = index + step;
      if (to < 0 || to >= count) return;
      const handle = event.currentTarget;
      move(index, to);
      // Đổi chỗ trong DOM có thể làm rơi focus: giữ lại để bấm tiếp được.
      requestAnimationFrame(() => handle.focus());
    },
  });

  /** Vạch báo chỗ sẽ thả, vẽ phía trên hoặc dưới mục đích. */
  const markerFor = (index: number): "before" | "after" | null => {
    if (!drag || drag.from === drag.to || index !== drag.to) return null;
    return drag.to > drag.from ? "after" : "before";
  };

  return { list, drag, handleProps, markerFor };
}
