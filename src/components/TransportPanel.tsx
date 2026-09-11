interface TransportPanelProps {
  isPlaying: boolean;
  canPlay: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onSkip: (seconds: number) => void;
}

export function TransportPanel({
  isPlaying,
  canPlay,
  onPlayPause,
  onStop,
  onSkip,
}: TransportPanelProps) {
  return (
    <section className="transport-row">
      <button className="transport-button play" onClick={onPlayPause}>
        <span>{isPlaying ? "暂停" : "播放"}</span>
        <b className={`t-icon ${isPlaying ? "icon-pause" : "icon-play"}`} aria-hidden="true" />
      </button>
      <button className="transport-button" onClick={onStop} disabled={!canPlay}>
        <span>停止</span>
        <b className="t-icon icon-stop" aria-hidden="true" />
      </button>
      <button className="transport-button" onClick={() => onSkip(-5)} disabled={!canPlay}>
        <span>快退</span>
        <b className="t-icon icon-rew" aria-hidden="true" />
      </button>
      <button className="transport-button" onClick={() => onSkip(5)} disabled={!canPlay}>
        <span>快进</span>
        <b className="t-icon icon-ff" aria-hidden="true" />
      </button>
    </section>
  );
}