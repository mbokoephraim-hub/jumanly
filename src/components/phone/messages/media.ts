/**
 * Photos and voice notes prepared on the phone before they leave it (lot B8): a photo is reduced
 * to 1 280 px (2 560 px in « HD ») so it stays light on a slow network; the server re-encodes it
 * anyway and drops its metadata.
 */
export async function shrinkPhoto(file: Blob, hd: boolean): Promise<Blob> {
  const side = hd ? 2560 : 1280;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", hd ? 0.9 : 0.82),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    // A format the browser cannot draw: sent as it is, the server decides.
    return file;
  }
}

/** The recording formats the browser offers, the lightest first. */
export function voiceType() {
  if (typeof MediaRecorder === "undefined") return null;
  return (
    ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((type) =>
      MediaRecorder.isTypeSupported(type),
    ) ?? ""
  );
}

export const VOICE_MAX_SECONDS = 300;

/** « 0:07 ». */
export const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds) % 60).padStart(2, "0")}`;

/** The bars of a voice note (planche Messages-vocal). */
export const WAVE = [8, 14, 22, 12, 18, 26, 10, 16, 24, 12, 8, 20, 14, 26, 18, 10, 16, 12, 8, 6];
export const WAVE_REC = [6, 12, 20, 10, 16, 24, 14, 8, 18, 26, 12, 20, 10, 16, 22, 8, 14, 10, 6, 4];
