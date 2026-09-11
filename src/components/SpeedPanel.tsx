import { useState } from "react";

interface SpeedPanelProps {
  playbackRate: number;
  practiceBpm: number;
  onChange: (playbackRate: number) => void;
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 3v4.5h-4.5" />
    </svg>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      {locked ? <path d="M8 10V7a4 4 0 0 1 8 0v3" /> : <path d="M8 10V7a4 4 0 0 1 7.3-2.2" />}
      <path d="M12 14v2" />
    </svg>
  );
}

export function SpeedPanel({ playbackRate, practiceBpm, onChange }: SpeedPanelProps) {
  const [isSpeedLocked, setIsSpeedLocked] = useState(true);
  const speedPercent = Math.round(playbackRate * 100);
  const isDefaultSpeed = speedPercent === 100;

  return (
    <section className={`panel slider-panel${isSpeedLocked ? " locked" : ""}`}>
      <div className="slider-header">
        <span className="slider-title">速度</span>
        <span className="lock-hint">{isSpeedLocked ? "已锁定" : "拖动调节"}</span>
        <div className="slider-actions">
          <button
            type="button"
            className="icon-button"
            title="重置为 100%"
            aria-label="重置速度为 100%"
            disabled={isSpeedLocked || isDefaultSpeed}
            onClick={() => onChange(1)}
          >
            <ResetIcon />
          </button>
          <button
            type="button"
            className={`icon-button lock-button${isSpeedLocked ? "" : " is-unlocked"}`}
            title={isSpeedLocked ? "解锁以调节速度" : "锁定速度，防止误触"}
            aria-label={isSpeedLocked ? "解锁速度控制" : "锁定速度控制"}
            aria-pressed={!isSpeedLocked}
            onClick={() => setIsSpeedLocked((current) => !current)}
          >
            <LockIcon locked={isSpeedLocked} />
          </button>
        </div>
      </div>
      <div className="slider-control-row">
        <input
          type="range"
          min="50"
          max="150"
          step="5"
          value={speedPercent}
          disabled={isSpeedLocked}
          aria-label="播放速度"
          onChange={(event) => onChange(Number(event.target.value) / 100)}
        />
        <strong className="speed-readout">
          {speedPercent}
          <small>%</small>
        </strong>
      </div>
      <p className="slider-footer">
        当前练习 <strong>{Math.round(practiceBpm)}</strong> BPM
      </p>
    </section>
  );
}
