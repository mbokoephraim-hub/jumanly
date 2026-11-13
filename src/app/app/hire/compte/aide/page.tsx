import { isModelB } from "@/server/phone-routes";
import { HireV3Help } from "@/components/hire-v3/help";
import { isHireScope } from "@/lib/product-scope";
import { db } from "@/server/db";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhHelpScreen, RhCompteTexts } from "@/components/phone/recruteur/compte";
import { requireHire } from "@/server/hire-context";

const PAGE = "/app/hire/compte/aide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhCompte");
  return { title: t("help.title"), robots: { index: false } };
}

/** Compte of the recruiter's phone (Modèle B recruteur M8). A computer keeps its own page. */
export default async function Page({ searchParams }: PageProps<"/app/hire/compte/aide">) {
  const { ctx, user } = await requireHire(PAGE);
  if (isHireScope()) {
    const query = await searchParams;
    const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
    const [org, jobs, members, me] = await Promise.all([
      db.organization.findUniqueOrThrow({
        where: { id: ctx.organizationId },
        select: { description: true, logo: true },
      }),
      db.job.count({ where: { organizationId: ctx.organizationId, status: { not: "draft" } } }),
      db.membership.count({ where: { organizationId: ctx.organizationId, status: "active" } }),
      db.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true } }),
    ]);
    const tab =
      one(query.onglet) === "guides"
        ? "guides"
        : one(query.onglet) === "ecrire"
          ? "ecrire"
          : "centre";
    return (
      <HireV3Help
        tab={tab}
        q={one(query.q)}
        firstName={me.name.split(" ")[0] ?? me.name}
        steps={[
          { key: "company", done: !!org.description && !!org.logo, href: "/app/hire/entreprise" },
          { key: "offer", done: jobs > 0, href: "/app/hire/offres/nouvelle" },
          { key: "team", done: members > 1, href: "/app/hire/compte/equipe" },
        ]}
      />
    );
  }
  if (!(await isModelB())) redirect("/app/hire/compte");
  return (
    <RhCompteTexts>
      <RhHelpScreen ctx={ctx} />
    </RhCompteTexts>
  );
}
