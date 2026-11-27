import { beforeEach, describe, expect, it, vi } from "vitest";
import { samplePayload } from "@/lib/test-fixtures";

vi.mock("@/lib/server/repo", () => ({
  consumeRateLimit: vi.fn(),
  insertLetter: vi.fn(),
  findLetterBy: vi.fn(),
  updateLetter: vi.fn(),
  deleteLetter: vi.fn(),
  setLetterUploads: vi.fn(),
  registerView: vi.fn(),
  listResponses: vi.fn(),
  insertResponse: vi.fn(),
  insertUpload: vi.fn(),
  deleteUpload: vi.fn(),
}));
vi.mock("@/lib/server/r2", () => ({
  publicUrl: (key: string) => `https://cdn.test/${key}`,
  putWebp: vi.fn(),
}));

import * as repo from "@/lib/server/repo";
import { putWebp } from "@/lib/server/r2";
import { POST as createLetter } from "./letters/route";
import { GET as readLetter, PATCH as editLetter } from "./letters/[slug]/route";
import { POST as respond } from "./letters/[slug]/responses/route";
import { GET as manage } from "./manage/[editToken]/route";
import { POST as upload } from "./upload/route";

const TOKEN = "abcdefghijklmnopqrstuvwx";
const row = () => ({
  ...samplePayload(),
  id: "11111111-1111-1111-1111-111111111111",
  slug: "k9x2m1",
  edit_token: TOKEN,
  creator_ip_hash: "bi-mat",
  view_count: 3,
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
});
const params = <T,>(value: T) => ({ params: Promise.resolve(value) });
const slugCtx = params({ slug: "k9x2m1" });
const send = (method: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://test/api", { method, body: JSON.stringify(body), headers });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("IP_HASH_SALT", "salt-test");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  vi.mocked(repo.consumeRateLimit).mockResolvedValue(true);
  vi.mocked(repo.findLetterBy).mockResolvedValue(row());
  vi.mocked(repo.setLetterUploads).mockResolvedValue(true);
  vi.mocked(repo.listResponses).mockResolvedValue([]);
  vi.mocked(repo.insertLetter).mockImplementation(async (input) => ({ ...row(), ...input }));
});

describe("POST /api/letters", () => {
  it("trả slug 6 ký tự và token 24 ký tự", async () => {
    const response = await createLetter(send("POST", samplePayload()));
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.slug).toMatch(/^[a-z0-9]{6}$/);
    expect(body.edit_token).toHaveLength(24);
  });

  it("sinh lại slug khi bị trùng", async () => {
    vi.mocked(repo.insertLetter).mockResolvedValueOnce(null);
    expect((await createLetter(send("POST", samplePayload()))).status).toBe(201);
    expect(repo.insertLetter).toHaveBeenCalledTimes(2);
  });

  it("429 khi vượt giới hạn, không ghi database", async () => {
    vi.mocked(repo.consumeRateLimit).mockResolvedValue(false);
    expect((await createLetter(send("POST", samplePayload()))).status).toBe(429);
    expect(repo.insertLetter).not.toHaveBeenCalled();
  });

  it("xóa thư vừa tạo nếu ảnh không hợp lệ", async () => {
    vi.mocked(repo.setLetterUploads).mockResolvedValue(false);
    expect((await createLetter(send("POST", samplePayload()))).status).toBe(400);
    expect(repo.deleteLetter).toHaveBeenCalled();
  });

  it("production thiếu khóa Turnstile thì từ chối", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await createLetter(send("POST", samplePayload()))).status).toBe(500);
    expect(repo.insertLetter).not.toHaveBeenCalled();
  });

  it("có khóa Turnstile mà thiếu token thì 403", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    expect((await createLetter(send("POST", samplePayload()))).status).toBe(403);
  });
});

describe("GET /api/letters/[slug]", () => {
  it("không lộ edit_token, id, IP hash và không tăng lượt xem", async () => {
    const body = await (await readLetter(new Request("http://test"), slugCtx)).json();
    expect(Object.keys(body).sort()).toEqual(
      ["canvas_data", "expires_at", "slug", "template_type", "title", "web_config"],
    );
    expect(repo.registerView).not.toHaveBeenCalled();
  });

  it("410 khi hết hạn, 404 khi sai mã", async () => {
    vi.mocked(repo.findLetterBy).mockResolvedValue({ ...row(), expires_at: "2000-01-01" });
    expect((await readLetter(new Request("http://test"), slugCtx)).status).toBe(410);
    vi.mocked(repo.findLetterBy).mockResolvedValue(null);
    expect((await readLetter(new Request("http://test"), slugCtx)).status).toBe(404);
  });

  it("lỗi database không lộ chi tiết", async () => {
    vi.mocked(repo.findLetterBy).mockRejectedValue(new Error("Supabase: mat khau sai"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await readLetter(new Request("http://test"), slugCtx);
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("Supabase");
  });
});

describe("PATCH /api/letters/[slug]", () => {
  it("403 khi sai token, không cập nhật", async () => {
    const request = send("PATCH", { title: "Mới" }, { "x-edit-token": "x".repeat(24) });
    expect((await editLetter(request, slugCtx)).status).toBe(403);
    expect(repo.updateLetter).not.toHaveBeenCalled();
  });

  it("chỉ cập nhật trường được gửi", async () => {
    const request = send("PATCH", { title: "Mới" }, { "x-edit-token": TOKEN });
    expect((await editLetter(request, slugCtx)).status).toBe(200);
    expect(repo.updateLetter).toHaveBeenCalledWith(row().id, { title: "Mới" });
    expect(repo.setLetterUploads).not.toHaveBeenCalled();
  });

  it("không cho sửa slug hay lượt xem", async () => {
    const request = send("PATCH", { view_count: 999 }, { "x-edit-token": TOKEN });
    expect((await editLetter(request, slugCtx)).status).toBe(400);
  });
});

describe("POST responses", () => {
  it("nhận bình chọn đúng phương án", async () => {
    const response = await respond(send("POST", { action_type: "poll", poll_option: "Lẩu" }), slugCtx);
    expect(response.status).toBe(201);
    expect(repo.insertResponse).toHaveBeenCalledWith(
      expect.objectContaining({ poll_option: "Lẩu", status: null, guest_count: null }),
    );
  });

  it("từ chối phương án lạ và khối chưa bật", async () => {
    const unknown = send("POST", { action_type: "poll", poll_option: "Phở" });
    expect((await respond(unknown, slugCtx)).status).toBe(400);
    const disabled = send("POST", { action_type: "accept", status: "yes" });
    expect((await respond(disabled, slugCtx)).status).toBe(400);
    expect(repo.insertResponse).not.toHaveBeenCalled();
  });
});

describe("GET manage", () => {
  it("trả lượt xem và phản hồi, không trả IP hash", async () => {
    const response = await manage(new Request("http://test"), params({ editToken: TOKEN }));
    const body = await response.json();
    expect(body).toMatchObject({ slug: "k9x2m1", view_count: 3, responses: [] });
    expect(JSON.stringify(body)).not.toContain("bi-mat");
  });

  it("404 với token sai định dạng mà không truy vấn database", async () => {
    const response = await manage(new Request("http://test"), params({ editToken: "abc" }));
    expect(response.status).toBe(404);
    expect(repo.findLetterBy).not.toHaveBeenCalled();
  });
});

describe("POST /api/upload", () => {
  const webp = new TextEncoder().encode("RIFF0000WEBPVP8 data");
  const request = (bytes: Uint8Array<ArrayBuffer>, type = "image/webp") => {
    const form = new FormData();
    form.set("file", new File([bytes], "a.webp", { type }));
    return new Request("http://test/api/upload", { method: "POST", body: form });
  };

  it("lưu ảnh WebP và trả URL", async () => {
    const response = await upload(request(webp));
    expect(response.status).toBe(201);
    expect((await response.json()).url).toMatch(/^https:\/\/cdn\.test\/uploads\/.+\.webp$/);
    expect(putWebp).toHaveBeenCalled();
  });

  it("chặn sai MIME, giả mạo WebP và file quá lớn", async () => {
    expect((await upload(request(webp, "image/png"))).status).toBe(415);
    expect((await upload(request(new TextEncoder().encode("<script>xxxxxxx</script>")))).status).toBe(415);
    expect((await upload(request(new Uint8Array(500 * 1024 + 1)))).status).toBe(413);
    expect(putWebp).not.toHaveBeenCalled();
  });

  it("R2 lỗi thì xóa bản ghi upload", async () => {
    vi.mocked(putWebp).mockRejectedValue(new Error("r2"));
    vi.mocked(repo.deleteUpload).mockResolvedValue();
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await upload(request(webp))).status).toBe(500);
    expect(repo.deleteUpload).toHaveBeenCalled();
  });
});
