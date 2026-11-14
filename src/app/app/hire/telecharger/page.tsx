import { loose } from "@/lib/loose-t";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HireExportDoc } from "@/components/hire-v3/export-doc";
import { HireIcon } from "@/components/hire-v3/icon";
import { HirePage } from "@/components/hire-v3/page-head";
import { isHireScope } from "@/lib/product-scope";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { exportParams, exportQuery } from "@/server/hire-v3-export-params";
import { hirePermissions } from "@/server/services/hire";
import { exportData, type ExportFormat } from "@/server/services/hire-v3-exports";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireV3Export");
  return { title: t("window.seo"), robots: { index: false } };
}

const FORMATS: [ExportFormat, "file" | "chart" | "layers"][] = [
  ["pdf", "file"],
  ["xlsx", "chart"],
  ["csv", "layers"],
];

/**
 * « Télécharger » (`exportModal` of the prototype v3): the format, the columns, « Masquer les
 * noms », the preview of the first page and « Voir le modèle ». The form is a plain GET to the
 * file route, which notes the download in the log.
 */
export default async function DownloadPage({ searchParams }: PageProps<"/app/hire/telecharger">) {
  if (!isHireScope()) notFound();
  const { ctx, user } = await requireHire("/app/hire/telecharger", "readApplications");
  const query = await searchParams;
  const params = exportParams(query);
  if (params.doc === "journal" && !hirePermissions(ctx.role).manage) notFound();
  const t = await getTranslations("hireV3Export");
  const tk = loose(t);
  const [data, member] = await Promise.all([
    exportData(db, ctx, params.doc, params),
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true } }),
  ]);
  const back =
    typeof query.retour === "string" && query.retour.startsWith("/app/hire")
      ? query.retour
      : "/app/hire/rapports";
  const preview = (over: Record<string, string>) =>
    `/app/hire/telecharger?${exportQuery(params, over)}`;
  return (
    <HirePage view="telecharger">
      <div className="card xpmod wide" style={{ maxWidth: 980, margin: "0 auto", padding: 22 }}>
        <div className="row">
          <span className="nwm-k">
            <HireIcon name="dl" size="s" />
          </span>
          <div style={{ marginLeft: 12 }}>
            <h1 className="xph3">
              {t("window.title", { doc: t(`docs.${params.doc}.title`).toLowerCase() })}
            </h1>
            <span className="meta">
              {t(`docs.${params.doc}.sub`, { ...data.facts, org: data.org })}
            </span>
          </div>
          <Link
            className="round"
            style={{ marginLeft: "auto" }}
            href={back}
            aria-label={t("window.close")}
          >
            <HireIcon name="x" size="s" />
          </Link>
        </div>
        <form action="/app/hire/telecharger/fichier" className="xpg">
          <input type="hidden" name="doc" value={params.doc} />
          {params.jobId ? <input type="hidden" name="offre" value={params.jobId} /> : null}
          <div>
            <fieldset className="nwf">
              <legend>{t("window.format")}</legend>
              <div className="xpfmt">
                {FORMATS.map(([f, icon]) => (
                  <label key={f} className="nwopt xpopt">
                    <input
                      type="radio"
                      name="format"
                      value={f}
                      defaultChecked={params.format === f}
                      className="sr-only"
                    />
                    <span className="nwopt-i">
                      <HireIcon name={icon} size="s" />
                    </span>
                    <b>{t(`format.${f}.label`)}</b>
                    <span className="meta">{t(`format.${f}.text`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {!data.transposed ? (
              <fieldset className="nwf" style={{ marginTop: 14 }}>
                <legend>{t("window.content")}</legend>
                {data.columns.map((c) => (
                  <label key={c} className="nwrow xpc">
                    <b>{tk(`cols.${c}`)}</b>
                    <input
                      type="checkbox"
                      name="cols"
                      value={c}
                      defaultChecked={!params.cols || params.cols.includes(c)}
                    />
                  </label>
                ))}
              </fieldset>
            ) : null}
            <label className="nwrow xpc">
              <div>
                <b>{t("window.mask")}</b>
                <span className="meta">{t("window.maskText")}</span>
              </div>
              <input type="checkbox" name="masquer" value="1" defaultChecked={params.masked} />
            </label>
            <p className="meta xplog">
              <HireIcon name="shield" size="s" />
              {t("window.log")}
            </p>
          </div>
          <div className="xpprev">
            <div className="xpthumb">
              <div className="xpscale">
                <HireExportDoc data={data} author={member.name} columns={params.cols} first />
              </div>
            </div>
            <Link
              className="btn sm ghost"
              href={`/app/hire/rapports/modeles?${exportQuery(params)}`}
            >
              <HireIcon name="eye" size="s" />
              {t("window.model")}
            </Link>
            <Link className="btn sm ghost" href={preview({ masquer: params.masked ? "0" : "1" })}>
              {params.masked ? t("window.showNames") : t("window.previewMasked")}
            </Link>
          </div>
          <div
            className="row"
            style={{ gap: 8, marginTop: 16, justifyContent: "flex-end", gridColumn: "1 / -1" }}
          >
            <Link className="btn sm ghost" href={back}>
              {t("window.cancel")}
            </Link>
            <button type="submit" className="btn sm pri">
              <HireIcon name="dl" size="s" />
              {t("window.go")}
            </button>
          </div>
        </form>
      </div>
    </HirePage>
  );
}
