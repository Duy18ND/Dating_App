import { nanoid } from "nanoid";
import { create } from "zustand";
import { PRINT_CONFIG } from "@/lib/print-config";
import { defaultWebStyle } from "@/lib/web-styles";
import {
  FACE_IDS,
  type BackgroundConfig,
  type CanvasData,
  type CanvasElement,
  type EnvelopeDecor,
  type FaceId,
  type LetterPayload,
  type LetterSheetConfig,
  type WebConfig,
  type WebSection,
  type WebStyleConfig,
  type WritingPageConfig,
} from "@/types/letter";
import { blankLetter } from "./defaults";

export const HISTORY_LIMIT = 50;

export type NewElement = Omit<CanvasElement, "id" | "zIndex" | "rotation"> & { rotation?: number };
export type LayerMove = "front" | "back" | "forward" | "backward";
/** Thư đã xuất bản của tài liệu đang mở: lần sau cập nhật thay vì tạo mới. */
export type Published = { id: string; slug: string };
/** select: chọn/kéo; pen: vẽ tay; eraser: chạm vào nét vẽ để xóa. */
export type Tool = "select" | "pen" | "eraser";
export interface PenSettings {
  color: string;
  width: number;
}

interface EditorState {
  /** Phần được lưu và nằm trong lịch sử Undo/Redo. Không bao giờ sửa tại chỗ. */
  doc: LetterPayload;
  past: LetterPayload[];
  future: LetterPayload[];
  coalesceKey: string | null;

  // Trạng thái giao diện tạm thời, không vào lịch sử.
  /** Mặt thiệp đang sửa. Thêm, chọn, đổi nền đều tác động lên mặt này. */
  face: FaceId;
  selectedId: string | null;
  editingTextId: string | null;
  printHideBackground: boolean;
  published: Published | null;
  /** Bản đã lưu gần nhất; khác `doc` nghĩa là còn thay đổi chưa lưu. */
  savedDoc: LetterPayload | null;
  tool: Tool;
  pen: PenSettings;

  load: (doc: LetterPayload, published?: Published) => void;
  setPublished: (published: Published) => void;
  markSaved: (doc: LetterPayload) => void;
  setTool: (tool: Tool) => void;
  setPen: (patch: Partial<PenSettings>) => void;
  select: (id: string | null) => void;
  setEditingText: (id: string | null) => void;
  setPrintHideBackground: (hide: boolean) => void;
  setFace: (face: FaceId) => void;

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
  setWritingPage: (patch: Partial<WritingPageConfig>, key?: string) => void;
  setLetter: (patch: Partial<LetterSheetConfig>, key?: string) => void;
  setEnvelope: (patch: Partial<EnvelopeDecor>, key?: string) => void;
  setWebConfig: (patch: Partial<WebConfig>, key?: string) => void;
  setWebStyle: (patch: Partial<WebStyleConfig>, key?: string) => void;
  setWebSections: (sections: WebSection[], key?: string) => void;
  updateWebSection: (id: string, patch: Partial<WebSection>, key?: string) => void;
  moveWebSection: (id: string, direction: "up" | "down") => void;
  toggleWebSection: (id: string, enabled?: boolean) => void;
  setTitle: (title: string, key?: string) => void;
}

/** Phần tử của mặt đang sửa. Dùng làm selector: useEditorStore(currentElements). */
export const currentElements = (s: { doc: LetterPayload; face: FaceId }) =>
  s.doc.canvas_data.faces[s.face].elements;

/** Phần tử đang chọn (trên mặt đang sửa). */
export const selectedElement = (s: {
  doc: LetterPayload;
  face: FaceId;
  selectedId: string | null;
}) => currentElements(s).find((el) => el.id === s.selectedId);

/** Mặt chứa phần tử `id`, hoặc undefined. */
const faceOf = (canvas: CanvasData, id: string) =>
  FACE_IDS.find((face) => canvas.faces[face].elements.some((el) => el.id === id));

const withCanvas = (doc: LetterPayload, patch: Partial<CanvasData>): LetterPayload => ({
  ...doc,
  canvas_data: { ...doc.canvas_data, ...patch },
});

const withElements = (
  doc: LetterPayload,
  face: FaceId | undefined,
  recipe: (elements: CanvasElement[]) => CanvasElement[],
): LetterPayload => {
  if (!face) return doc;
  const current = doc.canvas_data.faces[face];
  const elements = recipe(current.elements);
  if (elements === current.elements) return doc;
  return withCanvas(doc, {
    faces: { ...doc.canvas_data.faces, [face]: { ...current, elements } },
  });
};

export const sortByLayer = (elements: CanvasElement[]) =>
  [...elements].sort((a, b) => a.zIndex - b.zIndex);

/** Mã QR luôn vuông và không nhỏ hơn mức còn quét được trên thiệp mini. */
function lockQrSize(el: CanvasElement): CanvasElement {
  if (el.type !== "qr_code") return el;
  const size = Math.max(el.width ?? 0, PRINT_CONFIG.CANVAS.minQrPx);
  return { ...el, width: size, height: size };
}

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

/** Mặt thiệp khác nhau giữa hai bản; undo/redo chuyển sang mặt đó để người dùng thấy thay đổi. */
const changedFace = (a: LetterPayload, b: LetterPayload) =>
  FACE_IDS.find((face) => a.canvas_data.faces[face] !== b.canvas_data.faces[face]);

/** Bỏ chọn nếu phần tử không còn sau khi undo/redo/xóa. */
const keepSelection = (doc: LetterPayload, face: FaceId, id: string | null) =>
  doc.canvas_data.faces[face].elements.some((el) => el.id === id) ? id : null;

export const useEditorStore = create<EditorState>()((set, get) => ({
  doc: blankLetter(),
  past: [],
  future: [],
  coalesceKey: null,
  face: "front",
  selectedId: null,
  editingTextId: null,
  printHideBackground: false,
  published: null,
  savedDoc: null,
  tool: "select",
  pen: { color: "#2B2623", width: 4 },

  load: (doc, published) =>
    set({
      doc,
      published: published ?? null,
      savedDoc: doc,
      tool: "select",
      face: "front",
      printHideBackground: false,
      past: [],
      future: [],
      coalesceKey: null,
      selectedId: null,
      editingTextId: null,
    }),
  setPublished: (published) => set({ published }),
  markSaved: (savedDoc) => set({ savedDoc }),
  // Đổi công cụ thì bỏ chọn, để khung kéo giãn không cản nét vẽ.
  setTool: (tool) => set({ tool, selectedId: null, editingTextId: null, coalesceKey: null }),
  setPen: (patch) => set({ pen: { ...get().pen, ...patch } }),
  select: (selectedId) => set({ selectedId, coalesceKey: null }),
  setEditingText: (editingTextId) => set({ editingTextId, coalesceKey: null }),
  setPrintHideBackground: (printHideBackground) => set({ printHideBackground }),
  setFace: (face) => {
    if (get().face !== face) {
      set({ face, selectedId: null, editingTextId: null, coalesceKey: null });
    }
  },

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
    const { doc, past, future, selectedId, face } = get();
    const previous = past.at(-1);
    if (!previous) return;
    const target = changedFace(doc, previous) ?? face;
    set({
      doc: previous,
      past: past.slice(0, -1),
      future: [doc, ...future],
      coalesceKey: null,
      face: target,
      selectedId: target === face ? keepSelection(previous, face, selectedId) : null,
      editingTextId: null,
    });
  },
  redo: () => {
    const { doc, past, future, selectedId, face } = get();
    const [next, ...rest] = future;
    if (!next) return;
    const target = changedFace(doc, next) ?? face;
    set({
      doc: next,
      past: [...past, doc],
      future: rest,
      coalesceKey: null,
      face: target,
      selectedId: target === face ? keepSelection(next, face, selectedId) : null,
      editingTextId: null,
    });
  },

  addElement: (element) => {
    const id = nanoid(10);
    get().commit((doc) =>
      withElements(doc, get().face, (elements) => {
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
        withElements(doc, faceOf(doc.canvas_data, id), (elements) =>
          elements.some((el) => el.id === id)
            ? elements.map((el) => (el.id === id ? lockQrSize({ ...el, ...patch, id }) : el))
            : elements,
        ),
      key,
    ),
  removeElement: (id) => {
    get().commit((doc) =>
      withElements(doc, faceOf(doc.canvas_data, id), (elements) => {
        const rest = elements.filter((el) => el.id !== id);
        return rest.length === elements.length ? elements : renumber(sortByLayer(rest));
      }),
    );
    if (get().selectedId === id) set({ selectedId: null, editingTextId: null });
  },
  duplicateElement: (id) => {
    const source = currentElements(get()).find((el) => el.id === id);
    if (!source) return;
    get().addElement({ ...source, x: source.x + 30, y: source.y + 30, locked: false });
  },
  moveLayer: (id, move) =>
    get().commit((doc) =>
      withElements(doc, faceOf(doc.canvas_data, id), (elements) => reorder(elements, id, move)),
    ),

  setBackground: (patch, key) => {
    const face = get().face;
    get().commit((doc) => {
      const current = doc.canvas_data.faces[face];
      return withCanvas(doc, {
        faces: {
          ...doc.canvas_data.faces,
          [face]: { ...current, background: { ...current.background, ...patch } },
        },
      });
    }, key);
  },
  setWritingPage: (patch, key) =>
    get().commit(
      (doc) => withCanvas(doc, { writingPage: { ...doc.canvas_data.writingPage, ...patch } }),
      key,
    ),
  setLetter: (patch, key) =>
    get().commit(
      (doc) => withCanvas(doc, { letter: { ...doc.canvas_data.letter, ...patch } }),
      key,
    ),
  setEnvelope: (patch, key) =>
    get().commit(
      (doc) => withCanvas(doc, { envelope: { ...doc.canvas_data.envelope, ...patch } }),
      key,
    ),
  setWebConfig: (patch, key) =>
    get().commit((doc) => ({ ...doc, web_config: { ...doc.web_config, ...patch } }), key),
  setWebStyle: (patch, key) =>
    get().commit((doc) => {
      const base = doc.web_config.style ?? defaultWebStyle(doc.template_type);
      const next: WebStyleConfig = { ...base, ...patch };
      // Loại bỏ các trường đặt về undefined để dữ liệu sạch và hợp chuẩn strictObject.
      for (const k of Object.keys(next) as (keyof WebStyleConfig)[]) {
        if (next[k] === undefined) delete next[k];
      }
      return { ...doc, web_config: { ...doc.web_config, style: next } };
    }, key),
  setWebSections: (sections, key) =>
    get().commit((doc) => ({ ...doc, web_config: { ...doc.web_config, sections } }), key),
  updateWebSection: (id, patch, key) =>
    get().commit((doc) => {
      const sections = doc.web_config.sections;
      if (!sections || !sections.some((s) => s.id === id)) return doc;
      return {
        ...doc,
        web_config: {
          ...doc.web_config,
          sections: sections.map((s) => (s.id === id ? ({ ...s, ...patch, id } as WebSection) : s)),
        },
      };
    }, key),
  moveWebSection: (id, direction) =>
    get().commit((doc) => {
      const sections = doc.web_config.sections;
      if (!sections) return doc;
      const from = sections.findIndex((s) => s.id === id);
      const to = direction === "up" ? from - 1 : from + 1;
      if (from < 0 || to < 0 || to >= sections.length) return doc;
      const next = [...sections];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...doc, web_config: { ...doc.web_config, sections: next } };
    }),
  toggleWebSection: (id, enabled) =>
    get().commit((doc) => {
      const sections = doc.web_config.sections;
      if (!sections || !sections.some((s) => s.id === id)) return doc;
      return {
        ...doc,
        web_config: {
          ...doc.web_config,
          sections: sections.map((s) =>
            s.id === id ? { ...s, enabled: enabled ?? !s.enabled } : s,
          ),
        },
      };
    }),
  setTitle: (title, key) => get().commit((doc) => ({ ...doc, title }), key),
}));
