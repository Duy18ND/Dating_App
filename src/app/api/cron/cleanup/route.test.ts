import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/repo", () => ({
  deleteExpiredLetters: vi.fn(),
  takeOrphanUploads: vi.fn(),
  restoreUploads: vi.fn(),
  purgeRateEvents: vi.fn(),
}));
vi.mock("@/lib/server/r2", () => ({ deleteObjects: vi.fn() }));

import { deleteObjects } from "@/lib/server/r2";
import * as repo from "@/lib/server/repo";
import { GET } from "./route";

const call = (authorization?: string) =>
  GET(new Request("http://test", { headers: authorization ? { authorization } : {} }));

const orphan = {
  id: "u1",
  object_key: "uploads/a.webp",
  url: "https://cdn.test/uploads/a.webp",
  ip_hash: null,
  owner_id: null,
  letter_id: null,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "s3cret");
  vi.mocked(repo.deleteExpiredLetters).mockResolvedValue(2);
  vi.mocked(repo.takeOrphanUploads).mockResolvedValueOnce([orphan]).mockResolvedValue([]);
});

describe("cron dọn rác", () => {
  it.each([undefined, "Bearer sai", "s3cret"])("từ chối header %s, không xóa gì", async (header) => {
    expect((await call(header)).status).toBe(401);
    expect(repo.deleteExpiredLetters).not.toHaveBeenCalled();
    expect(deleteObjects).not.toHaveBeenCalled();
  });

  it("không chạy khi chưa cấu hình CRON_SECRET", async () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await call("Bearer ")).status).toBe(500);
    expect(repo.deleteExpiredLetters).not.toHaveBeenCalled();
  });

  it("xóa thư quá hạn rồi xóa file ảnh mồ côi", async () => {
    const response = await call("Bearer s3cret");
    expect(await response.json()).toEqual({ letters: 2, images: 1 });
    expect(deleteObjects).toHaveBeenCalledWith(["uploads/a.webp"]);
    expect(repo.restoreUploads).not.toHaveBeenCalled();
    expect(repo.purgeRateEvents).toHaveBeenCalled();
  });

  it("R2 lỗi thì ghi lại bản ghi để lần sau xóa tiếp", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(deleteObjects).mockRejectedValue(new Error("R2 sập"));
    expect((await call("Bearer s3cret")).status).toBe(500);
    expect(repo.restoreUploads).toHaveBeenCalledWith([orphan]);
  });
});
