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
import { fixCvCheckAction, renameCvAction, setCvPrimaryAction } from "@/server/actions/cv-flow";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { CvFrame } from "./frame";

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
  steps: ComponentProps<typeof CvFrame>["steps"];
}) {
  const t = useTranslations("phoneCv");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [isPrimary, setPrimary] = useState(primary);
  const [naming, setNaming] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [name, setName] = useState(title);

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
  const readable = checks.find((check) => check.key === "readable")?.ok ?? true;
  const ring = `conic-gradient(var(--nb-lime) ${score.total * 3.6}deg, var(--nb-haute) 0)`;
  return (
    <CvFrame
      title={t("preview.title")}
      sub={t("preview.sub")}
      back={{ href: `/app/career/cv/${cvId}?etape=style`, label: t("back") }}
      steps={steps}
      bottom={
        <a
          href={`/app/career/cv/${cvId}/pdf`}
          download
          className="nb-bouton nb-cv-principal"
          data-plein=""
          data-large=""
          onClick={() => showToast({ message: t("preview.downloading") })}
        >
          {t("preview.pdf")}
        </a>
      }
    >
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
