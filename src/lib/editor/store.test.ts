import { beforeEach, describe, expect, it } from "vitest";
import { blankLetter } from "./defaults";
import { HISTORY_LIMIT, sortByLayer, useEditorStore } from "./store";

const state = () => useEditorStore.getState();
const elements = () => state().doc.canvas_data.elements;
const add = (text: string) => state().addElement({ type: "text", x: 0, y: 0, text });
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
    expect(state().doc.canvas_data.background.blur).toBe(3);
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
