"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import {
  deleteCareerProjectAction,
  featureCareerProjectAction,
  saveCareerProjectAction,
} from "@/server/actions/career-phone";
import { PhoneBack } from "../back";
import { shrink } from "../fil/compose";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { Field, FormPage, OrbiRewrite, useLeave } from "./edit";

/** Where a page of the portfolio goes back to when it was opened directly. */
const PORTFOLIO = "/app/career/cv?onglet=portfolio";
/** « Photos (3 au plus) » (planche Carrière-real-ajout). */
const PHOTOS_MAX = 3;

/** The drawing of a project without a photo, as on the tiles of the tab. */
function Drawing() {
  return (
    <svg viewBox="0 0 160 110" fill="none" aria-hidden>
      <path
        d="M18 82 L58 56 L90 70 L128 32 L150 44"
        stroke="var(--nb-lime)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type ProjectView = {
  id: string;
  title: string;
  meta: string;
  text: string;
  skills: string[];
  photos: string[];
  link: string | null;
  featured: boolean;
};

/**
 * « Détail d'une réalisation » (planche Carrière-real, feuille Carrière-real-suppr): the photos,
 * the text, the skills; « Mettre en avant », « Partager dans le Fil », « Supprimer ».
 */
export function ProjectDetail({ project }: { project: ProjectView }) {
  const t = useTranslations("phoneCareer.project");
  const router = useRouter();
  const [featured, setFeatured] = useState(project.featured);
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [pending, start] = useTransition();
  const strip = useRef<HTMLDivElement>(null);

  const feature = (on: boolean) => {
    setFeatured(on);
    start(async () => {
      const result = await featureCareerProjectAction(project.id, on).catch(() => null);
      if (!result?.ok) {
        setFeatured(!on);
        showToast({ message: t("error"), tone: "error" });
      }
    });
  };

  return (
    <div className="nb-page nb-ca-projet">
      <header className="nb-ca-form-barre" data-retour-texte="">
        <PhoneBack fallback={PORTFOLIO} label={t("back")} text={t("back")} />
        <span />
        <Link href={`/app/career/portfolio/${project.id}?modifier=1`} className="nb-ca-ok">
          {t("edit")}
        </Link>
      </header>
      <div className="nb-ca-projet-img">
        {project.photos.length > 0 ? (
          <div
            ref={strip}
            className="nb-ca-projet-defile"
            onScroll={(event) => {
              const box = event.currentTarget;
              setIndex(Math.round(box.scrollLeft / Math.max(1, box.clientWidth)));
            }}
          >
            {project.photos.map((src, n) => (
              // eslint-disable-next-line @next/next/no-img-element -- private file, served by the API
              <img key={src} src={src} alt={t("photoAlt", { n: n + 1, title: project.title })} />
            ))}
          </div>
        ) : (
          <Drawing />
        )}
        {project.photos.length > 1 ? (
          <span className="nb-ca-projet-compte" aria-live="polite">
            {t("count", { n: index + 1, all: project.photos.length })}
          </span>
        ) : null}
      </div>
      <div className="nb-ca-projet-corps">
        <h1>{project.title}</h1>
        <p className="nb-meta">{project.meta}</p>
        {project.text ? <p className="nb-ca-projet-texte">{project.text}</p> : null}
        {project.link ? (
          <a href={project.link} target="_blank" rel="noopener noreferrer nofollow">
            {project.link}
          </a>
        ) : null}
        {project.skills.length > 0 ? (
          <div className="nb-ca-chips">
            {project.skills.map((skill) => (
              <span key={skill} className="nb-ex-chip">
                {skill}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="nb-ca-it" data-ligne="">
        <span id="real-avant">{t("feature")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={featured}
          aria-labelledby="real-avant"
          className="nb-switch"
          disabled={pending}
          onClick={() => feature(!featured)}
        >
          <span />
        </button>
      </div>
      <Link href={`/app/fil/publier?realisation=${project.id}`} className="nb-ca-it" data-ligne="">
        <span>{t("share")}</span>
        <PhoneIcon name="chevron" size={18} />
      </Link>
      <button
        type="button"
        className="nb-ca-it nb-ca-sortir"
        data-ligne=""
        onClick={() => setDeleting(true)}
      >
        {t("delete")}
      </button>
      <PhoneSheet
        open={deleting}
        onClose={() => setDeleting(false)}
        label={t("deleteQuestion")}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">{t("deleteQuestion")}</b>
        <p className="nb-meta nb-ca-feuille-d">{t("deleteText")}</p>
        <div className="nb-ca-feuille-b">
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-plein-rouge=""
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await deleteCareerProjectAction(project.id).catch(() => null);
                if (!result?.ok) {
                  showToast({ message: t("error"), tone: "error" });
                  return;
                }
                showToast({ message: t("deleted") });
                router.replace(PORTFOLIO);
              })
            }
          >
            {t("delete")}
          </button>
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-contour=""
            onClick={() => setDeleting(false)}
          >
            {t("cancel")}
          </button>
        </div>
      </PhoneSheet>
    </div>
  );
}

export type ProjectValues = {
  id: string | null;
  title: string;
  context: string;
  link: string;
  skills: string[];
  visible: boolean;
  /** Photos already saved (their key and address) and other files kept as they are. */
  photos: { key: string; src: string }[];
  others: string[];
};

type Added = { file: File; preview: string };

/**
 * « Nouvelle réalisation » (planche Carrière-real-ajout) and « Modifier »: up to 3 photos reduced on
 * the phone, the title, the description that Orbi can write, a link; « Publier aussi dans le Fil »
 * opens the publication with the project attached, for the person to send or not.
 */
export function ProjectForm({ values }: { values: ProjectValues }) {
  const t = useTranslations("phoneCareer.project");
  const router = useRouter();
  const leave = useLeave(PORTFOLIO);
  const editing = values.id !== null;
  const [title, setTitle] = useState(values.title);
  const [context, setContext] = useState(values.context);
  const [link, setLink] = useState(values.link);
  const [kept, setKept] = useState(values.photos);
  const [added, setAdded] = useState<Added[]>([]);
  const [share, setShare] = useState(!editing);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const count = kept.length + added.length;

  useEffect(
    () => () => added.forEach((item) => URL.revokeObjectURL(item.preview)),
    // Only when the page goes: a removed photo frees its preview itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    start(async () => {
      const next: Added[] = [];
      for (const file of Array.from(files).slice(0, PHOTOS_MAX - count)) {
        try {
          const blob = await shrink(file);
          const photo = new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
            type: "image/jpeg",
          });
          next.push({ file: photo, preview: URL.createObjectURL(blob) });
        } catch {
          showToast({ message: t("photoError"), tone: "error" });
        }
      }
      setAdded((before) => [...before, ...next]);
      if (input.current) input.current.value = "";
    });
  };

  const save = () =>
    start(async () => {
      const form = new FormData();
      if (values.id) form.set("id", values.id);
      form.set("title", title);
      form.set("context", context);
      form.set("link", link);
      form.set("visible", values.visible ? "1" : "0");
      for (const skill of values.skills) form.append("skills", skill);
      for (const photo of kept) form.append("keep", photo.key);
      for (const key of values.others) form.append("keep", key);
      for (const item of added) form.append("files", item.file);
      const result = await saveCareerProjectAction(form).catch(() => null);
      if (!result?.ok) {
        const code = result?.error ?? "error";
        setError(code);
        showToast({
          message: t.has(`errors.${code}` as "errors.title")
            ? t(`errors.${code}` as "errors.title")
            : t("error"),
          tone: "error",
        });
        return;
      }
      showToast({ message: editing ? t("saved") : t("added") });
      if (!editing && share) router.replace(`/app/fil/publier?realisation=${result.id}`);
      else leave();
    });

  return (
    <FormPage
      title={editing ? t("editTitle") : t("newTitle")}
      onSave={save}
      pending={pending}
      back={values.id ? `/app/career/portfolio/${values.id}` : PORTFOLIO}
    >
      <div className="nb-ca-ch">
        <span>{t("photos", { max: PHOTOS_MAX })}</span>
        <div className="nb-ca-photos">
          {kept.map((photo, n) => (
            <span key={photo.key} className="nb-ca-photo">
              {/* eslint-disable-next-line @next/next/no-img-element -- private file */}
              <img src={photo.src} alt={t("photoAlt", { n: n + 1, title })} />
              <button
                type="button"
                aria-label={t("photoRemove", { n: n + 1 })}
                onClick={() => setKept((before) => before.filter((item) => item.key !== photo.key))}
              >
                <PhoneIcon name="fermer" size={14} />
              </button>
            </span>
          ))}
          {added.map((item, n) => (
            <span key={item.preview} className="nb-ca-photo">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
              <img src={item.preview} alt={t("photoAlt", { n: kept.length + n + 1, title })} />
              <button
                type="button"
                aria-label={t("photoRemove", { n: kept.length + n + 1 })}
                onClick={() => {
                  URL.revokeObjectURL(item.preview);
                  setAdded((before) => before.filter((other) => other !== item));
                }}
              >
                <PhoneIcon name="fermer" size={14} />
              </button>
            </span>
          ))}
          {count < PHOTOS_MAX ? (
            <label className="nb-ca-photo nb-ca-photo-ajout">
              <PhoneIcon name="plus" size={20} />
              <span>{t("photoAdd")}</span>
              <input
                ref={input}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(event) => addPhotos(event.target.files)}
              />
            </label>
          ) : null}
        </div>
        <p className="nb-meta">{t("photosHint")}</p>
      </div>
      <Field label={t("title")} error={error === "title" ? t("errors.title") : null}>
        {(id) => (
          <input
            id={id}
            className="nb-ca-in"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("titlePlaceholder")}
            maxLength={120}
            required
          />
        )}
      </Field>
      <Field label={t("description")}>
        {(id) => (
          <textarea
            id={id}
            className="nb-ca-in"
            value={context}
            onChange={(event) => setContext(event.target.value)}
            maxLength={3000}
            rows={5}
          />
        )}
      </Field>
      <OrbiRewrite
        kind="project"
        text={context || title}
        title={title}
        hint={t("orbi")}
        button={t("orbiButton")}
        onUse={setContext}
      />
      <Field label={t("link")} error={error === "link" ? t("errors.link") : null}>
        {(id) => (
          <input
            id={id}
            type="url"
            inputMode="url"
            className="nb-ca-in"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://"
            maxLength={300}
          />
        )}
      </Field>
      {editing ? null : (
        <div className="nb-ca-bascule">
          <span id="real-fil">{t("alsoFil")}</span>
          <button
            type="button"
            role="switch"
            aria-checked={share}
            aria-labelledby="real-fil"
            className="nb-switch"
            onClick={() => setShare(!share)}
          >
            <span />
          </button>
        </div>
      )}
    </FormPage>
  );
}
