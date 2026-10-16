import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { pillClass } from "@/components/career/kit";
import { Alert } from "@/components/ui";
import { cx } from "@/lib/cx";
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

/**
 * « Mode testeur » (docs/decisions/2026-10-16-compte-passe-partout.md): the accounts listed in
 * TESTER_EMAILS switch their talent plan and their test organization's plan without paying.
 * Anyone else gets a 404.
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
    <div className="jm-page flex flex-col gap-5 lg:gap-6">
      <AppPageHeader
        eyebrow={t("tester.eyebrow")}
        title={t("tester.title")}
        subtitle={t("tester.subtitle")}
      />
      {savedPlan && <Alert tone="success" title={t("tester.saved", { plan: savedPlan.name })} />}
      {(params.cree === "company" || params.cree === "partner") && (
        <Alert tone="success" title={t("tester.created")} />
      )}
      {params.erreur && <Alert tone="error" title={t("tester.error")} />}
      <Alert tone="info" title={t("tester.notice")} />

      <Section id="talent" title={t("tester.talent.title")} text={t("tester.talent.text")}>
        <PlanGrid
          plans={of("talent")}
          current={talentPlan?.planCode}
          side="talent"
          labels={labels}
        />
        <form action={openPersonalSpace}>
          <button type="submit" className={pillClass("outline", "sm")}>
            {t("tester.talent.open")}
          </button>
        </form>
      </Section>

      <Section id="organization" title={t("tester.org.title")} text={t("tester.org.text")}>
        {organization ? (
          <>
            {(["rh", "company"] as const).map((family) => (
              <div key={family} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-ardoise">
                  {t(`tester.org.family.${family}`)}
                </h3>
                <PlanGrid
                  plans={of(family)}
                  current={orgPlan?.planCode}
                  side="organization"
                  labels={labels}
                />
              </div>
            ))}
            <form action={openTesterSpace}>
              <input type="hidden" name="kind" value="company" />
              <button type="submit" className={pillClass("outline", "sm")}>
                {t("tester.org.open", { name: organization.name })}
              </button>
            </form>
          </>
        ) : (
          <CreateSpace kind="company" text={t("tester.org.empty")} cta={t("tester.org.create")} />
        )}
      </Section>

      <Section id="partner" title={t("tester.partner.title")} text={t("tester.partner.text")}>
        {partner ? (
          <form action={openTesterSpace}>
            <input type="hidden" name="kind" value="partner" />
            <button type="submit" className={pillClass("outline", "sm")}>
              {t("tester.partner.open", { name: partner.name })}
            </button>
          </form>
        ) : (
          <CreateSpace kind="partner" cta={t("tester.partner.create")} />
        )}
      </Section>

      <Section id="admin" title={t("tester.admin.title")} text={t("tester.admin.text")}>
        {isAdmin ? (
          <Link href="/admin" className={pillClass("dark", "sm", "self-start")}>
            {t("tester.admin.open")}
          </Link>
        ) : (
          <p className="text-sm text-ardoise">{t("tester.admin.missing")}</p>
        )}
      </Section>
    </div>
  );
}

type Labels = {
  current: string;
  choose: string;
  reset: string;
  free: string;
  onQuote: string;
  price: (cents: number) => string;
};

function Section({
  id,
  title,
  text,
  children,
}: {
  id: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`testeur-${id}`}
      className="flex scroll-mt-24 flex-col gap-4 rounded-[24px] border border-sapin/8 bg-blanc p-5 lg:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id={`testeur-${id}`} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="text-sm text-ardoise">{text}</p>
      </div>
      {children}
    </section>
  );
}

function PlanGrid({
  plans,
  current,
  side,
  labels,
}: {
  plans: Plan[];
  current: string | undefined;
  side: "talent" | "organization";
  labels: Labels;
}) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => {
        const active = plan.code === current;
        return (
          <li
            key={plan.code}
            className={cx(
              "flex flex-col gap-3 rounded-[18px] border p-4",
              active ? "border-sapin bg-creme" : "border-sapin/8",
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">{plan.name}</span>
              <span className="text-xs text-ardoise">
                {plan.priceCents === null
                  ? labels.onQuote
                  : plan.priceCents === 0
                    ? labels.free
                    : labels.price(plan.priceCents)}
              </span>
              {active && (
                <span className="text-xs font-semibold text-feuille-fonce">{labels.current}</span>
              )}
            </div>
            <form action={chooseTesterPlan} className="mt-auto">
              <input type="hidden" name="plan" value={plan.code} />
              <input type="hidden" name="side" value={side} />
              <button
                type="submit"
                className={pillClass(active ? "outline" : "lime", "sm", "w-full justify-center")}
              >
                {active ? labels.reset : labels.choose}
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}

function CreateSpace({
  kind,
  text,
  cta,
}: {
  kind: "company" | "partner";
  text?: string;
  cta: string;
}) {
  return (
    <form action={createTesterSpace} className="flex flex-col items-start gap-2">
      {text && <p className="text-sm">{text}</p>}
      <input type="hidden" name="kind" value={kind} />
      <button type="submit" className={pillClass("lime", "sm")}>
        {cta}
      </button>
    </form>
  );
}
