import { getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { dynamic } from "@/i18n/dynamic";
import { formatShortDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";

export type InvoiceRow = {
  id: string;
  number: string;
  planName: string;
  periodStart: Date;
  issuedAt: Date;
  amountCents: number;
  payment: { method: string; operator: string | null };
};

/**
 * The invoices of the person, each with its PDF (planche talent-4 § 7, `.factures`). With `table`,
 * on a tablet or a computer: the five columns of the planche web talent-4 § 7 (`.tbl`), Formule,
 * Date, Moyen, Montant and the PDF; on a phone, the same rows as before.
 */
export async function InvoiceRows({
  invoices,
  table = false,
}: {
  invoices: InvoiceRow[];
  table?: boolean;
}) {
  const t = await getTranslations();
  const d = dynamic(t);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" });
  const methodOf = (payment: InvoiceRow["payment"]) =>
    payment.method === "mobile_money"
      ? payment.operator && d.has(`checkout.mm.operators.${payment.operator}`)
        ? d(`checkout.mm.operators.${payment.operator}`)
        : t("paiement.mm")
      : payment.method === "card"
        ? t("paiement.method.card")
        : payment.method === "cash"
          ? t("paiement.method.cash")
          : t("paiement.method.bankTransfer");
  return (
    <ul
      aria-label={t("factures.list")}
      className={`t-verre t-liste t-lignes t-factures${table ? " t-w4-tbl" : ""}`}
    >
      {table && (
        <li aria-hidden className="t-w4-web t-w4-tbl-h">
          <span>{t("talentW4.invoices.plan")}</span>
          <span>{t("talentW4.invoices.date")}</span>
          <span>{t("talentW4.invoices.method")}</span>
          <span>{t("talentW4.invoices.amount")}</span>
          <span />
        </li>
      )}
      {invoices.map((invoice) => {
        const date = formatShortDate(invoice.issuedAt);
        const method = methodOf(invoice.payment);
        return (
          <li key={invoice.id}>
            <a
              href={`/app/abonnement/factures/${invoice.id}/pdf`}
              download
              className="t-li t-press"
              aria-label={t("factures.download", { number: invoice.number })}
            >
              <span className="t-cases t-c2" aria-hidden>
                <TalentIcon name="document" size="s" />
              </span>
              <span className="t-t">
                <b>
                  {t("factures.item", {
                    plan: invoice.planName,
                    month: month.format(invoice.periodStart),
                  })}
                </b>
                <span className={table ? "t-w4-tel" : undefined}>
                  {t("factures.line", { date, method })}
                </span>
              </span>
              {table && <span className="t-w4-web t-w4-c">{date}</span>}
              {table && <span className="t-w4-web t-w4-c">{method}</span>}
              <span className="t-v">
                {t("abonnement.amount", { amount: formatUsd(invoice.amountCents) })}
              </span>
              <TalentIcon name="telecharger" size="s" className={table ? "t-w4-tel" : undefined} />
              {table && (
                <span className="t-w4-web t-bt t-sec t-s" aria-hidden>
                  <TalentIcon name="telecharger" size="xs" />
                  {t("talentW4.invoices.pdf")}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
