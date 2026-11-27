/** Phần tính toán của việc kéo tay đổi thứ tự (tách riêng để test). */

/** Chuyển phần tử ở `from` tới vị trí `to`, giữ nguyên thứ tự các phần tử khác. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item);
  return next;
}

/**
 * Vị trí mới của mục đang kéo: đếm số mục KHÁC có đường giữa nằm trên con trỏ.
 * `middles` là tung độ giữa của mọi mục đo lúc bắt đầu kéo.
 */
export function dropIndex(middles: number[], from: number, pointerY: number): number {
  return middles.filter((middle, index) => index !== from && middle < pointerY).length;
}
