import type { Metadata } from "next";
import { RhCompteTexts, RhProfileScreen } from "@/components/phone/recruteur/compte";
import { isPhone } from "@/server/view";
import { getTranslations } from "next-intl/server";
import { TalentAvatar } from "@/components/talent/avatar";
import Link from "next/link";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { shortName } from "@/lib/short-name";
import { saveRecruiterProfileAction } from "@/server/actions/recruiter-account";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireProfile");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * Mon profil RH (planche recruteur-3 PROF_R, r3plus): the name shown to candidates and the job
 * title in the active organization, then what a candidate sees of them. The professional e-mail cannot be changed here: it is used to verify
 * the organization.
 */
export default async function RecruiterProfilePage({
  searchParams,
}: PageProps<"/app/hire/compte/profil">) {
  const { user, ctx } = await requireHire("/app/hire/compte/profil");
  // On a phone, « Mon profil recruteur » of Modèle B (recruteur M8): what talents see.
  if (await isPhone())
    return (
      <RhCompteTexts>
        <RhProfileScreen ctx={ctx} query={await searchParams} />
      </RhCompteTexts>
    );
  const t = await getTranslations("hireProfile");
  const tr = await getTranslations("rhProfile");
  const tw = await getTranslations("hireWeb3.profile");
  const params = await searchParams;
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: ctx.organizationId } },
    select: { jobTitle: true, organization: { select: { name: true } } },
  });

  return (
    <div className="t-flux t-od-bas t-w4 t-large t-rw3-prof">
      <FlowHead back="/app/hire/compte" backLabel={t("back")} title={t("title")} />
      {one(params.ok) && <Notice tone="ok">{t("saved")}</Notice>}
      {one(params.erreur) && <Notice tone="err">{t("error.name")}</Notice>}
      {/* Ordinateur et tablette (planche web recruteur-3 § 3) : le formulaire en carte à gauche, ce
          que voient les candidats à droite. Le téléphone garde sa page. */}
      <div className="t-w4-g2">
        <div className="t-rw3-pfc">
          <div className="t-ph-ed">
            <TalentAvatar name={user.name} image={user.image} className="t-av-l" />
            <span className="t-aide-c">{t("photo")}</span>
          </div>
          <form id="rh-profil" action={saveRecruiterProfileAction} className="t-flux">
            <div className="t-champ">
              <label htmlFor="rh-profil-name">{t("name")}</label>
              <span className="t-verre t-saisie">
                <input
                  id="rh-profil-name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  defaultValue={user.name}
                />
              </span>
            </div>
            <div className="t-champ">
              <label htmlFor="rh-profil-title">{t("jobTitle")}</label>
              <span className="t-verre t-saisie">
                <input
                  id="rh-profil-title"
                  name="jobTitle"
                  maxLength={120}
                  autoComplete="organization-title"
                  defaultValue={membership?.jobTitle ?? ""}
                />
              </span>
            </div>
            <div className="t-champ">
              <label htmlFor="rh-profil-email">{t("email")}</label>
              <span className="t-verre t-saisie">
                <input
                  id="rh-profil-email"
                  type="email"
                  readOnly
                  aria-readonly="true"
                  aria-describedby="rh-profil-email-aide"
                  value={user.email}
                />
                <TalentIcon name="cadenas" size="s" />
              </span>
              <span id="rh-profil-email-aide" className="t-aide-c">
                {t("emailHint")}
              </span>
            </div>
          </form>
          <div className="t-w4-web t-bts">
            <Link href="/app/hire/compte" className="t-bt t-sec t-m t-press">
              {tw("cancel")}
            </Link>
            <button type="submit" form="rh-profil" className="t-bt t-p t-m t-press">
              {t("save")}
            </button>
          </div>
        </div>
        <div className="t-w4-col">
          {/* What a candidate reads beside the recruiter's messages (recruteur lot 5, r3plus PROF_R). */}
          <section aria-labelledby="rh-profil-vu" className="t-flux t-serre">
            <h2 id="rh-profil-vu" className="t-ck-t">
              {tr("seen")}
            </h2>
            <div className="t-r5-apc">
              <TalentAvatar name={user.name} image={user.image} />
              <div className="t-t">
                <b>
                  {tr("seenName", {
                    name: shortName(user.name),
                    org: membership?.organization.name ?? "",
                  })}
                </b>
                {membership?.jobTitle && <span>{membership.jobTitle}</span>}
              </div>
            </div>
          </section>
          <p className="t-gar">
            <TalentIcon name="confidentialite" size="s" />
            <span>{t("guard")}</span>
          </p>
        </div>
      </div>
      <div className="t-verre t-fort t-bas-f t-w4-tel">
        <button type="submit" form="rh-profil" className="t-bt t-p t-pl t-press">
          {t("save")}
        </button>
      </div>
    </div>
  );
}
