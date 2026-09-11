import { positiveModulo } from "../utils/clamp";

interface BeatLightsProps {
  bpm: number;
  beatsPerBar: number;
  downbeatOffsetSec: number;
  currentSongTimeSec: number;
  isPlaying: boolean;
}

export function BeatLights({
  bpm,
  beatsPerBar,
  downbeatOffsetSec,
  currentSongTimeSec,
  isPlaying,
}: BeatLightsProps) {
  const beatIntervalSec = bpm > 0 ? 60 / bpm : null;
  const relativeTime = currentSongTimeSec - downbeatOffsetSec;
  const activeBeat =
    beatIntervalSec !== null && relativeTime >= 0
      ? positiveModulo(Math.floor(relativeTime / beatIntervalSec), beatsPerBar)
      : -1;

  return (
    <footer className="beat-footer">
      <div className="speaker-grille" aria-hidden="true" />
      <div className="beat-status">
        <span className={isPlaying ? "playing" : ""}>节拍指示</span>
        <div className="beat-lights" style={{ gridTemplateColumns: `repeat(${beatsPerBar}, 1fr)` }}>
          {Array.from({ length: beatsPerBar }).map((_, index) => (
            <i
              key={index}
              className={`${index === activeBeat ? "active" : ""} ${index === 0 ? "downbeat" : ""}`}
            />
          ))}
        </div>
      </div>
      <div className="speaker-grille" aria-hidden="true" />
    </footer>
  );
}
