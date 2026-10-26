import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RecruiterWebHome } from "@/components/recruiter/web-home";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { isPhone } from "@/server/view";
import { RhTab, RhBell } from "@/components/phone/recruteur/head";
import { RhFil } from "@/components/phone/recruteur/fil";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rhWeb.home");
  return { title: t("seo"), robots: { index: false } };
}

const firstWord = (name: string | null | undefined) => (name ?? "").trim().split(/\s+/)[0] ?? "";

/**
 * On a phone, the Fil tab of Modèle B (docs/modele-b-recruteur, lot M3): the recruiter's Fil. On a
 * computer and a tablet, the home of the day (Modèle B, lot N1); `?bienvenue=1`, set by the end
 * of the first steps, opens « Bienvenue ».
 */
export default async function HireTodayPage({ searchParams }: PageProps<"/app/hire">) {
  const { user, space, ctx } = await requireHire("/app/hire");
  if (await isPhone()) {
    return (
      <RhTab tab="fil" actions={<RhBell />} legacy={false}>
        <RhFil user={{ id: user.id, name: user.name, image: user.image ?? null }} />
      </RhTab>
    );
  }
  const query = await searchParams;
  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { name: true, logo: true },
  });
  return (
    <RecruiterWebHome
      ctx={ctx}
      firstName={user.firstName?.trim() || firstWord(user.name)}
      org={{ name: space.organization.name || org.name, logo: org.logo }}
      welcome={query.bienvenue === "1"}
    />
  );
}
