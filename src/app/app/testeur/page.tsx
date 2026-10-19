import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { formatUsd } from "@/lib/money";
import {
  chooseTesterPlan,
  createTesterSpace,
  openPersonalSpace,
  openTesterSpace,
} from "@/server/actions/tester";
import { ADMIN_ROLES, requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { isTester, testerOrganizations, testerPlans } from "@/server/services/tester";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tester.seo");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

type Plan = Awaited<ReturnType<typeof testerPlans>>[number];
type Labels = {
  current: string;
  choose: string;
  reset: string;
  free: string;
  onQuote: string;
  price: (cents: number) => string;
};

/**
 * « Mode testeur » (docs/decisions/2026-10-16-compte-passe-partout.md), redrawn soberly with the
 * talent components (lot 7): the accounts listed in TESTER_EMAILS switch their talent plan and
 * their test organization's plan without paying. Anyone else gets a 404 and never sees the link.
 */
export default async function TesterPage({ searchParams }: PageProps<"/app/testeur">) {
  const params = await searchParams;
  const user = await requireUser("/app/testeur");
  if (!isTester(user)) notFound();
  const t = await getTranslations();
  const [plans, { organization, partner }, talentPlan] = await Promise.all([
    testerPlans(db),
    testerOrganizations(db, user.id),
    resolvePlan(db, { type: "user", id: user.id }),
  ]);
  const orgPlan = organization
    ? await resolvePlan(db, { type: "organization", id: organization.id })
    : null;
  const isAdmin = (ADMIN_ROLES as readonly string[]).includes(user.platformRole);
  const savedPlan = plans.find((plan) => plan.code === params.ok);
  const of = (family: Plan["family"]) => plans.filter((plan) => plan.family === family);
  const labels: Labels = {
    current: t("tester.current"),
    choose: t("tester.choose"),
    reset: t("tester.reset"),
    free: t("tester.free"),
    onQuote: t("tester.onQuote"),
    price: (cents) => t("common.priceMonthly", { price: formatUsd(cents) }),
  };

  return (
    <div className="t-flux">
      <FlowHead back="/app/compte" backLabel={t("tester.back")} title={t("tester.title")} />
      {savedPlan && <Notice tone="ok">{t("tester.saved", { plan: savedPlan.name })}</Notice>}
      {(params.cree === "company" || params.cree === "partner") && (
        <Notice tone="ok">{t("tester.created")}</Notice>
      )}
      {params.erreur && <Notice tone="err">{t("tester.error")}</Notice>}
      <p className="t-gar">
        <TalentIcon name="cadenas" size="s" />
        <span>{t("tester.notice")}</span>
      </p>

      <Section id="talent" title={t("tester.talent.title")} text={t("tester.talent.text")}>
        <Plans plans={of("talent")} current={talentPlan?.planCode} side="talent" labels={labels} />
        <Action action={openPersonalSpace} icon="profil" label={t("tester.talent.open")} />
      </Section>

      <Section id="organization" title={t("tester.org.title")} text={t("tester.org.text")}>
        {organization ? (
          <>
            {(["rh", "company"] as const).map((family) => (
              <Plans
                key={family}
                title={t(`tester.org.family.${family}`)}
                plans={of(family)}
                current={orgPlan?.planCode}
                side="organization"
                labels={labels}
              />
            ))}
            <Action
              action={openTesterSpace}
              kind="company"
              icon="entreprise"
              label={t("tester.org.open", { name: organization.name })}
            />
          </>
        ) : (
          <>
            <p className="t-aide-c">{t("tester.org.empty")}</p>
            <Action
              action={createTesterSpace}
              kind="company"
              icon="plus"
              label={t("tester.org.create")}
            />
          </>
        )}
      </Section>

      <Section id="partner" title={t("tester.partner.title")} text={t("tester.partner.text")}>
        {partner ? (
          <Action
            action={openTesterSpace}
            kind="partner"
            icon="entreprise"
            label={t("tester.partner.open", { name: partner.name })}
          />
        ) : (
          <Action
            action={createTesterSpace}
            kind="partner"
            icon="plus"
            label={t("tester.partner.create")}
          />
        )}
      </Section>

      <Section id="admin" title={t("tester.admin.title")} text={t("tester.admin.text")}>
        {isAdmin ? (
          <Link href="/admin" className="t-bt t-sec t-pl t-press">
            {t("tester.admin.open")}
          </Link>
        ) : (
          <p className="t-aide-c">{t("tester.admin.missing")}</p>
        )}
      </Section>
    </div>
  );
}

function Section({
  id,
  title,
  text,
  children,
}: {
  id: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`testeur-${id}`} className="t-flux t-testeur">
      <div>
        <h2 id={`testeur-${id}`} className="t-h2s">
          {title}
        </h2>
        <p className="t-aide-c">{text}</p>
      </div>
      {children}
    </section>
  );
}

function Plans({
  title,
  plans,
  current,
  side,
  labels,
}: {
  title?: string;
  plans: Plan[];
  current: string | undefined;
  side: "talent" | "organization";
  labels: Labels;
}) {
  return (
    <>
      {title && <span className="t-ck-t">{title}</span>}
      <ul aria-label={title} className="t-verre t-liste t-lignes">
        {plans.map((plan) => {
          const active = plan.code === current;
          return (
            <li key={plan.code}>
              <form action={chooseTesterPlan}>
                <input type="hidden" name="plan" value={plan.code} />
                <input type="hidden" name="side" value={side} />
                <button
                  type="submit"
                  className="t-li t-press"
                  aria-label={`${plan.name} · ${active ? labels.reset : labels.choose}`}
                >
                  <span className="t-t">
                    <b>{plan.name}</b>
                    <span>
                      {plan.priceCents === null
                        ? labels.onQuote
                        : plan.priceCents === 0
                          ? labels.free
                          : labels.price(plan.priceCents)}
                    </span>
                  </span>
                  {active ? (
                    <span className="t-st t-pre">{labels.current}</span>
                  ) : (
                    <span className="t-v">{labels.choose}</span>
                  )}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Action({
  action,
  kind,
  icon,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  kind?: "company" | "partner";
  icon: TalentIconName;
  label: string;
}) {
  return (
    <form action={action}>
      {kind && <input type="hidden" name="kind" value={kind} />}
      <button type="submit" className="t-bt t-sec t-pl t-press">
        <TalentIcon name={icon} size="s" />
        {label}
      </button>
    </form>
  );
}
