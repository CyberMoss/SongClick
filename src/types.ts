export interface TrackConfig {
  bpm: number;
  beatsPerBar: number;
  subdivisionsPerBeat: number;
  downbeatOffsetSec: number;
  playbackRate: number;
  musicVolume: number;
  clickVolume: number;
  loopStartSec: number | null;
  loopEndSec: number | null;
  loopEnabled: boolean;
}

export interface AudioState {
  audioBuffer: AudioBuffer | null;
  trackId: string | null;
  trackName: string;
  durationSec: number;
  isPlaying: boolean;
  currentSongTimeSec: number;
}

export interface LoadedTrack {
  audioBuffer: AudioBuffer;
  trackId: string;
  trackName: string;
  durationSec: number;
}
