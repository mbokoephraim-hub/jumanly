import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { Notice } from "@/components/talent/notice";
import { deleteExperience, saveExperience } from "@/server/actions/profile";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { dateToMonth, ensureProfile } from "@/server/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.experience");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * « Nouvelle expérience » (planche talent-4, profil : édition): the job, the organization, the
 * dates (or « Poste actuel ») and the result obtained, one per line.
 */
export default async function ExperiencePage({
  searchParams,
}: PageProps<"/app/profil/experience">) {
  const params = await searchParams;
  const user = await requireUser("/app/profil/experience");
  const t = await getTranslations();
  const profile = await ensureProfile(db, user.id);
  const id = one(params.id);
  const experience = id
    ? await db.experience.findFirst({ where: { id, profileId: profile.id } })
    : null;
  const error = one(params.erreur);

  return (
    <div className="t-flux t-od-bas">
      <FlowHead
        back="/app/profil?section=experiences#experiences"
        backLabel={t("profil.back")}
        title={experience ? t("profil.experience.edit") : t("profil.experience.new")}
      />
      {error && (
        <Notice tone="err">
          {error === "endBeforeStart" ? t("profil.experience.endBeforeStart") : t("profil.error")}
        </Notice>
      )}
      <form id="pf-exp" action={saveExperience} className="t-flux">
        <input type="hidden" name="retour" value="/app/profil/experience" />
        {experience && <input type="hidden" name="id" value={experience.id} />}
        <div className="t-champ">
          <label htmlFor="pf-exp-title">{t("profil.experience.job")}</label>
          <span className="t-verre t-saisie">
            <input
              id="pf-exp-title"
              name="title"
              required
              maxLength={120}
              defaultValue={experience?.title ?? ""}
              placeholder={t("profil.experience.jobPlaceholder")}
            />
          </span>
        </div>
        <div className="t-champ">
          <label htmlFor="pf-exp-company">{t("profil.experience.company")}</label>
          <span className="t-verre t-saisie">
            <input
              id="pf-exp-company"
              name="company"
              required
              maxLength={120}
              defaultValue={experience?.company ?? ""}
            />
          </span>
        </div>
        <div className="t-dates">
          <div className="t-champ">
            <label htmlFor="pf-exp-start">{t("profil.experience.start")}</label>
            <span className="t-verre t-saisie">
              <input
                id="pf-exp-start"
                name="start"
                type="month"
                required
                defaultValue={dateToMonth(experience?.startDate)}
              />
            </span>
          </div>
          <div className="t-champ">
            <label htmlFor="pf-exp-end">{t("profil.experience.end")}</label>
            <span className="t-verre t-saisie">
              <input
                id="pf-exp-end"
                name="end"
                type="month"
                defaultValue={dateToMonth(experience?.endDate)}
              />
            </span>
          </div>
        </div>
        <label className="t-li t-nu">
          <span className="t-t">
            <b>{t("profil.experience.current")}</b>
          </span>
          <input
            type="checkbox"
            role="switch"
            name="current"
            defaultChecked={Boolean(experience && !experience.endDate)}
            className="sr-only"
          />
          <span aria-hidden className="t-sw" />
        </label>
        <div className="t-champ">
          <label htmlFor="pf-exp-result">{t("profil.experience.result")}</label>
          <textarea
            id="pf-exp-result"
            name="description"
            rows={3}
            maxLength={3000}
            defaultValue={experience?.description ?? ""}
            placeholder={t("profil.experience.resultPlaceholder")}
            aria-describedby="pf-exp-aide"
            className="t-verre t-saisie t-zone"
          />
          <span id="pf-exp-aide" className="t-aide-c">
            {t("profil.experience.resultHelp")}
          </span>
        </div>
      </form>
      {experience && (
        <form action={deleteExperience}>
          <input type="hidden" name="id" value={experience.id} />
          <button type="submit" className="t-bt t-sec t-pl t-danger t-press">
            {t("profil.experience.remove")}
          </button>
        </form>
      )}
      <div className="t-verre t-fort t-bas-f">
        <button type="submit" form="pf-exp" className="t-bt t-p t-pl t-press">
          {experience ? t("profil.save") : t("profil.experience.addCta")}
        </button>
      </div>
    </div>
  );
}
