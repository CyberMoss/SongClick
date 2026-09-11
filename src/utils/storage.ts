import type { TrackConfig } from "../types";

const KEY_PREFIX = "songclick_track_config_";

export function getTrackConfigKey(trackId: string): string {
  return `${KEY_PREFIX}${trackId}`;
}

export function loadTrackConfig(trackId: string): TrackConfig | null {
  try {
    const raw = localStorage.getItem(getTrackConfigKey(trackId));
    return raw ? (JSON.parse(raw) as TrackConfig) : null;
  } catch {
    return null;
  }
}

export function saveTrackConfig(trackId: string, config: TrackConfig): void {
  localStorage.setItem(getTrackConfigKey(trackId), JSON.stringify(config));
}
