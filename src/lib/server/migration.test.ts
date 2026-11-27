import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

// Chạy đúng file migration trên Postgres nhúng (PGlite) để bắt lỗi SQL trước khi đưa lên Supabase.
const pg = new PGlite();

const one = async <T>(sql: string, params: unknown[] = []) =>
  (await pg.query<T>(sql, params)).rows[0];

const OWNER = "00000000-0000-0000-0000-00000000000a";
const OTHER = "00000000-0000-0000-0000-00000000000b";

async function newLetter(slug: string, owner = OWNER): Promise<string> {
  const row = await one<{ id: string }>(
    `INSERT INTO letters (slug, owner_id, template_type, canvas_data, web_config)
     VALUES ($1, $2, 'confession', '{}', '{}') RETURNING id`,
    [slug, owner],
  );
  return row.id;
}

/** Ảnh tải lên bởi `owner` (mặc định chủ thư thử). */
const upload = (key: string, owner: string | null = OWNER, createdAgo = "0 days") =>
  pg.query(
    `INSERT INTO uploads (object_key, url, owner_id, created_at)
     VALUES ($1, $1, $2, NOW() - $3::interval)`,
    [key, owner, createdAgo],
  );

const claim = async (letterId: string, urls: string[]) =>
  (await one<{ ok: boolean }>("SELECT set_letter_uploads($1, $2) AS ok", [letterId, urls])).ok;

beforeAll(async () => {
  // Các role có sẵn trên Supabase.
  await pg.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;");
  // Bảng người dùng của Supabase Auth, rút gọn.
  await pg.exec(`CREATE SCHEMA auth; CREATE TABLE auth.users (id UUID PRIMARY KEY);
    INSERT INTO auth.users VALUES ('${OWNER}'), ('${OTHER}');`);
  for (const file of ["0001_init.sql", "0002_upload_orphaned_at.sql", "0003_accounts.sql"]) {
    await pg.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
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
    for (const key of ["u1", "u2", "u3"]) await upload(key);
    expect(await claim(first, ["u1", "u2"])).toBe(true);
    expect(await claim(second, ["u1"])).toBe(false);
    expect(await claim(second, ["khong-co"])).toBe(false);
    expect(await claim(first, ["u2"])).toBe(true);
    const orphans = await pg.query<{ url: string }>(
      "SELECT url FROM uploads WHERE letter_id IS NULL AND url LIKE 'u%' ORDER BY url",
    );
    expect(orphans.rows.map((r) => r.url)).toEqual(["u1", "u3"]);
  });

  it("cron chỉ lấy ảnh mồ côi đủ cũ; xóa thư làm ảnh thành mồ côi", async () => {
    const take = async () =>
      (await pg.query<{ url: string }>("SELECT url FROM take_orphan_uploads(48, 100)")).rows;
    expect(await take()).toEqual([]);
    await pg.exec("DELETE FROM letters WHERE slug = 'aaaaaa'");
    await pg.exec(
      "UPDATE uploads SET created_at = NOW() - INTERVAL '3 days', orphaned_at = NOW() - INTERVAL '3 days'",
    );
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
    await expect(pg.query("SELECT owner_id FROM letters")).rejects.toThrow(/permission denied/);
    await expect(pg.query("SELECT register_view('cccccc')")).rejects.toThrow(/permission denied/);
    await pg.exec("RESET ROLE");
  });
});

describe("dọn thư quá hạn", () => {
  it("xóa thư quá hạn thì chỉ ảnh của nó thành mồ côi và bị thu hồi", async () => {
    const [expired, alive] = [await newLetter("hethan"), await newLetter("conhan")];
    await upload("x1", OWNER, "61 days");
    await upload("x2", OWNER, "61 days");
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

describe("ảnh vừa bị gỡ khỏi thư", () => {
  it("được giữ 24 giờ kể từ lúc gỡ, dù đã tải lên từ lâu", async () => {
    const letter = await newLetter("gogiu1");
    await upload("old1", OWNER, "30 days");
    await claim(letter, ["old1"]);
    await claim(letter, []); // người dùng bỏ ảnh rồi lưu
    const taken = await pg.query<{ url: string }>("SELECT url FROM take_orphan_uploads(24, 500)");
    expect(taken.rows.map((r) => r.url)).not.toContain("old1");
    // Hoàn tác và lưu lại vẫn được.
    expect(await claim(letter, ["old1"])).toBe(true);
  });
});

describe("tài khoản (0003)", () => {
  it("không còn cột edit_token; thư bắt buộc có chủ", async () => {
    const columns = await pg.query<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'letters'",
    );
    expect(columns.rows.map((r) => r.column_name)).not.toContain("edit_token");
    await expect(
      pg.query(
        "INSERT INTO letters (slug, template_type, canvas_data, web_config) VALUES ('vochu1', 'confession', '{}', '{}')",
      ),
    ).rejects.toThrow(/owner_id/);
  });

  it("chỉ gắn được ảnh do chính chủ thư tải lên", async () => {
    const mine = await newLetter("cuatoi");
    await upload("cua-toi");
    await upload("cua-nguoi-khac", OTHER);
    await upload("vo-chu", null);
    expect(await claim(mine, ["cua-nguoi-khac"])).toBe(false);
    expect(await claim(mine, ["vo-chu"])).toBe(false);
    expect(await claim(mine, ["cua-toi"])).toBe(true);
  });

  it("xóa tài khoản: xóa thư và phản hồi, ảnh thành vô chủ để cron dọn", async () => {
    const user = "00000000-0000-0000-0000-00000000000c";
    await pg.query("INSERT INTO auth.users VALUES ($1)", [user]);
    const letter = await newLetter("xoatk1", user);
    await upload("anh-tk", user);
    expect(await claim(letter, ["anh-tk"])).toBe(true);
    await pg.query(
      "INSERT INTO responses (letter_id, action_type, status) VALUES ($1, 'accept', 'yes')",
      [letter],
    );
    await pg.query("DELETE FROM auth.users WHERE id = $1", [user]);
    expect(await one("SELECT id FROM letters WHERE id = $1", [letter])).toBeUndefined();
    expect(await one("SELECT id FROM responses WHERE letter_id = $1", [letter])).toBeUndefined();
    const image = await one<{ owner_id: string | null; letter_id: string | null }>(
      "SELECT owner_id, letter_id FROM uploads WHERE url = 'anh-tk'",
    );
    expect(image).toEqual({ owner_id: null, letter_id: null });
  });
});
