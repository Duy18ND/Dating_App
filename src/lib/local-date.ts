/**
 * Đọc "YYYY-MM-DD" theo giờ địa phương. `new Date("2024-02-14")` là nửa đêm UTC,
 * nên ở múi giờ âm (Mỹ) ngày hiển thị và bộ đếm ngày sẽ lùi về ngày 13.
 * Chuỗi khác dạng (có giờ) vẫn đọc như `new Date`.
 */
export function parseLocalDate(dateIso?: string): Date | null {
  if (!dateIso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso.trim());
  const parsed = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(dateIso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
