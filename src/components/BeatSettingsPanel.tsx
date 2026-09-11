import { NumberControl } from "./NumberControl";

interface BeatSettingsPanelProps {
  bpm: number;
  beatsPerBar: number;
  subdivisionsPerBeat: number;
  onBpmChange: (value: number) => void;
  onBeatsPerBarChange: (value: number) => void;
  onSubdivisionsChange: (value: number) => void;
}

export function BeatSettingsPanel({
  bpm,
  beatsPerBar,
  subdivisionsPerBeat,
  onBpmChange,
  onBeatsPerBarChange,
  onSubdivisionsChange,
}: BeatSettingsPanelProps) {
  return (
    <section className="panel beat-settings">
      <NumberControl label="BPM（手动）" value={bpm} min={0} max={300} onChange={onBpmChange} />
      <NumberControl
        label="每小节拍数"
        value={beatsPerBar}
        min={1}
        max={16}
        onChange={onBeatsPerBarChange}
      />
      <NumberControl
        label="每拍细分数"
        value={subdivisionsPerBeat}
        min={1}
        max={16}
        onChange={onSubdivisionsChange}
      />
    </section>
  );
}
