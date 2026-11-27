import { describe, expect, it } from "vitest";
import { AUDIO_TRACKS, trackUrl } from "./audio-tracks";

describe("kho nhạc", () => {
  it("có 6-8 bài, id hợp lệ với validation", () => {
    expect(AUDIO_TRACKS.length).toBeGreaterThanOrEqual(6);
    expect(AUDIO_TRACKS.length).toBeLessThanOrEqual(8);
    for (const { id } of AUDIO_TRACKS) expect(id).toMatch(/^[a-z0-9-]{1,60}$/);
  });

  it("chỉ tạo URL cho bài có trong danh sách", () => {
    expect(trackUrl("fun-1", "https://cdn.test/")).toBe("https://cdn.test/audio/fun-1.mp3");
    expect(trackUrl("../secret", "https://cdn.test")).toBeNull();
    expect(trackUrl("fun-1", "")).toBeNull();
  });
});
