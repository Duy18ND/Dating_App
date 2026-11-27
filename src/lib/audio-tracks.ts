/**
 * Danh sách nhạc nền. File MP3 (128kbps) KHÔNG nằm trong repo: chủ dự án tự chọn bài có quyền
 * sử dụng, rồi tải lên R2 đúng tên `audio/<id>.mp3`. Đổi `label` cho khớp bài thật.
 * Không đổi `id` sau khi đã có thư xuất bản.
 */
export const AUDIO_MOODS = [
  { id: "romantic", label: "Lãng mạn" },
  { id: "wedding", label: "Ngày cưới" },
  { id: "fun", label: "Vui nhộn" },
  { id: "festive", label: "Lễ hội" },
] as const;

export type AudioMood = (typeof AUDIO_MOODS)[number]["id"];

export const AUDIO_TRACKS: { id: string; label: string; mood: AudioMood }[] = [
  { id: "romantic-1", label: "Lãng mạn 1", mood: "romantic" },
  { id: "romantic-2", label: "Lãng mạn 2", mood: "romantic" },
  { id: "wedding-1", label: "Ngày cưới 1", mood: "wedding" },
  { id: "wedding-2", label: "Ngày cưới 2", mood: "wedding" },
  { id: "fun-1", label: "Vui nhộn 1", mood: "fun" },
  { id: "fun-2", label: "Vui nhộn 2", mood: "fun" },
  { id: "festive-1", label: "Sinh nhật", mood: "festive" },
  { id: "festive-2", label: "Giáng sinh", mood: "festive" },
];

/** null nếu mã bài lạ hoặc chưa cấu hình R2. */
export function trackUrl(
  trackId: string,
  base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
): string | null {
  if (!base || !AUDIO_TRACKS.some((track) => track.id === trackId)) return null;
  return `${base.replace(/\/$/, "")}/audio/${trackId}.mp3`;
}
