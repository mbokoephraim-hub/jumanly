"use client";

import "@/styles/phone-apropos.css";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { showToast } from "@/components/motion/toaster";
import { removeCareerPhotoAction, saveCareerPhotoAction } from "@/server/actions/career-phone";

/** Side of the square sent: the largest avatar and the CV, light on the network. */
const EXPORT_SIDE = 512;
const ZOOM_MAX = 3;

type Mode = "voir" | "choisir" | "recadrer";
/** The photo being placed in the circle, and the circle's diameter when it was loaded. */
type Source = { url: string; width: number; height: number; diameter: number; local: boolean };

const PEN = "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4";
const CROP = "M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14";
const CAMERA = "M4 8h3l2-3h6l2 3h3v11H4zM12 9.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z";
const PICTURE = "M4 5h16v14H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17M15.5 8.5h.01";
const CLOSE = "M6 6l12 12M18 6 6 18";

function Svg({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

/**
 * The profile photo seen large (décision d'Ephraïm du 27/10/2026): a touch on the photo of
 * Carrière brings it forward, the screen behind blurs. From there: « Modifier » (camera or
 * gallery, then placed in the circle), « Recadrer » the current one, or « Initiales » to go back
 * to the round Jumanly draws from the name. A <dialog>: focus stays inside, Échap closes it.
 */
export function PhotoViewer({
  open,
  onClose,
  image,
  initials,
  name,
  ring,
}: {
  open: boolean;
  onClose: () => void;
  image: string | null;
  /** Without a photo, the Jumanly round: the initials of the name on Lime. */
  initials: string;
  name: string;
  /** The ring of skill colours around the photo, as on the profile. */
  ring: string;
}) {
  const t = useTranslations("phoneCareer.photoViewer");
  const tf = useTranslations("phoneCareer.form");
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [mode, setMode] = useState<Mode>("voir");
  const [shown, setShown] = useState(image);
  const [source, setSource] = useState<Source | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pending, start] = useTransition();

  // The photo saved on the server replaces the one shown (another screen changed it).
  const [seen, setSeen] = useState(image);
  if (seen !== image) {
    setSeen(image);
    setShown(image);
  }

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  // Left open on a page kept hidden (cacheComponents), a modal <dialog> would make the next one
  // inert: leaving closes it.
  useEffect(() => {
    const node = dialog.current;
    return () => {
      if (node?.open) node.close();
    };
  }, []);

  const reset = () => {
    if (source?.local) URL.revokeObjectURL(source.url);
    setSource(null);
    setMode("voir");
  };
  const close = () => {
    reset();
    onClose();
  };

  /** The scale that makes the photo cover the circle, times the zoom. */
  const scaleOf = (photo: Source, nextZoom: number) =>
    (photo.diameter / Math.min(photo.width, photo.height)) * nextZoom;
  const clamp = (x: number, y: number, nextZoom = zoom) => {
    if (!source) return { x: 0, y: 0 };
    const scale = scaleOf(source, nextZoom);
    const maxX = Math.max(0, (source.width * scale - source.diameter) / 2);
    const maxY = Math.max(0, (source.height * scale - source.diameter) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  };

  /** Loads a photo (a new file or the current one) into the circle. */
  const load = (url: string, local: boolean) => {
    const probe = new Image();
    probe.crossOrigin = "anonymous";
    probe.onload = () => {
      const width = stage.current?.getBoundingClientRect().width;
      setSource({
        url,
        width: probe.naturalWidth,
        height: probe.naturalHeight,
        diameter: width ? width * 0.86 : 260,
        local,
      });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    probe.onerror = () => {
      if (local) URL.revokeObjectURL(url);
      setMode("voir");
      showToast({ message: tf("photoError"), tone: "error" });
    };
    setMode("recadrer");
    probe.src = url;
  };
  const pick = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    load(URL.createObjectURL(file), true);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!source) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const from = drag.current;
    if (!from) return;
    setOffset(clamp(from.ox + event.clientX - from.x, from.oy + event.clientY - from.y));
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
    if (!source || !move) return;
    event.preventDefault();
    setOffset(clamp(offset.x + move[0], offset.y + move[1]));
  };

  /** Draws what is inside the circle on a square and sends it. */
  const save = () => {
    const img = picture.current;
    if (!source || !img) return;
    const scale = scaleOf(source, zoom);
    const side = source.diameter / scale;
    const sx = source.width / 2 - offset.x / scale - side / 2;
    const sy = source.height / 2 - offset.y / scale - side / 2;
    start(async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = EXPORT_SIDE;
        canvas.height = EXPORT_SIDE;
        const context = canvas.getContext("2d")!;
        // A JPEG has no transparency: a transparent PNG would turn black without this ground.
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, EXPORT_SIDE, EXPORT_SIDE);
        context.drawImage(img, sx, sy, side, side, 0, 0, EXPORT_SIDE, EXPORT_SIDE);
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (made) => (made ? resolve(made) : reject(new Error("photo"))),
            "image/jpeg",
            0.88,
          ),
        );
        const data = new FormData();
        data.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const result = await saveCareerPhotoAction(data);
        if (!result.ok) throw new Error(result.error);
        setShown(URL.createObjectURL(blob));
        reset();
        showToast({ message: tf("photoSaved") });
        router.refresh();
      } catch {
        showToast({ message: tf("photoError"), tone: "error" });
      }
    });
  };

  const backToInitials = () =>
    start(async () => {
      const result = await removeCareerPhotoAction().catch(() => null);
      if (!result?.ok) {
        showToast({ message: tf("error"), tone: "error" });
        return;
      }
      setShown(null);
      showToast({ message: t("initialsBack") });
      router.refresh();
    });

  return (
    <dialog
      ref={dialog}
      className="nb-pv"
      aria-label={mode === "recadrer" ? t("cropTitle") : t("title")}
      onCancel={(event) => {
        event.preventDefault();
        if (mode === "voir") close();
        else reset();
      }}
      onClick={(event) => {
        // A touch on the blurred screen, outside the photo and its buttons, closes.
        if (event.target === event.currentTarget && mode === "voir") close();
      }}
    >
      {open ? (
        <div className="nb-pv-in" data-mode={mode}>
          <div className="nb-pv-haut">
            <b>{mode === "recadrer" ? t("cropTitle") : t("title")}</b>
            <button
              type="button"
              className="nb-pv-fermer"
              aria-label={t("close")}
              onClick={close}
              disabled={pending}
            >
              <Svg d={CLOSE} />
            </button>
          </div>

          {mode === "recadrer" ? (
            <>
              <div
                ref={stage}
                className="nb-pv-cadre"
                tabIndex={0}
                role="group"
                aria-label={t("drag")}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={() => (drag.current = null)}
                onPointerCancel={() => (drag.current = null)}
                onKeyDown={onKeyDown}
              >
                {source ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a local photo, not sent yet
                  <img
                    ref={picture}
                    src={source.url}
                    alt=""
                    crossOrigin="anonymous"
                    draggable={false}
                    className="nb-pv-libre"
                    style={{
                      width: source.width,
                      height: source.height,
                      transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scaleOf(source, zoom)})`,
                    }}
                  />
                ) : null}
                <span className="nb-pv-cercle" aria-hidden />
              </div>
              <p className="nb-pv-aide">{t("drag")}</p>
              <label className="nb-pv-zoom">
                <span className="sr-only">{t("zoom")}</span>
                <Svg d="M5 12h14" size={18} />
                <input
                  type="range"
                  min={1}
                  max={ZOOM_MAX}
                  step={0.01}
                  value={zoom}
                  disabled={!source}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setZoom(next);
                    setOffset(clamp(offset.x, offset.y, next));
                  }}
                />
                <Svg d="M12 5v14M5 12h14" size={18} />
              </label>
              <div className="nb-pv-bas">
                <button type="button" className="nb-bouton" onClick={reset} disabled={pending}>
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  className="nb-bouton"
                  data-plein=""
                  onClick={save}
                  disabled={pending || !source}
                  aria-busy={pending}
                >
                  {t("save")}
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="nb-pv-photo" style={{ background: ring }}>
                {shown ? (
                  // eslint-disable-next-line @next/next/no-img-element -- the person's own photo
                  <img src={shown} alt={t("photoOf", { name })} />
                ) : (
                  <span
                    className="nb-pv-initiales"
                    role="img"
                    aria-label={t("initialsOf", { name })}
                  >
                    {initials}
                  </span>
                )}
              </span>
              <p className="nb-pv-nom">{name}</p>
              {shown ? null : <p className="nb-pv-aide">{t("initialsHint")}</p>}

              {mode === "choisir" ? (
                <div className="nb-pv-choix">
                  <button type="button" onClick={() => camera.current?.click()}>
                    <Svg d={CAMERA} />
                    {tf("photoCamera")}
                  </button>
                  <button type="button" onClick={() => gallery.current?.click()}>
                    <Svg d={PICTURE} />
                    {tf("photoGallery")}
                  </button>
                  <button type="button" data-gris="" onClick={() => setMode("voir")}>
                    {t("back")}
                  </button>
                </div>
              ) : (
                <div className="nb-pv-actions">
                  <button type="button" onClick={() => setMode("choisir")} disabled={pending}>
                    <span aria-hidden>
                      <Svg d={PEN} />
                    </span>
                    {t("change")}
                  </button>
                  {shown ? (
                    <button type="button" onClick={() => load(shown, false)} disabled={pending}>
                      <span aria-hidden>
                        <Svg d={CROP} />
                      </span>
                      {t("crop")}
                    </button>
                  ) : null}
                  {shown ? (
                    <button type="button" onClick={backToInitials} disabled={pending}>
                      <span aria-hidden className="nb-pv-ab">
                        {initials}
                      </span>
                      {t("initials")}
                    </button>
                  ) : null}
                </div>
              )}
            </>
          )}
          <input
            ref={camera}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            hidden
            onChange={(event) => {
              pick(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <input
            ref={gallery}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              pick(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      ) : null}
    </dialog>
  );
}
