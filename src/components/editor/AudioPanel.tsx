"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AUDIO_MOODS, AUDIO_TRACKS, trackUrl } from "@/lib/audio-tracks";
import { useEditorStore } from "@/lib/editor/store";
import type { WebConfig } from "@/types/letter";
import { Field, inputClass, Section, Slider, Toggle } from "./ui";

const MAX_START = 600;
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/** Nghe thử ngay tại chỗ, bắt đầu đúng giây đã chọn. Đổi `key` theo url để đặt lại trạng thái. */
function Preview({ url, startTime, volume }: { url: string; startTime: number; volume: number }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

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

  return (
    <>
      <audio
        ref={audio}
        src={url}
        preload="metadata"
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
          Không phát được bài này. Có thể file nhạc chưa được tải lên.
        </p>
      )}
    </>
  );
}

function StartTimeSlider({
  url,
  value,
  onChange,
  onCommit,
}: {
  url: string;
  value: number;
  onChange: (value: number) => void;
  onCommit: () => void;
}) {
  const [duration, setDuration] = useState<number>();
  useEffect(() => {
    const probe = new Audio();
    probe.preload = "metadata";
    probe.onloadedmetadata = () => setDuration(probe.duration);
    probe.src = url;
    return () => {
      probe.onloadedmetadata = null;
      probe.removeAttribute("src");
    };
  }, [url]);

  const max = Math.min(MAX_START, Math.max(0, Math.floor((duration ?? MAX_START) - 5)));
  return (
    <Slider
      label="Bắt đầu từ (điệp khúc)"
      min={0}
      max={max}
      step={1}
      value={Math.min(value, max)}
      format={clock}
      onChange={onChange}
      onCommit={onCommit}
    />
  );
}

export function AudioPanel() {
  const audio = useEditorStore((s) => s.doc.web_config.audio);
  const setWebConfig = useEditorStore((s) => s.setWebConfig);
  const endCoalesce = useEditorStore((s) => s.endCoalesce);
  const set = (patch: Partial<WebConfig["audio"]>, key?: string) =>
    setWebConfig({ audio: { ...useEditorStore.getState().doc.web_config.audio, ...patch } }, key);
  const url = trackUrl(audio.trackId);

  return (
    <Section title="Nhạc nền">
      <Toggle
        label="Phát nhạc khi người nhận mở thư"
        checked={audio.enabled}
        onChange={(enabled) => set({ enabled, trackId: audio.trackId || AUDIO_TRACKS[0].id })}
      />
      {audio.enabled && (
        <>
          <Field label="Bài nhạc">
            <select
              className={inputClass}
              value={audio.trackId}
              onChange={(event) => set({ trackId: event.target.value, startTime: 0 })}
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
          {url ? (
            <>
              <StartTimeSlider
                key={url}
                url={url}
                value={audio.startTime}
                onChange={(startTime) => set({ startTime }, "audio-start")}
                onCommit={endCoalesce}
              />
              <Preview
                key={`preview:${url}`}
                url={url}
                startTime={audio.startTime}
                volume={audio.volume}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chưa cấu hình kho nhạc nên chưa nghe thử được.
            </p>
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
