"use client";

import {
  ChevronDown,
  Image as ImageIcon,
  LayoutTemplate,
  Music,
  NotebookPen,
  Palette,
  PenLine,
  Redo2,
  Smile,
  Type,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type ComponentType } from "react";
import { PublishDialog } from "@/components/share/PublishDialog";
import { Button } from "@/components/ui/button";
import { currentElements, useEditorStore } from "@/lib/editor/store";
import { cn } from "@/lib/utils";
import type { ElementType, FaceId } from "@/types/letter";
import { AudioPanel } from "./AudioPanel";
import { BackgroundPanel } from "./BackgroundPanel";
import { EditorCanvas } from "./EditorCanvas";
import { ElementToolbar } from "./ElementToolbar";
import { HandwritingPanel } from "./HandwritingPanel";
import { ImagePanel } from "./ImagePanel";
import { LetterPanel } from "./LetterPanel";
import { QrPanel } from "./QrPanel";
import { StickerPanel } from "./StickerPanel";
import { TemplatePanel } from "./TemplatePanel";
import { AddTextButton, TextPanel } from "./TextPanel";
import { inputClass } from "./ui";
import { WebPanel } from "./WebPanel";

type TabId =
  | "template"
  | "text"
  | "image"
  | "background"
  | "sticker"
  | "draw"
  | "web"
  | "letter";

const TABS: { id: TabId; label: string; icon: ComponentType; Panel: ComponentType }[] = [
  { id: "template", label: "Mẫu", icon: LayoutTemplate, Panel: TemplatePanel },
  {
    id: "text",
    label: "Chữ",
    icon: Type,
    Panel: () => (
      <div className="space-y-6">
        <AddTextButton />
        <TextPanel />
      </div>
    ),
  },
  { id: "image", label: "Ảnh", icon: ImageIcon, Panel: ImagePanel },
  { id: "background", label: "Nền", icon: Palette, Panel: BackgroundPanel },
  { id: "sticker", label: "Sticker", icon: Smile, Panel: StickerPanel },
  { id: "draw", label: "Vẽ tay", icon: PenLine, Panel: HandwritingPanel },
  { id: "letter", label: "Thư", icon: NotebookPen, Panel: LetterPanel },
  {
    id: "web",
    label: "QR & Web",
    icon: Music,
    Panel: () => (
      <div className="space-y-6">
        <QrPanel />
        <AudioPanel />
        <WebPanel />
      </div>
    ),
  },
];

/** Chọn một phần tử trên canvas thì mở đúng tab chỉnh thuộc tính của nó. */
const TAB_OF: Record<ElementType, TabId> = {
  text: "text",
  image: "image",
  svg_icon: "sticker",
  sticker_img: "sticker",
  handwriting: "draw",
  lined_area: "draw",
  qr_code: "web",
};

const DESKTOP = "(min-width: 768px)";
function useDesktop() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(DESKTOP);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => true,
  );
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** Phím tắt PC: Ctrl+Z/Y, Delete, mũi tên (Shift = 10px), Ctrl+D, Esc. */
function useShortcuts() {
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const state = useEditorStore.getState();
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      const selected = currentElements(state).find((el) => el.id === state.selectedId);

      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
      } else if (mod && key === "y") {
        event.preventDefault();
        state.redo();
      } else if (mod && key === "d" && selected && selected.type !== "qr_code") {
        event.preventDefault();
        state.duplicateElement(selected.id);
      } else if ((key === "delete" || key === "backspace") && selected && !selected.locked) {
        event.preventDefault();
        state.removeElement(selected.id);
      } else if (key === "escape") {
        state.setTool("select");
      } else if (key === "enter" && selected?.type === "text") {
        event.preventDefault();
        state.setEditingText(selected.id);
      } else if (key.startsWith("arrow") && selected && !selected.locked) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
        const dy = key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
        state.updateElement(
          selected.id,
          { x: selected.x + dx, y: selected.y + dy },
          `nudge:${selected.id}`,
        );
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.key.startsWith("Arrow")) useEditorStore.getState().endCoalesce();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
}

/** Hỏi lại trước khi rời trang nếu còn thay đổi chưa lưu. */
function useLeaveWarning() {
  const dirty = useEditorStore((s) => s.doc !== s.savedDoc);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}

function HistoryButtons() {
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const { undo, redo } = useEditorStore.getState();
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Hoàn tác (Ctrl+Z)"
        title="Hoàn tác (Ctrl+Z)"
        disabled={!canUndo}
        onClick={undo}
      >
        <Undo2 />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Làm lại (Ctrl+Y)"
        title="Làm lại (Ctrl+Y)"
        disabled={!canRedo}
        onClick={redo}
      >
        <Redo2 />
      </Button>
    </>
  );
}

const FACES: { value: FaceId; label: string }[] = [
  { value: "front", label: "Bìa trước" },
  { value: "inside", label: "Lời mời + QR" },
];

/** Chọn mặt thiệp đang thiết kế. */
function FaceSwitch() {
  const face = useEditorStore((s) => s.face);
  return (
    <div role="group" aria-label="Mặt thiệp" className="flex rounded-lg border bg-card p-0.5">
      {FACES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={face === value}
          onClick={() => useEditorStore.getState().setFace(value)}
          className="rounded-md px-3 py-1.5 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function EditorShell() {
  const desktop = useDesktop();
  const [tab, setTab] = useState<TabId>("template");
  const [sheetOpen, setSheetOpen] = useState(false);
  const title = useEditorStore((s) => s.doc.title);
  const selectedType = useEditorStore(
    (s) => currentElements(s).find((el) => el.id === s.selectedId)?.type,
  );
  useShortcuts();
  useLeaveWarning();

  // Chọn phần tử trên canvas thì chuyển sang tab thuộc tính tương ứng.
  const [lastSelectedType, setLastSelectedType] = useState(selectedType);
  if (selectedType !== lastSelectedType) {
    setLastSelectedType(selectedType);
    if (selectedType) setTab(TAB_OF[selectedType]);
  }

  function openTab(id: TabId) {
    // Rời tab Vẽ tay thì trở lại chế độ chọn để không vẽ nhầm.
    if (id !== "draw") useEditorStore.getState().setTool("select");
    if (!desktop && id === tab) setSheetOpen((open) => !open);
    else setSheetOpen(true);
    setTab(id);
  }

  const active = TABS.find((t) => t.id === tab)!;
  const showPanel = desktop || sheetOpen;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex items-center gap-2 border-b bg-card px-3 py-2">
        <Link
          href="/"
          className="shrink-0 font-playfair text-lg text-primary"
          aria-label="Về trang chủ"
        >
          Phygital Letter
        </Link>
        <input
          className={cn(inputClass, "hidden max-w-xs md:block")}
          aria-label="Tên lá thư"
          placeholder="Tên lá thư"
          maxLength={120}
          value={title}
          onChange={(event) => useEditorStore.getState().setTitle(event.target.value, "title")}
          onBlur={useEditorStore.getState().endCoalesce}
        />
        <div className="ml-auto flex items-center gap-1">
          <HistoryButtons />
          <PublishDialog />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {desktop && (
          <nav
            aria-label="Công cụ"
            className="flex w-20 shrink-0 flex-col gap-1 border-r bg-card p-2"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={tab === id}
                onClick={() => openTab(id)}
                className="flex flex-col items-center gap-1 rounded-md px-1 py-2 text-xs hover:bg-accent aria-pressed:bg-accent aria-pressed:text-primary"
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>
        )}

        {showPanel && (
          <aside
            aria-label={active.label}
            className={cn(
              "overflow-y-auto bg-card p-4",
              desktop
                ? "w-80 shrink-0 border-r"
                : "fixed inset-x-0 bottom-16 z-30 h-[45dvh] rounded-t-2xl border-t shadow-[0_-8px_24px_rgba(0,0,0,0.12)]",
            )}
          >
            {!desktop && (
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="mb-2 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground"
                aria-label="Thu gọn bảng công cụ"
              >
                <ChevronDown className="size-4" /> {active.label}
              </button>
            )}
            <active.Panel />
          </aside>
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-12 items-center gap-3 border-b bg-card px-3 py-1.5">
            <FaceSwitch />
            {desktop && <ElementToolbar className="ml-auto" />}
          </div>
          <EditorCanvas />
          {!desktop && !sheetOpen && (
            // Thanh nổi trên điện thoại, chỉ hiện khi đang chọn một thành phần.
            <ElementToolbar
              onOpenProperties={() => selectedType && openTab(TAB_OF[selectedType])}
              className="mx-2 mb-2 rounded-xl border bg-card px-1 shadow-md empty:hidden"
            />
          )}
        </main>
      </div>

      {!desktop && (
        <nav
          aria-label="Công cụ"
          className="flex h-16 shrink-0 items-stretch overflow-x-auto border-t bg-card pb-[env(safe-area-inset-bottom)]"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={sheetOpen && tab === id}
              onClick={() => openTab(id)}
              className="flex min-w-16 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] aria-pressed:text-primary"
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
