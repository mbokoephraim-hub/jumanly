import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PlanPicker, type PlanChoice } from "@/components/talent/billing/plan-picker";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { dynamic, numbered } from "@/i18n/dynamic";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { AI_CREDITS_KEY } from "@/server/ai";
import { cancelSubscription, resumeSubscription } from "@/server/actions/billing";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { parseLimit, resolvePlan } from "@/server/entitlements";
import { effectiveStatus } from "@/server/entitlements/periods";
import { liveSubscription } from "@/server/services/subscriptions";
import { inOrganizationSpace } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("formules");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * Formules (planche talent-4 § 7): the public talent plans of the database, their price and what
 * they give (entitlements and texts of the plan, never its name in code). A dearer plan is paid
 * now; a cheaper one takes over at the end of the paid period; the free plan = not renewing.
 */
export default async function PlansPage({ searchParams }: PageProps<"/app/abonnement/formules">) {
  const params = await searchParams;
  const user = await requireUser("/app/abonnement/formules");
  if (await inOrganizationSpace(user.id)) redirect("/app/abonnement");
  const t = await getTranslations();
  const d = dynamic(t);
  const now = new Date();
  const subject = { type: "user" as const, id: user.id };
  const [plan, current, plans] = await Promise.all([
    resolvePlan(db, subject, now),
    liveSubscription(db, subject, now),
    db.plan.findMany({
      where: { family: "talent", active: true, isPublic: true },
      orderBy: { sortOrder: "asc" },
      include: { entitlements: true },
    }),
  ]);
  const status = current ? effectiveStatus(current, now) : null;
  const paid = !!current && status !== "trialing" && status !== "sponsored";
  const canceled = !!current && (status === "canceled" || current.cancelAtPeriodEnd);
  const currentPrice = plan?.priceCents ?? 0;
  const free = plans.find((item) => item.priceCents === 0);
  const yearly = plans.some((item) => item.interval === "year");
  const period = yearly && params.periode === "annuel" ? "year" : "month";
  const end = current ? formatDate(current.currentPeriodEnd) : "";

  const choices: PlanChoice[] = plans
    .filter((item) => (item.priceCents ?? 0) > 0 && item.interval === period)
    .map((item) => {
      const values = Object.fromEntries(item.entitlements.map((row) => [row.key, row.value]));
      const credits = parseLimit(values[AI_CREDITS_KEY]);
      const text = parseLimit(values["career.interview.text.monthly"]);
      const voice = parseLimit(values["career.interview.voice.monthly"]);
      const quota = [
        credits < 0
          ? t("formules.creditsUnlimited")
          : credits > 0
            ? t("formules.credits", { count: credits })
            : null,
        text > 0
          ? [
              t("formules.interviews", { text }),
              voice > 0 ? t("formules.interviewsVoice", { voice }) : null,
            ]
              .filter(Boolean)
              .join(", ")
          : null,
      ]
        .filter(Boolean)
        .join(", ");
      const features = numbered(d, `${item.contentKey}.f`, {}).slice(0, quota ? 2 : 3);
      const price = item.priceCents ?? 0;
      const isCurrent = item.id === plan?.planId;
      const action: PlanChoice["action"] =
        isCurrent && paid && !current?.pendingPlan
          ? {
              kind: "pay",
              label: t("formules.cta.renew", { plan: item.name }),
              href: `/app/abonnement/payer?forfait=${item.code}`,
            }
          : isCurrent
            ? { kind: "none", label: t("formules.cta.current") }
            : !item.isPurchasable
              ? { kind: "none", label: t("paiement.unavailable") }
              : price < currentPrice && paid
                ? {
                    kind: "downgrade",
                    label: t("formules.cta.downgrade", { plan: item.name, date: end }),
                    note: t("formules.downgrade.note", { plan: item.name, date: end }),
                  }
                : {
                    kind: "pay",
                    label: t("formules.cta.upgrade", { plan: item.name }),
                    href: `/app/abonnement/payer?forfait=${item.code}`,
                  };
      return {
        code: item.code,
        name: item.name,
        price: t("abonnement.amount", { amount: formatUsd(price) }),
        per: period === "year" ? t("formules.perYear") : t("formules.perMonth"),
        badge:
          item.recommended && isCurrent
            ? t("formules.recommendedYours")
            : item.recommended
              ? t("formules.recommended")
              : isCurrent
                ? t("formules.yours")
                : null,
        lines: [quota, ...features].filter((line): line is string => Boolean(line)),
        current: isCurrent,
        action,
      };
    });
  // The plan pre-selected: the one asked for (`?formule=`), else the next one up, else the first.
  const asked = choices.find((choice) => choice.code === params.formule);
  const next = choices.find(
    (choice) => (plans.find((item) => item.code === choice.code)?.priceCents ?? 0) > currentPrice,
  );
  const selected = (asked ?? next ?? choices[0])?.code ?? "";

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/abonnement"
        backLabel={t("formules.back")}
        title={t("formules.title")}
        end={
          <Link href="/app/abonnement" className="t-bi t-press" aria-label={t("formules.close")}>
            <TalentIcon name="fermer" size="s" />
          </Link>
        }
      />
      {yearly && (
        <nav aria-label={t("formules.period.aria")} className="t-seg">
          <Link
            href="/app/abonnement/formules"
            aria-current={period === "month" ? "page" : undefined}
          >
            {t("formules.period.month")}
          </Link>
          <Link
            href="/app/abonnement/formules?periode=annuel"
            aria-current={period === "year" ? "page" : undefined}
          >
            {t("formules.period.year")}
          </Link>
        </nav>
      )}
      {choices.length === 0 ? (
        <p className="t-gar">{t("formules.empty")}</p>
      ) : (
        <PlanPicker
          plans={choices}
          initial={selected}
          label={t("formules.list.aria")}
          applyFree={t("formules.applyFree")}
        />
      )}
      {free && paid && !canceled && (
        <form action={cancelSubscription} className="t-fin-formule">
          <input type="hidden" name="family" value="talent" />
          <input type="hidden" name="back" value="/app/abonnement" />
          <p className="t-aide-c">{t("formules.free.text", { date: end })}</p>
          <button type="submit" className="t-bt t-txt t-s t-press">
            {t("formules.free.cta", { plan: free.name })}
          </button>
        </form>
      )}
      {canceled && (
        <form action={resumeSubscription} className="t-fin-formule">
          <input type="hidden" name="family" value="talent" />
          <input type="hidden" name="back" value="/app/abonnement" />
          <p className="t-aide-c">{t("formules.resume.text", { date: end })}</p>
          <button type="submit" className="t-bt t-txt t-s t-press">
            {t("formules.resume.cta")}
          </button>
        </form>
      )}
    </div>
  );
}
