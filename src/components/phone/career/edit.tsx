"use client";

import "@/styles/phone-apropos.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { ABOUT_TEXT_MAX, ABOUT_TITLE_MAX } from "@/lib/profile-about";
import { showToast } from "@/components/motion/toaster";
import {
  deleteCareerEducationAction,
  deleteCareerExperienceAction,
  removeCareerPhotoAction,
  rewriteCareerTextAction,
  saveCareerAboutAction,
  saveCareerEducationAction,
  saveCareerExperienceAction,
  saveCareerHeadAction,
  saveCareerPhotoAction,
} from "@/server/actions/career-phone";
import { ACHIEVEMENTS_MAX, achievementsOf, achievementsText } from "@/lib/achievements";
import { PhoneBack } from "../back";
import { AchievementsField, CompanyField, type CompanyValue } from "./experience-fields";
import { BannerField } from "./banner";
import { FilAvatar } from "../fil/avatar";
import { OrbiDisc, PhoneIcon } from "../icon";
import { pagesSeen } from "../pages-seen";
import { PhoneSheet } from "../sheet";
import { SOCIAL_KINDS, type SocialKind } from "@/lib/social-links";

/** Where a form of the profile goes back to when it was opened directly: « Mon profil ». */
const CAREER = "/app/profil";

type Result = { ok: true } | { ok: false; error: string };

/** After « Enregistrer »: the page that opened the form, the Carrière tab otherwise. */
export function useLeave(fallback = CAREER) {
  const router = useRouter();
  return () => {
    if (pagesSeen() > 1) router.back();
    else router.replace(fallback);
  };
}

/**
 * A form of the profile (planches Carrière-modifier, -apropos, -exp, -formation): « Annuler », the
 * title, « Enregistrer » in lime; the fields below. One save, then back to where the person was.
 */
export function FormPage({
  title,
  onSave,
  pending,
  children,
  back = CAREER,
}: {
  title: string;
  onSave: () => void;
  pending: boolean;
  children: ReactNode;
  back?: string;
}) {
  const t = useTranslations("phoneCareer.form");
  return (
    <div className="nb-page nb-ca-form">
      <header className="nb-ca-form-barre">
        {/* Icons rather than words, so a long title keeps its room (Ephraïm, 29/10/2026). */}
        <PhoneBack fallback={back} label={t("cancel")} icon="fermer" />
        <h1>{title}</h1>
        <button
          type="button"
          className="nb-ca-ok"
          onClick={onSave}
          disabled={pending}
          aria-label={t("save")}
          aria-busy={pending}
        >
          <PhoneIcon name="coche" size={20} strong />
        </button>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        {children}
        <button type="submit" hidden />
      </form>
    </div>
  );
}

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: (id: string) => ReactNode;
  error?: string | null;
}) {
  const id = useId();
  return (
    <div className="nb-ca-ch">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {error ? (
        <p className="nb-ca-erreur" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; text: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="nb-ca-ch">
      <span id={`${label}-l`}>{label}</span>
      <div className="nb-ca-chips" role="radiogroup" aria-labelledby={`${label}-l`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className="nb-ex-chip"
            data-fort=""
            onClick={() => onChange(option.value)}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Orbi's card under a text: proposes a version, « Utiliser » or « Garder le mien ». */
export function OrbiRewrite({
  kind,
  text,
  title,
  hint,
  button,
  onUse,
}: {
  kind: "about" | "experience" | "project";
  text: string;
  title?: string;
  hint: string;
  button: string;
  onUse: (text: string) => void;
}) {
  const t = useTranslations("phoneCareer.form");
  const [proposal, setProposal] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ask = () =>
    start(async () => {
      const result = await rewriteCareerTextAction({ kind, text, title }).catch(() => null);
      if (result?.ok) setProposal(result.text);
      else
        showToast({
          message: t.has(`orbiError.${result?.error}` as "orbiError.empty")
            ? t(`orbiError.${result?.error}` as "orbiError.empty")
            : t("orbiError.unavailable"),
          tone: "error",
        });
    });
  return (
    <div className="nb-ca-ob">
      <div className="nb-ca-ob-h">
        <OrbiDisc size={34} />
        <span>{hint}</span>
        <button type="button" data-orbi="" onClick={ask} disabled={pending} aria-busy={pending}>
          {pending ? t("orbiWorking") : button}
        </button>
      </div>
      {proposal ? (
        <div className="nb-ca-ob-p" aria-live="polite">
          <p>{proposal}</p>
          <p className="nb-meta">{t("orbiNote")}</p>
          <div>
            <button
              type="button"
              data-plein=""
              onClick={() => {
                onUse(proposal);
                setProposal(null);
              }}
            >
              {t("orbiUse")}
            </button>
            <button type="button" onClick={() => setProposal(null)}>
              {t("orbiKeep")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** A confirmation before deleting (planche « Supprimer cette expérience ? »). */
function DeleteButton({
  label,
  question,
  detail,
  onConfirm,
}: {
  label: string;
  question: string;
  detail: string;
  onConfirm: () => Promise<Result>;
}) {
  const t = useTranslations("phoneCareer.form");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const leave = useLeave();
  return (
    <>
      <div className="nb-ca-suppr">
        <button
          type="button"
          className="nb-bouton"
          data-large=""
          data-rouge=""
          onClick={() => setOpen(true)}
        >
          {label}
        </button>
      </div>
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={question}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">{question}</b>
        <p className="nb-meta nb-ca-feuille-d">{detail}</p>
        <div className="nb-ca-feuille-b">
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-plein-rouge=""
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await onConfirm().catch(() => null);
                if (!result?.ok) {
                  showToast({ message: t("error"), tone: "error" });
                  return;
                }
                showToast({ message: t("deleted") });
                setOpen(false);
                leave();
              })
            }
          >
            {t("delete")}
          </button>
          <button type="button" className="nb-bouton" data-large="" onClick={() => setOpen(false)}>
            {t("cancel")}
          </button>
        </div>
      </PhoneSheet>
    </>
  );
}

function useSave() {
  const t = useTranslations("phoneCareer.form");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const leave = useLeave();
  const save = (run: () => Promise<Result>, done: string) =>
    start(async () => {
      const result = await run().catch(() => null);
      if (!result?.ok) {
        const code = result?.error ?? "error";
        setError(code);
        showToast({
          message: t.has(`errors.${code}` as "errors.invalid")
            ? t(`errors.${code}` as "errors.invalid")
            : t("error"),
          tone: "error",
        });
        return;
      }
      setError(null);
      showToast({ message: done });
      leave();
    });
  return { pending, error, save };
}

/** Reduces a photo to a 640 px square JPEG on the phone before sending it. */
async function square(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(640, side);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas
    .getContext("2d")
    ?.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("photo"))),
      "image/jpeg",
      0.88,
    ),
  );
}

export type HeadValues = {
  name: string;
  /** Without « @ »; the one drawn from the name when the person has not chosen one. */
  handle: string;
  /** False while the handle is the one drawn from the name (it is not saved unless changed). */
  handleChosen: boolean;
  socials: Record<SocialKind, string>;
  showEmail: boolean;
  headline: string;
  city: string;
  summary: string;
  availability: "open" | "listening" | "not_looking";
  image: string | null;
  banner: string | null;
  initials: string;
  tone: number;
};

/**
 * « Modifier le profil » (planche Carrière-modifier, feuille Carrière-photo): the photo, the name,
 * the title, the city, the bio and the availability; « Paramètres du compte » below.
 */
export function HeadForm({
  values,
  recruiter = false,
}: {
  values: HeadValues;
  /**
   * A recruiter's own profile (Ephraïm 27/10/2026): the title and « Recrute en ce moment » are
   * set in « Recrutement », so the title and the talent's availability are left out here.
   */
  recruiter?: boolean;
}) {
  const t = useTranslations("phoneCareer.form");
  const router = useRouter();
  const [form, setForm] = useState(values);
  const [image, setImage] = useState(values.image);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [photoPending, startPhoto] = useTransition();
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const { pending, error, save } = useSave();
  const set = (patch: Partial<HeadValues>) => setForm((before) => ({ ...before, ...patch }));

  const sendPhoto = (file: File | undefined) => {
    if (!file) return;
    setPhotoSheet(false);
    startPhoto(async () => {
      try {
        const blob = await square(file);
        const data = new FormData();
        data.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const result = await saveCareerPhotoAction(data);
        if (!result.ok) throw new Error(result.error);
        setImage(URL.createObjectURL(blob));
        showToast({ message: t("photoSaved") });
        router.refresh();
      } catch {
        showToast({ message: t("photoError"), tone: "error" });
      }
    });
  };

  return (
    <FormPage
      title={t("headTitle")}
      pending={pending}
      onSave={() =>
        save(
          () =>
            saveCareerHeadAction({
              name: form.name,
              headline: form.headline,
              city: form.city,
              summary: form.summary,
              availability: form.availability,
              // The handle drawn from the name is shared by namesakes: kept only once chosen.
              handle:
                !values.handleChosen && form.handle === values.handle ? undefined : form.handle,
              socials: form.socials,
              showEmail: form.showEmail,
            }),
          t("headSaved"),
        )
      }
    >
      <BannerField banner={values.banner} />
      <div className="nb-ca-form-photo">
        <FilAvatar
          initials={values.initials}
          image={image}
          tone={values.tone}
          org={false}
          size={88}
        />
        <button
          type="button"
          onClick={() => setPhotoSheet(true)}
          disabled={photoPending}
          aria-busy={photoPending}
        >
          {t("photoChange")}
        </button>
      </div>
      <Field label={t("name")} error={error === "name" ? t("errors.name") : null}>
        {(id) => (
          <input
            id={id}
            className="nb-ca-in"
            value={form.name}
            onChange={(event) => set({ name: event.target.value })}
            autoComplete="name"
            maxLength={120}
            required
          />
        )}
      </Field>
      <Field
        label={t("handle")}
        error={
          error === "handle"
            ? t("errors.handle")
            : error === "handleTaken"
              ? t("errors.handleTaken")
              : null
        }
      >
        {(id) => (
          <input
            id={id}
            className="nb-ca-in"
            value={form.handle}
            onChange={(event) => set({ handle: event.target.value.replace(/^@/, "") })}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
            aria-describedby="ca-alias-aide"
          />
        )}
      </Field>
      <p id="ca-alias-aide" className="nb-meta nb-ca-aide">
        {t("handleHint")}
      </p>
      {recruiter ? null : (
        <Field label={t("headline")}>
          {(id) => (
            <input
              id={id}
              className="nb-ca-in"
              value={form.headline}
              onChange={(event) => set({ headline: event.target.value })}
              placeholder={t("headlinePlaceholder")}
              maxLength={120}
            />
          )}
        </Field>
      )}
      <Field label={t("city")}>
        {(id) => (
          <input
            id={id}
            className="nb-ca-in"
            value={form.city}
            onChange={(event) => set({ city: event.target.value })}
            autoComplete="address-level2"
            maxLength={120}
            required
          />
        )}
      </Field>
      {/* The presentation has its own page now (« À propos », a title and 400 characters). */}
      <Link href="/app/career/profil/apropos" className="nb-ca-it">
        <span>
          {t("aboutTitle")}
          <small>{t("aboutHint")}</small>
        </span>
        <PhoneIcon name="chevron" size={18} />
      </Link>
      {recruiter ? null : (
        <Chips
          label={t("availability")}
          value={form.availability}
          onChange={(availability) => set({ availability })}
          options={(["open", "listening", "not_looking"] as const).map((value) => ({
            value,
            text: t(`availabilityOption.${value}`),
          }))}
        />
      )}
      <h2 className="nb-ca-sous">{t("socials")}</h2>
      <p className="nb-meta nb-ca-aide">{t("socialsHint")}</p>
      {SOCIAL_KINDS.map((kind) => (
        <Field
          key={kind}
          label={t(`social.${kind}`)}
          error={error === "socials" && form.socials[kind] ? t("errors.socials") : null}
        >
          {(id) => (
            <input
              id={id}
              type="url"
              inputMode="url"
              className="nb-ca-in"
              value={form.socials[kind]}
              onChange={(event) =>
                set({ socials: { ...form.socials, [kind]: event.target.value } })
              }
              placeholder={t(`socialPlaceholder.${kind}`)}
              autoCapitalize="none"
              maxLength={300}
            />
          )}
        </Field>
      ))}
      <div className="nb-ca-bascule">
        <span id="ca-courriel">{t("showEmail")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={form.showEmail}
          aria-labelledby="ca-courriel"
          className="nb-switch"
          onClick={() => set({ showEmail: !form.showEmail })}
        >
          <span />
        </button>
      </div>
      <Link href="/app/parametres" className="nb-ca-it">
        {t("accountSettings")}
        <PhoneIcon name="chevron" size={18} />
      </Link>

      <PhoneSheet
        open={photoSheet}
        onClose={() => setPhotoSheet(false)}
        label={t("photoTitle")}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">{t("photoTitle")}</b>
        <button type="button" className="nb-opt nb-fil-opt" onClick={() => camera.current?.click()}>
          {t("photoCamera")}
        </button>
        <button
          type="button"
          className="nb-opt nb-fil-opt"
          onClick={() => gallery.current?.click()}
        >
          {t("photoGallery")}
        </button>
        {image ? (
          <button
            type="button"
            className="nb-opt nb-fil-opt"
            data-danger=""
            onClick={() => {
              setPhotoSheet(false);
              startPhoto(async () => {
                const result = await removeCareerPhotoAction().catch(() => null);
                if (!result?.ok) {
                  showToast({ message: t("error"), tone: "error" });
                  return;
                }
                setImage(null);
                showToast({ message: t("photoRemoved") });
                router.refresh();
              });
            }}
          >
            {t("photoRemove")}
          </button>
        ) : null}
        <button
          type="button"
          className="nb-opt nb-fil-opt"
          data-gris=""
          onClick={() => setPhotoSheet(false)}
        >
          {t("cancel")}
        </button>
      </PhoneSheet>
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={(event) => sendPhoto(event.target.files?.[0])}
      />
      <input
        ref={gallery}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => sendPhoto(event.target.files?.[0])}
      />
    </FormPage>
  );
}

/** « À propos » (planche Carrière-apropos): the text, its length and Orbi's rewrite. */
export function AboutForm({
  title: initialTitle,
  summary,
  target,
}: {
  title: string;
  summary: string;
  target: string | null;
}) {
  const t = useTranslations("phoneCareer.form");
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(summary);
  const { pending, error, save } = useSave();
  // A text written before the 400-character limit (or imported from a CV) stays until shortened.
  const over = text.trim().length > ABOUT_TEXT_MAX;
  return (
    <FormPage
      title={t("aboutTitle")}
      pending={pending}
      onSave={() => save(() => saveCareerAboutAction({ title, text }), t("aboutSaved"))}
    >
      <Field label={t("aboutHeading")}>
        {(id) => (
          <input
            id={id}
            className="nb-ca-in"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={ABOUT_TITLE_MAX}
            placeholder={t("aboutHeadingPlaceholder")}
          />
        )}
      </Field>
      <Field
        label={t("aboutLabel")}
        error={over && error === "aboutTooLong" ? t("errors.aboutTooLong") : null}
      >
        {(id) => (
          <textarea
            id={id}
            className="nb-ca-in"
            data-haut=""
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={Math.max(ABOUT_TEXT_MAX, summary.length)}
            placeholder={t("aboutPlaceholder")}
            aria-invalid={over || undefined}
            rows={7}
          />
        )}
      </Field>
      <p className="nb-meta nb-ca-compte" data-trop={over ? "" : undefined}>
        {t("count", { count: text.trim().length, max: ABOUT_TEXT_MAX })}
      </p>
      <OrbiRewrite
        kind="about"
        text={text}
        hint={target ? t("aboutOrbiFor", { target }) : t("aboutOrbi")}
        button={t("rewrite")}
        onUse={setText}
      />
    </FormPage>
  );
}

export type ExperienceValues = {
  id: string | null;
  title: string;
  company: string;
  location: string;
  type: "job" | "internship" | "freelance" | "volunteer" | "entrepreneur";
  start: string;
  end: string;
  current: boolean;
} & Omit<CompanyValue, "company"> & {
    /** Réalisations clés, one field each (empty fields are dropped on save). */
    achievements: string[];
  };

const EXPERIENCE_TYPES = ["internship", "job", "freelance", "volunteer", "entrepreneur"] as const;

/** « Modifier l'expérience » / « Nouvelle expérience » (planches Carrière-exp, -exp-new). */
export function ExperienceForm({ values }: { values: ExperienceValues }) {
  const t = useTranslations("phoneCareer.form");
  const [form, setForm] = useState(values);
  const { pending, error, save } = useSave();
  const set = (patch: Partial<ExperienceValues>) => setForm((before) => ({ ...before, ...patch }));
  const editing = values.id !== null;
  const errorOf = (field: string) => (error === field ? t("errors.required") : null);
  return (
    <FormPage
      title={editing ? t("experienceEdit") : t("experienceNew")}
      pending={pending}
      onSave={() =>
        save(
          () => saveCareerExperienceAction({ ...form, id: form.id ?? undefined }),
          editing ? t("experienceSaved") : t("experienceAdded"),
        )
      }
    >
      <Field label={t("job")} error={errorOf("title")}>
        {(id) => (
          <input
            id={id}
            className="nb-ca-in"
            value={form.title}
            onChange={(event) => set({ title: event.target.value })}
            placeholder={t("jobPlaceholder")}
            maxLength={120}
            required
          />
        )}
      </Field>
      <CompanyField
        value={form}
        onChange={set}
        error={error === "company" ? t("errors.company") : null}
      />
      <Field label={t("place")}>
        {(id) => (
          <input
            id={id}
            className="nb-ca-in"
            value={form.location}
            onChange={(event) => set({ location: event.target.value })}
            placeholder={t("placePlaceholder")}
            maxLength={120}
          />
        )}
      </Field>
      <Chips
        label={t("type")}
        value={form.type}
        onChange={(type) => set({ type })}
        options={EXPERIENCE_TYPES.map((value) => ({ value, text: t(`experienceType.${value}`) }))}
      />
      <div className="nb-ca-deux">
        <Field label={t("start")} error={errorOf("start")}>
          {(id) => (
            <input
              id={id}
              type="month"
              className="nb-ca-in"
              value={form.start}
              onChange={(event) => set({ start: event.target.value })}
              required
            />
          )}
        </Field>
        <Field
          label={t("end")}
          error={error === "endBeforeStart" ? t("errors.endBeforeStart") : errorOf("end")}
        >
          {(id) => (
            <input
              id={id}
              type="month"
              className="nb-ca-in"
              value={form.current ? "" : form.end}
              onChange={(event) => set({ end: event.target.value })}
              disabled={form.current}
            />
          )}
        </Field>
      </div>
      <div className="nb-ca-bascule">
        <span id="exp-encore">{t("current")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={form.current}
          aria-labelledby="exp-encore"
          className="nb-switch"
          onClick={() => set({ current: !form.current })}
        >
          <span />
        </button>
      </div>
      <AchievementsField
        points={form.achievements}
        onChange={(achievements) => set({ achievements })}
      />
      <OrbiRewrite
        kind="experience"
        text={achievementsText(form.achievements)}
        title={form.title}
        hint={editing ? t("experienceOrbi") : t("experienceOrbiNew")}
        button={t("improve")}
        onUse={(text) => set({ achievements: achievementsOf(text).slice(0, ACHIEVEMENTS_MAX) })}
      />
      {values.id ? (
        <DeleteButton
          label={t("experienceDelete")}
          question={t("experienceDeleteQuestion")}
          detail={t("experienceDeleteDetail")}
          onConfirm={() => deleteCareerExperienceAction(values.id!)}
        />
      ) : null}
    </FormPage>
  );
}

export type EducationValues = {
  id: string | null;
  degree: string;
  school: string;
  level: "none" | "secondary" | "vocational" | "bachelor" | "master" | "doctorate";
  field: string;
  startYear: string;
  endYear: string;
};

const EDUCATION_LEVELS = [
  "secondary",
  "vocational",
  "bachelor",
  "master",
  "doctorate",
  "none",
] as const;

/** « Modifier la formation » (planche Carrière-formation): an empty end means « en cours ». */
export function EducationForm({ values }: { values: EducationValues }) {
  const t = useTranslations("phoneCareer.form");
  const [form, setForm] = useState(values);
  const { pending, error, save } = useSave();
  const set = (patch: Partial<EducationValues>) => setForm((before) => ({ ...before, ...patch }));
  const editing = values.id !== null;
  const errorOf = (field: string) => (error === field ? t("errors.required") : null);
  return (
    <FormPage
      title={editing ? t("educationEdit") : t("educationNew")}
      pending={pending}
      onSave={() =>
        save(
          () => saveCareerEducationAction({ ...form, id: form.id ?? undefined }),
          editing ? t("educationSaved") : t("educationAdded"),
        )
      }
    >
      <Field label={t("degree")} error={errorOf("degree")}>
        {(id) => (
          <input
            id={id}
            className="nb-ca-in"
            value={form.degree}
            onChange={(event) => set({ degree: event.target.value })}
            placeholder={t("degreePlaceholder")}
            maxLength={160}
            required
          />
        )}
      </Field>
      <Field label={t("school")} error={errorOf("school")}>
        {(id) => (
          <input
            id={id}
            className="nb-ca-in"
            value={form.school}
            onChange={(event) => set({ school: event.target.value })}
            placeholder={t("schoolPlaceholder")}
            maxLength={160}
            required
          />
        )}
      </Field>
      <Chips
        label={t("level")}
        value={form.level}
        onChange={(level) => set({ level })}
        options={EDUCATION_LEVELS.map((value) => ({ value, text: t(`educationLevel.${value}`) }))}
      />
      <div className="nb-ca-deux">
        <Field label={t("start")} error={errorOf("startYear")}>
          {(id) => (
            <input
              id={id}
              className="nb-ca-in"
              inputMode="numeric"
              value={form.startYear}
              onChange={(event) =>
                set({ startYear: event.target.value.replace(/\D/g, "").slice(0, 4) })
              }
              placeholder={t("year")}
            />
          )}
        </Field>
        <Field
          label={t("end")}
          error={error === "endBeforeStart" ? t("errors.endBeforeStart") : errorOf("endYear")}
        >
          {(id) => (
            <input
              id={id}
              className="nb-ca-in"
              inputMode="numeric"
              value={form.endYear}
              onChange={(event) =>
                set({ endYear: event.target.value.replace(/\D/g, "").slice(0, 4) })
              }
              placeholder={t("inProgress")}
            />
          )}
        </Field>
      </div>
      <Field label={t("detail")}>
        {(id) => (
          <input
            id={id}
            className="nb-ca-in"
            value={form.field}
            onChange={(event) => set({ field: event.target.value })}
            placeholder={t("optional")}
            maxLength={120}
          />
        )}
      </Field>
      <div className="nb-ca-ob">
        <div className="nb-ca-ob-h">
          <OrbiDisc size={34} />
          <span>{t("educationOrbi")}</span>
        </div>
      </div>
      {values.id ? (
        <DeleteButton
          label={t("educationDelete")}
          question={t("educationDeleteQuestion")}
          detail={t("educationDeleteDetail")}
          onConfirm={() => deleteCareerEducationAction(values.id!)}
        />
      ) : null}
    </FormPage>
  );
}
