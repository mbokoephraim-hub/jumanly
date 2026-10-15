"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { attachVideoAction, prepareVideoUploadAction } from "@/server/actions/course-admin";

/**
 * Sends a lesson video straight to the video provider (TUS protocol, one request for the file):
 * the site only signs the upload, so its 4.5 MB request limit does not apply (Admin v2, étape 6).
 */
export function VideoUploader({
  courseId,
  lessonId,
  labels,
}: {
  courseId: string;
  lessonId: string;
  labels: {
    file: string;
    hint: string;
    send: string;
    sending: string;
    done: string;
    error: string;
  };
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);

  async function send() {
    if (!file) return;
    setState("sending");
    setProgress(0);
    try {
      const upload = await prepareVideoUploadAction(courseId, lessonId);
      if (!upload) throw new Error("no upload");
      const encode = (value: string) => btoa(unescape(encodeURIComponent(value)));
      const created = await fetch(upload.endpoint, {
        method: "POST",
        headers: {
          ...upload.headers,
          "Tus-Resumable": "1.0.0",
          "Upload-Length": String(file.size),
          "Upload-Metadata": `filetype ${encode(file.type || "video/mp4")},title ${encode(file.name)}`,
        },
      });
      const location = created.headers.get("Location");
      if (!created.ok || !location) throw new Error("create");
      const target = new URL(location, upload.endpoint).toString();
      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("PATCH", target);
        for (const [name, value] of Object.entries(upload.headers))
          request.setRequestHeader(name, value);
        request.setRequestHeader("Tus-Resumable", "1.0.0");
        request.setRequestHeader("Upload-Offset", "0");
        request.setRequestHeader("Content-Type", "application/offset+octet-stream");
        request.upload.onprogress = (event) =>
          event.lengthComputable && setProgress(Math.round((100 * event.loaded) / event.total));
        request.onload = () =>
          request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("patch"));
        request.onerror = () => reject(new Error("network"));
        request.send(file);
      });
      await attachVideoAction(courseId, lessonId, upload.videoId);
      setState("done");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="lesson-video-file" className="text-[13px] font-semibold">
        {labels.file}
      </label>
      <input
        id="lesson-video-file"
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        aria-describedby="lesson-video-file-hint"
        className="text-[13px] file:mr-3 file:h-9 file:rounded-pill file:border-0 file:bg-creme file:px-4 file:font-semibold"
      />
      <p id="lesson-video-file-hint" className="text-[11.5px] text-ardoise">
        {labels.hint}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={!file || state === "sending"}
          className="inline-flex h-10 items-center rounded-pill bg-sapin px-[18px] text-[13px] font-semibold text-blanc disabled:opacity-55"
        >
          {state === "sending" ? labels.sending : labels.send}
        </button>
        <span role="status" className="text-[12.5px]">
          {state === "sending" && `${progress} %`}
          {state === "done" && labels.done}
          {state === "error" && labels.error}
        </span>
      </div>
    </div>
  );
}
