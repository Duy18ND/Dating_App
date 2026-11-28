import { describe, expect, it } from "vitest";
import { AUDIO_TRACKS, localTrackUrl, resolveAudioUrl, trackUrl } from "./audio-tracks";
import {
  estimateTrimBytes,
  MAX_TRIM_SECONDS,
  MAX_UPLOAD_AUDIO_BYTES,
  trimmedFileName,
} from "./client/trim-audio";

describe("kho nhạc & cắt nhạc", () => {
  it("có 6-8 bài, id hợp lệ với validation và đều có file tích hợp sẵn", () => {
    expect(AUDIO_TRACKS.length).toBeGreaterThanOrEqual(6);
    expect(AUDIO_TRACKS.length).toBeLessThanOrEqual(8);
    for (const { id } of AUDIO_TRACKS) {
      expect(id).toMatch(/^[a-z0-9-]{1,60}$/);
      expect(localTrackUrl(id)).toBe(`/audio/${id}.wav`);
    }
  });

  it("chỉ tạo URL cho bài có trong danh sách và ưu tiên file tự tải lên", () => {
    expect(trackUrl("fun-1", "https://cdn.test/")).toBe("https://cdn.test/audio/fun-1.mp3");
    expect(trackUrl("../secret", "https://cdn.test")).toBeNull();
    expect(trackUrl("fun-1", "")).toBeNull();
    expect(resolveAudioUrl({ trackId: "romantic-1" })).toBe("/audio/romantic-1.wav");
    expect(
      resolveAudioUrl({ trackId: "romantic-1", customUrl: "https://cdn.test/uploads/audio/a.wav" }),
    ).toBe("https://cdn.test/uploads/audio/a.wav");
  });

  it("đoạn cắt tối đa luôn nhỏ hơn 5MB", () => {
    expect(estimateTrimBytes(MAX_TRIM_SECONDS)).toBeLessThan(MAX_UPLOAD_AUDIO_BYTES);
    expect(trimmedFileName("Bai Hat Hay.mp3")).toBe("Bai Hat Hay-cat.wav");
  });
});
