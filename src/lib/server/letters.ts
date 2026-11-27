import "server-only";
import type { ManagedLetter, PublicLetter } from "@/types/letter";
import { ApiError } from "./http";
import { findLetterBy, listResponses, type LetterRow } from "./repo";

export const SLUG_PATTERN = /^[a-z0-9]{6,12}$/;
export const EDIT_TOKEN_PATTERN = /^[\w-]{24,32}$/;

/** Liệt kê từng trường được phép, để cột mới trong database không tự lộ ra API public. */
export function toPublicLetter(row: LetterRow): PublicLetter {
  return {
    slug: row.slug,
    template_type: row.template_type,
    title: row.title,
    canvas_data: row.canvas_data,
    web_config: row.web_config,
    expires_at: row.expires_at,
  };
}

export function isExpired(row: { expires_at: string }): boolean {
  return Date.parse(row.expires_at) <= Date.now();
}

/** Thư còn hạn theo slug. 404 nếu sai mã, 410 nếu quá hạn. */
export async function getActiveLetter(slug: string): Promise<LetterRow> {
  const row = SLUG_PATTERN.test(slug) ? await findLetterBy("slug", slug) : null;
  if (!row) throw new ApiError(404, "Không tìm thấy lá thư");
  if (isExpired(row)) throw new ApiError(410, "Lá thư đã hết hạn lưu trữ");
  return row;
}

export async function getManagedLetter(editToken: string): Promise<ManagedLetter> {
  const row = EDIT_TOKEN_PATTERN.test(editToken)
    ? await findLetterBy("edit_token", editToken)
    : null;
  if (!row) throw new ApiError(404, "Link quản lý không đúng");
  return {
    ...toPublicLetter(row),
    view_count: row.view_count,
    created_at: row.created_at,
    responses: await listResponses(row.id),
  };
}
