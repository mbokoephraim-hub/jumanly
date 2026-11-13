import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HireV3OffersReport } from "@/components/hire-v3/offers-report";
import { isHireScope } from "@/lib/product-scope";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { offersReport } from "@/server/services/hire-v3-offers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireV3Report");
  return { title: t("seo"), robots: { index: false } };
}

/** « Rapport des offres » of the web app v3 (prototype v3, `V.rapportoffres`). */
export default async function OffersReportPage() {
  if (!isHireScope()) notFound();
  const { ctx, user } = await requireHire("/app/hire/offres/rapport");
  const [report, org, member] = await Promise.all([
    offersReport(db, ctx),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true },
    }),
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true } }),
  ]);
  return <HireV3OffersReport report={report} orgName={org.name} author={member.name} />;
}
