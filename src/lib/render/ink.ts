/** Chữ trắng trên nền tối, chữ mực trên nền sáng. */
export function inkOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 140 ? "#FFFFFF" : "#2B2623";
}
