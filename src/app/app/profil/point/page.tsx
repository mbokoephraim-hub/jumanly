import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { careerPointView } from "@/components/talent/profile/panels";
import { requireUser } from "@/server/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("point");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * « Faire le point » (planche talent-4 § 5), opened from « Mon profil » on a phone. On a tablet
 * or a computer it opens as a panel at the right of the profile (`/app/profil?fenetre=point`).
 */
export default async function CareerPointPage() {
  const user = await requireUser("/app/profil/point");
  const t = await getTranslations();
  const { body, why } = await careerPointView(user.id, "pt");

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/profil"
        backLabel={t("point.back")}
        title={t("point.title")}
        end={
          <Link href="/app/profil" className="t-bi t-press" aria-label={t("point.close")}>
            <TalentIcon name="fermer" size="s" />
          </Link>
        }
      />
      {body}
      {why}
    </div>
  );
}
