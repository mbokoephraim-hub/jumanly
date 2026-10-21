import type { ReactNode } from "react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import type { ContractType, RemoteMode } from "@/generated/prisma/client";

/**
 * Web recruiter lot 4 (docs/refonte-web/recruteur-4, planche `ofh`): on a computer or a tablet, the
 * screens of the ATS of an offer (analysis, profile for the offer, list of the retained) open on
 * the offer itself, its place and its date, the actions on the right and the « … » menu anchored
 * under its button. Hidden on a phone (`t-rw-web`), where the head of the mobile lot stays.
 */
export async function OfferHead({
  job,
  actions,
  menu = true,
}: {
  job: {
    id: string;
    title: string;
    city: string;
    contractType: ContractType;
    remote: RemoteMode;
    closesAt: Date | null;
  };
  actions?: ReactNode;
  menu?: boolean;
}) {
  const t = await getTranslations("hireWeb.ats");
  const to = await getTranslations("hireOffers");
  const format = await getFormatter();
  const line = [
    job.city,
    to(`contract.${job.contractType}` as "contract.cdi"),
    to(`remote.${job.remote}` as "remote.onsite").toLowerCase(),
    job.closesAt
      ? t("until", { date: format.dateTime(job.closesAt, { day: "numeric", month: "long" }) })
      : t("noDeadline"),
  ].join(" · ");
  return (
    <div className="t-rw-web t-rw-ofh">
      <span className="t-cases" aria-hidden>
        <TalentIcon name="offre" />
      </span>
      <div className="t-t">
        <h1>{job.title}</h1>
        <p>{line}</p>
      </div>
      <div className="t-bts">
        {actions}
        {menu && (
          <SheetButton
            target={`menu-${job.id}`}
            label={t("menu")}
            className="t-bi t-rw-rond t-press"
            anchor
          >
            <TalentIcon name="plus-options" size="s" />
          </SheetButton>
        )}
      </div>
    </div>
  );
}

export type OfferTab = "candidatures" | "ats" | "retenus" | "stats";

/**
 * The four parts of an offer on a computer (planche `.ofh` + `.seg`): Candidatures, Analyse (ATS),
 * Retenus and Statistiques (the offer's detail, with its performance). Each one is a link.
 */
export async function OfferTabs({
  jobId,
  current,
  applications,
  shortlisted,
}: {
  jobId: string;
  current: OfferTab;
  applications: number;
  shortlisted: number;
}) {
  const t = await getTranslations("hireWeb.ats");
  const tabs: { key: OfferTab; href: string; count?: number }[] = [
    { key: "candidatures", href: `/app/hire/candidats?offre=${jobId}`, count: applications },
    { key: "ats", href: `/app/hire/offres/${jobId}/ats` },
    { key: "retenus", href: `/app/hire/offres/${jobId}/retenus`, count: shortlisted },
    { key: "stats", href: `/app/hire/offres/${jobId}` },
  ];
  return (
    <nav className="t-rw-web t-rw-otabs" aria-label={t("tabsAria")}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === current ? "page" : undefined}
          className={cx("t-press", tab.key === current && "t-on")}
        >
          {t(`tab.${tab.key}`)}
          {tab.count !== undefined && <small>{tab.count}</small>}
        </Link>
      ))}
    </nav>
  );
}

/** A section title with its link on the right (planche `.sec-t`), for the web columns. */
export function SectionTitle({
  title,
  id,
  end,
  className,
}: {
  title: string;
  id?: string;
  end?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("t-rw-sect", className)}>
      <h2 id={id}>{title}</h2>
      {end}
    </div>
  );
}
