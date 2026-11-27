import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { samplePayload } from "@/lib/test-fixtures";
import { letterPayloadSchema } from "@/lib/validation";
import { MEMES, STICKER_SIZE_PX } from "./stickers";

describe("kho sticker meme", () => {
  it("có 20-30 sticker, id không trùng", () => {
    expect(MEMES.length).toBeGreaterThanOrEqual(20);
    expect(MEMES.length).toBeLessThanOrEqual(30);
    expect(new Set(MEMES.map((m) => m.id)).size).toBe(MEMES.length);
  });

  it("mỗi sticker có file WebP <= 30KB", () => {
    for (const meme of MEMES) {
      const path = fileURLToPath(new URL(`../../public${meme.src}`, import.meta.url));
      expect(existsSync(path), meme.src).toBe(true);
      expect(statSync(path).size).toBeLessThanOrEqual(30 * 1024);
    }
  });

  it("đường dẫn sticker qua được validation của server", () => {
    const payload = samplePayload();
    payload.canvas_data.faces.front.elements = MEMES.map((meme, i) => ({
      id: meme.id,
      type: "sticker_img",
      src: meme.src,
      x: 0,
      y: 0,
      width: STICKER_SIZE_PX,
      height: STICKER_SIZE_PX,
      rotation: 0,
      zIndex: i,
    }));
    expect(letterPayloadSchema.safeParse(payload).success).toBe(true);
  });
});
