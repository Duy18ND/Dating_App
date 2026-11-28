import { nanoid } from "nanoid";
import { create } from "zustand";
import { PRINT_CONFIG } from "@/lib/print-config";
import { moveItem } from "@/lib/reorder";
import { defaultWebStyle } from "@/lib/web-styles";
import {
  FACE_IDS,
  type BackgroundConfig,
  type BoardSection,
  type CanvasData,
  type CanvasElement,
  type CardFace,
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
  /** Đang thiết kế một khung tự do của trang web (id phần); khi đó nó thay cho mặt thiệp. */
  boardId: string | null;
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
  setBoard: (boardId: string | null) => void;

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
  /** Xóa chữ/trang trí trên mặt sau, chỉ giữ lại mã QR để in trống viết tay (có thể Ctrl+Z). */
  clearInsideForHandwriting: () => void;
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
  reorderWebSections: (from: number, to: number) => void;
  toggleWebSection: (id: string, enabled?: boolean) => void;
  setTitle: (title: string, key?: string) => void;
}

type SurfaceState = { doc: LetterPayload; face: FaceId; boardId?: string | null };
/** Nơi chứa phần tử: một mặt thiệp, hoặc một khung tự do trên trang web. */
type SurfaceRef = { face: FaceId } | { board: string };

const NO_ELEMENTS: CanvasElement[] = [];

export const findBoard = (doc: LetterPayload, id: string | null | undefined) =>
  id
    ? doc.web_config.sections?.find((s): s is BoardSection => s.type === "board" && s.id === id)
    : undefined;

const boards = (doc: LetterPayload) =>
  doc.web_config.sections?.filter((s): s is BoardSection => s.type === "board") ?? [];

const refOf = (s: SurfaceState): SurfaceRef =>
  s.boardId ? { board: s.boardId } : { face: s.face };

const surfaceAt = (doc: LetterPayload, ref: SurfaceRef): CardFace | BoardSection | undefined =>
  "board" in ref ? findBoard(doc, ref.board) : doc.canvas_data.faces[ref.face];

const elementsAt = (doc: LetterPayload, ref: SurfaceRef) =>
  surfaceAt(doc, ref)?.elements ?? NO_ELEMENTS;

/** Phần tử của mặt đang sửa. Dùng làm selector: useEditorStore(currentElements). */
export const currentElements = (s: SurfaceState) => elementsAt(s.doc, refOf(s));

/** Nền của mặt đang sửa. */
export const currentBackground = (s: SurfaceState) =>
  (surfaceAt(s.doc, refOf(s)) ?? s.doc.canvas_data.faces[s.face]).background;

/** Chiều cao hệ tọa độ của mặt đang sửa (chiều ngang luôn là PRINT_CONFIG.CANVAS.width). */
export const currentHeight = (s: SurfaceState): number =>
  findBoard(s.doc, s.boardId)?.height ?? PRINT_CONFIG.CANVAS.height;

/** Phần tử đang chọn (trên mặt đang sửa). */
export const selectedElement = (s: SurfaceState & { selectedId: string | null }) =>
  currentElements(s).find((el) => el.id === s.selectedId);

/** Mặt hoặc khung chứa phần tử `id`, hoặc undefined. */
const surfaceOfElement = (doc: LetterPayload, id: string): SurfaceRef | undefined => {
  const has = (elements: CanvasElement[]) => elements.some((el) => el.id === id);
  const face = FACE_IDS.find((f) => has(doc.canvas_data.faces[f].elements));
  if (face) return { face };
  const board = boards(doc).find((b) => has(b.elements));
  return board ? { board: board.id } : undefined;
};

const withCanvas = (doc: LetterPayload, patch: Partial<CanvasData>): LetterPayload => ({
  ...doc,
  canvas_data: { ...doc.canvas_data, ...patch },
});

/** Thay nền hoặc phần tử của một mặt/khung. */
const withSurface = (
  doc: LetterPayload,
  ref: SurfaceRef,
  patch: Partial<CardFace>,
): LetterPayload => {
  if ("face" in ref) {
    const current = doc.canvas_data.faces[ref.face];
    return withCanvas(doc, {
      faces: { ...doc.canvas_data.faces, [ref.face]: { ...current, ...patch } },
    });
  }
  return {
    ...doc,
    web_config: {
      ...doc.web_config,
      sections: doc.web_config.sections?.map((s) =>
        s.type === "board" && s.id === ref.board ? { ...s, ...patch } : s,
      ),
    },
  };
};

const withElements = (
  doc: LetterPayload,
  ref: SurfaceRef | undefined,
  recipe: (elements: CanvasElement[]) => CanvasElement[],
): LetterPayload => {
  const current = ref && surfaceAt(doc, ref);
  if (!ref || !current) return doc;
  const elements = recipe(current.elements);
  if (elements === current.elements) return doc;
  return withSurface(doc, ref, { elements });
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
const keepSelection = (doc: LetterPayload, ref: SurfaceRef, id: string | null) =>
  elementsAt(doc, ref).some((el) => el.id === id) ? id : null;

/**
 * Sau Undo/Redo: chuyển tới mặt thiệp vừa thay đổi để người dùng thấy. Đang vẽ khung tự do thì
 * ở lại khung đó, trừ khi chính nó biến mất.
 */
function afterHistory(
  from: LetterPayload,
  to: LetterPayload,
  state: { face: FaceId; boardId: string | null; selectedId: string | null },
) {
  const boardId = findBoard(to, state.boardId) ? state.boardId : null;
  const face = boardId ? state.face : (changedFace(from, to) ?? state.face);
  const ref = refOf({ doc: to, face, boardId });
  const sameSurface = face === state.face && boardId === state.boardId;
  return {
    face,
    boardId,
    selectedId: sameSurface ? keepSelection(to, ref, state.selectedId) : null,
    editingTextId: null,
  };
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  doc: blankLetter(),
  past: [],
  future: [],
  coalesceKey: null,
  face: "front",
  boardId: null,
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
      boardId: null,
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
  setBoard: (boardId) =>
    set({ boardId, tool: "select", selectedId: null, editingTextId: null, coalesceKey: null }),
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
    const state = get();
    const previous = state.past.at(-1);
    if (!previous) return;
    set({
      doc: previous,
      past: state.past.slice(0, -1),
      future: [state.doc, ...state.future],
      coalesceKey: null,
      ...afterHistory(state.doc, previous, state),
    });
  },
  redo: () => {
    const state = get();
    const [next, ...rest] = state.future;
    if (!next) return;
    set({
      doc: next,
      past: [...state.past, state.doc],
      future: rest,
      coalesceKey: null,
      ...afterHistory(state.doc, next, state),
    });
  },

  addElement: (element) => {
    const id = nanoid(10);
    const ref = refOf(get());
    get().commit((doc) =>
      withElements(doc, ref, (elements) => {
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
        withElements(doc, surfaceOfElement(doc, id), (elements) =>
          elements.some((el) => el.id === id)
            ? elements.map((el) => (el.id === id ? lockQrSize({ ...el, ...patch, id }) : el))
            : elements,
        ),
      key,
    ),
  removeElement: (id) => {
    get().commit((doc) =>
      withElements(doc, surfaceOfElement(doc, id), (elements) => {
        const rest = elements.filter((el) => el.id !== id);
        return rest.length === elements.length ? elements : renumber(sortByLayer(rest));
      }),
    );
    if (get().selectedId === id) set({ selectedId: null, editingTextId: null });
  },
  clearInsideForHandwriting: () => {
    get().commit((doc) =>
      withElements(doc, { face: "inside" }, (elements) => {
        const kept = elements.filter((el) => el.type === "qr_code");
        return kept.length === elements.length ? elements : renumber(sortByLayer(kept));
      }),
    );
    const { doc, selectedId } = get();
    const stillSelected = doc.canvas_data.faces.inside.elements.some((el) => el.id === selectedId);
    set({ face: "inside", selectedId: stillSelected ? selectedId : null, editingTextId: null });
  },
  duplicateElement: (id) => {
    const source = currentElements(get()).find((el) => el.id === id);
    if (!source) return;
    get().addElement({ ...source, x: source.x + 30, y: source.y + 30, locked: false });
  },
  moveLayer: (id, move) =>
    get().commit((doc) =>
      withElements(doc, surfaceOfElement(doc, id), (elements) => reorder(elements, id, move)),
    ),

  setBackground: (patch, key) => {
    const ref = refOf(get());
    get().commit((doc) => {
      const current = surfaceAt(doc, ref);
      return current
        ? withSurface(doc, ref, { background: { ...current.background, ...patch } })
        : doc;
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
  reorderWebSections: (from, to) =>
    get().commit((doc) => {
      const sections = doc.web_config.sections;
      if (!sections) return doc;
      const next = moveItem(sections, from, to);
      return next === sections ? doc : { ...doc, web_config: { ...doc.web_config, sections: next } };
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
