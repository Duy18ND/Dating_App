import { nanoid } from "nanoid";
import { create } from "zustand";
import type { PrintSize } from "@/lib/print-config";
import type { BackgroundConfig, CanvasElement, LetterPayload, WebConfig } from "@/types/letter";
import { blankLetter } from "./defaults";

export const HISTORY_LIMIT = 50;

export type NewElement = Omit<CanvasElement, "id" | "zIndex" | "rotation"> & { rotation?: number };
export type LayerMove = "front" | "back" | "forward" | "backward";

interface EditorState {
  /** Phần được lưu và nằm trong lịch sử Undo/Redo. Không bao giờ sửa tại chỗ. */
  doc: LetterPayload;
  past: LetterPayload[];
  future: LetterPayload[];
  coalesceKey: string | null;

  // Trạng thái giao diện tạm thời, không vào lịch sử.
  selectedId: string | null;
  editingTextId: string | null;
  printHideBackground: boolean;

  load: (doc: LetterPayload) => void;
  select: (id: string | null) => void;
  setEditingText: (id: string | null) => void;
  setPrintHideBackground: (hide: boolean) => void;

  /**
   * Mọi thay đổi tài liệu đi qua đây. Các lần gọi liên tiếp cùng `key`
   * (kéo thanh trượt, gõ chữ) được gộp thành một bước Undo cho tới khi gọi `endCoalesce`.
   */
  commit: (recipe: (doc: LetterPayload) => LetterPayload, key?: string) => void;
  endCoalesce: () => void;
  undo: () => void;
  redo: () => void;

  addElement: (element: NewElement) => string;
  updateElement: (id: string, patch: Partial<CanvasElement>, key?: string) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  moveLayer: (id: string, move: LayerMove) => void;
  setBackground: (patch: Partial<BackgroundConfig>, key?: string) => void;
  setPrintSize: (size: PrintSize) => void;
  setWebConfig: (patch: Partial<WebConfig>, key?: string) => void;
  setTitle: (title: string, key?: string) => void;
}

const withElements = (
  doc: LetterPayload,
  recipe: (elements: CanvasElement[]) => CanvasElement[],
): LetterPayload => {
  const elements = recipe(doc.canvas_data.elements);
  if (elements === doc.canvas_data.elements) return doc;
  return { ...doc, canvas_data: { ...doc.canvas_data, elements } };
};

export const sortByLayer = (elements: CanvasElement[]) =>
  [...elements].sort((a, b) => a.zIndex - b.zIndex);

/** Đánh lại zIndex 0..n-1 theo thứ tự trong mảng. */
const renumber = (ordered: CanvasElement[]) =>
  ordered.map((el, zIndex) => (el.zIndex === zIndex ? el : { ...el, zIndex }));

function reorder(elements: CanvasElement[], id: string, move: LayerMove): CanvasElement[] {
  const ordered = sortByLayer(elements);
  const from = ordered.findIndex((el) => el.id === id);
  if (from < 0) return elements;
  const last = ordered.length - 1;
  const to = {
    front: last,
    back: 0,
    forward: Math.min(from + 1, last),
    backward: Math.max(from - 1, 0),
  }[move];
  if (to === from) return elements;
  const [item] = ordered.splice(from, 1);
  ordered.splice(to, 0, item);
  return renumber(ordered);
}

/** Bỏ chọn nếu phần tử không còn sau khi undo/redo/xóa. */
const keepSelection = (doc: LetterPayload, id: string | null) =>
  doc.canvas_data.elements.some((el) => el.id === id) ? id : null;

export const useEditorStore = create<EditorState>()((set, get) => ({
  doc: blankLetter(),
  past: [],
  future: [],
  coalesceKey: null,
  selectedId: null,
  editingTextId: null,
  printHideBackground: false,

  load: (doc) =>
    set({ doc, past: [], future: [], coalesceKey: null, selectedId: null, editingTextId: null }),
  select: (selectedId) => set({ selectedId, coalesceKey: null }),
  setEditingText: (editingTextId) => set({ editingTextId, coalesceKey: null }),
  setPrintHideBackground: (printHideBackground) => set({ printHideBackground }),

  commit: (recipe, key) => {
    const { doc, past, coalesceKey } = get();
    const next = recipe(doc);
    if (next === doc) return;
    const merge = key !== undefined && key === coalesceKey;
    set({
      doc: next,
      past: merge ? past : [...past, doc].slice(-HISTORY_LIMIT),
      future: [],
      coalesceKey: key ?? null,
    });
  },
  endCoalesce: () => set({ coalesceKey: null }),

  undo: () => {
    const { doc, past, future, selectedId } = get();
    const previous = past.at(-1);
    if (!previous) return;
    set({
      doc: previous,
      past: past.slice(0, -1),
      future: [doc, ...future],
      coalesceKey: null,
      selectedId: keepSelection(previous, selectedId),
      editingTextId: null,
    });
  },
  redo: () => {
    const { doc, past, future, selectedId } = get();
    const [next, ...rest] = future;
    if (!next) return;
    set({
      doc: next,
      past: [...past, doc],
      future: rest,
      coalesceKey: null,
      selectedId: keepSelection(next, selectedId),
      editingTextId: null,
    });
  },

  addElement: (element) => {
    const id = nanoid(10);
    get().commit((doc) =>
      withElements(doc, (elements) => {
        const zIndex = elements.reduce((max, el) => Math.max(max, el.zIndex + 1), 0);
        return [...elements, { rotation: 0, ...element, id, zIndex }];
      }),
    );
    set({ selectedId: id });
    return id;
  },
  updateElement: (id, patch, key) =>
    get().commit(
      (doc) =>
        withElements(doc, (elements) =>
          elements.some((el) => el.id === id)
            ? elements.map((el) => (el.id === id ? { ...el, ...patch, id } : el))
            : elements,
        ),
      key,
    ),
  removeElement: (id) => {
    get().commit((doc) =>
      withElements(doc, (elements) => {
        const rest = elements.filter((el) => el.id !== id);
        return rest.length === elements.length ? elements : renumber(sortByLayer(rest));
      }),
    );
    if (get().selectedId === id) set({ selectedId: null, editingTextId: null });
  },
  duplicateElement: (id) => {
    const source = get().doc.canvas_data.elements.find((el) => el.id === id);
    if (!source) return;
    get().addElement({ ...source, x: source.x + 30, y: source.y + 30, locked: false });
  },
  moveLayer: (id, move) =>
    get().commit((doc) => withElements(doc, (elements) => reorder(elements, id, move))),

  setBackground: (patch, key) =>
    get().commit(
      (doc) => ({
        ...doc,
        canvas_data: {
          ...doc.canvas_data,
          background: { ...doc.canvas_data.background, ...patch },
        },
      }),
      key,
    ),
  setPrintSize: (defaultPrintSize) =>
    get().commit((doc) =>
      doc.canvas_data.defaultPrintSize === defaultPrintSize
        ? doc
        : { ...doc, canvas_data: { ...doc.canvas_data, defaultPrintSize } },
    ),
  setWebConfig: (patch, key) =>
    get().commit((doc) => ({ ...doc, web_config: { ...doc.web_config, ...patch } }), key),
  setTitle: (title, key) => get().commit((doc) => ({ ...doc, title }), key),
}));
