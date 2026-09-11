import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioState, LoadedTrack, TrackConfig } from "../types";
import { clamp, positiveModulo } from "../utils/clamp";

const lookaheadMs = 25;
const visibleScheduleAheadTimeSec = 1;
const hiddenScheduleAheadTimeSec = 8;

interface ScheduledClick {
  oscillator: OscillatorNode;
  gain: GainNode;
  contextTime: number;
}

const emptyAudioState: AudioState = {
  audioBuffer: null,
  trackId: null,
  trackName: "尚未导入歌曲",
  durationSec: 0,
  isPlaying: false,
  currentSongTimeSec: 0,
};

export function useAudioEngine(config: TrackConfig) {
  const [audioState, setAudioState] = useState<AudioState>(emptyAudioState);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const clickGainRef = useRef<GainNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const configRef = useRef(config);
  const stateRef = useRef(audioState);
  const sourceStartContextTimeRef = useRef(0);
  const sourceStartSongOffsetSecRef = useRef(0);
  const pauseSongOffsetSecRef = useRef(0);
  const schedulerTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scheduledClicksRef = useRef<Map<number, ScheduledClick>>(new Map());
  const suppressEndedRef = useRef(false);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    resetClickSchedule();
  }, [
    config.bpm,
    config.beatsPerBar,
    config.subdivisionsPerBeat,
    config.downbeatOffsetSec,
    config.playbackRate,
  ]);

  useEffect(() => {
    stateRef.current = audioState;
  }, [audioState]);

  useEffect(() => {
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = config.musicVolume;
    }
    if (clickGainRef.current) {
      clickGainRef.current.gain.value = config.clickVolume;
    }
  }, [config.musicVolume, config.clickVolume]);

  useEffect(() => {
    if (!stateRef.current.isPlaying || !bufferRef.current) {
      return;
    }

    const currentTime = getCurrentSongTime();
    restartPlaybackAt(currentTime);
  }, [config.playbackRate]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        scheduleClicks();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    return () => {
      stopScheduler();
      stopFrameLoop();
      stopSource();
      void audioContextRef.current?.close();
    };
  }, []);

  function resetClickSchedule() {
    const audioContext = audioContextRef.current;

    scheduledClicksRef.current.forEach(({ oscillator, gain, contextTime }) => {
      if (audioContext && contextTime > audioContext.currentTime) {
        try {
          oscillator.stop(audioContext.currentTime);
        } catch {
          // The oscillator may already have stopped.
        }
      }

      oscillator.disconnect();
      gain.disconnect();
    });
    scheduledClicksRef.current.clear();
  }

  const ensureAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextCtor();
      const musicGain = audioContext.createGain();
      const clickGain = audioContext.createGain();
      musicGain.gain.value = configRef.current.musicVolume;
      clickGain.gain.value = configRef.current.clickVolume;
      musicGain.connect(audioContext.destination);
      clickGain.connect(audioContext.destination);
      audioContextRef.current = audioContext;
      musicGainRef.current = musicGain;
      clickGainRef.current = clickGain;
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  function stopSource() {
    if (!sourceRef.current) {
      return;
    }

    suppressEndedRef.current = true;
    try {
      sourceRef.current.stop();
    } catch {
      // Source may already have ended.
    }
    sourceRef.current.disconnect();
    sourceRef.current = null;
  }

  function stopScheduler() {
    if (schedulerTimerRef.current !== null) {
      window.clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
  }

  function startScheduler() {
    stopScheduler();
    schedulerTimerRef.current = window.setInterval(scheduleClicks, lookaheadMs);
    scheduleClicks();
  }

  function stopFrameLoop() {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function startFrameLoop() {
    stopFrameLoop();

    const tick = () => {
      const state = stateRef.current;
      if (!state.isPlaying || !bufferRef.current) {
        return;
      }

      const currentSongTimeSec = getCurrentSongTime();
      const nextTime = clamp(currentSongTimeSec, 0, state.durationSec);
      const { loopEnabled, loopStartSec, loopEndSec } = configRef.current;

      if (
        loopEnabled &&
        loopStartSec !== null &&
        loopEndSec !== null &&
        loopEndSec > loopStartSec + 0.49 &&
        nextTime >= loopEndSec
      ) {
        seekTo(loopStartSec);
        return;
      } else if (nextTime >= state.durationSec) {
        finishPlayback();
      } else {
        setAudioState((current) => ({ ...current, currentSongTimeSec: nextTime }));
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
  }

  function getCurrentSongTime() {
    const context = audioContextRef.current;
    const state = stateRef.current;
    if (!context || !state.isPlaying) {
      return pauseSongOffsetSecRef.current;
    }

    return (
      sourceStartSongOffsetSecRef.current +
      (context.currentTime - sourceStartContextTimeRef.current) * configRef.current.playbackRate
    );
  }

  function createSource(offsetSec: number) {
    const audioContext = audioContextRef.current;
    const buffer = bufferRef.current;
    const musicGain = musicGainRef.current;
    if (!audioContext || !buffer || !musicGain) {
      return null;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = configRef.current.playbackRate;
    source.connect(musicGain);
    source.onended = () => {
      if (suppressEndedRef.current) {
        suppressEndedRef.current = false;
        return;
      }
      finishPlayback();
    };

    sourceStartContextTimeRef.current = audioContext.currentTime;
    sourceStartSongOffsetSecRef.current = offsetSec;
    source.start(0, offsetSec);
    sourceRef.current = source;
    return source;
  }

  async function restartPlaybackAt(offsetSec: number) {
    await ensureAudioContext();
    const state = stateRef.current;
    if (!bufferRef.current) {
      return false;
    }

    const safeOffset = clamp(offsetSec, 0, Math.max(0, state.durationSec - 0.001));
    stopSource();
    createSource(safeOffset);
    pauseSongOffsetSecRef.current = safeOffset;
    resetClickSchedule();
    setAudioState((current) => ({
      ...current,
      isPlaying: true,
      currentSongTimeSec: safeOffset,
    }));
    startScheduler();
    startFrameLoop();
    return true;
  }

  async function startPlayback(offsetSec = pauseSongOffsetSecRef.current) {
    return restartPlaybackAt(offsetSec);
  }

  function pausePlayback() {
    const currentSongTimeSec = clamp(getCurrentSongTime(), 0, stateRef.current.durationSec);
    pauseSongOffsetSecRef.current = currentSongTimeSec;
    stopSource();
    stopScheduler();
    stopFrameLoop();
    resetClickSchedule();
    setAudioState((current) => ({
      ...current,
      isPlaying: false,
      currentSongTimeSec,
    }));
  }

  function finishPlayback() {
    const durationSec = stateRef.current.durationSec;
    pauseSongOffsetSecRef.current = durationSec;
    stopSource();
    stopScheduler();
    stopFrameLoop();
    resetClickSchedule();
    setAudioState((current) => ({
      ...current,
      isPlaying: false,
      currentSongTimeSec: durationSec,
    }));
  }

  function stopPlayback() {
    pauseSongOffsetSecRef.current = 0;
    stopSource();
    stopScheduler();
    stopFrameLoop();
    resetClickSchedule();
    setAudioState((current) => ({
      ...current,
      isPlaying: false,
      currentSongTimeSec: 0,
    }));
  }

  function seekTo(timeSec: number) {
    const safeTime = clamp(timeSec, 0, stateRef.current.durationSec);
    pauseSongOffsetSecRef.current = safeTime;
    resetClickSchedule();

    if (stateRef.current.isPlaying) {
      void restartPlaybackAt(safeTime);
      return;
    }

    setAudioState((current) => ({
      ...current,
      currentSongTimeSec: safeTime,
    }));
  }

  function setTrack(track: LoadedTrack) {
    stopSource();
    stopScheduler();
    stopFrameLoop();
    resetClickSchedule();
    bufferRef.current = track.audioBuffer;
    pauseSongOffsetSecRef.current = 0;
    setAudioState({
      audioBuffer: track.audioBuffer,
      trackId: track.trackId,
      trackName: track.trackName,
      durationSec: track.durationSec,
      isPlaying: false,
      currentSongTimeSec: 0,
    });
  }

  function scheduleClicks() {
    const audioContext = audioContextRef.current;
    const state = stateRef.current;
    const cfg = configRef.current;
    if (!audioContext || !state.isPlaying || !bufferRef.current || cfg.bpm <= 0) {
      return;
    }

    const clickIntervalSec = 60 / cfg.bpm / cfg.subdivisionsPerBeat;
    const clicksPerBar = cfg.beatsPerBar * cfg.subdivisionsPerBeat;
    const nowSongTime = getCurrentSongTime();
    const scheduleAheadTimeSec = document.hidden
      ? hiddenScheduleAheadTimeSec
      : visibleScheduleAheadTimeSec;
    const windowEndSongTime = nowSongTime + scheduleAheadTimeSec * cfg.playbackRate;
    const firstIndex = Math.ceil((nowSongTime - cfg.downbeatOffsetSec) / clickIntervalSec);
    const lastIndex = Math.floor((windowEndSongTime - cfg.downbeatOffsetSec) / clickIntervalSec);

    for (let index = firstIndex; index <= lastIndex; index += 1) {
      if (scheduledClicksRef.current.has(index)) {
        continue;
      }

      const clickSongTimeSec = cfg.downbeatOffsetSec + index * clickIntervalSec;
      const clickContextTime =
        sourceStartContextTimeRef.current +
        (clickSongTimeSec - sourceStartSongOffsetSecRef.current) / cfg.playbackRate;

      if (clickContextTime <= audioContext.currentTime + 0.005) {
        continue;
      }

      scheduledClicksRef.current.set(
        index,
        scheduleClickTone(audioContext, clickContextTime, index, clicksPerBar),
      );
    }
  }

  function scheduleClickTone(
    audioContext: AudioContext,
    clickContextTime: number,
    clickIndex: number,
    clicksPerBar: number,
  ): ScheduledClick {
    const cfg = configRef.current;
    const clickIndexInBar = positiveModulo(clickIndex, clicksPerBar);
    const subdivisionIndexInBeat = positiveModulo(clickIndex, cfg.subdivisionsPerBeat);
    const isDownbeat = clickIndexInBar === 0;
    const isMainBeat = subdivisionIndexInBeat === 0;
    const tone = isDownbeat
      ? { frequency: 1100, durationSec: 0.045, gain: 1 }
      : isMainBeat
        ? { frequency: 850, durationSec: 0.04, gain: 0.75 }
        : { frequency: 550, durationSec: 0.03, gain: 0.4 };

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = tone.frequency;
    oscillator.type = "square";
    gain.gain.setValueAtTime(0.0001, clickContextTime);
    gain.gain.exponentialRampToValueAtTime(tone.gain, clickContextTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, clickContextTime + tone.durationSec);
    oscillator.connect(gain);
    gain.connect(clickGainRef.current!);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      if (scheduledClicksRef.current.get(clickIndex)?.oscillator === oscillator) {
        scheduledClicksRef.current.delete(clickIndex);
      }
    };
    oscillator.start(clickContextTime);
    oscillator.stop(clickContextTime + tone.durationSec + 0.01);
    return { oscillator, gain, contextTime: clickContextTime };
  }

  return {
    audioState,
    ensureAudioContext,
    setTrack,
    startPlayback,
    pausePlayback,
    stopPlayback,
    seekTo,
  };
}
