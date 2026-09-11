export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) {
    return "00:00.00";
  }

  const sign = totalSeconds < 0 ? "-" : "";
  const absoluteSeconds = Math.abs(totalSeconds);
  const minutes = Math.floor(absoluteSeconds / 60);
  const seconds = Math.floor(absoluteSeconds % 60);
  const centiseconds = Math.floor((absoluteSeconds % 1) * 100);

  return `${sign}${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

export function formatSignedMs(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  return `${ms >= 0 ? "+" : ""}${ms}ms`;
}
