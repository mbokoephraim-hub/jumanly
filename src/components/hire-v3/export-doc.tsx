import { loose } from "@/lib/loose-t";
import { getFormatter, getTranslations } from "next-intl/server";
import { exportTable } from "@/server/hire-v3-export-text";
import type { ExportData } from "@/server/services/hire-v3-exports";
import { HIRE_SYMBOL } from "./icon-paths";

const SYML = HIRE_SYMBOL.replace('stroke="#fff"', 'stroke="#0F3F37"');
const ROWS_PER_PAGE = 18;

/**
 * One A4 document of the downloads (`xpPage` of the prototype v3): the Sapin band with the logo
 * and the company, the title, « Confidentiel », the key figures, the table, and the footer
 * « Jumanly · entreprise · assistant@jumanly.io · Téléchargement noté dans le journal · n/total ».
 * The documents stay white in dark mode (the prototype's sheet).
 */
export async function HireExportDoc({
  data,
  author,
  columns,
  first = false,
}: {
  data: ExportData;
  author: string;
  columns?: string[];
  /** Only the first page (the preview of the download window). */
  first?: boolean;
}) {
  const t = await getTranslations("hireV3Export");
  const tk = loose(t);
  const format = await getFormatter();
  const { header, rows } = await exportTable(data, columns);
  const chunks: (typeof rows)[] = [];
  for (let i = 0; i < Math.max(rows.length, 1); i += ROWS_PER_PAGE)
    chunks.push(rows.slice(i, i + ROWS_PER_PAGE));
  const pages = first ? chunks.slice(0, 1) : chunks;
  const title = t(`docs.${data.doc}.title`);
  const sub = t(`docs.${data.doc}.sub`, { ...data.facts, org: data.org });
  return (
    <>
      {pages.map((chunk, index) => (
        <section className="rp xpdoc" key={index}>
          {index === 0 ? (
            <>
              <div className="xpd-top">
                <span className="xpd-l">
                  <span className="lgt" dangerouslySetInnerHTML={{ __html: SYML }} />
                  <b>{t("brand")}</b>
                </span>
                <span className="xpd-co">
                  <span>{data.org.slice(0, 2).toUpperCase()}</span>
                  {data.org}
                </span>
              </div>
              <div className="xpd-t">
                <span className="xpd-k">{t(`docs.${data.doc}.kicker`)}</span>
                <h2>{title}</h2>
                <p>{sub}</p>
                <div className="xpd-m">
                  <span>
                    {t("downloadedOn", {
                      date: format.dateTime(new Date(), { dateStyle: "short" }),
                    })}
                  </span>
                  <span>{t("by", { name: author })}</span>
                  <span>{t("confidential")}</span>
                </div>
              </div>
              {data.kpis.length ? (
                <div className="xpkp">
                  {data.kpis.map((kpi) => (
                    <div key={kpi.key}>
                      <span>{tk(`kpi.${data.doc}.${kpi.key}`)}</span>
                      <b>{kpi.value}</b>
                      {kpi.note ? <em>{kpi.note}</em> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="xpd-sm">
              <b>{title}</b>
              <span>{sub}</span>
            </div>
          )}
          {rows.length ? (
            <table className={data.transposed ? "rp-t xpt xpct" : "rp-t xpt"}>
              <thead>
                <tr>
                  {header.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chunk.map((row, r) => (
                  <tr key={r}>
                    {row.map((value, c) =>
                      data.transposed && c === 0 ? (
                        <th key={c}>{value}</th>
                      ) : (
                        <td key={c}>
                          {c === (data.transposed ? -1 : 1) ? (
                            <b>{value ?? t("none")}</b>
                          ) : (
                            (value ?? t("none"))
                          )}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="xpnote">{t(`docs.${data.doc}.empty`)}</div>
          )}
          {index === pages.length - 1 ? (
            <div className="xpnote">{t(`docs.${data.doc}.note`)}</div>
          ) : null}
          <div className="rp-f">
            <span>{t("footer", { org: data.org })}</span>
            <span>{t("logged")}</span>
            <span>{t("page", { n: index + 1, total: first ? chunks.length : pages.length })}</span>
          </div>
        </section>
      ))}
    </>
  );
}
