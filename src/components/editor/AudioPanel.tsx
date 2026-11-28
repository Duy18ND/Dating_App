"use client";

import { Music, Pause, Play, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AUDIO_MOODS, AUDIO_TRACKS, resolveAudioUrl } from "@/lib/audio-tracks";
import { uploadAudio } from "@/lib/client/api";
import { useEditorStore } from "@/lib/editor/store";
import type { WebConfig } from "@/types/letter";
import { Choice, Field, inputClass, Section, Slider, Toggle } from "./ui";

const MAX_START = 600;
const MAX_AUDIO_MB = 5;
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

type AudioSource = "custom" | "library";
const SOURCE_OPTIONS: { value: AudioSource; label: string }[] = [
  { value: "custom", label: "Tải nhạc từ máy" },
  { value: "library", label: "Kho nhạc sẵn" },
];

/** Nghe thử ngay tại chỗ và đọc thời lượng từ đúng 1 thẻ audio duy nhất. */
function AudioPlayer({
  url,
  startTime,
  volume,
  onStartTimeChange,
  onCommit,
}: {
  url: string;
  startTime: number;
  volume: number;
  onStartTimeChange: (value: number) => void;
  onCommit: () => void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [duration, setDuration] = useState<number>();

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);
  // Kéo thanh chọn giây khi đang nghe thì nhảy tới vị trí mới.
  useEffect(() => {
    const player = audio.current;
    if (player && !player.paused) player.currentTime = startTime;
  }, [startTime]);

  function toggle() {
    const player = audio.current!;
    if (playing) return player.pause();
    player.currentTime = startTime;
    player.volume = volume;
    player.play().catch(() => setFailed(true));
  }

  const max = Math.min(MAX_START, Math.max(0, Math.floor((duration ?? MAX_START) - 5)));

  return (
    <>
      <Slider
        label="Bắt đầu từ (điệp khúc)"
        min={0}
        max={max}
        step={1}
        value={Math.min(startTime, max)}
        format={clock}
        onChange={onStartTimeChange}
        onCommit={onCommit}
      />
      <audio
        ref={audio}
        src={url}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const d = event.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <Button type="button" variant="outline" size="sm" onClick={toggle} disabled={failed}>
        {playing ? <Pause /> : <Play />}
        {playing ? "Dừng nghe thử" : `Nghe thử từ ${clock(startTime)}`}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Không phát được bài này. Hãy thử tải file MP3/M4A khác.
        </p>
      )}
    </>
  );
}

export function AudioPanel() {
  const audio = useEditorStore((s) => s.doc.web_config.audio);
  const setWebConfig = useEditorStore((s) => s.setWebConfig);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const fileInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<AudioSource>(audio.customUrl ? "custom" : "library");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  const set = (patch: Partial<WebConfig["audio"]>, key?: string) =>
    setWebConfig({ audio: { ...useEditorStore.getState().doc.web_config.audio, ...patch } }, key);

  const url = resolveAudioUrl(audio);
  const activeSource: AudioSource = audio.customUrl ? "custom" : source;

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      setUploadError(`File nhạc tối đa ${MAX_AUDIO_MB}MB.`);
      return;
    }
    setUploading(true);
    setUploadError(undefined);
    try {
      const uploaded = await uploadAudio(file);
      set({
        enabled: true,
        customUrl: uploaded.url,
        customName: uploaded.name,
        startTime: 0,
      });
      setSource("custom");
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Tải nhạc lên thất bại");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Section title="Nhạc nền">
      <Toggle
        label="Phát nhạc khi người nhận mở thư"
        checked={audio.enabled}
        onChange={(enabled) => set({ enabled, trackId: audio.trackId || AUDIO_TRACKS[0].id })}
      />
      {audio.enabled && (
        <>
          <Choice
            options={SOURCE_OPTIONS}
            value={activeSource}
            onChange={(next) => {
              setSource(next);
              if (next === "library" && audio.customUrl) {
                set({ customUrl: undefined, customName: undefined, startTime: 0 });
              }
            }}
          />

          {activeSource === "custom" ? (
            <div className="space-y-2 rounded-lg border border-dashed bg-accent/35 p-3">
              <input
                ref={fileInput}
                type="file"
                accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,audio/wav,audio/webm,.mp3,.m4a,.ogg,.wav"
                hidden
                onChange={(event) => {
                  const picked = event.target.files?.[0];
                  event.target.value = "";
                  void handleFile(picked);
                }}
              />
              {audio.customUrl ? (
                <div className="flex items-center justify-between gap-2 rounded-md border bg-card px-2.5 py-2">
                  <span className="flex min-w-0 items-center gap-2 text-xs font-medium">
                    <Music className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">{audio.customName || "Nhạc đã tải lên"}</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={uploading}
                      onClick={() => fileInput.current?.click()}
                    >
                      Đổi bài
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      aria-label="Xóa file nhạc"
                      onClick={() => set({ customUrl: undefined, customName: undefined, startTime: 0 })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full bg-card"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload className="size-4" />
                  {uploading ? "Đang tải nhạc lên..." : "Chọn file nhạc (MP3, M4A, OGG, WAV)"}
                </Button>
              )}
              <p className="text-[11px] text-muted-foreground">
                Hỗ trợ MP3, M4A, OGG, WAV tối đa {MAX_AUDIO_MB}MB. Có thể kéo chọn đoạn điệp khúc bên
                dưới.
              </p>
              {uploadError && (
                <p role="alert" className="text-xs text-destructive">
                  {uploadError}
                </p>
              )}
            </div>
          ) : (
            <Field label="Bài nhạc có sẵn">
              <select
                className={inputClass}
                value={audio.trackId}
                onChange={(event) =>
                  set({ trackId: event.target.value, customUrl: undefined, customName: undefined, startTime: 0 })
                }
              >
                {AUDIO_MOODS.map((mood) => (
                  <optgroup key={mood.id} label={mood.label}>
                    {AUDIO_TRACKS.filter((track) => track.mood === mood.id).map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          )}

          {url ? (
            <AudioPlayer
              key={url}
              url={url}
              startTime={audio.startTime}
              volume={audio.volume}
              onStartTimeChange={(startTime) => set({ startTime }, "audio-start")}
              onCommit={endCoalesce}
            />
          ) : activeSource === "library" ? (
            <p className="text-xs text-muted-foreground">
              Kho nhạc mẫu chưa có file sẵn — hãy chuyển sang “Tải nhạc từ máy” để chọn bài yêu
              thích của bạn!
            </p>
          ) : null}

          <Slider
            label="Âm lượng"
            min={0}
            max={1}
            step={0.05}
            value={audio.volume}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(volume) => set({ volume }, "audio-volume")}
            onCommit={endCoalesce}
          />
        </>
      )}
    </Section>
  );
}
