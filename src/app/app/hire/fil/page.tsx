import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RhFil } from "@/components/phone/recruteur/fil";
import { requireHire } from "@/server/hire-context";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rhWeb.top.title");
  return { title: t("fil"), robots: { index: false } };
}

/**
 * The recruiter's Fil on a computer and a tablet (entry « Fil » of the sidebar, lot N1). The
 * phone keeps it on its Fil tab (/app/hire). Its columns on a computer come with lot N2.
 */
export default async function HireFilPage() {
  const { user } = await requireHire("/app/hire/fil");
  if (await isPhone()) redirect("/app/hire");
  return (
    <div className="rb-fil">
      <RhFil user={{ id: user.id, name: user.name, image: user.image ?? null }} />
    </div>
  );
}
