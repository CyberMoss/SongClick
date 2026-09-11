interface MixerPanelProps {
  musicVolume: number;
  clickVolume: number;
  onMusicChange: (value: number) => void;
  onClickChange: (value: number) => void;
}

export function MixerPanel({
  musicVolume,
  clickVolume,
  onMusicChange,
  onClickChange,
}: MixerPanelProps) {
  return (
    <section className="panel mixer-panel">
      <VolumeRow label="音乐音量" value={musicVolume} onChange={onMusicChange} />
      <VolumeRow label="Click 音量" value={clickVolume} onChange={onClickChange} />
    </section>
  );
}

function VolumeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="volume-row">
      <span>{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
      <strong>{Math.round(value * 100)}%</strong>
    </label>
  );
}
