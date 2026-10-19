"use client";

import { useRef, useState, useTransition, type KeyboardEvent, type PointerEvent } from "react";
import { TalentIcon } from "@/components/talent/icon";
import { track } from "@/lib/track";
import { removePhotoAction, savePhotoAction } from "@/server/actions/profile";

/** Side of the exported square: enough for the largest avatar and the CV, light on the network. */
const EXPORT_SIDE = 512;
const ZOOM_MAX = 3;

/** The photo picked, and the diameter of the circle measured when it was picked. */
type Picked = { url: string; width: number; height: number; diameter: number };

/**
 * The photo of « Modifier le profil » (planche talent-4), in its sheet: take or choose a photo,
 * center it by dragging (or with the arrows), zoom with the slider, then send a 512 px square
 * JPEG. Without JavaScript the form still sends the file picked, uncropped.
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
    const context = canvas.getContext("2d")!;
    // A JPEG has no transparency: a transparent PNG would turn black without this white ground.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, EXPORT_SIDE, EXPORT_SIDE);
    context.drawImage(img, sx, sy, side, side, 0, 0, EXPORT_SIDE, EXPORT_SIDE);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const data = new FormData();
        data.set("photo", blob, "photo.jpg");
        track("profile_photo_saved");
        startTransition(() => savePhotoAction(data));
      },
      "image/jpeg",
      0.88,
    );
  };

  const shown = picked?.url ?? current;

  return (
    <form action={savePhotoAction} onSubmit={save} className="t-flux">
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
        className="t-ph-cadre"
      >
        {picked ? (
          // A local blob, never sent anywhere before « Enregistrer »: next/image has nothing to add.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={image}
            src={picked.url}
            alt=""
            draggable={false}
            className="t-ph-libre"
            style={{
              width: picked.width,
              height: picked.height,
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scaleOf(picked, zoom)})`,
            }}
          />
        ) : (
          shown && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="t-ph-rond" />
          )
        )}
        {/* The circle: what the avatar will show; the rest is dimmed. */}
        <div aria-hidden className="t-ph-cercle" />
        {!shown && <p className="t-ph-vide">{labels.empty}</p>}
      </div>

      <div className="t-ph-zoom">
        <TalentIcon name="recherche" size="xs" />
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
        />
        <TalentIcon name="plus" size="xs" />
      </div>

      <div className="t-verre t-liste">
        <label className="t-li t-press">
          <span className="t-cases" aria-hidden>
            <TalentIcon name="photo" size="s" />
          </span>
          <span className="t-t">
            <b>{labels.take}</b>
          </span>
          <TalentIcon name="suivant" />
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            className="sr-only"
            onChange={(event) => pick(event.target.files?.[0])}
          />
        </label>
        <label className="t-li t-press">
          <span className="t-cases" aria-hidden>
            <TalentIcon name="telecharger" size="s" />
          </span>
          <span className="t-t">
            <b>{labels.choose}</b>
          </span>
          <TalentIcon name="suivant" />
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => pick(event.target.files?.[0])}
          />
        </label>
        {hasPhoto && (
          <button
            type="submit"
            formAction={removePhotoAction}
            formNoValidate
            className="t-li t-danger t-press"
          >
            <span className="t-cases" aria-hidden>
              <TalentIcon name="supprimer" size="s" />
            </span>
            <span className="t-t">
              <b>{labels.remove}</b>
            </span>
          </button>
        )}
      </div>

      <p className="t-gar">
        <TalentIcon name="confidentialite" size="s" />
        <span>{labels.never}</span>
      </p>

      <button type="submit" disabled={pending} className="t-bt t-p t-pl t-press">
        {labels.save}
      </button>
    </form>
  );
}
