import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { HireV3Member, MEMBER_TABS, type MemberTab } from "@/components/hire-v3/member";
import { isHireScope } from "@/lib/product-scope";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError, type HireContext } from "@/server/services/hire";
import { memberFile } from "@/server/services/hire-v3-team";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireV3Member");
  return { title: t("tabs.activity"), robots: { index: false } };
}

/** « Fiche membre » of Équipe in the recruiter's web app v3 (`V.membre` of the prototype). */
export default async function Page({
  params,
  searchParams,
}: PageProps<"/app/hire/compte/equipe/[id]">) {
  if (!isHireScope()) notFound();
  const { id } = await params;
  const { ctx } = await requireHire(`/app/hire/compte/equipe/${id}`);
  const query = await searchParams;
  const tab: MemberTab =
    (Object.keys(MEMBER_TABS) as MemberTab[]).find((key) => MEMBER_TABS[key] === query.onglet) ??
    "activity";
  return (
    <Suspense fallback={null}>
      <MemberV3 ctx={ctx} id={id.slice(0, 60)} tab={tab} />
    </Suspense>
  );
}

async function MemberV3({ ctx, id, tab }: { ctx: HireContext; id: string; tab: MemberTab }) {
  let data;
  try {
    data = await memberFile(db, ctx, id);
  } catch (error) {
    if (error instanceof HireError) notFound();
    throw error;
  }
  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { name: true },
  });
  return <HireV3Member data={data} tab={tab} org={org.name} />;
}
