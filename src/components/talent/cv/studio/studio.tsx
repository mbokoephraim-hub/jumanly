import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Logo, toneOf } from "@/components/talent/art";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { CenteredDialog, DialogButton } from "@/components/talent/web/dialog";
import { previewData } from "@/features/cv/document";
import { templateKey } from "@/features/cv/examples";
import { cvFileName } from "@/features/cv/export/pdf";
import { splitName } from "@/features/cv/render/build";
import { CvPaginationProvider } from "@/features/cv/render/CvPreview";
import { cvColors, cvFonts } from "@/features/cv/render/palette";
import { cvSourceOf } from "@/features/cv/source";
import { blockLayout, cvDensities, cvTitleLanguages, MAX_PAGES } from "@/features/cv/style";
import { templateImage } from "@/features/cv/templates/images";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { tailorCvAction, tailorCvTextAction } from "@/server/actions/career-documents";
import {
  changeCvSection,
  decideAllChangesAction,
  decideChangeAction,
  improveSummaryAction,
  refreshCvFromProfile,
  updateCvStyleAction,
  updateCvSummary,
} from "@/server/actions/cv";
import { aiFeatures, AI_CREDITS_KEY } from "@/server/ai";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { usage } from "@/server/entitlements";
import {
  aiState,
  fold,
  offerGap,
  TAILOR_GATE,
  TAILOR_TEXT_MAX,
  tailorOffers,
  tailorTextKinds,
} from "@/server/services/career-documents";
import {
  canUseTemplate,
  cvSectionIds,
  MAX_CVS,
  parseCv,
  type CvSectionId,
} from "@/server/services/cv";
import { pendingSuggestions } from "@/server/services/cv-coach";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";
import { CvOptions } from "../cv-options";
import {
  marked,
  profileParts,
  sectionItems,
  sections,
  sentences,
  type Section,
} from "../mobile-editor";
import { cvNotices, type CvQuery } from "../notices";
import { OrbiLimit, orbiLimitCode } from "../orbi-limit";
import { PdfButton } from "../pdf-button";
import { SectionOrder } from "../section-order";
import { TailorOffer, TailorText } from "../tailor";
import { AskOrbi } from "./ask-orbi";
import { OrbiCvCard } from "./orbi-card";
import { CvPage, ExportCard, PageThumbs, ZoomBar } from "./preview";
import { StudioFrame } from "./studio-frame";

/** Blocks of the page outlined when Orbi changes them (`CvPage` `highlight`). */
const highlightOf = { summary: "summary", headline: "headline", bullet: "experience" } as const;

/** Id of the A4 page of the studio: the zoom, the thumbnails and the export read it. */
const PAGE = "sc-apercu";

type Panel = "orbi" | "changes" | "texte" | "offre" | "resume" | "partie";

/**
 * The CV studio on a tablet and a computer (planche studio-cv § 3 to § 7), from 768 px: three
 * panels. « Contenu »: the sections to reorder and hide on the left, the A4 page in the middle,
 * Orbi on the right (its actions, then « Améliorer », « Adapter à une offre », « Adapter à un
 * texte », a section or the summary). « Mise en forme » (`?vue=style`): template, accent colour,
 * font, density, photo and titles on the left; pages and export on the right. Every setting is
 * saved at once; Orbi proposes, nothing changes without « Accepter ».
 */
export async function CvStudio({ id, query }: { id: string; query: CvQuery }) {
  const user = await requireUser(`/app/career/cv/${id}`);
  const cv = await db.document.findFirst({
    where: { id, kind: "cv", profile: { userId: user.id } },
  });
  if (!cv) notFound();
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const content = parseCv(cv.content);
  const owner = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { image: true },
  });
  const source = cvSourceOf(cv, owner.image);
  const { template, style } = source;
  const subject = { type: "user" as const, id: user.id };
  const [included, plans, changes, cvCount, preview, credits] = await Promise.all([
    canUseTemplate(db, subject, template),
    listPublicPlans(db),
    pendingSuggestions(db, user.id, cv.id),
    db.document.count({ where: { profileId: cv.profileId, kind: "cv" } }),
    previewData(source),
    usage(db, subject, AI_CREDITS_KEY),
  ]);
  const left = credits.limit < 0 ? null : Math.max(0, credits.limit - credits.used);
  const editor = `/app/career/cv/${cv.id}`;
  const templateName = d(`career.cv.template.name.${templateKey(template.id)}`);
  const { firstName, lastName } = splitName(content.info.name.trim());
  const fileName = cvFileName([firstName, lastName].join(" "), cvCount > 1 ? cv.title : undefined);
  const close = t("docs.web.studio.close");
  const pdfLabels = {
    preparing: t("docs.pdf.preparing"),
    done: t("docs.pdf.done"),
    error: t("docs.pdf.error"),
  };
  const notices = await cvNotices({ query, title: cv.title, templateName, included, plans });
  const aiCode = orbiLimitCode(query.orbi) ?? orbiLimitCode(query.adaptation);
  const tailorPlan = talentPlanFor(plans, TAILOR_GATE.key);

  const tab = query.vue === "style" ? "style" : "content";
  const adapter = typeof query.adapter === "string" ? query.adapter.slice(0, 60) : undefined;
  const part = sections.find((section) => section === query.partie);
  const panel: Panel =
    tab === "style"
      ? "orbi"
      : query.vue === "ameliorer" && changes.length > 0
        ? "changes"
        : adapter === "texte"
          ? "texte"
          : adapter
            ? "offre"
            : query.vue === "resume"
              ? "resume"
              : part
                ? "partie"
                : "orbi";
  const isCopy =
    Boolean(cv.adaptedForJobId) || changes.some((change) => change.payload.kind === "tailor");
  const highlight =
    panel === "changes"
      ? [...new Set(changes.map((change) => highlightOf[change.payload.target.section]))]
      : [];

  // ─── Head: back, name and saving, Contenu · Mise en forme, Orbi, Télécharger ─────────────────
  const head = (
    <header className="t-sc-h">
      <Link href="/app/career/cv" className="t-bi t-press" aria-label={t("docs.web.studio.back")}>
        <TalentIcon name="retour" size="s" />
      </Link>
      <div className="t-sc-ht">
        <h1>
          {cv.title}
          {isCopy && <span className="t-sc-copie">{t("docs.web.studio.copyBadge")}</span>}
        </h1>
        <p>
          <i aria-hidden />
          {t("docs.web.studio.saved", { when: format.relativeTime(cv.updatedAt, new Date()) })}
        </p>
      </div>
      <DialogButton target="sc-options" className="t-bi t-press" label={t("docs.editor.more")}>
        <TalentIcon name="plus-options" size="s" />
      </DialogButton>
      <nav aria-label={t("docs.web.studio.tabs")} className="t-seg t-sc-tabs">
        <Link
          href={editor}
          aria-current={tab === "content" ? "page" : undefined}
          className="t-press"
        >
          {t("docs.web.studio.tab.content")}
        </Link>
        <Link
          href={`${editor}?vue=style`}
          aria-current={tab === "style" ? "page" : undefined}
          className="t-press"
        >
          {t("docs.web.studio.tab.style")}
        </Link>
      </nav>
      <Link
        href={editor}
        className="t-bt t-sec t-m t-press t-sc-orbt"
        aria-current={tab === "content" && panel === "orbi" ? "true" : undefined}
      >
        <OrbiMark size={22} />
        {t("docs.web.studio.orbi")}
      </Link>
      <PdfButton
        documentId={cv.id}
        fileName={fileName}
        labels={pdfLabels}
        className="t-bt t-p t-m t-press"
      >
        <TalentIcon name="telecharger" size="s" />
        {t("docs.web.studio.download")}
      </PdfButton>
    </header>
  );

  // ─── Left: « Mise en forme » ─────────────────────────────────────────────────────────────
  const setting = (name: string, children: ReactNode, className: string, label?: string) => (
    <form action={updateCvStyleAction} className={className} aria-label={label}>
      <input type="hidden" name="id" value={cv.id} />
      <input type="hidden" name="setting" value={name} />
      {children}
    </form>
  );
  const swatches = (ats: boolean) =>
    setting(
      "accent",
      cvColors
        .filter((color) => color.ats === ats)
        .map((color) => {
          const name = d(`cv.colors.${color.code}`);
          return (
            <button
              key={color.code}
              type="submit"
              name="value"
              value={color.code}
              aria-pressed={color.code === style.accent}
              aria-label={t("docs.web.studio.colorName", { name })}
              title={name}
              className="t-press"
            >
              <i style={{ background: color.hex }} />
            </button>
          );
        }),
      "t-sc-sw8",
      ats ? t("career.cv.style.color.recommended") : t("career.cv.style.color.others"),
    );
  const styleLeft = (
    <section aria-labelledby="sc-mef-t" className="t-verre t-sc-pnl">
      <h2 id="sc-mef-t" className="t-sc-h4">
        {t("career.cv.template.text")}
        <Link href={`/app/career/cv/modeles?cv=${cv.id}`}>{t("docs.web.studio.change")}</Link>
      </h2>
      <div className="t-sc-mdl">
        <Image src={templateImage(template)} alt="" width={120} height={170} />
        <div>
          <b>{templateName}</b>
          <span>
            {t("docs.web.studio.modelLine", {
              access: included
                ? t("docs.templates.included")
                : talentPlanFor(
                    plans,
                    "career.cv.templates.access",
                    template.access === "pro" ? ["pro"] : ["starter", "pro"],
                  ),
              ats: d(`career.cv.template.ats.${template.ats}`),
            })}
          </span>
        </div>
      </div>
      <h2 className="t-sc-h4">{t("career.cv.template.color")}</h2>
      <p className="t-sc-sub">{t("career.cv.style.color.recommended")}</p>
      {swatches(true)}
      <p className="t-sc-sub">{t("career.cv.style.color.others")}</p>
      {swatches(false)}
      <h2 className="t-sc-h4">{t("career.cv.template.font")}</h2>
      {setting(
        "font",
        cvFonts.map((font) => (
          <button
            key={font.code}
            type="submit"
            name="value"
            value={font.code}
            aria-pressed={font.code === style.font}
            className="t-press"
            style={{ fontFamily: `"${font.family}", ${font.serif ? "serif" : "sans-serif"}` }}
          >
            {font.label}
            {font.code === "sora" && <em>{t("career.cv.style.font.recommended")}</em>}
          </button>
        )),
        "t-sc-pol",
        t("career.cv.template.font"),
      )}
      <h2 className="t-sc-h4">{t("career.cv.template.density.text")}</h2>
      {setting(
        "density",
        cvDensities.map((density) => (
          <button
            key={density}
            type="submit"
            name="value"
            value={density}
            aria-pressed={density === style.density}
            className="t-press"
          >
            {d(`career.cv.template.density.${density}`)}
          </button>
        )),
        "t-seg t-sc-s3",
        t("career.cv.template.density.text"),
      )}
      {template.photo ? (
        setting(
          "showPhoto",
          <>
            <span id="sc-photo">{t("docs.web.studio.photo")}</span>
            <button
              type="submit"
              name="value"
              value={style.showPhoto ? "off" : "on"}
              role="switch"
              aria-checked={style.showPhoto}
              aria-labelledby="sc-photo"
              className="t-press"
            >
              <span aria-hidden className={cx("t-sw", style.showPhoto && "t-on")} />
            </button>
          </>,
          "t-sc-row",
        )
      ) : (
        <p className="t-sc-row">
          <span>{t("docs.web.studio.photo")}</span>
          <small>{t("career.cv.style.photo.unsupported")}</small>
        </p>
      )}
      <div className="t-sc-row">
        <span id="sc-titres">{t("docs.web.studio.titles")}</span>
        {setting(
          "titlesLanguage",
          cvTitleLanguages.map((language) => (
            <button
              key={language}
              type="submit"
              name="value"
              value={language}
              aria-pressed={language === style.titlesLanguage}
              aria-label={d(`career.cv.style.titlesLanguage.${language}`)}
              className="t-press"
            >
              {language === "fr" ? t("docs.web.studio.titlesFr") : t("docs.web.studio.titlesEn")}
            </button>
          )),
          "t-seg t-sc-s2",
          t("career.cv.style.titlesLanguage.text"),
        )}
      </div>
    </section>
  );

  // ─── Right of « Mise en forme »: pages and export ─────────────────────────────────────────
  const present = preview.data.blocks
    .map((block) => block.type as string)
    .filter((type): type is CvSectionId => (cvSectionIds as readonly string[]).includes(type));
  const breaks = new Set(style.pageBreaks ?? []);
  const styleRight = (
    <>
      <section aria-labelledby="sc-pages-t" className="t-verre t-sc-pnl">
        <h2 id="sc-pages-t" className="t-sc-h4">
          {t("career.cv.pages.title")}
          <DialogButton target="sc-sauts" className="t-sc-lien">
            {t("career.cv.pages.add")}
          </DialogButton>
        </h2>
        <PageThumbs target={PAGE} add={t("career.cv.pages.add")} />
        <div className="t-sc-lk">
          <DialogButton target="sc-sauts" className="t-press">
            <TalentIcon name="plus" size="xs" />
            {t("career.cv.pages.breakHere")}
          </DialogButton>
          {setting(
            "fitOne",
            <button type="submit" className="t-press">
              <TalentIcon name="valider" size="xs" />
              {t("career.cv.pages.fitOne")}
            </button>,
            "contents",
          )}
        </div>
        <p className="t-sc-sub">{t("docs.web.studio.pagesMax", { max: MAX_PAGES })}</p>
      </section>
      <section aria-labelledby="sc-export-t" className="t-verre t-sc-pnl">
        <h2 id="sc-export-t" className="t-sc-h4">
          {t("career.cv.export.title")}
        </h2>
        <ExportCard
          documentId={cv.id}
          fileName={fileName}
          labels={{
            formats: t("docs.web.studio.formats"),
            pdf: t("docs.web.studio.pdf"),
            pdfHint: t("docs.web.studio.pdfHint"),
            word: t("docs.web.studio.word"),
            wordHint: t("docs.web.studio.wordHint"),
            file: {
              one: t("docs.web.studio.file", { name: "{name}", count: 1 }).replace("1", "#"),
              other: t("docs.web.studio.file", { name: "{name}", count: 2 }).replace("2", "#"),
            },
            fileWord: t("docs.web.studio.fileWord", { name: "{name}" }),
            wordNote: t("career.cv.export.docxNote"),
            download: t("docs.web.studio.download"),
            preparing: t("docs.pdf.preparing"),
            done: t("docs.pdf.done"),
            wordDone: t("docs.web.studio.wordDone"),
            error: t("docs.pdf.error"),
          }}
        />
        <p className="t-sc-neutre">
          <TalentIcon name="cadenas" size="xs" />
          {t("docs.web.studio.neutral")}
        </p>
      </section>
      <CenteredDialog
        id="sc-sauts"
        title={t("career.cv.pages.breakTarget")}
        subtitle={t("docs.web.studio.breaksLead")}
        closeLabel={close}
      >
        <div className="t-verre t-liste t-lignes">
          {present.map((section) => {
            const on = breaks.has(section);
            const name = t(`docs.section.${section}`);
            return (
              <form key={section} action={updateCvStyleAction} className="t-li">
                <input type="hidden" name="id" value={cv.id} />
                <input type="hidden" name="setting" value="break" />
                <span className="t-t" id={`sc-saut-${section}`}>
                  <b>{t("career.cv.pages.breakLabel", { sectionName: name })}</b>
                  {on && <span>{t("career.cv.pages.removeBreak")}</span>}
                </span>
                <button
                  type="submit"
                  name="value"
                  value={section}
                  role="switch"
                  aria-checked={on}
                  aria-labelledby={`sc-saut-${section}`}
                  className="t-press"
                >
                  <span aria-hidden className={cx("t-sw", on && "t-on")} />
                </button>
              </form>
            );
          })}
        </div>
      </CenteredDialog>
    </>
  );

  // ─── Left of « Contenu »: the sections ────────────────────────────────────────────────────
  const order = blockLayout(template, style, cvSectionIds).map(
    (block) => block.type as CvSectionId,
  );
  const hidden = new Set(content.sections.filter((s) => !s.visible).map((s) => s.id));
  const line: Record<CvSectionId, string> = {
    summary: content.summary.trim()
      ? t("docs.editor.summaryLine", { count: sentences(content.summary) })
      : t("docs.editor.toWrite"),
    experience: t("docs.editor.count", { count: content.experiences.length }),
    education: t("docs.editor.count", { count: content.education.length }),
    skills: t("docs.editor.skillsLine", { count: content.skills.length }),
    languages: t("docs.editor.count", { count: content.languages.length }),
  };
  const current = panel === "resume" ? "summary" : panel === "partie" ? part : undefined;
  const rows = order.map((section) => {
    const name = t(`docs.section.${section}`);
    const visible = !hidden.has(section);
    const sub = [line[section], visible ? null : t("docs.editor.hiddenShort")]
      .filter(Boolean)
      .join(" · ");
    return {
      id: section,
      name,
      content: (
        <>
          <span className="t-t">
            <Link
              href={section === "summary" ? `${editor}?vue=resume` : `${editor}?partie=${section}`}
              aria-current={current === section ? "true" : undefined}
              className="t-lien"
            >
              <b>{name}</b>
            </Link>
            <span>{sub}</span>
          </span>
          {section === "summary" ? (
            <form action={improveSummaryAction}>
              <input type="hidden" name="id" value={cv.id} />
              <button type="submit" className="t-orb-b t-sc-orb-b t-press">
                <OrbiMark size={16} />
                {t("docs.editor.improve")}
              </button>
            </form>
          ) : (
            <form action={changeCvSection}>
              <input type="hidden" name="id" value={cv.id} />
              <input type="hidden" name="section" value={section} />
              <input type="hidden" name="move" value="toggle" />
              <button
                type="submit"
                role="switch"
                aria-checked={visible}
                aria-label={t("docs.web.studio.show", { section: name })}
                className="t-press"
              >
                <span aria-hidden className={cx("t-sw", visible && "t-on")} />
              </button>
            </form>
          )}
        </>
      ),
    };
  });
  const contentLeft = (
    <section aria-labelledby="sc-sections-t" className="t-verre t-sc-pnl">
      <h2 id="sc-sections-t" className="t-sc-h4">
        {t("docs.web.studio.sections")}
      </h2>
      <p className="t-sc-sub t-sc-sub-h">{t("docs.web.studio.sectionsHint")}</p>
      <SectionOrder
        documentId={cv.id}
        rows={rows}
        className="t-sc-secs"
        labels={{
          grip: t("docs.editor.grip", { section: "{section}" }),
          moved: t("docs.editor.moved", { section: "{section}" }),
          error: t("docs.editor.error"),
        }}
      />
    </section>
  );

  // ─── Right of « Contenu »: Orbi's panels ──────────────────────────────────────────────────
  const panelHead = (title: string, sub?: string, orbi = true) => (
    <div className="t-sc-opt">
      {orbi && <OrbiMark size={40} />}
      <div className="t-t">
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      <Link href={editor} className="t-bi t-press" aria-label={close}>
        <TalentIcon name="fermer" size="s" />
      </Link>
    </div>
  );
  const ask = (
    <AskOrbi labels={{ placeholder: t("docs.web.orbi.ask"), send: t("docs.web.orbi.send") }} />
  );
  let right: ReactNode;
  let dialogs: ReactNode = null;

  if (panel === "changes") {
    const [change, ...rest] = changes as [(typeof changes)[number], ...typeof changes];
    const { payload } = change;
    const editing = query.modifier === "1";
    const section = payload.target.section;
    const words = [...content.skills.map((skill) => skill.name), ...(payload.focus ?? [])];
    const focus = (payload.focus ?? []).filter((word) =>
      fold(payload.after ?? "").includes(fold(word)),
    );
    const short = (text: string) => (text.length > 70 ? `${text.slice(0, 68).trimEnd()}…` : text);
    right = (
      <section aria-labelledby="sc-op-t" className="t-sc-op">
        <div className="t-sc-opt">
          <OrbiMark size={40} />
          <div className="t-t">
            <h2 id="sc-op-t">
              {isCopy ? t("docs.web.change.copyTitle") : t("docs.web.orbi.improve")}
            </h2>
            <p>
              {isCopy
                ? t("docs.web.change.toCheck", { count: changes.length })
                : t("docs.web.change.improveSub", { count: changes.length })}
            </p>
          </div>
          <Link href={editor} className="t-bi t-press" aria-label={close}>
            <TalentIcon name="fermer" size="s" />
          </Link>
        </div>
        <p className="t-ck-t">{d(`docs.web.change.section.${section}`)}</p>
        <div className="t-avap t-av-a t-sc-avap">
          <h3>{t("docs.change.before")}</h3>
          <p>{payload.before || t("docs.change.emptyBefore")}</p>
        </div>
        {editing ? (
          <form id="sc-avap-form" action={decideChangeAction} className="t-avap t-ap t-sc-avap">
            <input type="hidden" name="id" value={cv.id} />
            <input type="hidden" name="suggestion" value={change.id} />
            <input type="hidden" name="decision" value="applied" />
            <label htmlFor="sc-avap-texte">{t("docs.change.yours")}</label>
            <textarea
              id="sc-avap-texte"
              name="text"
              rows={6}
              maxLength={section === "summary" ? 1000 : 600}
              defaultValue={payload.after ?? ""}
              required
            />
          </form>
        ) : (
          <div className="t-avap t-ap t-sc-avap">
            <h3>{t("docs.change.after")}</h3>
            <p>{marked(payload.after ?? "", words)}</p>
          </div>
        )}
        <DialogButton target="sc-pourquoi" className="t-pq t-press">
          <TalentIcon name="pourquoi" size="xs" />
          {t("docs.change.why")}
        </DialogButton>
        <div className="t-sc-acts3">
          {editing ? (
            <>
              <Link href={`${editor}?vue=ameliorer`} className="t-bt t-sec t-press">
                {t("docs.change.cancel")}
              </Link>
              <button type="submit" form="sc-avap-form" className="t-bt t-p t-press">
                <TalentIcon name="valider" size="s" />
                {t("docs.change.save")}
              </button>
            </>
          ) : (
            <>
              <form action={decideChangeAction} className="contents">
                <input type="hidden" name="id" value={cv.id} />
                <input type="hidden" name="suggestion" value={change.id} />
                <button
                  type="submit"
                  name="decision"
                  value="ignored"
                  className="t-bt t-sec t-press"
                >
                  {t("docs.change.refuse")}
                </button>
              </form>
              <Link href={`${editor}?vue=ameliorer&modifier=1`} className="t-bt t-sec t-press">
                {t("docs.change.edit")}
              </Link>
              <form action={decideChangeAction} className="contents">
                <input type="hidden" name="id" value={cv.id} />
                <input type="hidden" name="suggestion" value={change.id} />
                <button type="submit" name="decision" value="applied" className="t-bt t-p t-press">
                  <TalentIcon name="valider" size="s" />
                  {t("docs.change.accept")}
                </button>
              </form>
            </>
          )}
        </div>
        {rest.length > 0 && (
          <>
            <p className="t-ck-t">{t("docs.web.change.others", { count: rest.length })}</p>
            <ul className="t-ecart t-sc-ecart">
              {rest.map((other) => (
                <li key={other.id} className="t-l t-ko">
                  <TalentIcon name="plus" size="s" />
                  {t("docs.web.change.line", {
                    section: d(`docs.web.change.section.${other.payload.target.section}`),
                    text: short(other.payload.after ?? ""),
                  })}
                </li>
              ))}
            </ul>
          </>
        )}
        {isCopy && (
          <p className="t-gar">
            <TalentIcon name="document" size="s" />
            {t("docs.web.change.copyNote", { title: cv.title })}
          </p>
        )}
        {changes.length > 1 && !editing && (
          <div className="t-sc-acts3 t-sc-tout">
            <form action={decideAllChangesAction} className="contents">
              <input type="hidden" name="id" value={cv.id} />
              <button type="submit" name="decision" value="ignored" className="t-bt t-sec t-press">
                {t("docs.web.change.refuseAll")}
              </button>
            </form>
            <form action={decideAllChangesAction} className="contents">
              <input type="hidden" name="id" value={cv.id} />
              <button type="submit" name="decision" value="applied" className="t-bt t-p t-press">
                <TalentIcon name="valider" size="s" />
                {t("docs.web.change.acceptAll")}
              </button>
            </form>
          </div>
        )}
        {ask}
      </section>
    );
    dialogs = (
      <CenteredDialog id="sc-pourquoi" title={t("docs.change.why")} closeLabel={close}>
        <ul className="t-verre t-ecart">
          <li className="t-l t-ok">
            <TalentIcon name="valider" size="s" />
            {t("docs.change.whyMarked")}
          </li>
          {focus.length > 0 && (
            <li className="t-l t-ok">
              <TalentIcon name="valider" size="s" />
              {t("docs.change.whyFocus", { skills: focus.join(", ") })}
            </li>
          )}
          <li className="t-l t-ok">
            <TalentIcon name="valider" size="s" />
            {t("docs.change.whyNothing")}
          </li>
          <li className="t-l t-ok">
            <TalentIcon name="valider" size="s" />
            {t("docs.change.whyRefuse")}
          </li>
        </ul>
        <p className="t-gar">
          <TalentIcon name="cadenas" size="s" />
          {left === null ? t("docs.change.note") : t("docs.change.noteCredits", { left })}
        </p>
      </CenteredDialog>
    );
  } else if (panel === "offre" || panel === "texte") {
    const adaptFor = adapter === "offre" ? undefined : adapter;
    const [tailor, offers] = await Promise.all([
      aiState(db, user.id, "cv_tailor", TAILOR_GATE),
      panel === "offre" ? tailorOffers(db, user.id, adaptFor) : Promise.resolve([]),
    ]);
    const blocked = tailor.state !== "ready";
    const limit = blocked ? (
      <OrbiLimit code={tailor.state as "consent"} plan={tailorPlan} />
    ) : aiCode ? (
      <OrbiLimit code={aiCode} plan={tailorPlan} />
    ) : null;
    const cost =
      left === null
        ? t("docs.web.tailor.costOnly", { count: aiFeatures.cv_tailor.credits })
        : t("docs.web.tailor.cost", { count: aiFeatures.cv_tailor.credits, left });
    if (panel === "offre") {
      const tailorRows = offers.map((offer) => {
        const gap = offerGap(content, offer.skills);
        const lines = [
          ...(gap.listed.length > 0
            ? [
                {
                  tone: "ok" as const,
                  text: t("docs.tailor.listed", { skills: gap.listed.join(", ") }),
                },
              ]
            : []),
          ...gap.written.map((skill) => ({
            tone: "ko" as const,
            text: t("docs.tailor.written", { skill }),
          })),
          ...gap.absent.map((skill) => ({
            tone: "ko" as const,
            text: t("docs.tailor.absent", { skill }),
          })),
        ];
        return {
          id: offer.id,
          lines: lines.slice(0, 4),
          copyNote: t("docs.tailor.copyNote", {
            name: t("career.cv.tailor.name", { jobTitle: offer.title }),
          }),
          card: (
            <span className="t-haut">
              <Logo name={offer.company} src={offer.logo} tone={toneOf(offer.company)} />
              <span className="t-t">
                <b>{offer.title}</b>
                <span>{[offer.company, offer.city].filter(Boolean).join(" · ")}</span>
              </span>
            </span>
          ),
        };
      });
      right = (
        <section aria-labelledby="sc-op-t" className="t-sc-op">
          {panelHead(t("docs.tailor.offerTitle"), t("docs.web.tailor.offerSub"))}
          {limit}
          {blocked ? null : tailorRows.length === 0 ? (
            <p className="t-sc-sub">{t("docs.tailor.noOffers")}</p>
          ) : (
            <form action={tailorCvAction} className="t-flux t-sc-form">
              <input type="hidden" name="cvId" value={cv.id} />
              <input type="hidden" name="retour" value="offre" />
              <p className="t-ck-t" id="sc-offre-l">
                {t("docs.web.tailor.choose")}
              </p>
              <TailorOffer
                offers={tailorRows}
                legend={t("docs.tailor.offerLegend")}
                changes={t("docs.web.tailor.changes")}
              >
                <button type="submit" className="t-bt t-p t-press">
                  <OrbiMark size={20} />
                  {t("docs.tailor.create")}
                </button>
                <p className="t-sc-sub t-sc-centre">{cost}</p>
              </TailorOffer>
            </form>
          )}
          {!blocked && (
            <Link href={`${editor}?adapter=texte`} className="t-lien-m t-press">
              <TalentIcon name="document" size="s" />
              {t("docs.tailor.toText")}
            </Link>
          )}
          {ask}
        </section>
      );
    } else {
      right = (
        <section aria-labelledby="sc-op-t" className="t-sc-op">
          {panelHead(t("docs.tailor.textTitle"), t("docs.web.tailor.textSub"))}
          {limit}
          {!blocked && (
            <form action={tailorCvTextAction} className="t-flux t-sc-form">
              <input type="hidden" name="cvId" value={cv.id} />
              <input type="hidden" name="retour" value="texte" />
              <TailorText
                cvId={cv.id}
                idPrefix="sc-"
                headings
                max={TAILOR_TEXT_MAX}
                kinds={tailorTextKinds.map((kind) => ({
                  value: kind,
                  label: t(`docs.web.tailor.kind.${kind}`),
                  placeholder: t(`docs.tailor.placeholder.${kind}`),
                }))}
                labels={{
                  kinds: t("docs.web.tailor.source"),
                  text: t("docs.tailor.textLabel"),
                  count: t("docs.tailor.counter", {
                    count: "{count}",
                    max: TAILOR_TEXT_MAX.toLocaleString("fr-FR"),
                  }),
                  present: t("docs.web.tailor.found"),
                  missing: t("docs.tailor.missing"),
                }}
              />
              <p className="t-gar">
                <TalentIcon name="cadenas" size="s" />
                {t("docs.tailor.textNote")}
              </p>
              <button type="submit" className="t-bt t-p t-press">
                <OrbiMark size={20} />
                {t("docs.tailor.create")}
              </button>
              <p className="t-sc-sub t-sc-centre">{cost}</p>
            </form>
          )}
          {ask}
        </section>
      );
    }
  } else if (panel === "resume") {
    right = (
      <section aria-labelledby="sc-op-t" className="t-sc-op">
        <div className="t-sc-opt">
          <div className="t-t">
            <h2 id="sc-op-t">{t("docs.section.summary")}</h2>
          </div>
          <Link href={editor} className="t-bi t-press" aria-label={close}>
            <TalentIcon name="fermer" size="s" />
          </Link>
        </div>
        {aiCode && <OrbiLimit code={aiCode} />}
        <form id="sc-resume-form" action={updateCvSummary} className="t-flux">
          <input type="hidden" name="id" value={cv.id} />
          <div className="t-ta">
            <label htmlFor="sc-resume-texte" className="sr-only">
              {t("docs.section.summary")}
            </label>
            <textarea
              id="sc-resume-texte"
              name="summary"
              rows={8}
              maxLength={1000}
              defaultValue={content.summary}
            />
          </div>
          <p className="t-aide">{t("docs.editor.summaryHint")}</p>
          <button type="submit" className="t-bt t-p t-press">
            {t("docs.editor.save")}
          </button>
        </form>
        <form action={improveSummaryAction}>
          <input type="hidden" name="id" value={cv.id} />
          <button type="submit" className="t-lien-m t-press w-full">
            <OrbiMark size={20} />
            {t("docs.editor.improveSummary", { count: aiFeatures.cv_coach.credits })}
          </button>
        </form>
      </section>
    );
  } else if (panel === "partie" && part) {
    right = <SectionPanel cvId={cv.id} content={content} part={part} editor={editor} />;
  } else {
    right = (
      <>
        {aiCode && <OrbiLimit code={aiCode} plan={tailorPlan} />}
        <OrbiCvCard cvId={cv.id} credits={left} pending={changes.length} />
      </>
    );
  }

  return (
    <div className="t-large t-sc-studio">
      <StudioFrame studio />
      {head}
      {notices.length > 0 && <div className="t-sc-notes">{notices}</div>}
      <CvPaginationProvider>
        <div
          className={cx(
            "t-sc-stu",
            tab === "style" ? "t-sc-mef" : "t-sc-cnt",
            tab === "content" && panel !== "orbi" && "t-sc-ouvert",
          )}
        >
          <div className="t-sc-l">{tab === "style" ? styleLeft : contentLeft}</div>
          <div className="t-sc-mid">
            <ZoomBar
              target={PAGE}
              labels={{
                zoom: t("docs.web.studio.zoom", { percent: "{percent}" }),
                pages: {
                  one: t("docs.web.studio.pagesCount", {
                    count: 1,
                    max: template.pages[1],
                  }).replace("1", "#"),
                  other: t("docs.web.studio.pagesCount", {
                    count: 2,
                    max: template.pages[1],
                  }).replace("2", "#"),
                },
              }}
            />
            <CvPage
              id={PAGE}
              label={t("docs.web.studio.preview")}
              data={preview.data}
              template={template}
              style={style}
              highlight={highlight}
              mark={t("docs.web.change.highlight")}
            />
            {preview.demo && (
              <p className="t-gar">
                <TalentIcon name="aide" size="s" />
                {t("docs.editor.demo")}
              </p>
            )}
          </div>
          <div className="t-sc-r">{tab === "style" ? styleRight : right}</div>
        </div>
      </CvPaginationProvider>
      {dialogs}
      <CenteredDialog id="sc-options" title={cv.title} closeLabel={close}>
        <CvOptions
          cv={{ id: cv.id, title: cv.title, isPrimary: cv.isPrimary }}
          contact={content.info}
          canDuplicate={cvCount < MAX_CVS}
          prefix="sc-"
        />
      </CenteredDialog>
    </div>
  );
}

/** One section of the CV in the right panel: shown or not, its items, where to change them. */
async function SectionPanel({
  cvId,
  content,
  part,
  editor,
}: {
  cvId: string;
  content: ReturnType<typeof parseCv>;
  part: Section;
  editor: string;
}) {
  const t = await getTranslations();
  const d = dynamic(t);
  const visible = content.sections.find((section) => section.id === part)?.visible ?? true;
  const items = sectionItems(content, part, {
    present: t("docs.editor.present"),
    level: (level) => d(`talent.profile.languages.level.${level}`),
  });
  const name = t(`docs.section.${part}`);
  return (
    <section aria-labelledby="sc-op-t" className="t-sc-op">
      <div className="t-sc-opt">
        <div className="t-t">
          <h2 id="sc-op-t">{name}</h2>
        </div>
        <Link href={editor} className="t-bi t-press" aria-label={t("docs.web.studio.close")}>
          <TalentIcon name="fermer" size="s" />
        </Link>
      </div>
      <form action={changeCvSection} className="t-verre t-liste">
        <input type="hidden" name="id" value={cvId} />
        <input type="hidden" name="section" value={part} />
        <input type="hidden" name="move" value="toggle" />
        <input type="hidden" name="partie" value={part} />
        <div className="t-li">
          <span className="t-t" id="sc-partie-visible">
            <b>{t("docs.editor.shown")}</b>
            <span>{visible ? t("docs.editor.shownOn") : t("docs.editor.shownOff")}</span>
          </span>
          <button
            type="submit"
            role="switch"
            aria-checked={visible}
            aria-labelledby="sc-partie-visible"
            className="t-press"
          >
            <span aria-hidden className={cx("t-sw", visible && "t-on")} />
          </button>
        </div>
      </form>
      {items.length === 0 ? (
        <p className="t-vide-t">{t("docs.editor.sectionEmpty")}</p>
      ) : part === "skills" ? (
        <ul className="t-verre t-carte t-comp">
          {items.map((item) => (
            <li key={item.key}>
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="t-verre t-liste t-lignes">
          {items.map((item) => (
            <li key={item.key} className="t-li">
              <span className="t-t">
                <b>{item.title}</b>
                {item.detail && <span>{item.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link href={`/app/profil?partie=${profileParts[part]}`} className="t-ajout t-press">
        <TalentIcon name="modifier" size="s" />
        {t("docs.editor.editInProfile")}
      </Link>
      <form action={refreshCvFromProfile}>
        <input type="hidden" name="id" value={cvId} />
        <input type="hidden" name="partie" value={part} />
        <button type="submit" className="t-lien-m t-press w-full">
          <TalentIcon name="profil" size="s" />
          {t("docs.editor.refresh")}
        </button>
      </form>
    </section>
  );
}
