import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo, toneOf } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { SettingsNav } from "@/components/talent/settings-nav";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { SwitchRow } from "@/components/talent/settings-controls";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { formatShortDate } from "@/lib/dates";
import { updatePrivacy } from "@/server/actions/settings";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { listProjects } from "@/server/services/portfolio";
import { toHireSettings } from "@/server/settings-redirect";
import { inOrganizationSpace } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("confidentialite");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;
const visibilities = ["private", "recruiters", "anonymous"] as const;

/**
 * Confidentialité (planche talent-4 § 8): who sees the profile, Orbi, the suggested offers, the
 * requests to be put in touch, the public projects, and every consultation of the profile by a
 * recruiter (golden rule 5: each one is logged and shown here). One form: each switch saves it.
 */
export default async function PrivacyPage({
  searchParams,
}: PageProps<"/app/parametres/confidentialite">) {
  const params = await searchParams;
  const user = await requireUser("/app/parametres/confidentialite");
  if (await inOrganizationSpace(user.id)) toHireSettings("confidentialite", params);
  const t = await getTranslations();
  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      visibility: true,
      matchingEnabled: true,
      acceptsContactRequests: true,
      portfolioPublic: true,
    },
  });
  const [views, projects] = profile
    ? await Promise.all([
        db.auditLog.findMany({
          where: { action: "profile.view", targetType: "talentProfile", targetId: profile.id },
          orderBy: { createdAt: "desc" },
          select: { organizationId: true, metadata: true, createdAt: true },
          take: 60,
        }),
        listProjects(db, profile.id),
      ])
    : [[], []];
  // One line per organization, its latest consultation first.
  const latest = new Map<string, (typeof views)[number]>();
  for (const view of views) {
    if (view.organizationId && !latest.has(view.organizationId)) {
      latest.set(view.organizationId, view);
    }
  }
  const organizations = await db.organization.findMany({
    where: { id: { in: [...latest.keys()] } },
    select: { id: true, name: true, logo: true },
  });
  const consultations = [...latest.values()].slice(0, 12).flatMap((view) => {
    const organization = organizations.find((item) => item.id === view.organizationId);
    if (!organization) return [];
    const metadata = (view.metadata ?? {}) as { applicationId?: string };
    return [{ organization, application: Boolean(metadata.applicationId), at: view.createdAt }];
  });
  const visibility = profile?.visibility ?? "private";

  return (
    <div className="t-flux t-w4 t-large">
      <div className="t-w4-tel">
        <FlowHead
          back="/app/parametres"
          backLabel={t("confidentialite.back")}
          title={t("confidentialite.title")}
          end={
            <Link
              href="/app/parametres"
              className="t-bi t-press"
              aria-label={t("confidentialite.close")}
            >
              <TalentIcon name="fermer" size="s" />
            </Link>
          }
        />
      </div>
      <h1 className="t-w4-web t-w4-ph1">{t("parametres.title")}</h1>
      <div className="t-w4-prm">
        <SettingsNav on="confidentialite" />
        <div className="t-w4-col">
          <h2 className="t-w4-web t-w4-h3">{t("confidentialite.title")}</h2>
          {one(params.ok) && <Notice tone="ok">{t("parametres.saved")}</Notice>}
          {one(params.erreur) && <Notice tone="err">{t("parametres.error")}</Notice>}

          <form action={updatePrivacy} id="confidentialite-form">
            <ul aria-label={t("confidentialite.title")} className="t-verre t-liste t-lignes">
              <li>
                <SheetButton target="confidentialite-visibilite" className="t-li t-press">
                  <span className="t-cases t-c2" aria-hidden>
                    <TalentIcon name="profil" size="s" />
                  </span>
                  <span className="t-t">
                    <b>{t("confidentialite.visibility.title")}</b>
                    <span>{t(`talent.profile.visibility.${visibility}.text`)}</span>
                  </span>
                  <TalentIcon name="suivant" />
                </SheetButton>
              </li>
              <li>
                <SwitchRow
                  name="ai"
                  defaultChecked={Boolean(user.aiConsentAt)}
                  icon={
                    <span className="t-cases t-c1" aria-hidden>
                      <TalentIcon name="orbi" size="s" />
                    </span>
                  }
                  title={t("confidentialite.orbi.title")}
                  text={t("confidentialite.orbi.text")}
                />
              </li>
              <li>
                <SwitchRow
                  name="matching"
                  defaultChecked={profile?.matchingEnabled ?? true}
                  icon={
                    <span className="t-cases t-c3" aria-hidden>
                      <TalentIcon name="opportunites" size="s" />
                    </span>
                  }
                  title={t("confidentialite.matching.title")}
                  text={t("confidentialite.matching.text")}
                />
              </li>
              <li>
                <SwitchRow
                  name="contactRequests"
                  defaultChecked={profile?.acceptsContactRequests ?? true}
                  icon={
                    <span className="t-cases" aria-hidden>
                      <TalentIcon name="connexion" size="s" />
                    </span>
                  }
                  title={t("confidentialite.contacts.title")}
                  text={t("confidentialite.contacts.text")}
                />
              </li>
              <li>
                <Link href="/app/profil?partager=1" className="t-li t-press">
                  <span className="t-cases t-c3" aria-hidden>
                    <TalentIcon name="realisation" size="s" />
                  </span>
                  <span className="t-t">
                    <b>{t("confidentialite.projects.title")}</b>
                    <span>
                      {profile?.portfolioPublic
                        ? t("confidentialite.projects.public", { count: projects.length })
                        : t("confidentialite.projects.private")}
                    </span>
                  </span>
                  <TalentIcon name="suivant" />
                </Link>
              </li>
            </ul>
            {/* Kept as they are: the newsletter lives in Notifications. */}
            {user.newsletter && <input type="hidden" name="newsletter" value="on" />}
            <noscript>
              <button type="submit" className="t-bt t-sec t-pl">
                {t("parametres.save")}
              </button>
            </noscript>

            <Sheet
              id="confidentialite-visibilite"
              title={t("confidentialite.visibility.title")}
              closeLabel={t("confidentialite.close")}
            >
              <div
                role="radiogroup"
                className="t-choix"
                aria-label={t("confidentialite.visibility.title")}
              >
                {visibilities.map((value) => (
                  <label key={value} className="t-verre t-ch t-press">
                    <input
                      type="radio"
                      name="visibility"
                      value={value}
                      defaultChecked={visibility === value}
                      form="confidentialite-form"
                    />
                    <span className="t-t">
                      <b>{t(`talent.profile.visibility.${value}.text`)}</b>
                      <span>{t(`talent.profile.visibility.${value}.desc`)}</span>
                    </span>
                    <span aria-hidden className="t-radio" />
                  </label>
                ))}
              </div>
              <p className="t-gar">
                <TalentIcon name="confidentialite" size="s" />
                <span>{t("talent.profile.visibility.always")}</span>
              </p>
              <button type="submit" form="confidentialite-form" className="t-bt t-p t-pl t-press">
                {t("parametres.save")}
              </button>
            </Sheet>
          </form>

          <span className="t-ck-t" id="confidentialite-vues">
            {t("confidentialite.views.title")}
          </span>
          {consultations.length === 0 ? (
            <p className="t-aide-c">{t("confidentialite.views.empty")}</p>
          ) : (
            <ul aria-labelledby="confidentialite-vues" className="t-consults t-w4-cons">
              {consultations.map((row) => (
                <li key={row.organization.id} className="t-verre t-consult">
                  <Logo
                    name={row.organization.name}
                    src={row.organization.logo}
                    tone={toneOf(row.organization.name)}
                  />
                  <span className="t-t">
                    <b>{row.organization.name}</b>
                    <span>
                      {row.application
                        ? t("confidentialite.views.application", { date: formatShortDate(row.at) })
                        : t("confidentialite.views.visible", { date: formatShortDate(row.at) })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="t-gar">
            <TalentIcon name="confidentialite" size="s" />
            <span>{t("confidentialite.note")}</span>
          </p>
          <p className="t-liens-bas">
            <Link href="/comment-fonctionne-le-matching">{t("confidentialite.matchingLink")}</Link>
            <Link href="/confidentialite">{t("confidentialite.policy")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
