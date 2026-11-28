import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { LetterPayload, LetterResponse, LetterSummary } from "@/types/letter";
import { requireEnv } from "./env";

// Toàn bộ truy cập database nằm ở đây. Dùng service role key nên chỉ chạy phía server.
// Tạo client mới mỗi lần gọi để tránh lỗi chia sẻ I/O giữa các request trên Cloudflare Workers.

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL || requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  return createClient(url, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface LetterRow extends LetterPayload {
  id: string;
  slug: string;
  owner_id: string;
  view_count: number;
  expires_at: string;
  created_at: string;
}

const LETTER_COLUMNS =
  "id, slug, owner_id, template_type, title, canvas_data, web_config, view_count, expires_at, created_at";

function unwrap<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data;
}

export async function consumeRateLimit(bucket: string, max: number, windowSeconds: number) {
  return unwrap(
    await db().rpc("consume_rate_limit", {
      p_bucket: bucket,
      p_max: max,
      p_window_seconds: windowSeconds,
    }),
  ) as boolean;
}

/** Trả về null nếu trùng slug để nơi gọi sinh mã khác. */
export async function insertLetter(
  row: LetterPayload & { slug: string; owner_id: string; creator_ip_hash: string },
): Promise<LetterRow | null> {
  const { data, error } = await db().from("letters").insert(row).select(LETTER_COLUMNS).single();
  if (error?.code === "23505") return null;
  return unwrap({ data, error }) as LetterRow;
}

export async function findLetterBySlug(slug: string) {
  return unwrap(
    await db().from("letters").select(LETTER_COLUMNS).eq("slug", slug).maybeSingle(),
  ) as LetterRow | null;
}

export interface LetterMetaRow {
  id: string;
  owner_id: string;
  expires_at: string;
}

/** Chỉ đọc các cột nhẹ để đếm lượt mở mà không kéo cả JSONB canvas_data/web_config. */
export async function findLetterMetaBySlug(slug: string) {
  return unwrap(
    await db().from("letters").select("id, owner_id, expires_at").eq("slug", slug).maybeSingle(),
  ) as LetterMetaRow | null;
}

export interface LetterBlocksRow {
  id: string;
  expires_at: string;
  blocks: LetterPayload["web_config"]["blocks"];
}

/** Chỉ đọc blocks để xác thực phản hồi mà không kéo canvas_data. */
export async function findLetterBlocksBySlug(slug: string) {
  return unwrap(
    await db()
      .from("letters")
      .select("id, expires_at, blocks:web_config->blocks")
      .eq("slug", slug)
      .maybeSingle(),
  ) as LetterBlocksRow | null;
}

/** Mọi truy vấn của chủ thiệp lọc theo owner_id: thiệp của người khác coi như không tồn tại. */
export async function findOwnedLetter(id: string, ownerId: string) {
  return unwrap(
    await db()
      .from("letters")
      .select(LETTER_COLUMNS)
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle(),
  ) as LetterRow | null;
}

/** Đếm số thiệp còn hạn của tài khoản (dùng để giới hạn tối đa 5 thiệp lưu đồng thời). */
export async function countOwnedLetters(ownerId: string): Promise<number> {
  const { count, error } = await db()
    .from("letters")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .gt("expires_at", new Date().toISOString());
  if (error) throw new Error(`Supabase: ${error.message}`);
  return count ?? 0;
}

export async function listOwnedLetters(ownerId: string): Promise<LetterSummary[]> {
  const rows = unwrap(
    await db()
      .from("letters")
      .select(
        "id, slug, title, template_type, canvas_data->faces->front, view_count, expires_at, created_at, responses(count)",
      )
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(200),
  ) as unknown as (Omit<LetterSummary, "response_count" | "front"> & {
    front: LetterSummary["front"];
    responses: { count: number }[];
  })[];
  return rows.map(({ responses, ...row }) => ({
    ...row,
    response_count: responses[0]?.count ?? 0,
  }));
}

/** Cập nhật thư của đúng chủ. Trả false nếu không có thư đó. */
export async function updateOwnedLetter(
  id: string,
  ownerId: string,
  patch: Partial<LetterPayload>,
): Promise<boolean> {
  const { count, error } = await db()
    .from("letters")
    .update({ ...patch, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", id)
    .eq("owner_id", ownerId);
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (count ?? 0) > 0;
}

/** Xóa thư của đúng chủ (phản hồi xóa theo, ảnh thành mồ côi). Trả false nếu không có. */
export async function deleteOwnedLetter(id: string, ownerId: string): Promise<boolean> {
  const { count, error } = await db()
    .from("letters")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("owner_id", ownerId);
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (count ?? 0) > 0;
}

/** Chỉ dùng để hoàn tác thư vừa tạo khi gắn ảnh thất bại. */
export async function deleteLetter(id: string): Promise<void> {
  unwrap(await db().from("letters").delete().eq("id", id));
}

/** Xóa tài khoản Supabase Auth; thư và phản hồi xóa theo khóa ngoại (0003). */
export async function deleteAuthUser(userId: string): Promise<void> {
  const { error } = await db().auth.admin.deleteUser(userId);
  if (error) throw new Error(`Supabase: ${error.message}`);
}

export async function setLetterUploads(letterId: string, urls: string[]): Promise<boolean> {
  return unwrap(
    await db().rpc("set_letter_uploads", { p_letter_id: letterId, p_urls: urls }),
  ) as boolean;
}

export async function registerView(slug: string): Promise<void> {
  unwrap(await db().rpc("register_view", { p_slug: slug }));
}

export async function listResponses(letterId: string): Promise<LetterResponse[]> {
  return unwrap(
    await db()
      .from("responses")
      .select("id, responder_name, action_type, status, guest_count, poll_option, message, created_at")
      .eq("letter_id", letterId)
      .order("created_at", { ascending: false })
      .limit(1000),
  ) as LetterResponse[];
}

export async function insertResponse(
  row: Omit<LetterResponse, "id" | "created_at"> & { letter_id: string },
): Promise<void> {
  unwrap(await db().from("responses").insert(row));
}

export interface UploadRow {
  object_key: string;
  url: string;
  ip_hash: string | null;
  owner_id: string | null;
}

export async function insertUpload(row: UploadRow): Promise<void> {
  unwrap(await db().from("uploads").insert(row));
}

export async function deleteUpload(objectKey: string): Promise<void> {
  unwrap(await db().from("uploads").delete().eq("object_key", objectKey));
}

/** Xóa mọi thư có expires_at trước mốc `now`. Trả về số thư đã xóa. */
export async function deleteExpiredLetters(now: string): Promise<number> {
  const { count, error } = await db()
    .from("letters")
    .delete({ count: "exact" })
    .lt("expires_at", now);
  if (error) throw new Error(`Supabase: ${error.message}`);
  return count ?? 0;
}

export interface OrphanUpload extends UploadRow {
  id: string;
  created_at: string;
  letter_id: string | null;
}

/** Lấy ra và xóa bản ghi ảnh mồ côi. Nơi gọi chịu trách nhiệm xóa file hoặc ghi lại. */
export async function takeOrphanUploads(hours: number, limit: number): Promise<OrphanUpload[]> {
  return unwrap(
    await db().rpc("take_orphan_uploads", { p_hours: hours, p_limit: limit }),
  ) as OrphanUpload[];
}

export async function restoreUploads(rows: OrphanUpload[]): Promise<void> {
  unwrap(await db().from("uploads").insert(rows));
}

export async function purgeRateEvents(before: string): Promise<void> {
  unwrap(await db().from("rate_events").delete().lt("created_at", before));
}
