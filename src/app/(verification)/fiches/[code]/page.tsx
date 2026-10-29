import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { db } from "@/server/db";
import { verifySheet } from "@/server/services/job-sheet";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jobSheet.check");
  return { title: t("title"), description: t("seo"), robots: { index: false } };
}

/**
 * Public check of a job sheet drawn by Jumanly (publication d'offre étape par étape, 29/10/2026):
 * the number printed under the seal « Original » leads here. Authentic, authentic but the offer
 * is over, or unknown; then the offer, the company, the place and the dates.
 */
export default function JobSheetCheckPage({ params }: PageProps<"/fiches/[code]">) {
  return (
    <Suspense fallback={<div className="t-verre t-v-ok t-vpub-attente" aria-busy="true" />}>
      <Check params={params} />
    </Suspense>
  );
}

async function Check({ params }: { params: PageProps<"/fiches/[code]">["params"] }) {
  const { code } = await params;
  const t = await getTranslations("jobSheet.check");
  const format = await getFormatter();
  const job = await verifySheet(db, decodeURIComponent(code).slice(0, 40));
  if (!job || job.status === "draft" || job.status === "rejected")
    return (
      <div className="t-flux" role="status">
        <h1 className="sr-only">{t("title")}</h1>
        <div className="t-verre t-v-ko t-v-inconnue">
          <TalentIcon name="recherche" size="s" />
          <span>
            <b>{t("unknownTitle")}</b> {t("unknownText")}
          </span>
        </div>
      </div>
    );
  const live = job.status === "published";
  const date = (value: Date) => format.dateTime(value, { dateStyle: "long", timeZone: "UTC" });
  const rows = [
    { label: t("offer"), value: job.title },
    {
      label: t("company"),
      value: job.organization.verifiedAt
        ? t("companyVerified", { name: job.organization.name })
        : job.organization.name,
    },
    { label: t("place"), value: [job.city, job.country].filter(Boolean).join(", ") },
    ...(job.publishedAt ? [{ label: t("published"), value: date(job.publishedAt) }] : []),
    ...(job.closesAt ? [{ label: t("closes"), value: date(job.closesAt) }] : []),
    { label: t("number"), value: job.sheetCode ?? "" },
  ];
  return (
    <div className="t-flux" role="status">
      <h1 className="sr-only">{t("title")}</h1>
      <div className={live ? "t-verre t-v-ok" : "t-verre t-v-ok t-v-alerte"}>
        <span className="t-rond-ok" aria-hidden>
          <TalentIcon name={live ? "valider" : "horloge"} />
        </span>
        <h2>{live ? t("authenticTitle") : t("overTitle")}</h2>
        <p>{live ? t("authenticText") : t("overText")}</p>
      </div>
      <dl className="t-verre t-liste t-lignes">
        {rows.map((row) => (
          <div key={row.label} className="t-li">
            <div className="t-t">
              <dt>
                <span>{row.label}</span>
              </dt>
              <dd>
                <b>{row.value}</b>
              </dd>
            </div>
          </div>
        ))}
      </dl>
      {live ? (
        <Link href={`/offres/${job.slug}`} className="t-bt t-p t-pl t-press">
          {t("see")}
        </Link>
      ) : null}
      <p className="t-v-ko">
        <TalentIcon name="aide" size="s" />
        <span>{t("warning")}</span>
      </p>
    </div>
  );
}
