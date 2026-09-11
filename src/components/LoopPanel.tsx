import { formatTime } from "../utils/time";

interface LoopPanelProps {
  loopStartSec: number | null;
  loopEndSec: number | null;
  loopEnabled: boolean;
  onSetA: () => void;
  onSetB: () => void;
  onToggle: () => void;
  onClear: () => void;
}

export function LoopPanel({
  loopStartSec,
  loopEndSec,
  loopEnabled,
  onSetA,
  onSetB,
  onToggle,
  onClear,
}: LoopPanelProps) {
  return (
    <section className="panel loop-panel">
      <div className="panel-title">A-B 循环</div>
      <div className="loop-buttons">
        <button onClick={onSetA}>设置 A 点</button>
        <button onClick={onSetB}>设置 B 点</button>
        <button className={loopEnabled ? "active" : ""} onClick={onToggle}>
          {loopEnabled ? "关闭循环" : "开启循环"}
        </button>
        <button onClick={onClear}>清除</button>
      </div>
      <div className="loop-readout">
        <span>A {loopStartSec === null ? "--:--.--" : formatTime(loopStartSec)}</span>
        <span>→</span>
        <span>B {loopEndSec === null ? "--:--.--" : formatTime(loopEndSec)}</span>
      </div>
    </section>
  );
}
