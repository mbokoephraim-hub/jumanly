import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { OfferRow } from "@/components/phone/explorer/cards";
import { explorerWords } from "@/components/phone/explorer/data";
import { ExplorerList } from "@/components/phone/explorer/list";
import { ExplorerTexts } from "@/components/phone/explorer/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { savedOffers } from "@/server/services/explore";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneExplorer");
  return { title: { absolute: t("saved.title") }, robots: { index: false } };
}

/**
 * The saved offers. On a phone, their own page of Explorer (lot B4, planche Offres-enregistrees);
 * on a computer, the « Enregistrées » tab of Offres (lot 3), as before.
 */
export default async function SavedJobsPage() {
  const user = await requireUser("/app/jobs/enregistrees");
  if (!(await isPhone())) redirect("/app/jobs?vue=enregistrees");
  const now = new Date();
  const [rows, words] = await Promise.all([savedOffers(db, user.id, now), explorerWords(now)]);
  const { t } = words;
  return (
    <ExplorerTexts>
      <ExplorerList
        title={t("saved.title")}
        sub={t("saved.sub", { count: rows.length })}
        empty={
          rows.length === 0
            ? {
                title: t("saved.empty"),
                text: t("saved.emptyText"),
                cta: t("saved.emptyCta"),
                href: "/app/jobs",
              }
            : null
        }
      >
        {rows.map((row) => {
          const offer = words.offer(row);
          return (
            <OfferRow
              key={offer.id}
              offer={offer}
              line={t("list.offerLine", {
                company: offer.company,
                city: offer.city,
                kind: offer.kind,
              })}
              muted={row.open ? undefined : t("saved.closed")}
            />
          );
        })}
      </ExplorerList>
    </ExplorerTexts>
  );
}
