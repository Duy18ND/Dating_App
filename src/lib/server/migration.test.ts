import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

// Chạy đúng file migration trên Postgres nhúng (PGlite) để bắt lỗi SQL trước khi đưa lên Supabase.
const pg = new PGlite();

const one = async <T>(sql: string, params: unknown[] = []) =>
  (await pg.query<T>(sql, params)).rows[0];

async function newLetter(slug: string): Promise<string> {
  const row = await one<{ id: string }>(
    `INSERT INTO letters (slug, edit_token, template_type, canvas_data, web_config)
     VALUES ($1, $2, 'confession', '{}', '{}') RETURNING id`,
    [slug, `${slug}-token`],
  );
  return row.id;
}

const claim = async (letterId: string, urls: string[]) =>
  (await one<{ ok: boolean }>("SELECT set_letter_uploads($1, $2) AS ok", [letterId, urls])).ok;

beforeAll(async () => {
  // Các role có sẵn trên Supabase.
  await pg.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;");
  await pg.exec(readFileSync("supabase/migrations/0001_init.sql", "utf8"));
}, 60_000);

describe("migration", () => {
  it("rate limit chặn đúng ngưỡng, mỗi bucket đếm riêng", async () => {
    const hit = async (bucket: string) =>
      (await one<{ ok: boolean }>("SELECT consume_rate_limit($1, 2, 60) AS ok", [bucket])).ok;
    expect([await hit("a"), await hit("a"), await hit("a")]).toEqual([true, true, false]);
    expect(await hit("b")).toBe(true);
  });

  it("chỉ gắn được ảnh có thật và chưa thuộc thư khác; ảnh bỏ ra thành mồ côi", async () => {
    const [first, second] = [await newLetter("aaaaaa"), await newLetter("bbbbbb")];
    await pg.exec(
      "INSERT INTO uploads (object_key, url) VALUES ('k1','u1'), ('k2','u2'), ('k3','u3')",
    );
    expect(await claim(first, ["u1", "u2"])).toBe(true);
    expect(await claim(second, ["u1"])).toBe(false);
    expect(await claim(second, ["khong-co"])).toBe(false);
    expect(await claim(first, ["u2"])).toBe(true);
    const orphans = await pg.query<{ url: string }>(
      "SELECT url FROM uploads WHERE letter_id IS NULL ORDER BY url",
    );
    expect(orphans.rows.map((r) => r.url)).toEqual(["u1", "u3"]);
  });

  it("cron chỉ lấy ảnh mồ côi đủ cũ; xóa thư làm ảnh thành mồ côi", async () => {
    const take = async () =>
      (await pg.query<{ url: string }>("SELECT url FROM take_orphan_uploads(48, 100)")).rows;
    expect(await take()).toEqual([]);
    await pg.exec("DELETE FROM letters WHERE slug = 'aaaaaa'");
    await pg.exec("UPDATE uploads SET created_at = NOW() - INTERVAL '3 days'");
    expect((await take()).map((r) => r.url).sort()).toEqual(["u1", "u2", "u3"]);
  });

  it("register_view bỏ qua thư hết hạn", async () => {
    await newLetter("cccccc");
    await pg.query("SELECT register_view('cccccc')");
    await pg.exec("UPDATE letters SET expires_at = NOW() - INTERVAL '1 day' WHERE slug='cccccc'");
    await pg.query("SELECT register_view('cccccc')");
    const row = await one<{ view_count: number }>("SELECT view_count FROM letters WHERE slug='cccccc'");
    expect(row.view_count).toBe(1);
  });

  it("anon không đọc được bảng và không gọi được hàm", async () => {
    await pg.exec("SET ROLE anon");
    await expect(pg.query("SELECT edit_token FROM letters")).rejects.toThrow(/permission denied/);
    await expect(pg.query("SELECT register_view('cccccc')")).rejects.toThrow(/permission denied/);
    await pg.exec("RESET ROLE");
  });
});

describe("dọn thư quá hạn", () => {
  it("xóa thư quá hạn thì chỉ ảnh của nó thành mồ côi và bị thu hồi", async () => {
    const [expired, alive] = [await newLetter("hethan"), await newLetter("conhan")];
    await pg.exec(
      `INSERT INTO uploads (object_key, url, created_at) VALUES
       ('x1','x1', NOW() - INTERVAL '61 days'), ('x2','x2', NOW() - INTERVAL '61 days')`,
    );
    await claim(expired, ["x1"]);
    await claim(alive, ["x2"]);
    await pg.query("UPDATE letters SET expires_at = NOW() - INTERVAL '1 day' WHERE id = $1", [
      expired,
    ]);
    await pg.exec("DELETE FROM letters WHERE expires_at < NOW()");

    const taken = await pg.query<{ url: string }>("SELECT url FROM take_orphan_uploads(24, 500)");
    expect(taken.rows.map((r) => r.url)).toEqual(["x1"]);
    expect(await one("SELECT id FROM uploads WHERE url = 'x2'")).toBeDefined();
  });
});
