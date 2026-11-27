import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { LetterPayload, LetterResponse } from "@/types/letter";
import { requireEnv } from "./env";

// Toàn bộ truy cập database nằm ở đây. Dùng service role key nên chỉ chạy phía server.

let client: SupabaseClient | undefined;
function db(): SupabaseClient {
  client ??= createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export interface LetterRow extends LetterPayload {
  id: string;
  slug: string;
  edit_token: string;
  view_count: number;
  expires_at: string;
  created_at: string;
}

const LETTER_COLUMNS =
  "id, slug, edit_token, template_type, title, canvas_data, web_config, view_count, expires_at, created_at";

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

/** Trả về null nếu trùng slug/token để nơi gọi sinh mã khác. */
export async function insertLetter(
  row: LetterPayload & { slug: string; edit_token: string; creator_ip_hash: string },
): Promise<LetterRow | null> {
  const { data, error } = await db().from("letters").insert(row).select(LETTER_COLUMNS).single();
  if (error?.code === "23505") return null;
  return unwrap({ data, error }) as LetterRow;
}

export async function findLetterBy(column: "slug" | "edit_token", value: string) {
  return unwrap(
    await db().from("letters").select(LETTER_COLUMNS).eq(column, value).maybeSingle(),
  ) as LetterRow | null;
}

export async function updateLetter(id: string, patch: Partial<LetterPayload>): Promise<void> {
  unwrap(
    await db()
      .from("letters")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id),
  );
}

export async function deleteLetter(id: string): Promise<void> {
  unwrap(await db().from("letters").delete().eq("id", id));
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
