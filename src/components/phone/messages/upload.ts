"use client";

import { uploadPartAction, type MsgResult } from "@/server/actions/messages-phone";
import { shrinkPhoto } from "./media";

/** Same sizes as the server (`message-media.ts`): 3 Mo per part, 10 Mo per document. */
const PART_BYTES = 3 * 1024 * 1024;
const MAX_BYTES = 10 * 1024 * 1024;

export type SentParts = { upload: string; parts: number; name: string };

const newUploadId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

/**
 * A document taken from the phone (a diploma, an attestation, a PDF), sent in parts of 3 Mo: the
 * host refuses one request above 4,5 Mo, and a scanned diploma often weighs more. A photo of a
 * document is first reduced like the photos of the conversation (2 560 px, still readable).
 */
export async function sendInParts(file: File): Promise<MsgResult<SentParts>> {
  const isPhoto = file.type.startsWith("image/") && file.type !== "image/svg+xml";
  const blob: Blob = isPhoto ? await shrinkPhoto(file, true) : file;
  const name =
    isPhoto && blob !== file ? `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg` : file.name;
  if (blob.size === 0) return { ok: false, error: "empty" };
  if (blob.size > MAX_BYTES) return { ok: false, error: "size" };
  const upload = newUploadId();
  const parts = Math.ceil(blob.size / PART_BYTES);
  for (let index = 0; index < parts; index++) {
    const form = new FormData();
    form.set("upload", upload);
    form.set("index", String(index));
    form.set("part", blob.slice(index * PART_BYTES, (index + 1) * PART_BYTES), "part");
    const result = await uploadPartAction(form).catch(() => null);
    if (!result) return { ok: false, error: "failed" };
    if (!result.ok) return result;
  }
  return { ok: true, value: { upload, parts, name } };
}
