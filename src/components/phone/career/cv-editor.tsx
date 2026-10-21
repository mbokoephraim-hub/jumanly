import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { previewData } from "@/features/cv/document";
import { templateKey } from "@/features/cv/examples";
import { CvPaginationProvider, CvPreview } from "@/features/cv/render/CvPreview";
import { cvColors } from "@/features/cv/render/palette";
import { cvSourceOf } from "@/features/cv/source";
import { blockLayout } from "@/features/cv/style";
import { dynamic } from "@/i18n/dynamic";
import { tailorCvAction } from "@/server/actions/career-documents";
import { updateCvStyleAction } from "@/server/actions/cv";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { offerGap, tailorOffers } from "@/server/services/career-documents";
import { cvSectionIds, parseCv } from "@/server/services/cv";
import { CompanyMark } from "../explorer/cards";
import { companyTone } from "../explorer/data";
import { initialsOf } from "../fil/data";
import { PhoneIcon } from "../icon";
import { CvExportButton } from "./cv-export";
import { CareerTexts } from "./server";
import { SettingsFrame } from "./settings";

/**
 * The CV editor on the phone (Modèle B, planche Carrière-cv-editeur): the page as it will be
 * exported, its colour, its sections, and « Exporter ». A section opens its own screen.
 */
export async function PhoneCvEditor({ id, adapt }: { id: string; adapt: string | null }) {
  const user = await requireUser(`/app/career/cv/${id}`);
  const cv = await db.document.findFirst({
    where: { id, kind: "cv", profile: { userId: user.id } },
  });
  if (!cv) notFound();
  const t = await getTranslations();
  const d = dynamic(t);
  const owner = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { image: true },
  });
  const content = parseCv(cv.content);
  const source = cvSourceOf(cv, owner.image);
  const { template, style } = source;
  const editor = `/app/career/cv/${cv.id}`;

  if (adapt !== null) {
    const offers = await tailorOffers(db, user.id, adapt || undefined);
    return (
      <CareerTexts>
        <SettingsFrame title={t("phoneCareer.cvEdit.adaptTitle")} back={editor}>
          <form action={tailorCvAction} className="nb-ca-adapter">
            <input type="hidden" name="cvId" value={cv.id} />
            <p className="nb-ca-gr" id="ca-offre">
              {t("phoneCareer.cvEdit.adaptWhich")}
            </p>
            {offers.length === 0 ? (
              <p className="nb-meta nb-ca-intro">{t("phoneCareer.cvEdit.adaptNone")}</p>
            ) : (
              <div role="radiogroup" aria-labelledby="ca-offre">
                {offers.map((offer, index) => {
                  const gap = offerGap(content, offer.skills);
                  return (
                    <label key={offer.id} className="nb-ca-it nb-ca-op" data-ligne="">
                      <CompanyMark
                        initials={initialsOf(offer.company)}
                        logo={offer.logo}
                        tone={companyTone(offer.company)}
                        size={40}
                      />
                      <span>
                        {offer.title}
                        <small className="nb-meta">
                          {gap.absent.length + gap.written.length > 0
                            ? t("phoneCareer.cvEdit.adaptGap", {
                                company: offer.company,
                                count: gap.absent.length + gap.written.length,
                              })
                            : offer.company}
                        </small>
                      </span>
                      <input
                        type="radio"
                        name="jobId"
                        value={offer.id}
                        defaultChecked={index === 0}
                      />
                      <i className="nb-ca-radio" aria-hidden />
                    </label>
                  );
                })}
              </div>
            )}
            <p className="nb-meta nb-ca-intro">{t("phoneCareer.cvEdit.adaptNote")}</p>
            <div className="nb-ca-suppr nb-ca-bas">
              {offers.length > 0 ? (
                <button type="submit" className="nb-bouton" data-large="" data-plein="">
                  {t("phoneCareer.cvEdit.adaptCreate")}
                </button>
              ) : (
                <Link href="/app/jobs" className="nb-bouton" data-large="" data-plein="">
                  {t("phoneCareer.cvEdit.adaptFind")}
                </Link>
              )}
            </div>
          </form>
        </SettingsFrame>
      </CareerTexts>
    );
  }

  const { data } = await previewData(source);
  const order = blockLayout(template, style, cvSectionIds).map((block) => block.type);
  const counts: Record<string, number> = {
    experience: content.experiences.length,
    education: content.education.length,
    skills: content.skills.length,
    languages: content.languages.length,
  };
  const rows = [
    ...order.map((section) => ({
      key: section,
      href: section === "summary" ? `${editor}?vue=resume` : `${editor}?partie=${section}`,
      name: t(`docs.section.${section}` as "docs.section.summary"),
      count: counts[section],
    })),
  ];
  const templateName = d(`career.cv.template.name.${templateKey(template.id)}`);
  return (
    <CareerTexts>
      <div className="nb-page nb-ca-form nb-ca-editeur">
        <header className="nb-ca-form-barre" data-retour-texte="">
          <Link href="/app/career/cv" className="nb-retour" data-retour="">
            <PhoneIcon name="retour" size={22} stroke={2} />
            <span>{t("phoneCareer.cvEdit.back")}</span>
          </Link>
          <h1>{cv.title}</h1>
          <CvExportButton id={cv.id} title={cv.title} label={t("phoneCareer.cvEdit.export")} />
        </header>
        <Link
          href={`${editor}?vue=apercu`}
          className="nb-ca-apercu"
          aria-label={t("phoneCareer.cvEdit.preview", { template: templateName })}
        >
          <span className="nb-ca-apercu-page" aria-hidden>
            <CvPaginationProvider>
              <CvPreview data={data} template={template} style={style} label={cv.title} />
            </CvPaginationProvider>
          </span>
        </Link>
        <p className="nb-ca-gr" id="ca-couleur">
          {t("phoneCareer.cvEdit.color")}
        </p>
        <div className="nb-ca-teintes" role="group" aria-labelledby="ca-couleur">
          {cvColors.slice(0, 6).map((item) => (
            <form key={item.code} action={updateCvStyleAction}>
              <input type="hidden" name="id" value={cv.id} />
              <input type="hidden" name="setting" value="accent" />
              <button
                type="submit"
                name="value"
                value={item.code}
                aria-pressed={item.code === style.accent}
                aria-label={d(`cv.colors.${item.code}`)}
                style={{ background: item.hex }}
              />
            </form>
          ))}
        </div>
        <p className="nb-ca-gr">{t("phoneCareer.cvEdit.sections")}</p>
        {rows.map((row) => (
          <Link key={row.key} href={row.href} className="nb-ca-it" data-ligne="">
            <span>{row.name}</span>
            {typeof row.count === "number" ? <small>{row.count}</small> : null}
            <PhoneIcon name="chevron" size={18} />
          </Link>
        ))}
        <Link href={`/app/career/cv/modeles?cv=${cv.id}`} className="nb-ca-it" data-ligne="">
          <span>{t("phoneCareer.cvEdit.template")}</span>
          <small>{templateName}</small>
          <PhoneIcon name="chevron" size={18} />
        </Link>
        <Link href={`${editor}?adapter=`} className="nb-ca-it" data-ligne="">
          <span>{t("phoneCareer.cvEdit.adapt")}</span>
          <PhoneIcon name="chevron" size={18} />
        </Link>
      </div>
    </CareerTexts>
  );
}
