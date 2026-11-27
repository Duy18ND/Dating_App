import "server-only";
import { deleteObjects } from "./r2";
import { deleteExpiredLetters, purgeRateEvents, restoreUploads, takeOrphanUploads } from "./repo";

/** Ảnh chưa gắn thư được giữ lại chừng này giờ, đủ cho người đang soạn dở. */
export const ORPHAN_GRACE_HOURS = 24;
export const ORPHAN_BATCH = 500;
const MAX_BATCHES = 10;
const RATE_EVENT_KEEP_HOURS = 48; // dài hơn cửa sổ giới hạn lớn nhất (24 giờ)

/**
 * 1. Xóa thư quá hạn (responses xóa theo; uploads được gỡ liên kết thành ảnh mồ côi).
 * 2. Xóa ảnh mồ côi trên R2, gồm cả ảnh vừa được gỡ ở bước 1.
 * 3. Dọn sổ đếm rate limit.
 * Chạy lại nhiều lần vẫn an toàn.
 */
export async function runCleanup() {
  const letters = await deleteExpiredLetters(new Date().toISOString());

  let images = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const rows = await takeOrphanUploads(ORPHAN_GRACE_HOURS, ORPHAN_BATCH);
    if (rows.length === 0) break;
    try {
      await deleteObjects(rows.map((row) => row.object_key));
    } catch (error) {
      // Bản ghi đã bị lấy khỏi database: ghi lại để lần sau xóa tiếp, tránh sót file trên R2.
      await restoreUploads(rows);
      throw error;
    }
    images += rows.length;
    if (rows.length < ORPHAN_BATCH) break;
  }

  await purgeRateEvents(new Date(Date.now() - RATE_EVENT_KEEP_HOURS * 3_600_000).toISOString());
  return { letters, images };
}
