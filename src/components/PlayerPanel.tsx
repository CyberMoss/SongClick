import { useMemo } from "react";
import type { AudioState } from "../types";
import { formatTime } from "../utils/time";
import { TrackLoader } from "./TrackLoader";

interface PlayerPanelProps {
  audioState: AudioState;
  url: string;
  isLoading: boolean;
  onUrlChange: (url: string) => void;
  onFileLoad: (file: File) => void;
  onUrlLoad: () => void;
  onSeek: (timeSec: number) => void;
}

export function PlayerPanel({
  audioState,
  url,
  isLoading,
  onUrlChange,
  onFileLoad,
  onUrlLoad,
  onSeek,
}: PlayerPanelProps) {
  const progressValue = audioState.durationSec
    ? (audioState.currentSongTimeSec / audioState.durationSec) * 100
    : 0;
  const waveformPeaks = useMemo(
    () => buildWaveformPeaks(audioState.audioBuffer, 72),
    [audioState.audioBuffer],
  );

  return (
    <section className="player-window">
      <div className="record-area" aria-hidden="true">
        <div className="turntable">
          <div className={`vinyl ${audioState.isPlaying ? "is-spinning" : ""}`} />
          <div className="tone-arm" />
        </div>
      </div>
      <div className="track-area">
        <TrackLoader
          url={url}
          isLoading={isLoading}
          onUrlChange={onUrlChange}
          onFileLoad={onFileLoad}
          onUrlLoad={onUrlLoad}
        />
        <h1>{audioState.trackName}</h1>
        <div className={`wave-line ${audioState.audioBuffer ? "has-waveform" : ""}`} aria-hidden="true">
          {waveformPeaks.map((peak, index) => (
            <span key={index} style={{ height: `${Math.max(4, peak * 100)}%` }} />
          ))}
        </div>
        <div className="time-row">
          <span>{formatTime(audioState.currentSongTimeSec)}</span>
          <span>{formatTime(audioState.durationSec)}</span>
        </div>
        <input
          className="progress"
          type="range"
          min="0"
          max="1000"
          value={Math.round(progressValue * 10)}
          onChange={(event) => {
            const ratio = Number(event.target.value) / 1000;
            onSeek(audioState.durationSec * ratio);
          }}
          disabled={!audioState.audioBuffer}
          aria-label="播放进度"
        />
      </div>
    </section>
  );
}

function buildWaveformPeaks(audioBuffer: AudioBuffer | null, bins: number): number[] {
  if (!audioBuffer) {
    return Array.from({ length: bins }, (_, index) => 0.16 + (((index * 19) % 17) / 17) * 0.58);
  }

  const channelCount = Math.min(audioBuffer.numberOfChannels, 2);
  const channelData = Array.from({ length: channelCount }, (_, index) =>
    audioBuffer.getChannelData(index),
  );
  const samplesPerBin = Math.max(1, Math.floor(audioBuffer.length / bins));
  const peaks: number[] = [];

  for (let bin = 0; bin < bins; bin += 1) {
    const start = bin * samplesPerBin;
    const end = Math.min(audioBuffer.length, start + samplesPerBin);
    let sum = 0;
    let count = 0;

    for (let i = start; i < end; i += 8) {
      let sample = 0;
      for (const channel of channelData) {
        sample += Math.abs(channel[i] ?? 0);
      }
      sum += sample / channelCount;
      count += 1;
    }

    peaks.push(count ? sum / count : 0);
  }

  const maxPeak = Math.max(...peaks, 0.001);
  return peaks.map((peak) => 0.12 + Math.sqrt(peak / maxPeak) * 0.88);
}
