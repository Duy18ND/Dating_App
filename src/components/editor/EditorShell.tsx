"use client";

import {
  Check,
  ChevronDown,
  Image as ImageIcon,
  LayoutTemplate,
  Palette,
  PenLine,
  QrCode,
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
import { BackgroundPanel } from "./BackgroundPanel";
import { EditorCanvas } from "./EditorCanvas";
import { ElementToolbar } from "./ElementToolbar";
import { EnvelopePanel } from "./EnvelopePanel";
import { HandwritingPanel } from "./HandwritingPanel";
import { ImagePanel } from "./ImagePanel";
import { KitPreview } from "./print/KitPreview";
import { QrPanel } from "./QrPanel";
import { StickerPanel } from "./StickerPanel";
import { TemplatePanel } from "./TemplatePanel";
import { AddTextButton, TextPanel } from "./TextPanel";
import { inputClass } from "./ui";
import { WebEditor } from "./web/WebEditor";

type TabId =
  | "template"
  | "text"
  | "image"
  | "background"
  | "sticker"
  | "draw"
  | "qr";

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
  { id: "qr", label: "Mã QR", icon: QrCode, Panel: QrPanel },
];

const BOARD_TOOLS: TabId[] = ["text", "image", "background", "sticker", "draw"];

/** Chọn một phần tử trên canvas thì mở đúng tab chỉnh thuộc tính của nó. */
const TAB_OF: Record<ElementType, TabId> = {
  text: "text",
  image: "image",
  svg_icon: "sticker",
  sticker_img: "sticker",
  handwriting: "draw",
  lined_area: "draw",
  qr_code: "qr",
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

type Mode = "print" | "web";
const MODES: { value: Mode; label: string }[] = [
  { value: "print", label: "Bản in" },
  { value: "web", label: "Trang web" },
];

/** Hai tab lớn của trình thiết kế (SRS 2.3). */
function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div role="group" aria-label="Phần đang thiết kế" className="flex border-b bg-card px-3 py-1.5">
      <div className="mx-auto flex w-full max-w-sm rounded-lg bg-muted p-0.5">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => onChange(value)}
            className="flex-1 rounded-md py-1.5 text-sm font-medium aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Các màn con của "Bản in" (SRS 2.3). Hai mặt thiệp dùng chung bộ công cụ canvas. */
type PrintView = FaceId | "envelope" | "kit";
const PRINT_VIEWS: { value: PrintView; label: string }[] = [
  { value: "front", label: "Mặt trước" },
  { value: "inside", label: "Mặt sau + QR" },
  { value: "envelope", label: "Phong bì" },
  { value: "kit", label: "Xem cả bộ" },
];

function PrintViewSwitch({
  view,
  onChange,
}: {
  view: PrintView;
  onChange: (view: PrintView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Phần bản in"
      className="flex shrink-0 gap-1 border-b bg-card px-2 py-1.5 md:justify-center"
    >
      {PRINT_VIEWS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className="flex-auto rounded-md border px-1.5 py-1.5 text-xs whitespace-nowrap aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:font-medium aria-pressed:text-primary md:flex-none md:px-4 md:text-sm"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function EditorShell() {
  const desktop = useDesktop();
  const [mode, setMode] = useState<Mode>("print");
  const [extraView, setExtraView] = useState<"envelope" | "kit" | null>(null);
  const face = useEditorStore((s) => s.face);
  const printView: PrintView = extraView ?? face;
  const [tab, setTab] = useState<TabId>("template");
  const [sheetOpen, setSheetOpen] = useState(false);
  const boardId = useEditorStore((s) => s.boardId);
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

  /** Rời canvas thì bỏ chọn, để phím Delete hay mũi tên không sửa vật thể đang bị ẩn. */
  function leaveCanvas() {
    useEditorStore.getState().setTool("select");
    setSheetOpen(false);
  }

  function changeMode(next: Mode) {
    leaveCanvas();
    setMode(next);
  }

  function changeView(next: PrintView) {
    if (next === "envelope" || next === "kit") {
      leaveCanvas();
      setExtraView(next);
    } else {
      setExtraView(null);
      useEditorStore.getState().setFace(next);
    }
  }

  // Thiết kế khung tự do dùng lại chính trình soạn thiệp, bỏ công cụ chỉ dành cho bản in.
  const designing = boardId !== null;
  const tools = designing ? TABS.filter((t) => BOARD_TOOLS.includes(t.id)) : TABS;
  const active = tools.find((t) => t.id === tab) ?? tools[0];
  const printing = mode === "print" && !designing;
  const onCard = designing || (printing && extraView === null);
  const showPanel = onCard && (desktop || sheetOpen);

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

      {designing ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-accent px-3 py-1.5">
          <p className="text-sm font-medium">Đang thiết kế khung tự do của trang web</p>
          <Button
            type="button"
            size="sm"
            className="h-9"
            onClick={() => {
              setSheetOpen(false);
              useEditorStore.getState().setBoard(null);
            }}
          >
            <Check /> Xong
          </Button>
        </div>
      ) : (
        <ModeSwitch mode={mode} onChange={changeMode} />
      )}

      {/* Giữ nguyên tab Trang web khi vào màn thiết kế khung, để quay lại đúng chỗ. */}
      {mode === "web" && (
        <div className={cn("flex min-h-0 flex-1 flex-col", designing && "hidden")}>
          <WebEditor desktop={desktop} />
        </div>
      )}
      {printing && <PrintViewSwitch view={printView} onChange={changeView} />}
      {printing && extraView === "kit" && <KitPreview />}
      {printing && extraView === "envelope" && (
        <div className="min-h-0 flex-1 overflow-y-auto bg-canvas p-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
          <div className="mx-auto max-w-md rounded-lg border bg-card p-4">
            <EnvelopePanel />
          </div>
        </div>
      )}

      <div className={cn("flex min-h-0 flex-1", !onCard && "hidden")}>
        {desktop && (
          <nav
            aria-label="Công cụ"
            className="flex w-20 shrink-0 flex-col gap-1 border-r bg-card p-2"
          >
            {tools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={active.id === id}
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
          {desktop && (
            <div className="flex min-h-12 items-center border-b bg-card px-3 py-1.5">
              <ElementToolbar className="ml-auto" />
            </div>
          )}
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

      {!desktop && onCard && (
        <nav
          aria-label="Công cụ"
          className="flex h-16 shrink-0 items-stretch border-t bg-card pb-[env(safe-area-inset-bottom)]"
        >
          {tools.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={sheetOpen && active.id === id}
              onClick={() => openTab(id)}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] whitespace-nowrap aria-pressed:text-primary"
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
