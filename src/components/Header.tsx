interface HeaderProps {
  isPlaying: boolean;
}

export function Header({ isPlaying }: HeaderProps) {
  return (
    <header className="top-bar">
      <div className="name-plate">
        <span>SongClick · 跟歌节拍器</span>
      </div>
      <div className="ready-state">
        <span className={`pilot-light ${isPlaying ? "is-playing" : ""}`} />
        <span>{isPlaying ? "PLAYING" : "READY"}</span>
      </div>
    </header>
  );
}
