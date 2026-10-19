import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { dynamic } from "@/i18n/dynamic";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { recruiterPreview } from "@/server/services/profile-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.preview");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * « Vu par un recruteur » (planche talent-4 § 3): what a recruiter sees once the person applies
 * or makes the profile visible, and what never enters the score (règle d'or 4).
 */
export default async function PreviewPage() {
  const user = await requireUser("/app/profil/apercu");
  const t = await getTranslations();
  const td = dynamic(t);
  const preview = await recruiterPreview(db, user.id);
  const skills = preview.skills
    .slice(0, 6)
    .map((skill) => (skill.proven ? `${skill.name} ✓` : skill.name))
    .join(", ");

  return (
    <div className="t-flux">
      <FlowHead back="/app/profil" backLabel={t("profil.back")} title={t("profil.preview.title")} />
      <p className="t-vu-rec">
        <TalentIcon name="profil" size="s" />
        {t("profil.preview.banner")}
      </p>
      <dl className="t-verre t-masque">
        <div className="t-l">
          <dt>{t("profil.preview.headline")}</dt>
          <dd>{preview.title ?? "—"}</dd>
        </div>
        <div className="t-l">
          <dt>{t("profil.preview.skills")}</dt>
          <dd>{skills || "—"}</dd>
        </div>
        <div className="t-l">
          <dt>{t("profil.preview.projects")}</dt>
          <dd>{t("profil.preview.projectsValue", { count: preview.visibleProjects })}</dd>
        </div>
        <div className="t-l">
          <dt>{t("profil.preview.attestations")}</dt>
          <dd>{t("profil.preview.attestationsValue", { count: preview.attestations })}</dd>
        </div>
        <div className="t-l">
          <dt>{t("profil.preview.cv")}</dt>
          <dd>{t("profil.preview.cvValue")}</dd>
        </div>
      </dl>
      <h2 className="t-ck-t">{t("profil.preview.never")}</h2>
      <dl className="t-verre t-masque">
        <div className="t-l">
          <dt>{t("profil.preview.photoAge")}</dt>
          <dd>
            <s>{t("profil.preview.excluded")}</s>
          </dd>
        </div>
        <div className="t-l">
          <dt>{t("profil.preview.origin")}</dt>
          <dd>
            <s>{t("profil.preview.excluded")}</s>
          </dd>
        </div>
        <div className="t-l">
          <dt>{t("profil.preview.address")}</dt>
          <dd>
            <s>{t("profil.preview.cityOnly")}</s>
          </dd>
        </div>
      </dl>
      <p className="t-gar">
        <TalentIcon name="confidentialite" size="s" />
        <span>{td(`profil.preview.rule.${preview.visibility}`)}</span>
      </p>
    </div>
  );
}
