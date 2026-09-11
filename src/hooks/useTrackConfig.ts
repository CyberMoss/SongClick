import { useEffect, useRef, useState } from "react";
import type { TrackConfig } from "../types";
import { loadTrackConfig, saveTrackConfig } from "../utils/storage";

export const defaultTrackConfig: TrackConfig = {
  bpm: 60,
  beatsPerBar: 4,
  subdivisionsPerBeat: 1,
  downbeatOffsetSec: 0,
  playbackRate: 1,
  musicVolume: 0.8,
  clickVolume: 0.7,
  loopStartSec: null,
  loopEndSec: null,
  loopEnabled: false,
};

export function useTrackConfig(trackId: string | null) {
  const [config, setConfig] = useState<TrackConfig>({ ...defaultTrackConfig });
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    skipNextSaveRef.current = true;

    if (!trackId) {
      setConfig({ ...defaultTrackConfig });
      return;
    }

    // Always use a fresh object so the save effect runs after switching tracks.
    // Reusing the default object could cause the first user edit to be skipped.
    setConfig(loadTrackConfig(trackId) ?? { ...defaultTrackConfig });
  }, [trackId]);

  useEffect(() => {
    if (!trackId) {
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    saveTrackConfig(trackId, config);
  }, [config, trackId]);

  function updateConfig(patch: Partial<TrackConfig>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  return { config, setConfig, updateConfig };
}
