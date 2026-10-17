"use client";

import { useRef, useState, useTransition, type KeyboardEvent, type PointerEvent } from "react";
import { Icon } from "@/components/brand/icon";
import { removeBrandImageAction, uploadBrandImageAction } from "@/server/actions/organization";

/** Exported sizes: the largest width served (BRAND_WIDTHS in organization-brand.ts). */
const EXPORT = { banner: { width: 1500, ratio: 3 }, logo: { width: 512, ratio: 1 } } as const;
const ZOOM_MAX = 3;

/** The image picked, and the frame measured when it was picked. */
type Picked = { url: string; width: number; height: number; frameW: number; frameH: number };

/**
 * Banner (3:1) or logo (square) of the organization (V6 § B9, screens 63 to 66), in a window: pick
 * an image, frame it by dragging (or with the arrows), zoom with the slider, then send the framed
 * part as a JPEG. The page stays as it is (a job being written is kept).
 */
export function BrandImageEditor({
  kind,
  current,
  onDone,
  labels,
}: {
  kind: "banner" | "logo";
  current?: string | null;
  /** Closes the window; `true` once the server has saved or removed the image. */
  onDone: (saved: boolean) => void;
  labels: {
    choose: string;
    zoom: string;
    drag: string;
    empty: string;
    cancel: string;
    save: string;
    remove: string;
    /** Shown when the server refuses the image (type or size). */
    error: string;
  };
}) {
  const [failed, setFailed] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pending, startTransition] = useTransition();
  const { ratio, width: exportWidth } = EXPORT[kind];

  /** The scale that makes the image cover the frame, times the zoom. */
  const scaleOf = (item: Picked, nextZoom: number) =>
    Math.max(item.frameW / item.width, item.frameH / item.height) * nextZoom;
  const clamp = (x: number, y: number, nextZoom = zoom) => {
    if (!picked) return { x: 0, y: 0 };
    const scale = scaleOf(picked, nextZoom);
    const maxX = Math.max(0, (picked.width * scale - picked.frameW) / 2);
    const maxY = Math.max(0, (picked.height * scale - picked.frameH) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  };

  const pick = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      if (picked) URL.revokeObjectURL(picked.url);
      const box = stage.current?.getBoundingClientRect();
      // Same frame as drawn below: 90 % of the width for the banner, 78 % of the height for the logo.
      const frameW = kind === "banner" ? (box?.width ?? 320) * 0.9 : (box?.height ?? 220) * 0.78;
      setPicked({
        url,
        width: probe.naturalWidth,
        height: probe.naturalHeight,
        frameW,
        frameH: frameW / ratio,
      });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    probe.src = url;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!picked) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    setOffset(clamp(start.ox + event.clientX - start.x, start.oy + event.clientY - start.y));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 40 : 10;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (!picked || !move) return;
    event.preventDefault();
    setOffset(clamp(offset.x + move[0], offset.y + move[1]));
  };

  /** Draws the part inside the frame on a canvas and sends it. */
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    const img = image.current;
    event.preventDefault();
    if (!picked || !img) return;
    const form = new FormData(event.currentTarget);
    const scale = scaleOf(picked, zoom);
    const sw = picked.frameW / scale;
    const sh = picked.frameH / scale;
    const sx = picked.width / 2 - offset.x / scale - sw / 2;
    const sy = picked.height / 2 - offset.y / scale - sh / 2;
    const canvas = document.createElement("canvas");
    canvas.width = exportWidth;
    canvas.height = Math.round(exportWidth / ratio);
    const context = canvas.getContext("2d")!;
    // A JPEG has no transparency: a transparent logo would turn black without this white ground.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        form.delete("image");
        form.set("image", blob, `${kind}.jpg`);
        startTransition(async () => {
          const result = await uploadBrandImageAction(form);
          setFailed(!result.ok);
          if (result.ok) onDone(true);
        });
      },
      "image/jpeg",
      0.9,
    );
  };

  const shown = picked?.url ?? current;
  const frame =
    kind === "banner"
      ? "w-[90%] aspect-[3/1] rounded-[14px]"
      : "h-[78%] aspect-square rounded-[22px]";

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value={kind} />
      <div
        ref={stage}
        tabIndex={picked ? 0 : -1}
        role={picked ? "group" : undefined}
        aria-label={picked ? labels.drag : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={onKeyDown}
        className="relative h-[clamp(220px,52vw,340px)] touch-none overflow-hidden rounded-[22px] bg-[linear-gradient(160deg,#6E7F4E,#5E7A70)] outline-none select-none focus-visible:ring-4 focus-visible:ring-lime"
      >
        {picked ? (
          // A local blob, never sent anywhere before « Enregistrer »: next/image has nothing to add.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={image}
            src={picked.url}
            alt=""
            draggable={false}
            className="absolute top-1/2 left-1/2 max-w-none"
            style={{
              width: picked.width,
              height: picked.height,
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scaleOf(picked, zoom)})`,
            }}
          />
        ) : (
          shown && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt=""
              className={`absolute top-1/2 left-1/2 -translate-1/2 object-cover ${frame}`}
            />
          )
        )}
        {/* The frame: what the cards will show; the rest is dimmed. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 shadow-[0_0_0_9999px_rgb(15_45_38/0.45)] ring-[3px] ring-blanc ${frame}`}
        />
        {!shown && (
          <p className="absolute inset-x-[18%] top-1/2 -translate-y-1/2 text-center text-[15px] leading-5 text-blanc">
            {labels.empty}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 px-1">
        <Icon name="recherche" className="size-4 shrink-0 text-ardoise" />
        <input
          type="range"
          min={1}
          max={ZOOM_MAX}
          step={0.01}
          value={zoom}
          disabled={!picked}
          aria-label={labels.zoom}
          onChange={(event) => {
            const next = Number(event.target.value);
            setZoom(next);
            setOffset(clamp(offset.x, offset.y, next));
          }}
          className="h-11 min-w-0 flex-1 accent-sapin disabled:opacity-40"
        />
        <Icon name="plus" className="size-4 shrink-0 text-ardoise" />
      </div>

      <label className="flex h-14 cursor-pointer items-center gap-4 rounded-[18px] bg-blanc px-5 text-[15px] font-semibold shadow-douce has-focus-visible:ring-2 has-focus-visible:ring-sapin">
        <Icon name="telecharger" className="size-5 shrink-0" />
        <span className="flex-1">{labels.choose}</span>
        <Icon name="chev-r" className="size-5 shrink-0 text-ardoise" />
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => pick(event.target.files?.[0])}
        />
      </label>

      {current && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const data = new FormData();
              data.set("kind", kind);
              const result = await removeBrandImageAction(data);
              if (result.ok) onDone(true);
            })
          }
          className="flex h-12 items-center justify-center gap-2 rounded-[18px] text-[15px] font-semibold text-down-texte hover:bg-down-texte/5"
        >
          <Icon name="fermer" className="size-5" />
          {labels.remove}
        </button>
      )}

      {failed && (
        <p
          role="alert"
          className="rounded-[14px] bg-corail/10 px-4 py-3 text-[14px] text-down-texte"
        >
          {labels.error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => onDone(false)}
          className="flex h-[52px] items-center justify-center rounded-pill bg-blanc px-6 text-[15px] font-semibold shadow-douce"
        >
          {labels.cancel}
        </button>
        <button
          type="submit"
          disabled={pending || !picked}
          className="flex h-[52px] min-w-0 flex-1 items-center justify-center rounded-pill bg-gradient-principal px-5 text-[15px] font-semibold text-blanc shadow-[var(--jm-ombre-principal)] hover:brightness-110 disabled:opacity-60"
        >
          {labels.save}
        </button>
      </div>
    </form>
  );
}
