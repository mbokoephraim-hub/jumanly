import "server-only";
import { getTranslations } from "next-intl/server";
import { InstallApp } from "@/components/site/install-app";
import { dynamic } from "@/i18n/dynamic";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { paymentProvider } from "@/server/payments";
import { NOTIFICATION_CATEGORIES } from "@/server/services/notifications";
import { hireMemberships } from "@/server/services/organization";
import { liveSubscription, localMask, quoteCheckout } from "@/server/services/subscriptions";
import { initialsOf, toneOf } from "../fil/data";
import { PhoneIcon } from "../icon";
import { PhonePay, PhonePayEnd, PhonePayWait, PhonePlans, type PlanCard } from "./billing";
import { CareerTexts } from "./server";
import { NotificationsForm, PhoneHelp, PhoneSettings, PrivacyForm } from "./settings";

/** The only contact of Jumanly (CLAUDE.md § 8): by e-mail, never by phone. */
export const CONTACT_EMAIL = "assistant@jumanly.io";

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  notificationsMuted: string[];
  notificationEmails: boolean;
  newsletter: boolean;
  aiConsentAt: Date | null;
};

/**
 * « Installer l'appli » (Ephraïm, 20/10), kept from the former Compte (lot B9): the browser's own
 * installation on Android, the three gestures of Safari on an iPhone; hidden once installed.
 */
export async function InstallRow() {
  const t = await getTranslations("system.install");
  return (
    <InstallApp
      id="nb-installer"
      buttonClassName="nb-ca-it nb-ca-installer"
      dialogClassName="nb-installer"
      trigger={
        <>
          <span>
            {t("button")}
            <small className="nb-meta">{t("text")}</small>
          </span>
          <PhoneIcon name="chevron" size={18} />
        </>
      }
      steps={
        <>
          <span className="nb-poignee" aria-hidden />
          <div className="nb-installer-h">
            <h2 id="nb-installer-t">{t("ios.title")}</h2>
            <form method="dialog">
              <button type="submit" className="nb-rond" aria-label={t("ios.close")}>
                <PhoneIcon name="fermer" size={20} stroke={2} />
              </button>
            </form>
          </div>
          <p className="nb-meta">{t("ios.intro")}</p>
          <ol aria-label={t("ios.steps")}>
            {(["step1", "step2", "step3"] as const).map((key, index) => (
              <li key={key}>
                <span aria-hidden>{index + 1}</span>
                <span>
                  <b>{t(`ios.${key}.title`)}</b>
                  <small className="nb-meta">{t(`ios.${key}.text`)}</small>
                </span>
              </li>
            ))}
          </ol>
          <form method="dialog">
            <button type="submit" className="nb-bouton" data-plein="" data-large="">
              {t("ios.done")}
            </button>
          </form>
        </>
      }
    />
  );
}

/** « Paramètres » on the phone (planche Carrière-parametres). */
export async function PhoneSettingsScreen({ user }: { user: User }) {
  const t = await getTranslations("phoneCareer.reglages");
  const [plan, memberships] = await Promise.all([
    resolvePlan(db, { type: "user", id: user.id }, new Date()),
    hireMemberships(db, user.id),
  ]);
  return (
    <CareerTexts>
      <PhoneSettings
        name={user.name}
        image={user.image}
        initials={initialsOf(user.name)}
        tone={toneOf(user.name, false)}
        email={user.email}
        plan={plan?.planName ?? t("noPlan")}
        install={<InstallRow />}
        language={t("french")}
        recruiter={memberships.length > 0 ? "open" : "become"}
      />
    </CareerTexts>
  );
}

/** « Confidentialité » on the phone (planche Carrière-confid). */
export async function PhonePrivacyScreen({ user }: { user: User }) {
  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: { visibility: true, matchingEnabled: true, acceptsContactRequests: true },
  });
  return (
    <CareerTexts>
      <PrivacyForm
        initial={{
          visibility: profile?.visibility ?? "recruiters",
          matching: profile?.matchingEnabled ?? true,
          contactRequests: profile?.acceptsContactRequests ?? true,
          ai: user.aiConsentAt !== null,
          newsletter: user.newsletter,
        }}
      />
    </CareerTexts>
  );
}

/** « Notifications » on the phone (planche Carrière-notif). */
export async function PhoneNotificationsScreen({ user }: { user: User }) {
  const muted = new Set(user.notificationsMuted);
  return (
    <CareerTexts>
      <NotificationsForm
        initial={{
          categories: Object.fromEntries(
            NOTIFICATION_CATEGORIES.map((category) => [category, !muted.has(category)]),
          ),
          emails: user.notificationEmails,
        }}
      />
    </CareerTexts>
  );
}

/** « Aide et contact » on the phone (planche Carrière-aide): a few questions, then the e-mail. */
export function PhoneHelpScreen({
  questions,
}: {
  questions: { id: string; question: string; answer: string }[];
}) {
  return (
    <CareerTexts>
      <PhoneHelp email={CONTACT_EMAIL} questions={questions} />
    </CareerTexts>
  );
}

/**
 * « Ma formule » on the phone (planche Carrière-abonnement): the public talent plans of the
 * database (their name and tagline, never a name in code). A dearer plan is paid now; a cheaper
 * one goes through the plans' page, which explains when it starts.
 */
export async function PhonePlansScreen({ userId }: { userId: string }) {
  const t = await getTranslations("phoneCareer.billing");
  const now = new Date();
  const subject = { type: "user" as const, id: userId };
  const [plan, plans] = await Promise.all([
    resolvePlan(db, subject, now),
    db.plan.findMany({
      where: { family: "talent", active: true, isPublic: true, interval: "month" },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const currentPrice = plan?.priceCents ?? 0;
  const cards: PlanCard[] = plans.map((item) => {
    const price = item.priceCents ?? 0;
    const current = item.code === plan?.planCode || (!plan && price === 0);
    return {
      code: item.code,
      name: item.name,
      price: price === 0 ? t("free") : t("perMonth", { amount: formatUsd(price) }),
      text: item.tagline,
      current,
      href: current
        ? null
        : price > currentPrice && item.isPurchasable
          ? `/app/abonnement/payer?forfait=${item.code}`
          : `/app/abonnement/formules?formule=${item.code}`,
    };
  });
  return (
    <CareerTexts>
      <PhonePlans intro={t("intro", { plan: plan?.planName ?? t("free") })} plans={cards} />
    </CareerTexts>
  );
}

/**
 * « Paiement » on the phone (planches Carrière-paiement, -valider, -ok): the order and Mobile
 * Money, then the provider's answer on the same address (`&paiement=`). `null` when the phone
 * screens cannot show it (no provider, a card only, a trial): the page shows its own.
 */
export async function PhonePayScreen({
  userId,
  plan,
  paymentId,
}: {
  userId: string;
  plan: { code: string; name: string };
  paymentId: string | undefined;
}) {
  const t = await getTranslations();
  const d = dynamic(t);
  const now = new Date();
  const subject = { type: "user" as const, id: userId };
  const provider = paymentProvider();
  const amount = (cents: number) => t("abonnement.amount", { amount: formatUsd(cents) });
  const opName = (operator: string | null) =>
    operator && d.has(`checkout.mm.operators.${operator}`)
      ? d(`checkout.mm.operators.${operator}`)
      : (operator ?? "");

  if (paymentId) {
    const payment = await db.payment.findFirst({
      where: { id: paymentId, subjectType: subject.type, subjectId: subject.id },
    });
    if (!payment) return null;
    const retry = `/app/abonnement/payer?forfait=${plan.code}`;
    if (payment.status === "pending")
      return (
        <CareerTexts>
          <PhonePayWait
            paymentId={payment.id}
            back={retry}
            text={t("phoneCareer.billing.validateText", {
              operator: opName(payment.operator),
              amount: amount(payment.amountCents),
            })}
          />
        </CareerTexts>
      );
    if (payment.status === "succeeded")
      return (
        <CareerTexts>
          <PhonePayEnd
            ok
            title={t("phoneCareer.billing.welcome", { plan: plan.name })}
            text={t("phoneCareer.billing.welcomeText", {
              date: formatDate(payment.periodEnd),
            })}
            primary={{ href: "/app/career/cv", label: t("phoneCareer.billing.backCareer") }}
          />
        </CareerTexts>
      );
    return (
      <CareerTexts>
        <PhonePayEnd
          ok={false}
          title={
            payment.status === "failed" ? t("paiement.failed.title") : t("paiement.expired.title")
          }
          text={t("paiement.debited", {
            email: CONTACT_EMAIL,
            reference: payment.providerRef ?? "",
          })}
          primary={{ href: retry, label: t("paiement.retry") }}
          secondary={{ href: "/app/abonnement", label: t("paiement.keep") }}
        />
      </CareerTexts>
    );
  }

  if (!provider?.methods.includes("mobile_money")) return null;
  const quote = await quoteCheckout(db, subject, plan.code, now);
  if (!quote || quote.kind === "downgrade") return null;
  const lastPayments = await db.payment.findMany({
    where: {
      ...{ subjectType: subject.type, subjectId: subject.id },
      method: "mobile_money",
      status: "succeeded",
    },
    orderBy: { createdAt: "desc" },
    select: { operator: true, msisdnMasked: true },
    take: 10,
  });
  const operators = (provider.operators ?? []).map((code) => {
    const name = opName(code);
    const last = lastPayments.find((item) => item.operator === code && item.msisdnMasked);
    return {
      code,
      name,
      initials: name
        .split(/\s+/)
        .map((word) => word[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      last: last?.msisdnMasked ? localMask(last.msisdnMasked) : null,
    };
  });
  const current = await liveSubscription(db, subject, now);
  return (
    <CareerTexts>
      <PhonePay
        plan={plan.code}
        planName={plan.name}
        total={amount(quote.totalCents)}
        period={
          quote.creditCents > 0
            ? t("paiement.credit", {
                credit: amount(quote.creditCents),
                plan: current?.plan.name ?? "",
              })
            : t("paiement.period", {
                start: formatDate(quote.periodStart),
                end: formatDate(quote.periodEnd),
              })
        }
        operators={operators}
        fake={provider.id === "fake"}
      />
    </CareerTexts>
  );
}
