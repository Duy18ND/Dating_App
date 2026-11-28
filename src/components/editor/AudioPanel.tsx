"use client";

import { Music, Pause, Play, Scissors, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AUDIO_MOODS, AUDIO_TRACKS, resolveAudioUrl } from "@/lib/audio-tracks";
import { uploadAudio } from "@/lib/client/api";
import {
  decodeAudioFile,
  estimateTrimBytes,
  MAX_LOCAL_AUDIO_BYTES,
  MAX_TRIM_SECONDS,
  MAX_UPLOAD_AUDIO_BYTES,
  MIN_TRIM_SECONDS,
  trimAudioBufferToWav,
  trimmedFileName,
} from "@/lib/client/trim-audio";
import { useEditorStore } from "@/lib/editor/store";
import type { WebConfig } from "@/types/letter";
import { Choice, Field, inputClass, Section, Slider, Toggle } from "./ui";

const MAX_START = 600;
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const fmtMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

type AudioSource = "custom" | "library";
const SOURCE_OPTIONS: { value: AudioSource; label: string }[] = [
  { value: "custom", label: "Tải nhạc từ máy" },
  { value: "library", label: "Kho nhạc sẵn" },
];

interface TrimSession {
  fileName: string;
  originalBytes: number;
  buffer: AudioBuffer;
  startSec: number;
  durationSec: number;
}

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
      {max > 0 && (
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
      )}
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
        {playing ? "Dừng nghe thử" : `Nghe thử từ ${clock(Math.min(startTime, max))}`}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Không phát được bài này. Hãy thử chọn bài khác hoặc tải file MP3/M4A/WAV.
        </p>
      )}
    </>
  );
}

/** Trình cắt đoạn nhạc trực tiếp khi file lớn hơn 5MB (hoặc người dùng muốn cắt điệp khúc). */
function AudioTrimmer({
  session,
  busy,
  volume,
  onChange,
  onConfirm,
  onCancel,
}: {
  session: TrimSession;
  busy: boolean;
  volume: number;
  onChange: (patch: Pick<TrimSession, "startSec" | "durationSec">) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const totalSec = Math.max(1, Math.floor(session.buffer.duration));
  const maxStart = Math.max(0, totalSec - MIN_TRIM_SECONDS);
  const maxDur = Math.max(
    MIN_TRIM_SECONDS,
    Math.min(MAX_TRIM_SECONDS, totalSec - session.startSec),
  );
  const clampedDur = Math.min(session.durationSec, maxDur);
  const endSec = Math.min(totalSec, session.startSec + clampedDur);
  const estBytes = estimateTrimBytes(clampedDur);

  const stopPreview = () => {
    try {
      srcRef.current?.stop();
    } catch {
      // Đã dừng trước đó.
    }
    srcRef.current = null;
    if (ctxRef.current) {
      void ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    setPreviewing(false);
  };

  useEffect(() => stopPreview, []);

  function togglePreview() {
    if (previewing) {
      stopPreview();
      return;
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    const source = ctx.createBufferSource();
    source.buffer = session.buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.onended = () => {
      srcRef.current = null;
      void ctx.close().catch(() => {});
      ctxRef.current = null;
      setPreviewing(false);
    };
    ctxRef.current = ctx;
    srcRef.current = source;
    source.start(0, session.startSec, clampedDur);
    setPreviewing(true);
  }

  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-accent/40 p-3">
      <div className="space-y-1">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Scissors className="size-3.5" /> Cắt đoạn nhạc cho gọn dưới 5 MB
        </p>
        <p className="truncate text-xs font-medium">{session.fileName}</p>
        <p className="text-[11px] text-muted-foreground">
          File gốc {fmtMb(session.originalBytes)} (dài {clock(totalSec)}). Kéo chọn đoạn điệp khúc
          hay nhất (tối đa {clock(MAX_TRIM_SECONDS)}) rồi bấm Cắt & tải lên.
        </p>
      </div>

      <Slider
        label="Điểm bắt đầu"
        min={0}
        max={maxStart}
        step={1}
        value={session.startSec}
        format={clock}
        onChange={(startSec) => {
          stopPreview();
          const nextMaxDur = Math.max(
            MIN_TRIM_SECONDS,
            Math.min(MAX_TRIM_SECONDS, totalSec - startSec),
          );
          onChange({ startSec, durationSec: Math.min(clampedDur, nextMaxDur) });
        }}
      />

      <Slider
        label="Độ dài đoạn cắt"
        min={Math.min(MIN_TRIM_SECONDS, maxDur)}
        max={maxDur}
        step={1}
        value={clampedDur}
        format={(v) => `${clock(v)} (~${fmtMb(estimateTrimBytes(v))})`}
        onChange={(durationSec) => {
          stopPreview();
          onChange({ startSec: session.startSec, durationSec });
        }}
      />

      <p className="rounded-md bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground">
        Đoạn đã chọn: {clock(session.startSec)} → {clock(endSec)} · Ước tính{" "}
        <span className="text-primary">{fmtMb(estBytes)}</span> / 5.0 MB
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={togglePreview} disabled={busy}>
          {previewing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {previewing ? "Dừng nghe" : "Nghe thử đoạn cắt"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => {
            stopPreview();
            onConfirm();
          }}
        >
          <Scissors className="size-3.5" />
          {busy ? "Đang cắt & tải lên..." : "Cắt & tải lên"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => {
            stopPreview();
            onCancel();
          }}
        >
          Hủy
        </Button>
      </div>
    </div>
  );
}

export function AudioPanel() {
  const audio = useEditorStore((s) => s.doc.web_config.audio);
  const setWebConfig = useEditorStore((s) => s.setWebConfig);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const fileInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<AudioSource>(audio.customUrl ? "custom" : "library");
  const [uploading, setUploading] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [trimmer, setTrimmer] = useState<TrimSession | null>(null);
  const [uploadError, setUploadError] = useState<string>();

  const set = (patch: Partial<WebConfig["audio"]>, key?: string) =>
    setWebConfig({ audio: { ...useEditorStore.getState().doc.web_config.audio, ...patch } }, key);

  const url = resolveAudioUrl(audio);
  const activeSource: AudioSource = audio.customUrl || trimmer ? "custom" : source;

  async function handleFile(file: File | undefined) {
    if (!file || uploading || decoding) return;
    setUploadError(undefined);
    if (file.size > MAX_LOCAL_AUDIO_BYTES) {
      setUploadError(
        `File gốc quá lớn (${fmtMb(file.size)}). Chọn file dưới ${fmtMb(MAX_LOCAL_AUDIO_BYTES)} để cắt trực tiếp nhé.`,
      );
      return;
    }

    // File lớn hơn 5MB: mở trình cắt nhạc trực tiếp ngay trong app để cắt gọn < 5MB!
    if (file.size > MAX_UPLOAD_AUDIO_BYTES) {
      setDecoding(true);
      try {
        const buffer = await decodeAudioFile(file);
        const total = Math.max(1, Math.floor(buffer.duration));
        const defaultDur = Math.min(60, MAX_TRIM_SECONDS, total);
        setTrimmer({
          fileName: file.name,
          originalBytes: file.size,
          buffer,
          startSec: 0,
          durationSec: defaultDur,
        });
        setSource("custom");
      } catch (cause) {
        setUploadError(cause instanceof Error ? cause.message : "Không đọc được file nhạc.");
      } finally {
        setDecoding(false);
      }
      return;
    }

    // File <= 5MB: tải lên ngay lập tức.
    setUploading(true);
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

  async function confirmTrim() {
    if (!trimmer || uploading) return;
    setUploading(true);
    setUploadError(undefined);
    try {
      const blob = trimAudioBufferToWav(trimmer.buffer, trimmer.startSec, trimmer.durationSec);
      const cutFile = new File([blob], trimmedFileName(trimmer.fileName), { type: "audio/wav" });
      const uploaded = await uploadAudio(cutFile);
      set({
        enabled: true,
        customUrl: uploaded.url,
        customName: uploaded.name,
        startTime: 0,
      });
      setTrimmer(null);
      setSource("custom");
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Cắt và tải nhạc thất bại");
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
              if (next === "library") {
                setTrimmer(null);
                if (audio.customUrl) {
                  set({ customUrl: undefined, customName: undefined, startTime: 0 });
                }
              }
            }}
          />

          {activeSource === "custom" ? (
            <div className="space-y-2.5">
              <input
                ref={fileInput}
                type="file"
                accept="audio/*,.mp3,.m4a,.ogg,.wav"
                hidden
                onChange={(event) => {
                  const picked = event.target.files?.[0];
                  event.target.value = "";
                  void handleFile(picked);
                }}
              />
              {trimmer ? (
                <AudioTrimmer
                  session={trimmer}
                  busy={uploading}
                  volume={audio.volume}
                  onChange={(patch) => setTrimmer((cur) => (cur ? { ...cur, ...patch } : null))}
                  onConfirm={() => void confirmTrim()}
                  onCancel={() => setTrimmer(null)}
                />
              ) : (
                <div className="space-y-2 rounded-lg border border-dashed bg-accent/35 p-3">
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
                          disabled={uploading || decoding}
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
                          onClick={() =>
                            set({ customUrl: undefined, customName: undefined, startTime: 0 })
                          }
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
                      disabled={uploading || decoding}
                      onClick={() => fileInput.current?.click()}
                    >
                      <Upload className="size-4" />
                      {decoding
                        ? "Đang đọc file nhạc để cắt..."
                        : uploading
                          ? "Đang tải nhạc lên..."
                          : "Chọn file nhạc (MP3, M4A, OGG, WAV)"}
                    </Button>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Chọn file tới 30 MB: file ≤ 5 MB tải thẳng, file dài hơn (VD: 10 MB) sẽ tự mở{" "}
                    <strong className="text-foreground">trình cắt đoạn nhạc</strong> gọn dưới 5 MB
                    ngay tại đây!
                  </p>
                </div>
              )}
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
                  set({
                    trackId: event.target.value,
                    customUrl: undefined,
                    customName: undefined,
                    startTime: 0,
                  })
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

          {url && !trimmer && (
            <AudioPlayer
              key={url}
              url={url}
              startTime={audio.startTime}
              volume={audio.volume}
              onStartTimeChange={(startTime) => set({ startTime }, "audio-start")}
              onCommit={endCoalesce}
            />
          )}

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
