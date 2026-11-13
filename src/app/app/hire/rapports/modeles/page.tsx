import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HireAutoPrint } from "@/components/hire-v3/auto-print";
import { HireExportDoc } from "@/components/hire-v3/export-doc";
import { HireIcon } from "@/components/hire-v3/icon";
import { HirePage, HirePageHead } from "@/components/hire-v3/page-head";
import { HirePrintButton } from "@/components/hire-v3/print-button";
import { isHireScope } from "@/lib/product-scope";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { exportParams, exportQuery } from "@/server/hire-v3-export-params";
import { hirePermissions } from "@/server/services/hire";
import { EXPORT_DOCS, exportData } from "@/server/services/hire-v3-exports";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireV3Export");
  return { title: t("models.title"), robots: { index: false } };
}

/** « Modèles de téléchargement » (`V.modeles` of the prototype v3): the six A4 documents. */
export default async function ExportModelsPage({
  searchParams,
}: PageProps<"/app/hire/rapports/modeles">) {
  if (!isHireScope()) notFound();
  const { ctx, user } = await requireHire("/app/hire/rapports/modeles", "readApplications");
  const query = await searchParams;
  const params = exportParams(query);
  const t = await getTranslations("hireV3Export");
  const manage = hirePermissions(ctx.role).manage;
  const docs = EXPORT_DOCS.filter((d) => d !== "journal" || manage);
  const doc = docs.includes(params.doc) ? params.doc : "candidats";
  const [data, member] = await Promise.all([
    exportData(db, ctx, doc, params),
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true } }),
  ]);
  return (
    <HirePage view="modeles">
      {query.imprimer === "1" ? <HireAutoPrint /> : null}
      <HirePageHead
        title={t("models.title")}
        sub={t("models.sub")}
        back={{ href: "/app/hire/rapports", label: t("models.back") }}
        actions={
          query.imprimer === "1" ? (
            <HirePrintButton label={t("models.print")} />
          ) : (
            <Link
              className="btn pri"
              href={`/app/hire/telecharger?${exportQuery({ ...params, doc })}`}
            >
              <HireIcon name="dl" />
              {t("models.download")}
            </Link>
          )
        }
      />
      <div className="xpmt">
        {docs.map((d) => (
          <Link
            key={d}
            className={d === doc ? "on" : undefined}
            href={`/app/hire/rapports/modeles?doc=${d}`}
          >
            <HireIcon name="file" size="s" />
            {t(`docs.${d}.tab`)}
          </Link>
        ))}
        <Link href="/app/hire/offres/rapport">
          <HireIcon name="file" size="s" />
          {t("models.offersReport")}
        </Link>
      </div>
      <div className="rp-wrap xpwrap">
        <HireExportDoc data={data} author={member.name} columns={params.cols} />
      </div>
    </HirePage>
  );
}
