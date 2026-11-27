import { beforeEach, describe, expect, it } from "vitest";
import { currentElements, currentHeight, useEditorStore } from "@/lib/editor/store";
import { samplePayload } from "@/lib/test-fixtures";
import { collectUserImageUrls, collectWebImageUrls, webConfigSchema } from "@/lib/validation";
import { isSectionEmpty, missingSectionTypes, newSection } from "@/lib/web-sections";
import type { BoardSection, CanvasElement, WebConfig } from "@/types/letter";

const PHOTO = "https://cdn.test/uploads/board-photo.webp";
const BACKDROP = "https://cdn.test/uploads/board-bg.webp";

const element = (patch: Partial<CanvasElement>): CanvasElement => ({
  id: "e1",
  type: "image",
  x: 10,
  y: 10,
  width: 400,
  height: 300,
  rotation: 0,
  zIndex: 0,
  src: PHOTO,
  ...patch,
});

const board = (patch: Partial<BoardSection> = {}): BoardSection => ({
  ...(newSection("board") as BoardSection),
  ...patch,
});

const web = (sections: WebConfig["sections"]): WebConfig => ({
  ...samplePayload().web_config,
  sections,
});

describe("khung tự do: ảnh phải được gắn với thư (nếu không cron sẽ xóa)", () => {
  const withImages = board({
    elements: [element({})],
    background: { type: "image", value: BACKDROP, overlayOpacity: 0 },
  });

  it("gom cả ảnh trong khung lẫn ảnh nền khung", () => {
    expect(collectWebImageUrls(web([withImages])).sort()).toEqual([BACKDROP, PHOTO].sort());
    expect(collectUserImageUrls(samplePayload().canvas_data, web([withImages]))).toContain(PHOTO);
  });

  it("ảnh trong khung tính vào hạn mức 8 ảnh trang web", () => {
    const elements = Array.from({ length: 9 }, (_, i) =>
      element({ id: `i${i}`, src: `https://cdn.test/uploads/${i}.webp` }),
    );
    expect(webConfigSchema.safeParse(web([board({ elements })])).success).toBe(false);
  });
});

describe("khung tự do: kiểm tra dữ liệu", () => {
  it("khung mới hợp lệ và chiều cao chỉ nhận 3 cỡ", () => {
    expect(webConfigSchema.safeParse(web([board()])).success).toBe(true);
    const odd = { ...board(), height: 999 } as unknown as BoardSection;
    expect(webConfigSchema.safeParse(web([odd])).success).toBe(false);
  });

  it("không cho mã QR, ảnh không phải http, hay quá 3 khung", () => {
    const qr = element({ type: "qr_code", width: 380, height: 380, src: undefined });
    expect(webConfigSchema.safeParse(web([board({ elements: [qr] })])).success).toBe(false);
    const script = element({ src: "javascript:alert(1)" });
    expect(webConfigSchema.safeParse(web([board({ elements: [script] })])).success).toBe(false);
    expect(webConfigSchema.safeParse(web([board(), board(), board(), board()])).success).toBe(false);
  });

  it("thêm được nhiều khung, tối đa 3; khung chưa có gì thì tự ẩn", () => {
    expect(missingSectionTypes([board(), board()])).toContain("board");
    expect(missingSectionTypes([board(), board(), board()])).not.toContain("board");
    expect(isSectionEmpty(board(), false)).toBe(true);
    expect(isSectionEmpty(board({ elements: [element({})] }), false)).toBe(false);
  });
});

describe("store: vẽ trên khung tự do", () => {
  const target = board();
  const store = () => useEditorStore.getState();
  const faceCount = () => store().doc.canvas_data.faces.front.elements.length;

  beforeEach(() => {
    const doc = samplePayload();
    doc.web_config.sections = [target];
    store().load(doc);
    store().setBoard(target.id);
  });

  it("thêm, sửa, đổi nền và xóa đều tác động lên khung, không đụng tấm thiệp", () => {
    const before = faceCount();
    expect(currentHeight(store())).toBe(880);
    const id = store().addElement({ type: "text", x: 0, y: 0, width: 600, text: "Hi" });
    expect(currentElements(store()).map((el) => el.id)).toEqual([id]);
    store().updateElement(id, { x: 55 });
    expect(currentElements(store())[0].x).toBe(55);
    store().setBackground({ value: "#000000" });
    const saved = store().doc.web_config.sections![0] as BoardSection;
    expect(saved.background.value).toBe("#000000");
    store().removeElement(id);
    expect(currentElements(store())).toEqual([]);
    expect(faceCount()).toBe(before);
  });

  it("hoàn tác vẫn ở lại khung; khung biến mất thì thoát khỏi màn thiết kế", () => {
    store().addElement({ type: "text", x: 0, y: 0, text: "Hi" });
    store().undo();
    expect(store().boardId).toBe(target.id);
    expect(currentElements(store())).toEqual([]);
    store().setWebSections([]);
    store().undo();
    store().redo();
    expect(store().boardId).toBeNull();
  });

  it("thoát khung thì trở lại mặt thiệp", () => {
    store().setBoard(null);
    expect(currentHeight(store())).toBe(1240);
    expect(currentElements(store())).toBe(store().doc.canvas_data.faces.front.elements);
  });
});

describe("cỡ chữ và cỡ ảnh trang web", () => {
  const image = (patch: object) =>
    web([
      { id: "h", type: "hero", enabled: true, lead: "a", image: { src: PHOTO, ...patch } },
    ]);

  it("nhận trong khoảng cho phép, từ chối ngoài khoảng", () => {
    expect(webConfigSchema.safeParse(image({ size: 60, zoom: 2.5 })).success).toBe(true);
    expect(webConfigSchema.safeParse(image({ size: 10 })).success).toBe(false);
    expect(webConfigSchema.safeParse(image({ zoom: 9 })).success).toBe(false);
    const style = { theme: "pastel" as const, intensity: "medium" as const };
    const withScale = (textScale: number) => ({
      ...samplePayload().web_config,
      style: { ...style, textScale },
    });
    expect(webConfigSchema.safeParse(withScale(1.2)).success).toBe(true);
    expect(webConfigSchema.safeParse(withScale(3)).success).toBe(false);
  });
});
