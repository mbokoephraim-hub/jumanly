import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { Badge, ButtonLink, EmptyState } from "@/components/ui";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { myCertificates } from "@/server/services/learn";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn.certificates");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/** « Mes attestations »: each one with its PDF and its public verification page. */
export default async function CertificatesPage() {
  const user = await requireUser("/app/learn/attestations");
  const t = await getTranslations("learn.certificates");
  const certificates = await myCertificates(db, user.id);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("title")}</h1>
        <p className="max-w-2xl text-[15px] leading-6 text-ardoise">{t("subtitle")}</p>
      </header>
      {certificates.length === 0 ? (
        <EmptyState
          title={t("empty.text")}
          action={
            <ButtonLink href="/app/learn?liste=mes" variant="secondary">
              {t("empty.cta")}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {certificates.map((certificate) => (
            <li key={certificate.id} className="flex flex-col gap-3 rounded-card bg-blanc p-5">
              <Icon name="certificat" duo className="size-10" />
              <h2 className="font-semibold text-h3">{certificate.courseTitle}</h2>
              <p className="text-sm text-ardoise">
                {[
                  t("issued", { date: certificate.issuedAt }),
                  t("number", { code: certificate.code }),
                ].join(" · ")}
              </p>
              {certificate.revokedAt && (
                <Badge tone="error" className="self-start">
                  {t("revoked", { date: certificate.revokedAt })}
                </Badge>
              )}
              <div className="mt-auto flex flex-wrap gap-3">
                {!certificate.revokedAt && (
                  <ButtonLink
                    href={`/app/learn/attestations/${certificate.id}/pdf`}
                    prefetch={false}
                  >
                    {t("download")}
                  </ButtonLink>
                )}
                <ButtonLink href={`/attestations/${certificate.code}`} variant="tertiary">
                  {t("verifyLink")}
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
