import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { OpenSpaceSwitcher } from "@/components/site/open-space-switcher";
import {
  AppSystemCard,
  SystemActions,
  SystemCode,
  SystemHero,
} from "@/components/site/system-page";
import { TalentIcon } from "@/components/talent/icon";
import { ButtonLink } from "@/components/ui";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { hireMemberships, partnerMemberships } from "@/server/services/organization";
import { inOrganizationSpace } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("system.403");
  return { title: { absolute: t("meta.title") }, robots: { index: false } };
}

/**
 * Page 403 (mockup 08-02), in the application template. A Hire or partner page opened from the
 * personal space comes here: with another space available, the button opens the space switcher.
 * A plan lock is not a 403 (Verrou component, partie 05).
 */
export default async function AccessDeniedPage({ searchParams }: PageProps<"/app/acces-refuse">) {
  const user = await requireUser("/app");
  const t = await getTranslations();
  const { raison } = await searchParams;
  const [hire, partners] = await Promise.all([
    hireMemberships(db, user.id),
    partnerMemberships(db, user.id),
  ]);
  const canSwitch = hire.length + partners.length > 0;
  const body =
    raison === "suspendu"
      ? t("system.403.suspended")
      : raison === "organisation"
        ? t("system.403.orgSuspended")
        : canSwitch
          ? t("system.403.wrongSpace")
          : t("system.403.body");
  // Personal space (lot 7): the talent components, readable in dark mode. The other spaces keep
  // the system card of mockup 08-02 until their step.
  if (!(await inOrganizationSpace(user.id))) {
    return (
      <div className="t-flux">
        <div className="t-flux t-conf">
          <span className="t-rond-ko" aria-hidden>
            <TalentIcon name="cadenas" />
          </span>
          <h1 className="t-h2s">{t("system.403.title")}</h1>
          <p>{body}</p>
          {canSwitch && raison !== "suspendu" && (
            <Link href="/app/compte" className="t-bt t-sec t-pl t-press">
              {t("system.403.switchSpace")}
            </Link>
          )}
          <Link href="/app" className="t-bt t-p t-pl t-press">
            {t("system.403.cta")}
          </Link>
        </div>
      </div>
    );
  }
  return (
    <AppSystemCard eyebrow={t("common.brand")} title={t("system.403.pageTitle")}>
      <SystemHero
        code={<SystemCode code={t("system.403.code")} />}
        title={t("system.403.title")}
        body={
          <p className="text-[13px] leading-[19px] text-sapin lg:text-[15px] lg:leading-[22px]">
            {body}
          </p>
        }
        character={{ name: "diallo", pose: "perplexe" }}
        compact
      >
        <SystemActions>
          {canSwitch && raison !== "suspendu" && (
            <OpenSpaceSwitcher label={t("system.403.switchSpace")} />
          )}
          <ButtonLink href="/app" size="lg" variant="tertiary">
            {t("system.403.cta")}
          </ButtonLink>
        </SystemActions>
      </SystemHero>
    </AppSystemCard>
  );
}
