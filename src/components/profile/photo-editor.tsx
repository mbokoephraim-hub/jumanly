"use client";

import { useRef, useState, useTransition, type KeyboardEvent, type PointerEvent } from "react";
import Link from "next/link";
import { Icon } from "@/components/brand/icon";
import { removePhotoAction, savePhotoAction } from "@/server/actions/profile";

/** Side of the exported square: enough for the largest avatar and the CV, light on the network. */
const EXPORT_SIDE = 512;
const ZOOM_MAX = 3;

/** The photo picked, and the diameter of the circle measured when it was picked. */
type Picked = { url: string; width: number; height: number; diameter: number };

/**
 * « Photo de profil » (screen 26): take or choose a photo, center it by dragging (or with the
 * arrows), zoom with the slider, then send a 512 px square JPEG. Without JavaScript the form still
 * sends the file picked, uncropped.
 */
export function PhotoEditor({
  current,
  hasPhoto,
  labels,
}: {
  /** The photo already saved, shown until another one is picked. */
  current?: string;
  hasPhoto: boolean;
  labels: {
    take: string;
    choose: string;
    remove: string;
    never: string;
    zoom: string;
    cancel: string;
    save: string;
    empty: string;
    drag: string;
  };
}) {
  const stage = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pending, startTransition] = useTransition();

  /** The scale that makes the photo cover the circle, times the zoom. */
  const scaleOf = (photo: Picked, nextZoom: number) =>
    (photo.diameter / Math.min(photo.width, photo.height)) * nextZoom;
  const clamp = (x: number, y: number, nextZoom = zoom) => {
    if (!picked) return { x: 0, y: 0 };
    const scale = scaleOf(picked, nextZoom);
    const maxX = Math.max(0, (picked.width * scale - picked.diameter) / 2);
    const maxY = Math.max(0, (picked.height * scale - picked.diameter) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  };

  const pick = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      if (picked) URL.revokeObjectURL(picked.url);
      const box = stage.current?.getBoundingClientRect();
      setPicked({
        url,
        width: probe.naturalWidth,
        height: probe.naturalHeight,
        diameter: box ? Math.min(box.width, box.height) * 0.78 : 280,
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

  /** Draws the part inside the circle on a square canvas and sends it. */
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    const img = image.current;
    if (!picked || !img) return; // no crop: the browser sends the picked file as it is
    event.preventDefault();
    const side = picked.diameter / scaleOf(picked, zoom);
    const scale = scaleOf(picked, zoom);
    const sx = picked.width / 2 - offset.x / scale - side / 2;
    const sy = picked.height / 2 - offset.y / scale - side / 2;
    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_SIDE;
    canvas.height = EXPORT_SIDE;
    canvas.getContext("2d")!.drawImage(img, sx, sy, side, side, 0, 0, EXPORT_SIDE, EXPORT_SIDE);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const data = new FormData();
        data.set("photo", blob, "photo.jpg");
        startTransition(() => savePhotoAction(data));
      },
      "image/jpeg",
      0.88,
    );
  };

  const shown = picked?.url ?? current;

  return (
    <form action={savePhotoAction} onSubmit={save} className="flex flex-col gap-4">
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
        className="relative h-[clamp(240px,52vw,360px)] touch-none overflow-hidden rounded-[22px] bg-[linear-gradient(160deg,#6E7F4E,#5E7A70)] outline-none select-none focus-visible:ring-4 focus-visible:ring-lime"
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
              className="absolute top-1/2 left-1/2 aspect-square h-[78%] -translate-1/2 rounded-full object-cover"
            />
          )
        )}
        {/* The circle: what the avatar will show; the rest is dimmed. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 aspect-square h-[78%] -translate-1/2 rounded-full shadow-[0_0_0_9999px_rgb(15_45_38/0.45)] ring-[3px] ring-blanc"
        />
        {!shown && (
          <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-[15px] text-blanc">
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

      <ul className="overflow-hidden rounded-[22px] bg-blanc shadow-douce">
        <li>
          <label className="flex h-16 cursor-pointer items-center gap-4 px-5 text-[17px] has-focus-visible:bg-sapin/5">
            <Icon name="video" className="size-5 shrink-0" />
            <span className="flex-1">{labels.take}</span>
            <Icon name="chev-r" className="size-5 shrink-0 text-ardoise" />
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              className="sr-only"
              onChange={(event) => pick(event.target.files?.[0])}
            />
          </label>
        </li>
        <li className="border-t border-brume">
          <label className="flex h-16 cursor-pointer items-center gap-4 px-5 text-[17px] has-focus-visible:bg-sapin/5">
            <Icon name="telecharger" className="size-5 shrink-0" />
            <span className="flex-1">{labels.choose}</span>
            <Icon name="chev-r" className="size-5 shrink-0 text-ardoise" />
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => pick(event.target.files?.[0])}
            />
          </label>
        </li>
        {hasPhoto && (
          <li className="border-t border-brume">
            <button
              type="submit"
              formAction={removePhotoAction}
              formNoValidate
              className="flex h-16 w-full items-center gap-4 px-5 text-left text-[17px] text-down-texte hover:bg-down-texte/5"
            >
              <Icon name="fermer" className="size-5 shrink-0" />
              {labels.remove}
            </button>
          </li>
        )}
      </ul>

      <p className="flex items-center gap-3 rounded-[16px] bg-lime-clair px-4 py-3 text-[15px]">
        <Icon name="lock" className="size-4 shrink-0" />
        {labels.never}
      </p>

      <div className="sticky bottom-0 -mx-5 mt-2 flex gap-3 border-t border-brume bg-creme px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link
          href="/app/profil"
          className="flex h-14 items-center justify-center rounded-pill bg-blanc px-6 text-[17px] font-semibold shadow-douce"
        >
          {labels.cancel}
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 min-w-0 flex-1 items-center justify-center rounded-pill bg-gradient-principal px-5 text-[17px] font-semibold text-blanc shadow-[var(--jm-ombre-principal)] hover:brightness-110 disabled:opacity-60"
        >
          {labels.save}
        </button>
      </div>
    </form>
  );
}
