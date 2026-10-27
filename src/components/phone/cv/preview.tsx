"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ComponentProps } from "react";
import { showToast } from "@/components/motion/toaster";
import type { CvDocumentData } from "@/features/cv/render/model";
import {
  CvPaginationProvider,
  CvPreview,
  usePaginationResult,
} from "@/features/cv/render/CvPreview";
import type { CvStyle } from "@/features/cv/style";
import type { CvTemplate } from "@/features/cv/templates/registry";
import {
  addCvToProfileAction,
  fillCvFromProfileAction,
  fixCvCheckAction,
  previewCvIntoProfileAction,
  renameCvAction,
  setCvPrimaryAction,
} from "@/server/actions/cv-flow";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { CvFrame } from "./frame";

type AddCounts = Extract<
  Awaited<ReturnType<typeof previewCvIntoProfileAction>>,
  { ok: true }
>["counts"];
const ADD_PARTS = [
  "headline",
  "summary",
  "experiences",
  "educations",
  "skills",
  "languages",
] as const;

/** Saves the PDF answered by the server; a refusal (redirect to a page) is an error. */
async function savePdf(cvId: string) {
  const response = await fetch(`/app/career/cv/${cvId}/pdf`, { credentials: "same-origin" });
  if (!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf"))
    throw new Error("export");
  const blob = await response.blob();
  const name =
    /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") ?? "")?.[1] ?? "CV.pdf";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export type PreviewCheck = {
  key: string;
  ok: boolean;
  text: string;
  /** « Corriger »: an action on the server, or the place where the person writes it. */
  fix: { kind: "action" } | { kind: "link"; href: string } | null;
};

/** « 1 page · lisible par les logiciels de recrutement », once the preview is laid out. */
function Pages({ readable }: { readable: boolean }) {
  const t = useTranslations("phoneCv.preview");
  const result = usePaginationResult();
  const pages = result ? t("pages", { count: result.pages }) : null;
  return <small>{[pages, readable ? t("readable") : null].filter(Boolean).join(" · ")}</small>;
}

/**
 * Aperçu et vérification (capture 11): the real CV, Orbi's score out of 100 with what was
 * checked (fixed rules, « Pourquoi ? » says how it is counted, « Corriger » takes what the
 * profile already has), the CV's name, « Utiliser par défaut », Word, Adapter, then the PDF.
 * An empty CV shows an example: it is filled from the profile before it can be downloaded.
 * « Ajouter à mon profil » and « Terminer » end the flow on Carrière (Ephraïm, 27/10).
 */
export function CvPreviewStep({
  cvId,
  title,
  primary,
  data,
  template,
  style,
  score,
  checks,
  why,
  error,
  empty,
  steps,
}: {
  cvId: string;
  title: string;
  primary: boolean;
  data: CvDocumentData;
  template: CvTemplate;
  style: CvStyle;
  score: { total: number; ats: number; impact: number; keywords: number };
  checks: PreviewCheck[];
  why: string[];
  error: string | null;
  /** Nothing written yet: the preview is an example, the PDF is not offered. */
  empty: boolean;
  steps: ComponentProps<typeof CvFrame>["steps"];
}) {
  const t = useTranslations("phoneCv");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [isPrimary, setPrimary] = useState(primary);
  const [naming, setNaming] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [name, setName] = useState(title);
  const [preparing, setPreparing] = useState(false);
  const [adding, setAdding] = useState<{ counts: AddCounts; total: number } | null>(null);

  const fail = (message = t("error")) => showToast({ message, tone: "error" });
  const fix = (check: PreviewCheck) => {
    if (!check.fix) return;
    if (check.fix.kind === "link") return router.push(check.fix.href);
    start(async () => {
      const result = await fixCvCheckAction(cvId, check.key);
      if (result.ok) {
        showToast({ message: t("preview.fixed", { count: result.added }) });
        router.refresh();
      } else fail(result.error === "profile" ? t("preview.fixProfile") : t("error"));
    });
  };
  const download = async () => {
    setPreparing(true);
    try {
      await savePdf(cvId);
      showToast({ message: t("preview.downloaded") });
    } catch {
      fail(t("preview.exportError"));
    } finally {
      setPreparing(false);
    }
  };
  const fill = () =>
    start(async () => {
      const result = await fillCvFromProfileAction(cvId);
      if (result.ok) {
        showToast({ message: t("preview.filled") });
        router.refresh();
      } else fail(result.error === "profile" ? t("preview.fillNothing") : t("error"));
    });
  const askAdd = () =>
    start(async () => {
      const result = await previewCvIntoProfileAction(cvId);
      if (result.ok) setAdding({ counts: result.counts, total: result.total });
      else fail();
    });
  const add = () =>
    start(async () => {
      const result = await addCvToProfileAction(cvId);
      if (!result.ok) return fail();
      setAdding(null);
      showToast({ message: t("preview.added", { count: result.added }) });
      router.refresh();
    });
  const finish = () => {
    showToast({ message: t("preview.saved") });
    router.replace("/app/career/cv?onglet=cv");
  };
  const readable = checks.find((check) => check.key === "readable")?.ok ?? true;
  const ring = `conic-gradient(var(--nb-lime) ${score.total * 3.6}deg, var(--nb-haute) 0)`;
  return (
    <CvFrame
      title={t("preview.title")}
      sub={t("preview.sub")}
      back={{ href: `/app/career/cv/${cvId}?etape=style`, label: t("back") }}
      steps={steps}
      bottom={
        <div className="nb-cv-fin">
          <button
            type="button"
            className="nb-bouton nb-cv-principal"
            data-plein=""
            data-large=""
            disabled={empty || preparing}
            aria-busy={preparing}
            onClick={download}
          >
            {empty ? t("preview.pdfEmpty") : preparing ? t("preview.preparing") : t("preview.pdf")}
          </button>
          <button type="button" className="nb-bouton" data-contour="" onClick={finish}>
            {t("preview.finish")}
          </button>
        </div>
      }
    >
      {empty ? (
        <div className="nb-cv-vide" role="status">
          <p>{t("preview.empty")}</p>
          <div className="nb-cv-deux">
            <button
              type="button"
              className="nb-bouton"
              data-plein=""
              disabled={pending}
              onClick={fill}
            >
              {t("preview.fillProfile")}
            </button>
            <Link
              href={`/app/career/cv/${cvId}?etape=contenu`}
              className="nb-bouton"
              data-contour=""
            >
              {t("preview.fillWrite")}
            </Link>
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="nb-cv-erreur" role="alert">
          {error}
        </p>
      ) : null}
      <CvPaginationProvider>
        <div className="nb-cv-bilan">
          <div className="nb-cv-vignette" aria-hidden>
            <CvPreview data={data} template={template} style={style} />
          </div>
          <div className="nb-cv-note-orbi">
            <span
              className="nb-cv-anneau"
              style={{ background: ring }}
              role="img"
              aria-label={t("preview.scoreLabel", { score: score.total })}
            >
              <span>
                <b>{score.total}</b>
                <small>{t("preview.outOf")}</small>
              </span>
            </span>
            <b>{t("preview.checked")}</b>
            <Pages readable={readable} />
          </div>
        </div>
      </CvPaginationProvider>

      <div className="nb-cv-h" data-action="">
        <h2>{t("preview.checks")}</h2>
        <button type="button" onClick={() => setExplaining(true)}>
          {t("preview.why")}
        </button>
      </div>
      <ul className="nb-cv-verifs">
        {checks.map((check, index) => (
          <li
            key={check.key}
            data-ok={check.ok ? "" : undefined}
            style={{ animationDelay: `${0.07 * index}s` }}
          >
            <i aria-hidden>{check.ok ? <PhoneIcon name="coche" size={16} stroke={2.6} /> : "!"}</i>
            <span>
              <span className="sr-only">{check.ok ? t("preview.ok") : t("preview.todo")}</span>
              {check.text}
            </span>
            {!check.ok && check.fix ? (
              <button type="button" onClick={() => fix(check)} disabled={pending}>
                {t("preview.fix")}
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="nb-cv-reglages">
        <button type="button" className="nb-cv-reglage" onClick={() => setNaming(true)}>
          <span>{t("preview.name")}</span>
          <b>{t("preview.nameValue", { title })}</b>
        </button>
        <div className="nb-cv-reglage">
          <span id="cv-apercu-defaut">{t("preview.primary")}</span>
          <button
            type="button"
            role="switch"
            aria-checked={isPrimary}
            aria-labelledby="cv-apercu-defaut"
            className="nb-switch"
            disabled={pending}
            onClick={() => {
              const next = !isPrimary;
              setPrimary(next);
              start(async () => {
                const result = await setCvPrimaryAction(cvId, next);
                if (!result.ok) {
                  setPrimary(!next);
                  fail(result.error === "only" ? t("preview.primaryOnly") : t("error"));
                }
              });
            }}
          >
            <span />
          </button>
        </div>
      </div>
      {empty ? null : (
        <button
          type="button"
          className="nb-bouton nb-cv-ajout-profil"
          data-contour=""
          data-large=""
          disabled={pending}
          onClick={askAdd}
        >
          {t("preview.addProfile")}
        </button>
      )}
      <div className="nb-cv-deux">
        <a href={`/app/career/cv/${cvId}/word`} download className="nb-bouton" data-contour="">
          {t("preview.word")}
        </a>
        <Link href={`/app/career/cv/${cvId}?adapter=`} className="nb-bouton" data-contour="">
          {t("preview.adapt")}
        </Link>
      </div>

      <PhoneSheet
        open={naming}
        onClose={() => setNaming(false)}
        label={t("preview.name")}
        closeLabel={t("close")}
      >
        <form
          className="nb-cv-feuille-f"
          onSubmit={(event) => {
            event.preventDefault();
            start(async () => {
              const result = await renameCvAction(cvId, name);
              if (!result.ok) return fail();
              setNaming(false);
              router.refresh();
            });
          }}
        >
          <label htmlFor="cv-apercu-nom" className="nb-cv-feuille-t">
            {t("preview.name")}
          </label>
          <input
            id="cv-apercu-nom"
            value={name}
            maxLength={80}
            required
            onChange={(event) => setName(event.target.value)}
          />
          <button
            type="submit"
            className="nb-bouton"
            data-plein=""
            data-large=""
            disabled={pending}
          >
            {t("save")}
          </button>
        </form>
      </PhoneSheet>

      <p className="nb-cv-note" data-centre="">
        {t("preview.autosave")}
      </p>

      <PhoneSheet
        open={adding !== null}
        onClose={() => setAdding(null)}
        label={t("preview.addTitle")}
        closeLabel={t("close")}
      >
        <div className="nb-cv-feuille-f">
          <b className="nb-cv-feuille-t">{t("preview.addTitle")}</b>
          <p className="nb-cv-aide">{t("preview.addSub")}</p>
          {adding && adding.total > 0 ? (
            <ul className="nb-cv-parts">
              {ADD_PARTS.filter((part) => adding.counts[part] > 0).map((part) => (
                <li key={part}>
                  <span>
                    {part === "headline" || part === "summary"
                      ? t(`preview.addPart.${part}`)
                      : t(`preview.addPart.${part}`, { count: adding.counts[part] })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="nb-cv-note">{t("preview.addNothing")}</p>
          )}
          {adding && adding.total > 0 ? (
            <button
              type="button"
              className="nb-bouton"
              data-plein=""
              data-large=""
              disabled={pending}
              onClick={add}
            >
              {t("preview.addConfirm")}
            </button>
          ) : null}
        </div>
      </PhoneSheet>

      <PhoneSheet
        open={explaining}
        onClose={() => setExplaining(false)}
        label={t("preview.whyTitle")}
        closeLabel={t("close")}
      >
        <div className="nb-cv-feuille-f">
          <b className="nb-cv-feuille-t">{t("preview.whyTitle")}</b>
          {why.map((line) => (
            <p key={line} className="nb-cv-aide">
              {line}
            </p>
          ))}
          <ul className="nb-cv-parts">
            {(["ats", "impact", "keywords"] as const).map((part) => (
              <li key={part}>
                <span>{t(`preview.part.${part}`)}</span>
                <b>{t("preview.partValue", { value: score[part] })}</b>
              </li>
            ))}
          </ul>
          <p className="nb-cv-note">{t("preview.whyNote")}</p>
        </div>
      </PhoneSheet>
    </CvFrame>
  );
}
