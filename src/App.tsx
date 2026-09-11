import { useMemo, useState } from "react";
import { BeatLights } from "./components/BeatLights";
import { BeatSettingsPanel } from "./components/BeatSettingsPanel";
import { CalibrationPanel } from "./components/CalibrationPanel";
import { Header } from "./components/Header";
import { LoopPanel } from "./components/LoopPanel";
import { MixerPanel } from "./components/MixerPanel";
import { PlayerPanel } from "./components/PlayerPanel";
import { SpeedPanel } from "./components/SpeedPanel";
import { StatusMessage } from "./components/StatusMessage";
import { TransportPanel } from "./components/TransportPanel";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useTrackConfig } from "./hooks/useTrackConfig";
import { loadAudioUrl, loadLocalAudioFile } from "./utils/audioLoaders";
import { clamp } from "./utils/clamp";

const messages = {
  noTrack: "请先导入音频。",
  badUrl: "无法读取该链接。请确认它是可直接访问的音频文件链接，或改用本地导入。",
  decodeFailed: "浏览器无法解码该音频格式，请换一个文件。",
  bpm: "BPM 需要在 0 到 300 之间。",
  beats: "每小节拍数需要在 1 到 16 之间。",
  subdivisions: "每拍细分数需要在 1 到 16 之间。",
  loop: "B 点必须晚于 A 点，且循环区间至少 0.5 秒。",
};

export default function App() {
  const [trackId, setTrackId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { config, updateConfig } = useTrackConfig(trackId);
  const audio = useAudioEngine(config);

  const practiceBpm = useMemo(
    () => config.bpm * config.playbackRate,
    [config.bpm, config.playbackRate],
  );

  async function handleLocalFile(file: File) {
    setIsLoading(true);
    setMessage("");

    try {
      const audioContext = await audio.ensureAudioContext();
      const loadedTrack = await loadLocalAudioFile(file, audioContext);
      setTrackId(loadedTrack.trackId);
      audio.setTrack(loadedTrack);
    } catch {
      setMessage(messages.decodeFailed);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUrlLoad() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const audioContext = await audio.ensureAudioContext();
      const loadedTrack = await loadAudioUrl(trimmedUrl, audioContext);
      setTrackId(loadedTrack.trackId);
      audio.setTrack(loadedTrack);
    } catch {
      setMessage(messages.badUrl);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePlayPause() {
    setMessage("");
    if (!audio.audioState.audioBuffer) {
      setMessage(messages.noTrack);
      return;
    }

    if (audio.audioState.isPlaying) {
      audio.pausePlayback();
      return;
    }

    await audio.startPlayback();
  }

  function handleNumberChange(
    value: number,
    min: number,
    max: number,
    key: "bpm" | "beatsPerBar" | "subdivisionsPerBeat",
    errorMessage: string,
    allowDecimal = false,
  ) {
    if (Number.isNaN(value) || value < min || value > max) {
      setMessage(errorMessage);
    } else {
      setMessage("");
    }

    const normalizedValue = allowDecimal ? value : Math.round(value);
    updateConfig({ [key]: clamp(normalizedValue, min, max) });
  }

  function setLoopEnd() {
    const currentTime = audio.audioState.currentSongTimeSec;
    if (config.loopStartSec !== null && currentTime <= config.loopStartSec + 0.49) {
      setMessage(messages.loop);
      return;
    }

    setMessage("");
    updateConfig({ loopEndSec: currentTime });
  }

  function toggleLoop() {
    const { loopStartSec, loopEndSec, loopEnabled } = config;

    if (loopEnabled) {
      setMessage("");
      updateConfig({ loopEnabled: false });
      return;
    }

    if (loopStartSec === null) {
      setMessage(messages.loop);
      return;
    }

    const effectiveEndSec = loopEndSec ?? audio.audioState.currentSongTimeSec;
    if (effectiveEndSec <= loopStartSec + 0.49) {
      setMessage(messages.loop);
      return;
    }

    setMessage("");
    updateConfig({ loopEndSec: effectiveEndSec, loopEnabled: true });
    audio.seekTo(loopStartSec);
  }

  function skip(seconds: number) {
    audio.seekTo(audio.audioState.currentSongTimeSec + seconds);
  }

  return (
    <main className="app-shell">
      <div className="device">
        <Header isPlaying={audio.audioState.isPlaying} />
        <PlayerPanel
          audioState={audio.audioState}
          url={url}
          isLoading={isLoading}
          onUrlChange={setUrl}
          onFileLoad={handleLocalFile}
          onUrlLoad={handleUrlLoad}
          onSeek={audio.seekTo}
        />
        <TransportPanel
          isPlaying={audio.audioState.isPlaying}
          canPlay={Boolean(audio.audioState.audioBuffer)}
          onPlayPause={handlePlayPause}
          onStop={audio.stopPlayback}
          onSkip={skip}
        />
        <CalibrationPanel
          downbeatOffsetSec={config.downbeatOffsetSec}
          onSetDownbeat={() => updateConfig({ downbeatOffsetSec: audio.audioState.currentSongTimeSec })}
          onAdjust={(deltaSec) => updateConfig({ downbeatOffsetSec: config.downbeatOffsetSec + deltaSec })}
          onReset={() => updateConfig({ downbeatOffsetSec: 0 })}
        />
        <BeatSettingsPanel
          bpm={config.bpm}
          beatsPerBar={config.beatsPerBar}
          subdivisionsPerBeat={config.subdivisionsPerBeat}
          onBpmChange={(value) => handleNumberChange(value, 0, 300, "bpm", messages.bpm, true)}
          onBeatsPerBarChange={(value) =>
            handleNumberChange(value, 1, 16, "beatsPerBar", messages.beats)
          }
          onSubdivisionsChange={(value) =>
            handleNumberChange(value, 1, 16, "subdivisionsPerBeat", messages.subdivisions)
          }
        />
        <SpeedPanel
          playbackRate={config.playbackRate}
          practiceBpm={practiceBpm}
          onChange={(playbackRate) => updateConfig({ playbackRate })}
        />
        <LoopPanel
          loopStartSec={config.loopStartSec}
          loopEndSec={config.loopEndSec}
          loopEnabled={config.loopEnabled}
          onSetA={() => {
            setMessage("");
            updateConfig({ loopStartSec: audio.audioState.currentSongTimeSec, loopEnabled: false });
          }}
          onSetB={setLoopEnd}
          onToggle={toggleLoop}
          onClear={() =>
            updateConfig({ loopStartSec: null, loopEndSec: null, loopEnabled: false })
          }
        />
        <MixerPanel
          musicVolume={config.musicVolume}
          clickVolume={config.clickVolume}
          onMusicChange={(musicVolume) => updateConfig({ musicVolume })}
          onClickChange={(clickVolume) => updateConfig({ clickVolume })}
        />
        <StatusMessage message={message || (isLoading ? "正在读取音频..." : "")} />
        <BeatLights
          bpm={config.bpm}
          beatsPerBar={config.beatsPerBar}
          downbeatOffsetSec={config.downbeatOffsetSec}
          currentSongTimeSec={audio.audioState.currentSongTimeSec}
          isPlaying={audio.audioState.isPlaying}
        />
      </div>
    </main>
  );
}
