import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { tailorCvAction } from "@/server/actions/career-documents";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { offerGap, tailorOffers } from "@/server/services/career-documents";
import { parseCv } from "@/server/services/cv";
import { CompanyMark } from "../explorer/cards";
import { companyTone } from "../explorer/data";
import { initialsOf } from "../fil/data";
import { CareerTexts } from "./server";
import { SettingsFrame } from "./settings";

/**
 * « Adapter à une offre » on the phone (Modèle B, planche Carrière-cv-adapter): the offers the
 * CV can be adapted to, with the skills it lacks for each one. The CV's own steps are in
 * src/components/phone/cv (docs/carriere-v3).
 */
export async function PhoneCvEditor({ id, adapt }: { id: string; adapt: string }) {
  const user = await requireUser(`/app/career/cv/${id}`);
  const cv = await db.document.findFirst({
    where: { id, kind: "cv", profile: { userId: user.id } },
  });
  if (!cv) notFound();
  const t = await getTranslations();
  const content = parseCv(cv.content);
  const editor = `/app/career/cv/${cv.id}?etape=apercu`;
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
