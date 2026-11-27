import { isHttpUrl } from "@/lib/validation";

/**
 * eventDate là giá trị datetime-local ('2027-01-10T17:30'), tức giờ địa phương nơi tổ chức.
 * Định dạng thẳng từ chuỗi để người xem ở múi giờ khác không thấy lệch giờ.
 */
export function formatEventDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long", timeZone: "UTC" }).format(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );
  return `${hour}:${minute}, ${weekday}, ${day}/${month}/${year}`;
}

/** Dùng link người gửi dán vào; không có thì tìm theo tên địa điểm. */
export function mapsLink(mapsUrl: string, locationName: string): string {
  if (mapsUrl && isHttpUrl(mapsUrl)) return mapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`;
}
