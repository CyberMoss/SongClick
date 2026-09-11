import type { ChangeEvent, FormEvent } from "react";

interface TrackLoaderProps {
  url: string;
  isLoading: boolean;
  onUrlChange: (url: string) => void;
  onFileLoad: (file: File) => void;
  onUrlLoad: () => void;
}

export function TrackLoader({
  url,
  isLoading,
  onUrlChange,
  onFileLoad,
  onUrlLoad,
}: TrackLoaderProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onFileLoad(file);
      event.target.value = "";
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onUrlLoad();
  }

  return (
    <div className="loader-row">
      <label className="file-button">
        <input type="file" accept="audio/*" onChange={handleFileChange} disabled={isLoading} />
        导入歌曲
      </label>
      <form className="url-form" onSubmit={handleSubmit}>
        <input
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="音频 URL"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !url.trim()}>
          读取
        </button>
      </form>
    </div>
  );
}
