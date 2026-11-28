import { beforeEach, describe, expect, it, vi } from "vitest";
import { samplePayload } from "@/lib/test-fixtures";
import type { CanvasData, WebConfig } from "@/types/letter";

vi.mock("@/lib/server/repo", () => ({
  consumeRateLimit: vi.fn(),
  insertLetter: vi.fn(),
  findLetterBySlug: vi.fn(),
  findLetterMetaBySlug: vi.fn(),
  findLetterBlocksBySlug: vi.fn(),
  findOwnedLetter: vi.fn(),
  listOwnedLetters: vi.fn(),
  updateOwnedLetter: vi.fn(),
  deleteOwnedLetter: vi.fn(),
  deleteAuthUser: vi.fn(),
  deleteLetter: vi.fn(),
  setLetterUploads: vi.fn(),
  registerView: vi.fn(),
  listResponses: vi.fn(),
  insertResponse: vi.fn(),
  insertUpload: vi.fn(),
  deleteUpload: vi.fn(),
}));
// Phiên đăng nhập: getUser giả lập; requireUser giữ đúng hành vi thật (401 khi chưa đăng nhập).
vi.mock("@/lib/server/auth", () => ({ getUser: vi.fn(), requireUser: vi.fn() }));
vi.mock("@/lib/server/r2", () => ({
  publicUrl: (key: string) => `https://cdn.test/${key}`,
  putWebp: vi.fn(),
}));

import * as auth from "@/lib/server/auth";
import { ApiError } from "@/lib/server/http";
import * as repo from "@/lib/server/repo";
import { putWebp } from "@/lib/server/r2";
import { DELETE as deleteAccount } from "./me/account/route";
import { GET as myLetters } from "./me/letters/route";
import {
  DELETE as deleteMine,
  GET as readMine,
  PATCH as editMine,
} from "./me/letters/[id]/route";
import { POST as createLetter } from "./letters/route";
import { GET as readLetter } from "./letters/[slug]/route";
import { POST as respond } from "./letters/[slug]/responses/route";
import { POST as view } from "./letters/[slug]/view/route";
import { POST as upload } from "./upload/route";

const OWNER = { id: "aaaaaaaa-0000-0000-0000-000000000001", email: "chu@test.vn" };
const STRANGER = { id: "bbbbbbbb-0000-0000-0000-000000000002", email: "la@test.vn" };
const LETTER_ID = "11111111-1111-1111-1111-111111111111";
const row = () => ({
  ...samplePayload(),
  id: LETTER_ID,
  slug: "k9x2m1",
  owner_id: OWNER.id,
  creator_ip_hash: "bi-mat",
  view_count: 3,
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
});
const OLD_CARD = "https://cdn.test/uploads/card-old.webp";
const NEW_CARD = "https://cdn.test/uploads/card-new.webp";
const WEB_A = "https://cdn.test/uploads/web-a.webp";
const WEB_B = "https://cdn.test/uploads/web-b.webp";

function withCardImage(canvas: CanvasData, src: string): CanvasData {
  const next = structuredClone(canvas);
  next.faces.front.elements.push({
    id: "img1",
    type: "image",
    x: 200,
    y: 200,
    width: 400,
    height: 400,
    rotation: 0,
    zIndex: 1,
    src,
  });
  return next;
}

/** Ảnh đầu cho phần hero, tối đa 8 ảnh tiếp theo cho kỷ niệm, phần dư đưa vào photobooth. */
function withWebImages(web: WebConfig, urls: string[]): WebConfig {
  const [first, ...rest] = urls;
  const memUrls = rest.slice(0, 8);
  const pbUrls = rest.slice(8);
  return {
    ...web,
    sections: [
      { id: "s-hero", type: "hero", enabled: true, lead: "Chào", image: first ? { src: first } : undefined },
      {
        id: "s-mem",
        type: "memories",
        enabled: true,
        items: memUrls.map((src, i) => ({ id: `m${i}`, caption: `Kỷ niệm ${i}`, image: { src } })),
      },
      ...(pbUrls.length > 0
        ? [
            {
              id: "s-pb",
              type: "photobooth" as const,
              enabled: true,
              photos: pbUrls.map((src) => ({ src })),
            },
          ]
        : []),
    ],
  };
}

const params = <T,>(value: T) => ({ params: Promise.resolve(value) });
const slugCtx = params({ slug: "k9x2m1" });
const idCtx = params({ id: LETTER_ID });
/** Request từ chính trang (có Origin cùng site) như trình duyệt gửi. */
const send = (method: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://test/api", {
    method,
    body: JSON.stringify(body),
    headers: { origin: "http://test", ...headers },
  });
const get = () => new Request("http://test/api");
let current: typeof OWNER | null = OWNER;
const signIn = (user: typeof OWNER | null) => (current = user);

beforeEach(() => {
  vi.resetAllMocks();
  signIn(OWNER);
  vi.mocked(auth.getUser).mockImplementation(async () => current);
  vi.mocked(auth.requireUser).mockImplementation(async () => {
    if (!current) throw new ApiError(401, "Bạn cần đăng nhập");
    return current;
  });
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("IP_HASH_SALT", "salt-test");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  vi.mocked(repo.consumeRateLimit).mockResolvedValue(true);
  vi.mocked(repo.findLetterBySlug).mockResolvedValue(row());
  vi.mocked(repo.findLetterMetaBySlug).mockImplementation(async () => {
    const r = row();
    return { id: r.id, owner_id: r.owner_id, expires_at: r.expires_at };
  });
  vi.mocked(repo.findLetterBlocksBySlug).mockImplementation(async () => {
    const r = row();
    return { id: r.id, expires_at: r.expires_at, blocks: r.web_config.blocks };
  });
  // Như truy vấn thật: chỉ thấy thư khi đúng chủ.
  vi.mocked(repo.findOwnedLetter).mockImplementation(async (id, ownerId) =>
    id === LETTER_ID && ownerId === OWNER.id ? row() : null,
  );
  vi.mocked(repo.updateOwnedLetter).mockResolvedValue(true);
  vi.mocked(repo.deleteOwnedLetter).mockImplementation(
    async (id, ownerId) => id === LETTER_ID && ownerId === OWNER.id,
  );
  vi.mocked(repo.setLetterUploads).mockResolvedValue(true);
  vi.mocked(repo.listResponses).mockResolvedValue([]);
  vi.mocked(repo.insertLetter).mockImplementation(async (input) => ({ ...row(), ...input }));
});

describe("POST /api/letters", () => {
  it("lưu với chủ là người đang đăng nhập, trả id và slug 6 ký tự", async () => {
    const response = await createLetter(send("POST", samplePayload()));
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body).toEqual({ id: LETTER_ID, slug: expect.stringMatching(/^[a-z0-9]{6}$/) });
    expect(repo.insertLetter).toHaveBeenCalledWith(expect.objectContaining({ owner_id: OWNER.id }));
  });

  it("chưa đăng nhập thì 401, không ghi database", async () => {
    signIn(null);
    expect((await createLetter(send("POST", samplePayload()))).status).toBe(401);
    expect(repo.insertLetter).not.toHaveBeenCalled();
  });

  it("request từ trang khác (CSRF) hoặc thiếu Origin thì 403", async () => {
    const evil = send("POST", samplePayload(), { origin: "https://evil.test" });
    expect((await createLetter(evil)).status).toBe(403);
    const bare = new Request("http://test/api", {
      method: "POST",
      body: JSON.stringify(samplePayload()),
    });
    expect((await createLetter(bare)).status).toBe(403);
    expect(repo.insertLetter).not.toHaveBeenCalled();
  });

  it("không cho tự đặt chủ thư qua body", async () => {
    const payload = { ...samplePayload(), owner_id: STRANGER.id };
    expect((await createLetter(send("POST", payload))).status).toBe(400);
  });

  it("sinh lại slug khi bị trùng", async () => {
    vi.mocked(repo.insertLetter).mockResolvedValueOnce(null);
    expect((await createLetter(send("POST", samplePayload()))).status).toBe(201);
    expect(repo.insertLetter).toHaveBeenCalledTimes(2);
  });

  it("giới hạn theo cả IP lẫn tài khoản", async () => {
    await createLetter(send("POST", samplePayload()));
    const buckets = vi.mocked(repo.consumeRateLimit).mock.calls.map(([bucket]) => bucket);
    expect(buckets).toContain(`createLetter:user:${OWNER.id}`);
    expect(buckets.some((b) => b.startsWith("createLetter::"))).toBe(true);
  });

  it("429 khi vượt giới hạn, không ghi database", async () => {
    vi.mocked(repo.consumeRateLimit).mockResolvedValue(false);
    expect((await createLetter(send("POST", samplePayload()))).status).toBe(429);
    expect(repo.insertLetter).not.toHaveBeenCalled();
  });

  it("gắn cả ảnh thiệp và ảnh trang web (bỏ trùng)", async () => {
    const payload = samplePayload();
    payload.canvas_data = withCardImage(payload.canvas_data, NEW_CARD);
    payload.web_config = withWebImages(payload.web_config, [WEB_A, WEB_B, NEW_CARD]);
    expect((await createLetter(send("POST", payload))).status).toBe(201);
    expect(vi.mocked(repo.setLetterUploads).mock.calls[0][1].sort()).toEqual(
      [NEW_CARD, WEB_A, WEB_B].sort(),
    );
  });

  it("từ chối trang web quá 12 ảnh mà không ghi database", async () => {
    const payload = samplePayload();
    const urls = Array.from({ length: 13 }, (_, i) => `https://cdn.test/uploads/w${i}.webp`);
    payload.web_config = withWebImages(payload.web_config, urls);
    expect((await createLetter(send("POST", payload))).status).toBe(400);
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
  it("không lộ chủ thư, id, IP hash và không tăng lượt xem", async () => {
    signIn(null);
    const body = await (await readLetter(get(), slugCtx)).json();
    expect(Object.keys(body).sort()).toEqual(
      ["canvas_data", "expires_at", "slug", "template_type", "title", "web_config"],
    );
    expect(repo.registerView).not.toHaveBeenCalled();
  });

  it("410 khi hết hạn, 404 khi sai mã", async () => {
    vi.mocked(repo.findLetterBySlug).mockResolvedValue({ ...row(), expires_at: "2000-01-01" });
    expect((await readLetter(get(), slugCtx)).status).toBe(410);
    vi.mocked(repo.findLetterBySlug).mockResolvedValue(null);
    expect((await readLetter(get(), slugCtx)).status).toBe(404);
  });

  it("lỗi database không lộ chi tiết", async () => {
    vi.mocked(repo.findLetterBySlug).mockRejectedValue(new Error("Supabase: mat khau sai"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await readLetter(get(), slugCtx);
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("Supabase");
  });
});

describe("/api/me/letters/[id]: chỉ chính chủ", () => {
  it("chủ xem được chi tiết kèm phản hồi, không lộ IP hash", async () => {
    const body = await (await readMine(get(), idCtx)).json();
    expect(body).toMatchObject({ id: LETTER_ID, slug: "k9x2m1", view_count: 3, responses: [] });
    expect(JSON.stringify(body)).not.toContain("bi-mat");
    expect(body).not.toHaveProperty("owner_id");
  });

  it("thiệp của người khác và thiệp không tồn tại cùng trả 404", async () => {
    signIn(STRANGER);
    expect((await readMine(get(), idCtx)).status).toBe(404);
    expect((await editMine(send("PATCH", { title: "Hack" }), idCtx)).status).toBe(404);
    expect((await deleteMine(send("DELETE", {}), idCtx)).status).toBe(404);
    expect(repo.updateOwnedLetter).not.toHaveBeenCalled();
    expect(repo.deleteOwnedLetter).toHaveBeenCalledWith(LETTER_ID, STRANGER.id);
    // Người lạ cũng không chiếm được ảnh của thư qua PATCH.
    const steal = send("PATCH", { canvas_data: samplePayload().canvas_data }, {});
    expect((await editMine(steal, idCtx)).status).toBe(404);
    expect(repo.setLetterUploads).not.toHaveBeenCalled();
    signIn(OWNER);
    const missing = params({ id: "22222222-2222-2222-2222-222222222222" });
    expect((await readMine(get(), missing)).status).toBe(404);
  });

  it("id sai định dạng thì 404 mà không truy vấn database", async () => {
    expect((await readMine(get(), params({ id: "1 OR 1=1" }))).status).toBe(404);
    expect(repo.findOwnedLetter).not.toHaveBeenCalled();
  });

  it("chưa đăng nhập thì 401", async () => {
    signIn(null);
    expect((await readMine(get(), idCtx)).status).toBe(401);
    expect((await myLetters()).status).toBe(401);
  });

  it("PATCH và DELETE từ trang khác thì 403", async () => {
    const headers = { origin: "https://evil.test" };
    expect((await editMine(send("PATCH", { title: "x" }, headers), idCtx)).status).toBe(403);
    expect((await deleteMine(send("DELETE", {}, headers), idCtx)).status).toBe(403);
    expect(repo.updateOwnedLetter).not.toHaveBeenCalled();
    expect(repo.deleteOwnedLetter).not.toHaveBeenCalled();
  });

  it("chỉ cập nhật trường được gửi, lọc theo chủ", async () => {
    expect((await editMine(send("PATCH", { title: "Mới" }), idCtx)).status).toBe(200);
    expect(repo.updateOwnedLetter).toHaveBeenCalledWith(LETTER_ID, OWNER.id, { title: "Mới" });
    expect(repo.setLetterUploads).not.toHaveBeenCalled();
  });

  it("chỉ sửa thiệp: vẫn gắn ảnh trang web đang lưu để cron không xóa", async () => {
    vi.mocked(repo.findOwnedLetter).mockResolvedValue({
      ...row(),
      canvas_data: withCardImage(samplePayload().canvas_data, OLD_CARD),
      web_config: withWebImages(samplePayload().web_config, [WEB_A, WEB_B]),
    });
    const canvas = withCardImage(samplePayload().canvas_data, NEW_CARD);
    expect((await editMine(send("PATCH", { canvas_data: canvas }), idCtx)).status).toBe(200);
    expect(vi.mocked(repo.setLetterUploads).mock.calls[0][1].sort()).toEqual(
      [NEW_CARD, WEB_A, WEB_B].sort(),
    );
  });

  it("chỉ sửa trang web: vẫn gắn ảnh thiệp đang lưu, kiểm tra ảnh web mới", async () => {
    vi.mocked(repo.findOwnedLetter).mockResolvedValue({
      ...row(),
      canvas_data: withCardImage(samplePayload().canvas_data, OLD_CARD),
    });
    const web = withWebImages(samplePayload().web_config, [WEB_A]);
    expect((await editMine(send("PATCH", { web_config: web }), idCtx)).status).toBe(200);
    expect(vi.mocked(repo.setLetterUploads).mock.calls[0][1].sort()).toEqual([OLD_CARD, WEB_A].sort());
  });

  it("ảnh lạ hoặc ảnh của người khác thì 400, không cập nhật", async () => {
    vi.mocked(repo.setLetterUploads).mockResolvedValue(false);
    const web = withWebImages(samplePayload().web_config, ["https://evil.test/x.webp"]);
    expect((await editMine(send("PATCH", { web_config: web }), idCtx)).status).toBe(400);
    expect(repo.updateOwnedLetter).not.toHaveBeenCalled();
  });

  it("không cho sửa slug, lượt xem hay chủ thư", async () => {
    for (const body of [{ view_count: 999 }, { slug: "khac01" }, { owner_id: STRANGER.id }]) {
      expect((await editMine(send("PATCH", body), idCtx)).status).toBe(400);
    }
  });

  it("chủ xóa được thiệp", async () => {
    expect((await deleteMine(send("DELETE", {}), idCtx)).status).toBe(200);
    expect(repo.deleteOwnedLetter).toHaveBeenCalledWith(LETTER_ID, OWNER.id);
  });

  it("danh sách chỉ lấy thiệp của người đang đăng nhập", async () => {
    vi.mocked(repo.listOwnedLetters).mockResolvedValue([]);
    expect((await myLetters()).status).toBe(200);
    expect(repo.listOwnedLetters).toHaveBeenCalledWith(OWNER.id);
  });
});

describe("DELETE /api/me/account", () => {
  it("cần đúng chuỗi xác nhận và cùng trang", async () => {
    expect((await deleteAccount(send("DELETE", {}))).status).toBe(400);
    expect((await deleteAccount(send("DELETE", { confirm: "ok" }))).status).toBe(400);
    const evil = send("DELETE", { confirm: "XOA TAI KHOAN" }, { origin: "https://evil.test" });
    expect((await deleteAccount(evil)).status).toBe(403);
    expect(repo.deleteAuthUser).not.toHaveBeenCalled();
  });

  it("xóa đúng tài khoản đang đăng nhập", async () => {
    const response = await deleteAccount(send("DELETE", { confirm: "XOA TAI KHOAN" }));
    expect(response.status).toBe(200);
    expect(repo.deleteAuthUser).toHaveBeenCalledWith(OWNER.id);
  });

  it("chưa đăng nhập thì 401", async () => {
    signIn(null);
    expect((await deleteAccount(send("DELETE", { confirm: "XOA TAI KHOAN" }))).status).toBe(401);
  });
});

describe("POST view", () => {
  it("người nhận mở thư thì tính lượt", async () => {
    signIn(null);
    expect(await (await view(send("POST", {}), slugCtx)).json()).toEqual({ ok: true, counted: true });
    expect(repo.registerView).toHaveBeenCalledWith("k9x2m1");
  });

  it("chủ thiệp tự xem thử thì không tính", async () => {
    expect(await (await view(send("POST", {}), slugCtx)).json()).toEqual({ ok: true, counted: false });
    expect(repo.registerView).not.toHaveBeenCalled();
  });

  it("chặn request từ trang khác (CSRF)", async () => {
    signIn(null);
    const evil = send("POST", {}, { origin: "https://evil.test" });
    expect((await view(evil, slugCtx)).status).toBe(403);
    expect(repo.registerView).not.toHaveBeenCalled();
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

  it("nhận xác nhận & hồi âm thư và lưu tương thích DB", async () => {
    vi.mocked(repo.findLetterBlocksBySlug).mockResolvedValueOnce({
      id: LETTER_ID,
      expires_at: "2099-01-01T00:00:00Z",
      blocks: {
        reply: { enabled: true, prompt: "Nhắn lại mình nhé" },
      },
    });
    const response = await respond(
      send("POST", {
        action_type: "reply",
        reaction: "Đã nhận thư ❤️",
        responder_name: "Minh Anh",
        message: "Cảm ơn cậu nhiều lắm!",
      }),
      slugCtx,
    );
    expect(response.status).toBe(201);
    expect(repo.insertResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        letter_id: LETTER_ID,
        action_type: "accept",
        status: "reply",
        poll_option: "Đã nhận thư ❤️",
        responder_name: "Minh Anh",
        message: "Cảm ơn cậu nhiều lắm!",
        guest_count: null,
      }),
    );
  });

  it("chặn request từ trang khác (CSRF)", async () => {
    const evil = send("POST", { action_type: "poll", poll_option: "Lẩu" }, { origin: "https://evil.test" });
    expect((await respond(evil, slugCtx)).status).toBe(403);
    expect(repo.insertResponse).not.toHaveBeenCalled();
  });
});

describe("POST /api/upload", () => {
  const webp = new TextEncoder().encode("RIFF0000WEBPVP8 data");
  const request = (bytes: Uint8Array<ArrayBuffer>, type = "image/webp") => {
    const form = new FormData();
    form.set("file", new File([bytes], "a.webp", { type }));
    return new Request("http://test/api/upload", {
      method: "POST",
      body: form,
      headers: { origin: "http://test" },
    });
  };

  it("chưa đăng nhập thì 401, không lưu file", async () => {
    signIn(null);
    expect((await upload(request(webp))).status).toBe(401);
    expect(putWebp).not.toHaveBeenCalled();
  });

  it("lưu ảnh WebP và trả URL", async () => {
    const response = await upload(request(webp));
    expect(response.status).toBe(201);
    expect((await response.json()).url).toMatch(/^https:\/\/cdn\.test\/uploads\/.+\.webp$/);
    expect(putWebp).toHaveBeenCalled();
    // Ảnh ghi chủ là người tải lên: chỉ người này gắn được ảnh vào thiệp của mình.
    expect(repo.insertUpload).toHaveBeenCalledWith(expect.objectContaining({ owner_id: OWNER.id }));
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
