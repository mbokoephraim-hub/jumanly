import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { RecruiterPreview } from "@/components/talent/profile/panels";
import { requireUser } from "@/server/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.preview");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * « Vu par un recruteur » (planche talent-4 § 3) on a phone. On a tablet or a computer it opens
 * as a panel at the right of the profile (`/app/profil?fenetre=apercu`).
 */
export default async function PreviewPage() {
  const user = await requireUser("/app/profil/apercu");
  const t = await getTranslations();
  return (
    <div className="t-flux">
      <FlowHead back="/app/profil" backLabel={t("profil.back")} title={t("profil.preview.title")} />
      <RecruiterPreview userId={user.id} />
    </div>
  );
}
