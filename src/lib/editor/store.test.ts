import { beforeEach, describe, expect, it } from "vitest";
import { blankLetter } from "./defaults";
import { currentElements, HISTORY_LIMIT, sortByLayer, useEditorStore } from "./store";

const state = () => useEditorStore.getState();
const elements = () => currentElements(state());
const add = (text: string) => state().addElement({ type: "text", x: 0, y: 0, text, fontSize: 64 });
const order = () => sortByLayer(elements()).map((el) => el.text);

beforeEach(() => state().load(blankLetter()));

describe("editor store", () => {
  it("undo/redo thêm phần tử và bỏ chọn phần tử đã mất", () => {
    add("a");
    state().undo();
    expect(elements()).toHaveLength(0);
    expect(state().selectedId).toBeNull();
    state().redo();
    expect(elements()).toHaveLength(1);
  });

  it("giữ ít nhất 20 bước, tối đa HISTORY_LIMIT", () => {
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) add(String(i));
    expect(HISTORY_LIMIT).toBeGreaterThanOrEqual(20);
    for (let i = 0; i < 100; i++) state().undo();
    expect(elements()).toHaveLength(10);
  });

  it("gộp thay đổi cùng key thành một bước, endCoalesce tách bước mới", () => {
    for (const blur of [1, 2, 3]) state().setBackground({ blur }, "blur");
    expect(state().past).toHaveLength(1);
    state().endCoalesce();
    state().setBackground({ blur: 4 }, "blur");
    expect(state().past).toHaveLength(2);
    state().undo();
    expect(state().doc.canvas_data.faces.front.background.blur).toBe(3);
  });

  it("thay đổi mới xóa nhánh redo", () => {
    add("a");
    state().undo();
    add("b");
    expect(state().future).toHaveLength(0);
  });

  it("đổi lớp và đánh lại zIndex liên tục", () => {
    const a = add("a");
    add("b");
    add("c");
    state().moveLayer(a, "front");
    expect(order()).toEqual(["b", "c", "a"]);
    state().moveLayer(a, "backward");
    expect(order()).toEqual(["b", "a", "c"]);
    expect(sortByLayer(elements()).map((el) => el.zIndex)).toEqual([0, 1, 2]);
  });

  it("đổi lớp không có tác dụng thì không tạo bước lịch sử", () => {
    const a = add("a");
    const steps = state().past.length;
    state().moveLayer(a, "front");
    state().updateElement("khong-co", { x: 1 });
    expect(state().past).toHaveLength(steps);
  });

  it("nhân bản tạo id mới, lệch vị trí, không khóa", () => {
    const a = add("a");
    state().updateElement(a, { locked: true, rotation: 15 });
    state().duplicateElement(a);
    const [first, copy] = elements();
    expect(copy.id).not.toBe(first.id);
    expect(copy).toMatchObject({ x: 30, y: 30, rotation: 15, locked: false, zIndex: 1 });
  });

  it("chọn phần tử không vào lịch sử", () => {
    const a = add("a");
    const steps = state().past.length;
    state().select(null);
    state().select(a);
    expect(state().past).toHaveLength(steps);
  });
});

describe("khóa kích thước mã QR", () => {
  it("không cho thu nhỏ dưới 252px và luôn vuông", () => {
    state().setFace("inside");
    const id = state().addElement({ type: "qr_code", x: 0, y: 0, width: 280, height: 280 });
    state().updateElement(id, { width: 100, height: 90 });
    expect(elements()[0]).toMatchObject({ width: 252, height: 252 });
    state().updateElement(id, { width: 320 });
    expect(elements()[0]).toMatchObject({ width: 320, height: 320 });
  });

  it("để trống mặt sau viết tay giữ lại duy nhất mã QR và hoàn tác được", () => {
    state().setFace("inside");
    state().addElement({ type: "text", x: 120, y: 120, text: "Lời nhắn", fontSize: 54 });
    state().addElement({ type: "qr_code", x: 1360, y: 840, width: 280, height: 280 });
    state().clearInsideForHandwriting();
    expect(elements().map((el) => el.type)).toEqual(["qr_code"]);
    state().undo();
    expect(elements()).toHaveLength(2);
  });
});

describe("hai mặt thiệp", () => {
  const faces = () => state().doc.canvas_data.faces;

  it("thêm và đổi nền chỉ tác động lên mặt đang sửa", () => {
    add("bìa");
    state().setFace("inside");
    add("trong");
    state().setBackground({ type: "color", value: "#FFEEEE" });
    expect(faces().front.elements.map((el) => el.text)).toEqual(["bìa"]);
    expect(faces().inside.elements.map((el) => el.text)).toEqual(["trong"]);
    expect(faces().front.background.type).toBe("preset");
    expect(faces().inside.background.value).toBe("#FFEEEE");
  });

  it("đổi mặt thì bỏ chọn, và không vào lịch sử", () => {
    add("a");
    const steps = state().past.length;
    state().setFace("inside");
    expect(state().selectedId).toBeNull();
    expect(state().past).toHaveLength(steps);
  });

  it("sửa và xóa theo id ở đúng mặt chứa phần tử", () => {
    const a = add("a");
    state().setFace("inside");
    state().updateElement(a, { x: 50 });
    expect(faces().front.elements[0].x).toBe(50);
    state().removeElement(a);
    expect(faces().front.elements).toHaveLength(0);
  });

  it("undo chuyển sang mặt vừa bị thay đổi", () => {
    add("bìa");
    state().setFace("inside");
    state().undo();
    expect(state().face).toBe("front");
    expect(faces().front.elements).toHaveLength(0);
    state().setFace("inside");
    state().redo();
    expect(state().face).toBe("front");
  });

  it("undo được thay đổi của thư, phong bì, trang viết tay", () => {
    state().setLetter({ greeting: "Gửi Na" });
    state().setEnvelope({ monogram: "N ♡" });
    state().setWritingPage({ paper: "plain" });
    state().undo();
    state().undo();
    expect(state().doc.canvas_data.letter.greeting).toBe("Gửi Na");
    expect(state().doc.canvas_data.envelope.monogram).toBe("");
  });
});
