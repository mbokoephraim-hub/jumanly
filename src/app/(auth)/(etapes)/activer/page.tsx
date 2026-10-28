import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading } from "@/components/auth/auth-card";
import { Icon, type IconName } from "@/components/brand/icon";
import { Alert, Button, ButtonLink, Skeleton, TextField } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/seo";
import { activateLicenseAction } from "@/server/actions/partners";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { findOffer, licenseEnd } from "@/server/services/partners";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("activate.seo");
  return {
    ...pageMetadata({ path: "/activer", title: t("title"), description: t("description") }),
    robots: { index: false },
  };
}

/**
 * Activation of a Partners licence (partie 06 § 6.8): a code (`?code=`) or an invitation link
 * (`?lien=`). The offer is shown to anyone holding the code; activating needs a session.
 * Mockup 02-10.
 */
export default function ActivatePage({ searchParams }: PageProps<"/activer">) {
  return (
    <Suspense fallback={<Skeleton className="h-80 w-full max-w-[520px] rounded-card" />}>
      <Activation searchParams={searchParams} />
    </Suspense>
  );
}

const param = (value: string | string[] | undefined, max: number) =>
  typeof value === "string" ? value.slice(0, max) : "";

async function Activation({ searchParams }: Pick<PageProps<"/activer">, "searchParams">) {
  const query = await searchParams;
  // The offer depends on today's date (programme started, code expired).
  await connection();
  const t = await getTranslations("activate");
  const code = param(query.code, 40);
  const token = param(query.lien, 64);
  const error = param(query.erreur, 30);
  const user = await getCurrentUser();
  const found = code || token ? await findOffer(db, token ? { token } : { code }) : null;
  const offerQuery = new URLSearchParams(token ? { lien: token } : { code });
  const suite = `/activer?${offerQuery}`;

  const errorText = (name: string) => {
    switch (name) {
      case "notYet":
        return t("error.notYet", { startDate: param(query.debut, 10) });
      case "emailMismatch":
        return t("error.emailMismatch", { maskedEmail: param(query.adresse, 80) });
      case "tooManyAttempts":
        return t("error.tooManyAttempts", { minutes: 15 });
      case "used":
      case "expired":
      case "exhausted":
      case "alreadyActive":
        return t(`error.${name}`);
      default:
        return t("error.invalid");
    }
  };

  const codeForm = (fieldError?: string) => (
    <form method="get" action="/activer" className="flex flex-col gap-4">
      <TextField
        id="activate-code"
        name="code"
        icon="lock"
        label={t("code.label")}
        placeholder={t("code.placeholder")}
        hint={t("code.help")}
        defaultValue={code}
        autoComplete="off"
        autoCapitalize="characters"
        className="font-semibold tracking-[0.08em] uppercase placeholder:font-normal placeholder:tracking-normal placeholder:normal-case"
        error={fieldError}
        required
      />
      <Button type="submit" size="lg" fullWidth>
        {t("submit")}
      </Button>
    </form>
  );

  const heading = (
    <AuthHeading icon="certificat" tone="menthe" title={t("title")} subtitle={t("subtitle")} />
  );
  const help = <p className="text-center text-xs leading-[17px] text-ardoise">{t("help")}</p>;

  if (!found) {
    return (
      <AuthCard className="jm-rise lg:pt-6">
        {heading}
        {codeForm(error ? errorText(error) : undefined)}
        {help}
      </AuthCard>
    );
  }
  if (!found.ok) {
    const startDate = found.startDate ? formatDate(found.startDate) : "";
    const message =
      found.error === "notYet" ? t("error.notYet", { startDate }) : errorText(found.error);
    return (
      <AuthCard className="jm-rise lg:pt-6">
        {heading}
        {token ? <Alert tone="error" title={message} /> : codeForm(message)}
        {help}
      </AuthCard>
    );
  }

  const endDate = formatDate(licenseEnd(new Date(), found.months, found.batchEnd));
  const sponsorInitials = found.sponsorName
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^\p{Lu}/u.test(word))
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const facts: { icon: IconName; text: string }[] = [
    { icon: "etoile", text: t("preview.plan", { plan: found.planName }) },
    { icon: "calendrier", text: t("preview.months", { months: found.months, endDate }) },
    { icon: "portefeuille", text: t("preview.free") },
  ];
  return (
    <AuthCard className="jm-rise lg:pt-6">
      {heading}
      {!token && (
        <TextField
          id="activate-code"
          label={t("code.label")}
          icon="lock"
          value={code}
          hint={t("code.help")}
          readOnly
          required
          className="font-semibold tracking-[0.08em] uppercase ring-feuille"
        />
      )}
      <section className="flex flex-col gap-4 rounded-[24px] bg-blanc p-5 ring-[1.5px] ring-lime ring-inset lg:p-[22px]">
        {error && <Alert tone="error" title={errorText(error)} />}
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-feuille-fonce text-base font-bold text-blanc"
          >
            {sponsorInitials}
          </span>
          <div className="flex flex-col">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
              {t("preview.title")}
            </p>
            <h2 className="text-lg leading-6 font-bold">
              {token
                ? t("invite.title", { sponsorName: found.sponsorName })
                : t("preview.sponsor", { sponsorName: found.sponsorName })}
            </h2>
          </div>
        </div>
        {token ? (
          <p className="text-sm">
            {t("invite.text", { sponsorName: found.sponsorName, plan: found.planName, endDate })}
          </p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {facts.map((fact) => (
              <li key={fact.icon} className="flex items-center gap-2.5">
                <Icon name={fact.icon} className="size-4 shrink-0 text-feuille-fonce" />
                {fact.text}
              </li>
            ))}
          </ul>
        )}
        <p className="flex items-start gap-2.5 rounded-[14px] bg-creme px-4 py-3 text-xs leading-[17px]">
          <Icon name="lock" className="mt-px size-4 shrink-0" />
          {t("preview.privacy", { sponsorName: found.sponsorName })}
        </p>
        {user ? (
          <form action={activateLicenseAction} className="flex gap-2.5">
            {token ? (
              <input type="hidden" name="lien" value={token} />
            ) : (
              <input type="hidden" name="code" value={code} />
            )}
            <Button type="submit" size="lg" className="flex-1">
              {t("preview.confirm")}
            </Button>
            <ButtonLink href="/activer" variant="tertiary" size="lg">
              {t("preview.cancel")}
            </ButtonLink>
          </form>
        ) : (
          <div className="flex flex-col gap-3 rounded-[16px] bg-menthe-claire p-4">
            <h3 className="font-semibold">{t("loginRequired.title")}</h3>
            <p className="text-sm">{t("loginRequired.text")}</p>
            <div className="flex flex-wrap gap-2.5">
              <ButtonLink href={`/connexion?${new URLSearchParams({ suite })}`} size="md">
                {t("loginRequired.login")}
              </ButtonLink>
              <ButtonLink
                href={`/inscription?${new URLSearchParams({ suite })}`}
                variant="white"
                size="md"
              >
                {t("loginRequired.signup")}
              </ButtonLink>
            </div>
          </div>
        )}
      </section>
      {!token && (
        // A full reload empties the code field (the rule mistakes /activer for a public page).
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a
          href="/activer"
          className="text-center text-[13px] font-semibold text-sapin hover:underline"
        >
          {t("change")}
        </a>
      )}
      {help}
    </AuthCard>
  );
}
