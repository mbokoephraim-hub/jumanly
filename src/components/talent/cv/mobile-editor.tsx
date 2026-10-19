import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Logo, toneOf } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { CvOptions } from "./cv-options";
import { cvNotices, type CvQuery } from "./notices";
import { OrbiLimit, orbiLimitCode } from "./orbi-limit";
import { PdfButton } from "./pdf-button";
import { SectionOrder } from "./section-order";
import { TailorOffer, TailorText } from "./tailor";
import { previewData } from "@/features/cv/document";
import { templateKey } from "@/features/cv/examples";
import { cvFileName } from "@/features/cv/export/pdf";
import { splitName } from "@/features/cv/render/build";
import { CvPaginationProvider, CvPreview } from "@/features/cv/render/CvPreview";
import { cvColors, cvFonts, fontOf } from "@/features/cv/render/palette";
import { cvSourceOf } from "@/features/cv/source";
import { blockLayout, cvDensities } from "@/features/cv/style";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { languageName } from "@/lib/dates";
import { tailorCvAction, tailorCvTextAction } from "@/server/actions/career-documents";
import {
  changeCvSection,
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
  type CvContent,
  type CvSectionId,
} from "@/server/services/cv";
import { pendingSuggestions, type CoachSuggestion } from "@/server/services/cv-coach";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export type Section = Exclude<CvSectionId, "summary">;
export const sections: Section[] = ["experience", "education", "skills", "languages"];
/** Where each part is written in the profile (the CV content comes from it). */
export const profileParts: Record<Section, string> = {
  experience: "experiences",
  education: "formations",
  skills: "competences",
  languages: "langues",
};

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The proposal with what comes from the CV marked (planche `.avap.ap mark`): its skills and its
 * figures, so the talent sees nothing was invented.
 */
export function marked(text: string, words: string[]): ReactNode[] {
  const names = [...new Set(words.filter((word) => word.trim().length > 1))]
    .sort((a, b) => b.length - a.length)
    .map(escape);
  const pattern = new RegExp(
    `(${[...names, "\\d+(?:[ ,.]\\d+)*(?:\\s?%)?(?:\\s[\\p{L}]+)?"].join("|")})`,
    "giu",
  );
  return text
    .split(pattern)
    .map((part, index) => (index % 2 === 1 ? <mark key={index}>{part}</mark> : part));
}

export const sentences = (text: string) =>
  text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;

/**
 * The CV editor of a phone (planche talent-4 § 6), below 768 px; the web studio
 * (`./studio/studio.tsx`) replaces it on a tablet and a computer. The template and its look (colour, font, density), the
 * sections in the order the talent drags them to, « Améliorer » on the summary, « Adapter » (to an
 * offer or to a pasted text, `career.cv.tailor`) and the PDF. One view at a time in the address:
 * `?vue=apercu`, `?vue=resume`, `?partie=<section>`, `?vue=ameliorer` (Orbi's changes, avant/après).
 */
export async function MobileCvEditor({ id, query }: { id: string; query: CvQuery }) {
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
  const [included, plans, changes, cvCount] = await Promise.all([
    canUseTemplate(db, { type: "user", id: user.id }, template),
    listPublicPlans(db),
    pendingSuggestions(db, user.id, cv.id),
    db.document.count({ where: { profileId: cv.profileId, kind: "cv" } }),
  ]);
  const editor = `/app/career/cv/${cv.id}`;
  const templateName = d(`career.cv.template.name.${templateKey(template.id)}`);
  const { firstName, lastName } = splitName(content.info.name.trim());
  const fileName = cvFileName([firstName, lastName].join(" "), cvCount > 1 ? cv.title : undefined);
  const close = t("offer.close");
  const pdfLabels = {
    preparing: t("docs.pdf.preparing"),
    done: t("docs.pdf.done"),
    error: t("docs.pdf.error"),
  };
  const pdf = (className: string) => (
    <PdfButton documentId={cv.id} fileName={fileName} labels={pdfLabels} className={className}>
      <TalentIcon name="telecharger" size="s" />
      {t("docs.editor.pdf")}
    </PdfButton>
  );
  const part = sections.find((section) => section === query.partie);
  const view =
    query.vue === "ameliorer" && changes.length > 0
      ? "ameliorer"
      : query.vue === "apercu"
        ? "apercu"
        : query.vue === "resume"
          ? "resume"
          : part
            ? "partie"
            : "editeur";

  const notices = await cvNotices({ query, title: cv.title, templateName, included, plans });
  const aiCode = orbiLimitCode(query.orbi) ?? orbiLimitCode(query.adaptation);
  const tailorPlan = talentPlanFor(plans, TAILOR_GATE.key);

  // ─── Avant, après: Orbi's changes, one at a time ──────────────────────────────────────
  if (view === "ameliorer") {
    const [change] = changes as [{ id: string; payload: CoachSuggestion }];
    const { payload } = change;
    const editing = query.modifier === "1";
    const credits = await usage(db, { type: "user", id: user.id }, AI_CREDITS_KEY);
    const left = credits.limit < 0 ? null : Math.max(0, credits.limit - credits.used);
    const words = [...content.skills.map((skill) => skill.name), ...(payload.focus ?? [])];
    const section = payload.target.section;
    const focus = (payload.focus ?? []).filter((word) =>
      fold(payload.after ?? "").includes(fold(word)),
    );
    return (
      <div className="t-flux t-od-bas">
        <FlowHead
          back={editor}
          backLabel={t("docs.back")}
          title={d(`docs.change.title.${section}`)}
          end={
            <Link href={editor} className="t-bi t-press" aria-label={close}>
              <TalentIcon name="fermer" size="s" />
            </Link>
          }
        />
        {notices}
        {changes.length > 1 && (
          <p className="t-ck-t">{t("docs.change.count", { total: changes.length })}</p>
        )}
        <section aria-labelledby="avap-avant" className="t-verre t-avap t-av-a">
          <h2 id="avap-avant">{t("docs.change.before")}</h2>
          <p>{payload.before || t("docs.change.emptyBefore")}</p>
        </section>
        {editing ? (
          <form id="avap-form" action={decideChangeAction} className="t-verre t-avap t-ap">
            <input type="hidden" name="id" value={cv.id} />
            <input type="hidden" name="suggestion" value={change.id} />
            <input type="hidden" name="decision" value="applied" />
            <label htmlFor="avap-texte">{t("docs.change.yours")}</label>
            <textarea
              id="avap-texte"
              name="text"
              rows={6}
              maxLength={section === "summary" ? 1000 : 600}
              defaultValue={payload.after ?? ""}
              required
            />
          </form>
        ) : (
          <section aria-labelledby="avap-apres" className="t-verre t-avap t-ap">
            <h2 id="avap-apres">{t("docs.change.after")}</h2>
            <p>{marked(payload.after ?? "", words)}</p>
          </section>
        )}
        <p className="t-gar">
          <TalentIcon name="cadenas" size="s" />
          {left === null ? t("docs.change.note") : t("docs.change.noteCredits", { left })}
        </p>
        <SheetButton target="avap-pourquoi" className="t-pq t-press">
          <TalentIcon name="pourquoi" size="xs" />
          {t("docs.change.why")}
        </SheetButton>

        <div className="t-verre t-fort t-bas-f">
          {editing ? (
            <>
              <Link href={`${editor}?vue=ameliorer`} className="t-bt t-sec t-m t-press">
                {t("docs.change.cancel")}
              </Link>
              <button type="submit" form="avap-form" className="t-bt t-p t-pl t-press">
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
                  className="t-bt t-sec t-m t-press"
                >
                  {t("docs.change.refuse")}
                </button>
              </form>
              <Link href={`${editor}?vue=ameliorer&modifier=1`} className="t-bt t-sec t-m t-press">
                {t("docs.change.edit")}
              </Link>
              <form action={decideChangeAction} className="contents">
                <input type="hidden" name="id" value={cv.id} />
                <input type="hidden" name="suggestion" value={change.id} />
                <button
                  type="submit"
                  name="decision"
                  value="applied"
                  className="t-bt t-p t-pl t-press"
                >
                  <TalentIcon name="valider" size="s" />
                  {t("docs.change.accept")}
                </button>
              </form>
            </>
          )}
        </div>

        <Sheet id="avap-pourquoi" title={t("docs.change.why")} closeLabel={close}>
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
        </Sheet>
      </div>
    );
  }

  // ─── Aperçu: the pages as they will be exported ───────────────────────────────────────
  if (view === "apercu") {
    const { data, demo } = await previewData(source);
    return (
      <div className="t-flux t-od-bas">
        <FlowHead back={editor} backLabel={t("docs.back")} title={t("docs.editor.preview")} />
        {notices}
        {demo && (
          <p className="t-gar">
            <TalentIcon name="aide" size="s" />
            {t("docs.editor.demo")}
          </p>
        )}
        <div className="t-verre t-apercu">
          <CvPaginationProvider>
            <CvPreview
              data={data}
              template={template}
              style={style}
              label={t("docs.editor.preview")}
            />
          </CvPaginationProvider>
        </div>
        <p className="t-gar">
          <TalentIcon name="confidentialite" size="s" />
          {t("career.cv.template.neutral")}
        </p>
        <div className="t-verre t-fort t-bas-f">
          <Link href={`/app/career/cv/modeles?cv=${cv.id}`} className="t-bt t-sec t-m t-press">
            {t("docs.editor.changeTemplate")}
          </Link>
          {pdf("t-bt t-p t-pl t-press")}
        </div>
      </div>
    );
  }

  // ─── Résumé: the talent's own words ────────────────────────────────────────────────────
  if (view === "resume") {
    return (
      <div className="t-flux t-od-bas">
        <FlowHead back={editor} backLabel={t("docs.back")} title={t("docs.section.summary")} />
        {notices}
        {aiCode && <OrbiLimit code={aiCode} />}
        <form id="resume-form" action={updateCvSummary} className="t-flux">
          <input type="hidden" name="id" value={cv.id} />
          <div className="t-ta">
            <label htmlFor="resume-texte" className="sr-only">
              {t("docs.section.summary")}
            </label>
            <textarea
              id="resume-texte"
              name="summary"
              rows={8}
              maxLength={1000}
              defaultValue={content.summary}
            />
          </div>
          <p className="t-aide">{t("docs.editor.summaryHint")}</p>
        </form>
        <form action={improveSummaryAction}>
          <input type="hidden" name="id" value={cv.id} />
          <button type="submit" className="t-lien-m t-press w-full">
            <OrbiMark size={20} />
            {t("docs.editor.improveSummary", { count: aiFeatures.cv_coach.credits })}
          </button>
        </form>
        <div className="t-verre t-fort t-bas-f">
          <button type="submit" form="resume-form" className="t-bt t-p t-pl t-press">
            {t("docs.editor.save")}
          </button>
        </div>
      </div>
    );
  }

  // ─── One section, read from the profile ────────────────────────────────────────────────
  if (view === "partie" && part) {
    const visible = content.sections.find((section) => section.id === part)?.visible ?? true;
    const items = sectionItems(content, part, {
      present: t("docs.editor.present"),
      level: (level) => d(`talent.profile.languages.level.${level}`),
    });
    const name = t(`docs.section.${part}`);
    return (
      <div className="t-flux">
        <FlowHead back={editor} backLabel={t("docs.back")} title={name} />
        {notices}
        <form action={changeCvSection} className="t-verre t-liste">
          <input type="hidden" name="id" value={cv.id} />
          <input type="hidden" name="section" value={part} />
          <input type="hidden" name="move" value="toggle" />
          <input type="hidden" name="partie" value={part} />
          <div className="t-li">
            <span className="t-t" id="partie-visible">
              <b>{t("docs.editor.shown")}</b>
              <span>{visible ? t("docs.editor.shownOn") : t("docs.editor.shownOff")}</span>
            </span>
            <button
              type="submit"
              role="switch"
              aria-checked={visible}
              aria-labelledby="partie-visible"
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
          <input type="hidden" name="id" value={cv.id} />
          <input type="hidden" name="partie" value={part} />
          <button type="submit" className="t-lien-m t-press w-full">
            <TalentIcon name="profil" size="s" />
            {t("docs.editor.refresh")}
          </button>
        </form>
      </div>
    );
  }

  // ─── The editor ────────────────────────────────────────────────────────────────────────
  // « Adapter mon CV » from an offer: `?adapter=<job id>` opens the sheet on that offer.
  // `?adapter=offre` and `?adapter=texte` (links of « Orbi pour vos CV ») open the sheet itself.
  const adapter = typeof query.adapter === "string" ? query.adapter.slice(0, 60) : undefined;
  const adaptFor = adapter === "offre" || adapter === "texte" ? undefined : adapter;
  const [tailor, offers] = await Promise.all([
    aiState(db, user.id, "cv_tailor", TAILOR_GATE),
    tailorOffers(db, user.id, adaptFor),
  ]);
  const order = blockLayout(template, style, cvSectionIds).map(
    (block) => block.type as CvSectionId,
  );
  const hidden = new Set(content.sections.filter((s) => !s.visible).map((s) => s.id));
  const color = cvColors.find((item) => item.code === style.accent);
  const colorName = color ? d(`cv.colors.${color.code}`) : style.accent;
  const colorHex = color?.hex ?? style.accent;
  const line: Record<CvSectionId, string> = {
    summary: content.summary.trim()
      ? t("docs.editor.summaryLine", { count: sentences(content.summary) })
      : t("docs.editor.toWrite"),
    experience: t("docs.editor.count", { count: content.experiences.length }),
    education: t("docs.editor.count", { count: content.education.length }),
    skills: t("docs.editor.skillsLine", { count: content.skills.length }),
    languages: t("docs.editor.count", { count: content.languages.length }),
  };
  const rows = order.map((section) => {
    const name = t(`docs.section.${section}`);
    const sub = [line[section], hidden.has(section) ? t("docs.editor.hiddenShort") : null]
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
              className="t-lien"
            >
              <b>{name}</b>
            </Link>
            <span>{sub}</span>
          </span>
          {section === "summary" ? (
            <form action={improveSummaryAction}>
              <input type="hidden" name="id" value={cv.id} />
              <button type="submit" className="t-orb-b t-press">
                <OrbiMark size={16} />
                {t("docs.editor.improve")}
              </button>
            </form>
          ) : (
            <TalentIcon name="suivant" size="s" />
          )}
        </>
      ),
    };
  });
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
  const tailorBlocked = tailor.state !== "ready";

  return (
    <div className="t-flux t-od-bas">
      <FlowHead
        back="/app/career/cv"
        backLabel={t("docs.back")}
        title={cv.title}
        end={
          <SheetButton target="cv-options" className="t-bi t-press" label={t("docs.editor.more")}>
            <TalentIcon name="plus-options" size="s" />
          </SheetButton>
        }
      />
      {notices}
      {aiCode && <OrbiLimit code={aiCode} plan={tailorPlan} />}
      {changes.length > 0 && (
        <Link href={`${editor}?vue=ameliorer`} className="t-verre t-carte t-sugg t-press">
          <OrbiMark size={36} />
          <span className="t-t">
            <small>{t("docs.editor.changesLabel")}</small>
            <b>{t("docs.editor.changes", { count: changes.length })}</b>
          </span>
          <TalentIcon name="suivant" size="s" />
        </Link>
      )}

      <div className="t-verre t-ed-ap">
        <span className="t-pg" aria-hidden>
          <i className="t-h" />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="t-t">
          <Link href={`/app/career/cv/modeles?cv=${cv.id}`} className="t-lien">
            <b>{t("docs.editor.template", { templateName })}</b>
          </Link>
          <span>
            {t("docs.editor.savedOn", {
              date: format.dateTime(cv.updatedAt, { day: "numeric", month: "short" }),
            })}
          </span>
        </span>
        <Link href={`${editor}?vue=apercu`} className="t-bt t-sec t-s t-press">
          {t("docs.editor.preview")}
        </Link>
      </div>

      <div className="t-reg">
        <SheetButton target="cv-couleur" className="t-press" label={t("docs.style.color")}>
          <i style={{ background: colorHex }} />
          {colorName}
        </SheetButton>
        <SheetButton target="cv-police" className="t-press" label={t("docs.style.font")}>
          {t("docs.style.fontChip", { font: fontOf(style.font).label })}
        </SheetButton>
        <SheetButton target="cv-densite" className="t-press" label={t("docs.style.density")}>
          {d(`career.cv.template.density.${style.density}`)}
        </SheetButton>
      </div>

      <h2 className="t-ck-t">{t("docs.editor.sections")}</h2>
      <SectionOrder
        documentId={cv.id}
        rows={rows}
        labels={{
          grip: t("docs.editor.grip", { section: "{section}" }),
          moved: t("docs.editor.moved", { section: "{section}" }),
          error: t("docs.editor.error"),
        }}
      />

      <div className="t-verre t-fort t-bas-f">
        <SheetButton target="cv-adapter" className="t-bt t-sec t-m t-press">
          <TalentIcon name="opportunites" size="s" />
          {t("docs.editor.adapt")}
        </SheetButton>
        {pdf("t-bt t-p t-pl t-press")}
      </div>

      <Sheet id="cv-options" title={cv.title} closeLabel={close}>
        <CvOptions
          cv={{ id: cv.id, title: cv.title, isPrimary: cv.isPrimary }}
          contact={content.info}
          canDuplicate={cvCount < MAX_CVS}
          prefix="cv-"
        />
      </Sheet>

      <Sheet id="cv-couleur" title={t("docs.style.color")} closeLabel={close}>
        <p className="t-ss">{t("career.cv.style.color.hint")}</p>
        <div className="t-teintes">
          {cvColors.map((item) => (
            <form key={item.code} action={updateCvStyleAction}>
              <input type="hidden" name="id" value={cv.id} />
              <input type="hidden" name="setting" value="accent" />
              <button
                type="submit"
                name="value"
                value={item.code}
                aria-pressed={item.code === style.accent}
                className="t-press"
              >
                <i style={{ background: item.hex }} />
                {d(`cv.colors.${item.code}`)}
              </button>
            </form>
          ))}
        </div>
        <p className="t-aide">{t("docs.style.colorAts")}</p>
      </Sheet>

      <Sheet id="cv-police" title={t("docs.style.font")} closeLabel={close}>
        <div className="t-verre t-liste t-lignes">
          {cvFonts.map((font) => (
            <form key={font.code} action={updateCvStyleAction} className="t-li">
              <input type="hidden" name="id" value={cv.id} />
              <input type="hidden" name="setting" value="font" />
              <span className="t-t">
                <button
                  type="submit"
                  name="value"
                  value={font.code}
                  aria-pressed={font.code === style.font}
                  className="t-lien"
                >
                  <b style={{ fontFamily: font.family }}>{font.label}</b>
                </button>
                {font.code === "sora" && <span>{t("career.cv.style.font.recommended")}</span>}
              </span>
              {font.code === style.font && <TalentIcon name="valider" size="s" />}
            </form>
          ))}
        </div>
        <p className="t-aide">{t("career.cv.style.font.hint")}</p>
      </Sheet>

      <Sheet id="cv-densite" title={t("docs.style.density")} closeLabel={close}>
        <div className="t-verre t-liste t-lignes">
          {cvDensities.map((density) => (
            <form key={density} action={updateCvStyleAction} className="t-li">
              <input type="hidden" name="id" value={cv.id} />
              <input type="hidden" name="setting" value="density" />
              <span className="t-t">
                <button
                  type="submit"
                  name="value"
                  value={density}
                  aria-pressed={density === style.density}
                  className="t-lien"
                >
                  <b>{d(`career.cv.template.density.${density}`)}</b>
                </button>
              </span>
              {density === style.density && <TalentIcon name="valider" size="s" />}
            </form>
          ))}
        </div>
      </Sheet>

      <Sheet
        id="cv-adapter"
        title={t("docs.tailor.offerTitle")}
        closeLabel={close}
        openParam="adapter"
        defaultOpen={Boolean(adapter) && adapter !== "texte"}
      >
        {tailorBlocked ? (
          <OrbiLimit code={tailor.state as "consent"} plan={tailorPlan} />
        ) : tailorRows.length === 0 ? (
          <p className="t-ss">{t("docs.tailor.noOffers")}</p>
        ) : (
          <form action={tailorCvAction} className="t-flux">
            <input type="hidden" name="cvId" value={cv.id} />
            <TailorOffer offers={tailorRows} legend={t("docs.tailor.offerLegend")}>
              <button type="submit" className="t-bt t-p t-pl t-press">
                <OrbiMark size={20} />
                {t("docs.tailor.create")}
              </button>
            </TailorOffer>
          </form>
        )}
        {!tailorBlocked && (
          <SheetButton target="cv-adapter-texte" className="t-lien-m t-press">
            <TalentIcon name="document" size="s" />
            {t("docs.tailor.toText")}
          </SheetButton>
        )}
      </Sheet>

      {!tailorBlocked && (
        <Sheet
          id="cv-adapter-texte"
          title={t("docs.tailor.textTitle")}
          closeLabel={close}
          openParam="adapter"
          defaultOpen={adapter === "texte"}
        >
          <p className="t-ss">{t("docs.tailor.textLead")}</p>
          <form action={tailorCvTextAction} className="t-flux">
            <input type="hidden" name="cvId" value={cv.id} />
            <TailorText
              cvId={cv.id}
              max={TAILOR_TEXT_MAX}
              kinds={tailorTextKinds.map((kind) => ({
                value: kind,
                label: t(`docs.tailor.kind.${kind}`),
                placeholder: t(`docs.tailor.placeholder.${kind}`),
              }))}
              labels={{
                kinds: t("docs.tailor.kinds"),
                text: t("docs.tailor.textLabel"),
                count: t("docs.tailor.counter", {
                  count: "{count}",
                  max: TAILOR_TEXT_MAX.toLocaleString("fr-FR"),
                }),
                present: t("docs.tailor.keywords"),
                missing: t("docs.tailor.missing"),
              }}
            />
            <p className="t-gar">
              <TalentIcon name="cadenas" size="s" />
              {t("docs.tailor.textNote")}
            </p>
            <button type="submit" className="t-bt t-p t-pl t-press">
              <OrbiMark size={20} />
              {t("docs.tailor.create")}
            </button>
          </form>
        </Sheet>
      )}
    </div>
  );
}

/** The items of a section, as the CV prints them. */
export function sectionItems(
  content: CvContent,
  section: Section,
  labels: { present: string; level: (level: string) => string },
) {
  const years = (start: string, end: string | null) =>
    [start.slice(0, 4), end ? end.slice(0, 4) : labels.present]
      .filter((value, index, all) => index === 0 || value !== all[0])
      .join(" – ");
  switch (section) {
    case "experience":
      return content.experiences.map((item, index) => ({
        key: `${index}`,
        title: item.title,
        detail: [item.company, years(item.start, item.end)].filter(Boolean).join(" · "),
      }));
    case "education":
      return content.education.map((item, index) => ({
        key: `${index}`,
        title: item.degree,
        detail: [item.school, item.endYear ?? item.startYear].filter(Boolean).join(" · "),
      }));
    case "skills":
      return content.skills.map((item) => ({ key: item.name, title: item.name, detail: "" }));
    case "languages":
      return content.languages.map((item) => ({
        key: item.code,
        title: languageName(item.code),
        detail: [labels.level(item.level), item.cefr].filter(Boolean).join(" · "),
      }));
  }
}
