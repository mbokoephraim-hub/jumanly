"use client";

import { useCallback, useEffect, useId, useState, useTransition } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { cx } from "@/lib/cx";
import {
  orgBillingRefreshAction,
  orgPaymentStatusAction,
  orgScheduleDowngradeAction,
  orgStartPaymentAction,
} from "@/server/actions/org-billing";
import type { PlanAction, UsageGauge } from "@/server/services/org-billing";
import { Check } from "./company-page";
import { AeDialog, Toast } from "./team";

type Limit = { count: number; more: boolean } | null;

export type OrgFormulaData = {
  plan: { code: string; name: string; priceCents: number | null; status: string };
  freePlanName: string;
  until: string | null;
  paidUntil: string | null;
  graceUntil: string | null;
  canceled: boolean;
  paidWith: { method: string; operator: string | null } | null;
  pendingPlan: { name: string } | null;
  renewal: { totalCents: number; periodEnd: string } | null;
  gauges: Record<UsageGauge, { used: number; max: number }>;
  seatsUsed: number;
  plans: {
    code: string;
    name: string;
    priceCents: number | null;
    users: Limit;
    jobs: Limit;
    extra: string;
    action: PlanAction;
    totalCents: number | null;
    creditCents: number;
  }[];
  invoices: {
    id: string;
    number: string;
    issuedAt: string;
    amountCents: number;
    method: string;
    operator: string | null;
  }[];
};

const GAUGES: UsageGauge[] = ["seats", "jobs", "search", "contact", "credits"];
const OPERATORS = ["mpesa", "orange", "airtel", "carte"] as const;
type Operator = (typeof OPERATORS)[number];
type Payable = {
  code: string;
  name: string;
  totalCents: number;
  creditCents: number;
  /** End of the period a renewal pays for. */
  until?: string;
};

const methodKey = (method: string, operator: string | null) =>
  (method === "mobile_money"
    ? operator && ["mpesa", "orange", "airtel"].includes(operator)
      ? operator
      : "mobile_money"
    : method) as "mpesa";

/**
 * Formule et facturation (étape 3, A4, capture 083): the plan in force and its prepaid period,
 * the gauges of the month, the company plans to move to (upgrade paid at once, downgrade at the
 * end of the period, Company Premium on quote) and the invoices. Prepaid: nothing is taken
 * automatically, the administrator pays by Mobile Money or card.
 */
export function OrgFormulaScreen({ data }: { data: OrgFormulaData }) {
  const t = useTranslations("orgFormula");
  const format = useFormatter();
  const [toast, setToast] = useState<string | null>(null);
  const [paying, setPaying] = useState<(Payable & { renewal: boolean }) | null>(null);
  const [lowering, setLowering] = useState<OrgFormulaData["plans"][number] | null>(null);
  const [pending, start] = useTransition();
  const closeToast = useCallback(() => setToast(null), []);
  const titleId = useId();

  const usd = (cents: number, digits = 0) =>
    `${format.number(cents / 100, { minimumFractionDigits: digits, maximumFractionDigits: 2 })} USD`;
  const day = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "long" });
  const longDay = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "long", year: "numeric" });
  const method = (item: { method: string; operator: string | null }) =>
    t(`method.${methodKey(item.method, item.operator)}`);

  const { plan } = data;
  const title =
    plan.priceCents === null
      ? t("current.quote", { plan: plan.name })
      : plan.priceCents === 0
        ? t("current.free", { plan: plan.name })
        : t("current.price", { plan: plan.name, price: usd(plan.priceCents) });
  let line: string | null = null;
  if (data.graceUntil && data.paidUntil)
    line = t("current.grace", { date: day(data.paidUntil), grace: day(data.graceUntil) });
  else if (data.paidUntil && data.canceled)
    line = t("current.canceled", { date: longDay(data.paidUntil), free: data.freePlanName });
  else if (data.paidUntil)
    line = data.paidWith
      ? t("current.paid", { date: longDay(data.paidUntil), method: method(data.paidWith) })
      : t("current.paidNoMethod", { date: longDay(data.paidUntil) });
  else if (data.until) line = t("current.active", { date: longDay(data.until) });
  const current = data.plans.find((item) => item.action === "current");

  const keep = () =>
    start(async () => {
      const result = await orgScheduleDowngradeAction(null);
      setToast(result.text);
    });

  return (
    <div className="ae-app ae-page" aria-busy={pending}>
      <h1 className="ae-h1">{t("title")}</h1>
      <div className="ae-fb-haut">
        <section className="ae-carte ae-fb-actuelle" aria-labelledby={titleId}>
          <span className="ae-tag ae-tag-lime">{t("current.tag")}</span>
          <h2 id={titleId} className="ae-fb-titre">
            {title}
          </h2>
          {line && <p className="ae-meta ae-fb-ligne">{line}</p>}
          {data.pendingPlan && data.paidUntil && (
            <p className="ae-fb-texte">
              {t("current.pending", { plan: data.pendingPlan.name, date: longDay(data.paidUntil) })}
            </p>
          )}
          <p className="ae-fb-texte">
            {plan.priceCents === 0
              ? t("current.freeText")
              : t("current.reminders", { free: data.freePlanName })}
          </p>
          {data.renewal && (
            <button
              type="button"
              className="ae-btn ae-btn-m ae-fb-action"
              onClick={() =>
                setPaying({
                  code: plan.code,
                  name: plan.name,
                  totalCents: data.renewal!.totalCents,
                  creditCents: 0,
                  until: data.renewal!.periodEnd,
                  renewal: true,
                })
              }
            >
              {t("current.renew")}
            </button>
          )}
        </section>

        <section className="ae-carte ae-fb-usage" aria-labelledby={`${titleId}-usage`}>
          <h2 id={`${titleId}-usage`} className="ae-h2">
            {t("usage.title")}
          </h2>
          <ul>
            {GAUGES.map((key) => {
              const { used, max } = data.gauges[key];
              const unlimited = max < 0;
              const share = unlimited ? 0 : max > 0 ? Math.min(1, used / max) : used > 0 ? 1 : 0;
              return (
                <li key={key}>
                  <span className="ae-fb-jauge-ligne">
                    <span>{t(`usage.${key}`)}</span>
                    <b>
                      {unlimited ? t("usage.unlimited", { used }) : t("usage.value", { used, max })}
                    </b>
                  </span>
                  <span className="ae-jauge" aria-hidden="true">
                    <i style={{ width: `${Math.round(share * 100)}%` }} />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <h2 className="ae-fb-h2">{t("change.title")}</h2>
      <ul className="ae-g3 ae-fb-formules">
        {data.plans.map((item) => {
          const parts = [
            item.users
              ? item.users.count < 0
                ? t("change.usersUnlimited")
                : item.users.more
                  ? t("change.usersMore", { count: item.users.count })
                  : t("change.users", { count: item.users.count })
              : null,
            item.jobs
              ? item.jobs.count < 0
                ? t("change.jobsUnlimited")
                : t("change.jobs", { count: item.jobs.count })
              : null,
            item.extra || null,
          ].filter(Boolean);
          return (
            <li
              key={item.code}
              className={cx("ae-carte ae-fb-formule", item.action === "current" && "ae-fb-on")}
              aria-current={item.action === "current" ? "true" : undefined}
            >
              <h3 className="ae-fb-nom">{item.name}</h3>
              <b className="ae-fb-prix">
                {item.priceCents
                  ? t("change.monthly", { price: usd(item.priceCents) })
                  : t("change.quote")}
              </b>
              <p className="ae-meta ae-fb-details">{parts.join(" · ")}</p>
              {item.action === "current" ? (
                <span className="ae-tag ae-fb-votre">{t("change.current")}</span>
              ) : item.action === "quote" ? (
                <Link href="/contact?sujet=devis" className="ae-btn2 ae-btn-m ae-fb-bouton">
                  {t("change.quoteCta")}
                </Link>
              ) : item.action === "scheduled" ? (
                <span className="ae-fb-prevue">
                  <span className="ae-tag">
                    {t("change.scheduled", { date: data.paidUntil ? day(data.paidUntil) : "" })}
                  </span>
                  <button
                    type="button"
                    className="ae-btn2 ae-btn-m ae-fb-bouton"
                    disabled={pending}
                    onClick={keep}
                  >
                    {t("change.keep", { plan: plan.name })}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="ae-btn2 ae-btn-m ae-fb-bouton"
                  onClick={() =>
                    item.action === "downgrade"
                      ? setLowering(item)
                      : setPaying({
                          code: item.code,
                          name: item.name,
                          totalCents: item.totalCents ?? item.priceCents ?? 0,
                          creditCents: item.creditCents,
                          renewal: false,
                        })
                  }
                >
                  {item.action === "downgrade"
                    ? t("change.downgrade", { plan: item.name })
                    : t("change.upgrade", { plan: item.name })}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="ae-meta ae-fb-note">{t("change.note")}</p>

      <section className="ae-carte ae-fb-factures" aria-labelledby={`${titleId}-factures`}>
        <h2 id={`${titleId}-factures`} className="ae-h2">
          {t("invoices.title")}
        </h2>
        {data.invoices.length === 0 ? (
          <p className="ae-meta" style={{ marginTop: 10 }}>
            {t("invoices.empty")}
          </p>
        ) : (
          <table className="ae-fb-table">
            <thead>
              <tr>
                <th scope="col">{t("invoices.number")}</th>
                <th scope="col">{t("invoices.date")}</th>
                <th scope="col">{t("invoices.amount")}</th>
                <th scope="col">{t("invoices.status")}</th>
                <th scope="col">
                  <span className="sr-only">{t("invoices.title")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <th scope="row">{invoice.number}</th>
                  <td className="ae-meta">
                    {format.dateTime(new Date(invoice.issuedAt), {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>{usd(invoice.amountCents, 2)}</td>
                  <td className="ae-fb-payee">{t("invoices.paid", { method: method(invoice) })}</td>
                  <td>
                    <a
                      href={`/app/organisation/facturation/factures/${invoice.id}/pdf`}
                      className="ae-fb-pdf"
                      aria-label={t("invoices.download", { number: invoice.number })}
                      download
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <PayDialog
        target={paying}
        currentName={current?.name ?? plan.name}
        onClose={() => setPaying(null)}
        onPaid={(text) => setToast(text)}
      />
      <AeDialog
        open={!!lowering}
        onClose={() => setLowering(null)}
        title={lowering ? t("downgrade.title", { plan: lowering.name }) : ""}
      >
        {lowering && (
          <>
            <p className="ae-dialog-texte ae-meta">
              {t("downgrade.text", {
                current: plan.name,
                plan: lowering.name,
                date: data.paidUntil ? longDay(data.paidUntil) : "",
              })}
            </p>
            {lowering.users &&
              !lowering.users.more &&
              lowering.users.count >= 0 &&
              data.seatsUsed > lowering.users.count && (
                <p className="ae-dialog-texte ae-meta">
                  {t("downgrade.seats", {
                    plan: lowering.name,
                    count: lowering.users.count,
                    used: data.seatsUsed,
                  })}
                </p>
              )}
            <div className="ae-dialog-actions">
              <button type="button" className="ae-btn2 ae-btn-m" onClick={() => setLowering(null)}>
                {t("cancel")}
              </button>
              <button
                type="button"
                className="ae-btn ae-btn-m"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await orgScheduleDowngradeAction(lowering.code);
                    setToast(result.text);
                    setLowering(null);
                  })
                }
              >
                {t("downgrade.confirm", { plan: lowering.name })}
              </button>
            </div>
          </>
        )}
      </AeDialog>
      {toast && <Toast text={toast} onClose={closeToast} label={t("close")} />}
    </div>
  );
}

/**
 * The payment window, dark (Modèle B): the operator, the number, « Payer », then the wait for the
 * confirmation on the phone (read every 3 seconds) and the payment received.
 */
function PayDialog({
  target,
  currentName,
  onClose,
  onPaid,
}: {
  target: (Payable & { renewal: boolean }) | null;
  currentName: string;
  onClose: () => void;
  onPaid: (text: string) => void;
}) {
  const t = useTranslations("orgFormula");
  const tp = useTranslations("adminSignup.pay");
  const format = useFormatter();
  const [pending, start] = useTransition();
  const [operator, setOperator] = useState<Operator>("mpesa");
  const [number, setNumber] = useState("");
  const [payment, setPayment] = useState<{ id: string; status: string } | null>(null);
  const [error, setError] = useState<string>();
  const errorId = useId();
  const usd = (cents: number) =>
    `${format.number(cents / 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  const operatorName = tp(`operators.${operator}`);

  const close = () => {
    const paid = payment?.status === "succeeded";
    setPayment(null);
    setError(undefined);
    setNumber("");
    onClose();
    if (paid) void orgBillingRefreshAction();
  };
  const settle = (id: string, status: string | null) => {
    if (!status || status === "pending") return false;
    if (status === "failed" || status === "expired") {
      setError(tp(`error.${status}`));
      setPayment(null);
    } else {
      if (status === "succeeded") onPaid(tp("okToast"));
      setPayment({ id, status });
    }
    return true;
  };
  // Attente : la réponse du prestataire est lue toutes les 3 secondes.
  useEffect(() => {
    if (payment?.status !== "pending") return;
    const timer = setInterval(async () => {
      settle(payment.id, await orgPaymentStatusAction(payment.id));
    }, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  const title = target
    ? target.renewal
      ? t("pay.renewTitle", { plan: target.name })
      : t("pay.upgradeTitle", { plan: target.name })
    : "";
  return (
    <AeDialog open={!!target} onClose={close} title={title} width={520}>
      {target && (
        <div aria-busy={pending}>
          <div className="ae-encadre ae-fb-montant">
            <span className="ae-grandit">
              <b>{t("pay.amount")}</b>
              <span className="ae-meta">
                {target.renewal && target.until
                  ? t("pay.renewText", {
                      date: format.dateTime(new Date(target.until), {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                    })
                  : t("pay.upgradeText")}
              </span>
              {target.creditCents > 0 && (
                <span className="ae-meta">
                  {t("pay.credit", { plan: currentName, credit: usd(target.creditCents) })}
                </span>
              )}
            </span>
            <b className="ae-fb-somme">{usd(target.totalCents)}</b>
          </div>
          {payment?.status === "succeeded" ? (
            <div className="ae-fb-ok" role="status">
              <Check size={26} />
              <span>
                <b>{tp("ok.title")}</b>
                <span className="ae-meta">{t("pay.okNoDate")}</span>
              </span>
            </div>
          ) : payment?.status === "pending" ? (
            <div className="ae-fb-attente" role="status">
              <span className="ae-attente" aria-hidden="true" />
              <b>{operator === "carte" ? tp("wait.cardTitle") : tp("wait.title")}</b>
              <p className="ae-meta">
                {operator === "carte"
                  ? tp("wait.cardText")
                  : tp("wait.text", { operator: operatorName })}
              </p>
              <div className="ae-dialog-actions" style={{ justifyContent: "center" }}>
                <button type="button" className="ae-btn2 ae-btn-m" onClick={() => setPayment(null)}>
                  {tp("retry")}
                </button>
                <button
                  type="button"
                  className="ae-btn ae-btn-m"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      if (!settle(payment.id, await orgPaymentStatusAction(payment.id)))
                        setError(tp("stillPending"));
                    })
                  }
                >
                  {tp("confirmed")}
                </button>
              </div>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                start(async () => {
                  setError(undefined);
                  const result = await orgStartPaymentAction(
                    operator === "carte"
                      ? { planCode: target.code, method: "card" }
                      : { planCode: target.code, method: "mobile_money", operator, number },
                  );
                  if (!result.ok)
                    setError(
                      result.error === "unavailable"
                        ? t("pay.error.unavailable")
                        : tp(`error.${result.error}`),
                    );
                  else if (!settle(result.paymentId, result.status))
                    setPayment({ id: result.paymentId, status: "pending" });
                });
              }}
            >
              <span className="ae-lab" id={`${errorId}-moyen`}>
                {tp("method")}
              </span>
              <div
                className="ae-pills ae-pills-wrap"
                role="radiogroup"
                aria-labelledby={`${errorId}-moyen`}
              >
                {OPERATORS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={operator === item}
                    className="ae-pill"
                    onClick={() => setOperator(item)}
                  >
                    {tp(`operators.${item}`)}
                  </button>
                ))}
              </div>
              {operator === "carte" ? (
                <p className="ae-meta ae-fb-carte">{tp("cardNote")}</p>
              ) : (
                <>
                  <label className="ae-lab" htmlFor={`${errorId}-numero`}>
                    {tp("number", { operator: operatorName })}
                  </label>
                  <input
                    id={`${errorId}-numero`}
                    className="ae-in"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={tp("numberPlaceholder")}
                    value={number}
                    aria-invalid={!!error || undefined}
                    aria-describedby={error ? errorId : undefined}
                    onChange={(event) => setNumber(event.target.value)}
                  />
                </>
              )}
              {error && (
                <p id={errorId} className="ae-erreur" role="alert">
                  {error}
                </p>
              )}
              <div className="ae-dialog-actions">
                <button type="button" className="ae-btn2 ae-btn-m" onClick={close}>
                  {t("cancel")}
                </button>
                <button type="submit" className="ae-btn ae-btn-m" disabled={pending}>
                  {tp("pay", { amount: usd(target.totalCents) })}
                </button>
              </div>
            </form>
          )}
          {(payment?.status === "succeeded" || payment?.status === "pending") && error && (
            <p className="ae-erreur" role="alert">
              {error}
            </p>
          )}
          {payment?.status === "succeeded" && (
            <div className="ae-dialog-actions">
              <button type="button" className="ae-btn ae-btn-m" onClick={close}>
                {t("close")}
              </button>
            </div>
          )}
        </div>
      )}
    </AeDialog>
  );
}
