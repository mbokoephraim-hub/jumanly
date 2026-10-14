import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
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
 */
export default async function ActivatePage({ searchParams }: PageProps<"/activer">) {
  const t = await getTranslations("activate");
  return (
    <section className="bg-creme">
      <div className="mx-auto flex max-w-xl flex-col gap-6 page-x py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-h1">{t("title")}</h1>
          <p className="text-ardoise">{t("subtitle")}</p>
        </header>
        <Suspense fallback={<Skeleton className="h-80 rounded-card" />}>
          <Activation searchParams={searchParams} />
        </Suspense>
        <p className="text-sm text-ardoise">{t("help")}</p>
      </div>
    </section>
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

  const codeForm = (
    <form method="get" action="/activer" className="flex flex-col gap-4 rounded-card bg-blanc p-6">
      <TextField
        id="activate-code"
        name="code"
        label={t("code.label")}
        placeholder={t("code.placeholder")}
        hint={t("code.help")}
        defaultValue={code}
        autoComplete="off"
        autoCapitalize="characters"
        required
      />
      <Button type="submit" className="self-start">
        {t("submit")}
      </Button>
    </form>
  );

  if (!found) {
    return (
      <>
        {error && <Alert tone="error" title={errorText(error)} />}
        {codeForm}
      </>
    );
  }
  if (!found.ok) {
    const startDate = found.startDate ? formatDate(found.startDate) : "";
    return (
      <>
        <Alert
          tone="error"
          title={
            found.error === "notYet" ? t("error.notYet", { startDate }) : errorText(found.error)
          }
        />
        {!token && codeForm}
      </>
    );
  }

  const endDate = formatDate(licenseEnd(new Date(), found.months, found.batchEnd));
  return (
    <div className="flex flex-col gap-4 rounded-card bg-blanc p-6">
      {error && <Alert tone="error" title={errorText(error)} />}
      <h2 className="text-h2">
        {token ? t("invite.title", { sponsorName: found.sponsorName }) : t("preview.title")}
      </h2>
      {token ? (
        <p>{t("invite.text", { sponsorName: found.sponsorName, plan: found.planName, endDate })}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          <li>{t("preview.sponsor", { sponsorName: found.sponsorName })}</li>
          <li>{t("preview.plan", { plan: found.planName })}</li>
          <li>{t("preview.months", { months: found.months, endDate })}</li>
        </ul>
      )}
      <p className="font-medium text-feuille-fonce">{t("preview.free")}</p>
      <p className="text-sm text-ardoise">
        {t("preview.privacy", { sponsorName: found.sponsorName })}
      </p>
      {user ? (
        <form action={activateLicenseAction} className="flex flex-wrap gap-3">
          {token ? (
            <input type="hidden" name="lien" value={token} />
          ) : (
            <input type="hidden" name="code" value={code} />
          )}
          <Button type="submit">{t("preview.confirm")}</Button>
          <ButtonLink href="/activer" variant="tertiary">
            {t("change")}
          </ButtonLink>
        </form>
      ) : (
        <div className="flex flex-col gap-3 rounded-md bg-creme p-4">
          <h3 className="font-semibold">{t("loginRequired.title")}</h3>
          <p className="text-sm">{t("loginRequired.text")}</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/connexion?${new URLSearchParams({ suite })}`}>
              {t("loginRequired.login")}
            </ButtonLink>
            <ButtonLink href={`/inscription?${new URLSearchParams({ suite })}`} variant="secondary">
              {t("loginRequired.signup")}
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
