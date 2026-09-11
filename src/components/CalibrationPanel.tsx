import { formatTime } from "../utils/time";

interface CalibrationPanelProps {
  downbeatOffsetSec: number;
  onSetDownbeat: () => void;
  onAdjust: (deltaSec: number) => void;
  onReset: () => void;
}

export function CalibrationPanel({
  downbeatOffsetSec,
  onSetDownbeat,
  onAdjust,
  onReset,
}: CalibrationPanelProps) {
  return (
    <section className="panel calibration-panel">
      <div className="calibration-readout">第一拍：{formatTime(downbeatOffsetSec)}</div>
      <div className="calibration-controls">
        <button onClick={() => onAdjust(-0.01)}>
          前移<small>-10ms</small>
        </button>
        <button className="set-downbeat" onClick={onSetDownbeat}>
          设为第一拍
        </button>
        <button onClick={() => onAdjust(0.01)}>
          后移<small>+10ms</small>
        </button>
        <button onClick={onReset}>重置</button>
      </div>
    </section>
  );
}
