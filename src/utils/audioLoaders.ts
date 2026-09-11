import type { LoadedTrack } from "../types";

export function getLocalTrackId(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

export function getUrlTrackId(url: string): string {
  return `url_${url}`;
}

export async function decodeAudioBuffer(
  audioContext: AudioContext,
  arrayBuffer: ArrayBuffer,
): Promise<AudioBuffer> {
  return await audioContext.decodeAudioData(arrayBuffer.slice(0));
}

export async function loadLocalAudioFile(
  file: File,
  audioContext: AudioContext,
): Promise<LoadedTrack> {
  const audioBuffer = await decodeAudioBuffer(audioContext, await file.arrayBuffer());

  return {
    audioBuffer,
    trackId: getLocalTrackId(file),
    trackName: file.name.replace(/\.[^.]+$/, ""),
    durationSec: audioBuffer.duration,
  };
}

export async function loadAudioUrl(
  url: string,
  audioContext: AudioContext,
): Promise<LoadedTrack> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("URL_FETCH_FAILED");
  }

  const audioBuffer = await decodeAudioBuffer(audioContext, await response.arrayBuffer());
  const urlObject = new URL(url);
  const fileName = decodeURIComponent(urlObject.pathname.split("/").pop() || "URL 音频");

  return {
    audioBuffer,
    trackId: getUrlTrackId(url),
    trackName: fileName.replace(/\.[^.]+$/, ""),
    durationSec: audioBuffer.duration,
  };
}
