import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import {
  AdminSignup,
  type PlanOption,
  type SignupData,
} from "@/components/entreprise/admin-signup";
import { DesktopOnly } from "@/components/entreprise/desktop-only";
import { pickMessages } from "@/i18n/client-messages";
import { SIGNUP_SECTORS } from "@/lib/entreprise";
import { pageMetadata } from "@/lib/seo";
import { enabledProviders } from "@/server/auth";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { getPublicPlans } from "@/server/queries/public";
import { pendingSocialSignup } from "@/server/services/accounts";
import {
  adminSignupState,
  companyDomain,
  readAdminStep,
  signupContext,
  signupPlanChoices,
  sizeKeyOf,
  teamPlan,
  type AdminSignupStep,
} from "@/server/services/admin-signup";
import { limitOf } from "@/server/services/plans";
import { readSignupFlow } from "@/server/signup-flow";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminSignup.seo");
  return pageMetadata({
    path: "/inscription/entreprise",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

/**
 * Inscription de l'administrateur d'entreprise (Modèle B, étape 3 A1, captures 020 à 029) :
 * formule, compte, code, rôle, entreprise, logo, vérification, paiement, équipe, puis « prêt ».
 * Réservée à l'ordinateur : sur un téléphone, « À ouvrir sur un ordinateur ».
 */
export default function AdminSignupPage({ searchParams }: PageProps<"/inscription/entreprise">) {
  return (
    <Suspense fallback={<div className="ae" />}>
      <AdminSignupScreen searchParams={searchParams} />
    </Suspense>
  );
}

const ACCOUNT_STEPS: AdminSignupStep[] = ["forfait", "compte", "code"];

async function AdminSignupScreen({
  searchParams,
}: Pick<PageProps<"/inscription/entreprise">, "searchParams">) {
  const query = await searchParams;
  const one = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : "");
  const messages = await getMessages();
  const provide = (children: React.ReactNode) => (
    <NextIntlClientProvider
      messages={pickMessages(messages, ["adminSignup", "desktopOnly", "auth"])}
    >
      {children}
    </NextIntlClientProvider>
  );
  if (await isPhone()) return provide(<DesktopOnly variant="signup" />);

  let step = readAdminStep(one("etape"));
  const flow = await readSignupFlow();
  const session = await getSession();
  const signup = session ? await signupContext(db, session.user.id) : null;
  const social = session && !signup ? await pendingSocialSignup(db, session.user.id) : false;

  if (session && !signup) {
    // Un compte créé avec Google, Apple ou LinkedIn nomme l'entreprise ; un autre compte n'a rien
    // à créer ici.
    if (!social) redirect("/app");
    if (step !== "forfait") step = "compte";
  } else if (signup && ACCOUNT_STEPS.includes(step)) {
    redirect("/inscription/entreprise?etape=role");
  } else if (!session && !ACCOUNT_STEPS.includes(step)) {
    redirect("/inscription/entreprise?etape=forfait");
  }
  if (step === "code" && (!flow.email || session)) redirect("/inscription/entreprise?etape=compte");

  const t = await getTranslations();
  const choices = signupPlanChoices(await getPublicPlans());
  const suggested = teamPlan(choices);
  const free = choices.find((item) => item.priceCents === 0);
  const selectable = (code?: string) =>
    choices.find((item) => item.code === code && item.priceCents !== null)?.code;
  // Avant le compte, la formule vient de l'adresse ; ensuite, du parcours (absente = gratuite).
  const plan = signup
    ? (selectable(flow.plan) ?? free?.code ?? "")
    : (selectable(one("forfait")) ?? selectable(flow.plan) ?? suggested?.code ?? free?.code ?? "");
  const plans: PlanOption[] = choices.map((item) => {
    const quote = item.priceCents === null;
    const users = limitOf(item, quote ? "org.seats.min" : "org.seats");
    return {
      code: item.code,
      name: item.name,
      priceCents: item.priceCents,
      users: users !== null && users >= 0 ? users : null,
      jobs: quote ? null : limitOf(item, "jobs.active.max"),
      recommended: item.code === suggested?.code,
      extra: t.has(`adminSignup.plan.extra.${item.code}` as "adminSignup.plan.extra.company")
        ? t(`adminSignup.plan.extra.${item.code}` as "adminSignup.plan.extra.company")
        : "",
    };
  });

  let org: SignupData["org"] = null;
  let current: SignupData["current"] = null;
  if (signup) {
    const state = await adminSignupState(db, signup.ctx);
    const sector =
      SIGNUP_SECTORS.find(
        (key) => t(`adminSignup.company.sectors.${key}`) === state.organization.sector,
      ) ?? "";
    org = {
      name: state.organization.name,
      sector,
      size: sizeKeyOf(state.organization.size) ?? "",
      city: state.organization.city ?? "",
      website: state.organization.website ?? "",
      description: state.organization.description ?? "",
      logo: state.organization.logo,
      banner: state.organization.banner,
      bannerTheme: state.organization.bannerTheme ?? "sapin",
      verification: state.organization.verifiedAt
        ? "verified"
        : state.organization.verificationStatus === "none"
          ? "none"
          : "pending",
      documents: state.documents,
      jobTitle: state.jobTitle,
    };
    current = {
      planName: state.planName,
      paid: !!state.paidUntil,
      paidUntil: state.paidUntil?.toISOString() ?? null,
      seatsMax: state.seats.max,
      seatsUsed: state.seats.used,
      pendingInvites: state.seats.pending,
    };
  }

  const email = session?.user.email ?? flow.email ?? "";
  const data: SignupData = {
    step,
    plan,
    plans,
    providers: enabledProviders().map((id) => ({ id, label: t(`access.provider.${id}`) })),
    social: social && session ? { email: session.user.email } : null,
    email,
    domain: companyDomain(email),
    org,
    current,
    error: one("erreur") || undefined,
  };
  return provide(
    <>
      <AdminSignup key={step} data={data} />
      <div className="ae-ordi">
        <DesktopOnly variant="signup" />
      </div>
    </>,
  );
}
