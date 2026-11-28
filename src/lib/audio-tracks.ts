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
  { id: "romantic-1", label: "Piano lãng mạn", mood: "romantic" },
  { id: "romantic-2", label: "Hộp nhạc dịu dàng", mood: "romantic" },
  { id: "wedding-1", label: "Khúc Canon ngày cưới", mood: "wedding" },
  { id: "wedding-2", label: "Vũ điệu Waltz nhẹ", mood: "wedding" },
  { id: "fun-1", label: "Kalimba vui tươi", mood: "fun" },
  { id: "fun-2", label: "Giai điệu hẹn hò", mood: "fun" },
  { id: "festive-1", label: "Chúc mừng sinh nhật", mood: "festive" },
  { id: "festive-2", label: "Chuông Giáng sinh", mood: "festive" },
];

/** File nhạc tích hợp sẵn trong `public/audio/<id>.wav` (luôn phát được không cần cấu hình thêm). */
export function localTrackUrl(trackId: string): string | null {
  if (!AUDIO_TRACKS.some((track) => track.id === trackId)) return null;
  return `/audio/${trackId}.wav`;
}

/** null nếu mã bài lạ hoặc chưa cấu hình R2. */
export function trackUrl(
  trackId: string,
  base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
): string | null {
  if (!base || !AUDIO_TRACKS.some((track) => track.id === trackId)) return null;
  return `${base.replace(/\/$/, "")}/audio/${trackId}.mp3`;
}

/** Ưu tiên file nhạc người dùng tự tải lên, nếu không có thì phát nhạc tích hợp sẵn. */
export function resolveAudioUrl(
  audio: { trackId: string; customUrl?: string },
): string | null {
  if (audio.customUrl) return audio.customUrl;
  return localTrackUrl(audio.trackId);
}
