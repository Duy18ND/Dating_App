"use client";

import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Copy,
  Lock,
  SlidersHorizontal,
  Trash2,
  Unlock,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { currentElements, useEditorStore } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

function Action({
  label,
  onClick,
  children,
  disabled,
  destructive,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant={destructive ? "destructive" : "ghost"}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="size-10 shrink-0 md:size-8"
    >
      {children}
    </Button>
  );
}

/** Thao tác trên phần tử đang chọn: thứ tự lớp, khóa, nhân bản, xóa. */
export function ElementToolbar({
  onOpenProperties,
  className,
}: {
  /** Chỉ có trên điện thoại: mở bảng thuộc tính của phần tử. */
  onOpenProperties?: () => void;
  className?: string;
}) {
  const element = useEditorStore((s) => currentElements(s).find((el) => el.id === s.selectedId));
  const { moveLayer, updateElement, duplicateElement, removeElement } = useEditorStore.getState();
  if (!element) return null;
  const id = element.id;
  const locked = !!element.locked;

  return (
    <div
      role="toolbar"
      aria-label="Thao tác với thành phần đang chọn"
      className={cn("flex items-center gap-1 overflow-x-auto", className)}
    >
      {onOpenProperties && (
        <Action label="Chỉnh thuộc tính" onClick={onOpenProperties}>
          <SlidersHorizontal />
        </Action>
      )}
      <Action label="Đưa lên trên cùng" onClick={() => moveLayer(id, "front")}>
        <ArrowUpToLine />
      </Action>
      <Action label="Lên một lớp" onClick={() => moveLayer(id, "forward")}>
        <ArrowUp />
      </Action>
      <Action label="Xuống một lớp" onClick={() => moveLayer(id, "backward")}>
        <ArrowDown />
      </Action>
      <Action label="Xuống dưới cùng" onClick={() => moveLayer(id, "back")}>
        <ArrowDownToLine />
      </Action>
      <Action
        label={locked ? "Mở khóa vị trí" : "Khóa vị trí"}
        onClick={() => updateElement(id, { locked: !locked })}
      >
        {locked ? <Lock /> : <Unlock />}
      </Action>
      <Action
        label="Nhân bản"
        // Mỗi thư chỉ cần một mã QR.
        disabled={element.type === "qr_code"}
        onClick={() => duplicateElement(id)}
      >
        <Copy />
      </Action>
      <Action label="Xóa" destructive disabled={locked} onClick={() => removeElement(id)}>
        <Trash2 />
      </Action>
    </div>
  );
}
