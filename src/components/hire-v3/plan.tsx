import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { OrgBillingScreen } from "@/server/services/org-billing";
import { avatarColor, initialsOf } from "./avatar";
import { HireIcon, type HireIconName } from "./icon";
import { HirePage, HirePageHead } from "./page-head";

const DAY = 86_400_000;
const INCLUDED: [string, HireIconName][] = [
  ["offers", "offres"],
  ["orbi", "orbi"],
  ["agenda", "cal"],
  ["pool", "layers"],
  ["team", "users"],
  ["data", "shield"],
];

/**
 * « Formule » (`V.formule` of the prototype v3): the plan in force with its period, the use of
 * the places and of the plan, what is included and the payment; « Factures » lists the invoices
 * (PDF from the company's billing). Read from the billing service, no figure invented.
 */
export async function HireV3Plan({
  data,
  tab,
  members,
}: {
  data: OrgBillingScreen;
  tab: "formule" | "factures";
  members: string[];
}) {
  const t = await getTranslations("hireV3Plan");
  const format = await getFormatter();
  const now = new Date();
  const tabs = (["formule", "factures"] as const).map((k) => ({
    label: t(`tabs.${k}`),
    href: k === "formule" ? "/app/hire/compte/formule" : "/app/hire/compte/formule?onglet=factures",
    active: tab === k,
  }));
  const usd = (cents: number) =>
    format.number(cents / 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const day = (d: Date) => format.dateTime(d, { day: "numeric", month: "long", year: "numeric" });
  const methodOf = (m: string | null | undefined) => (m ? t(`method.${m}`) : t("none"));
  const pay = (
    <div className="tsbox fmpay">
      <div className="tsh">
        <h3>{t("pay.title")}</h3>
        <Link className="btn sm ghost" href="/app/organisation/facturation">
          {t("pay.change")}
        </Link>
      </div>
      <div className="fmmm">
        <span className="chip-ic">
          <HireIcon name="card" size="s" />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <b>{methodOf(data.paidWith?.method)}</b>
          <em>
            {data.invoices[0]
              ? t("pay.last", { date: day(data.invoices[0].issuedAt) })
              : t("pay.noneYet")}
          </em>
        </span>
      </div>
      {data.paidUntil ? (
        <div className="fmline">
          <span>{t("pay.next")}</span>
          <b>{day(data.paidUntil)}</b>
        </div>
      ) : null}
      {data.plan.priceCents ? (
        <div className="fmline">
          <span>{t("pay.amount")}</span>
          <b className="num">{t("usd", { value: usd(data.plan.priceCents) })}</b>
        </div>
      ) : null}
      <div className="fmline">
        <span>{t("pay.also")}</span>
        <b>{t("pay.alsoValue")}</b>
      </div>
      <div className="obf" style={{ marginTop: "auto", padding: "12px 0 0" }}>
        <HireIcon name="mail" size="s" />
        {t("pay.question")}
      </div>
    </div>
  );
  if (tab === "factures")
    return (
      <HirePage view="formule">
        <HirePageHead title={t("invoices.title")} sub={t("invoices.sub")} tabs={tabs} />
        <div className="tsgrid">
          <div className="tsbox">
            <div className="tsh">
              <h3>{t("invoices.yours")}</h3>
              <span className="meta">{t("invoices.usd")}</span>
            </div>
            <div className="tsth fmfr">
              <span>{t("invoices.number")}</span>
              <span>{t("invoices.date")}</span>
              <span>{t("invoices.amount")}</span>
              <span>{t("invoices.method")}</span>
              <span>{t("invoices.state")}</span>
              <span />
            </div>
            {data.invoices.length === 0 ? (
              <p className="meta" style={{ padding: 14 }}>
                {t("invoices.empty")}
              </p>
            ) : null}
            {data.invoices.map((inv) => (
              <div className="fmfr tsrow" key={inv.id}>
                <b>{inv.number}</b>
                <span className="meta">{day(inv.issuedAt)}</span>
                <b className="num">{usd(inv.amountCents)}</b>
                <span>{methodOf(inv.method)}</span>
                <span>
                  <span className="sust ok">{t("invoices.paid")}</span>
                </span>
                <span className="row" style={{ justifyContent: "flex-end" }}>
                  <a
                    className="btn sm ghost"
                    href={`/app/organisation/facturation/factures/${inv.id}/pdf`}
                  >
                    <HireIcon name="dl" size="s" />
                    {t("invoices.pdf")}
                  </a>
                </span>
              </div>
            ))}
            {data.renewal ? (
              <div className="fmfr tsrow fmnext">
                <b>{t("invoices.next")}</b>
                <span className="meta">{day(data.renewal.periodEnd)}</span>
                <b className="num">{usd(data.renewal.totalCents)}</b>
                <span>{methodOf(data.paidWith?.method)}</span>
                <span>
                  <span className="sust wait">{t("invoices.coming")}</span>
                </span>
                <span />
              </div>
            ) : null}
          </div>
          {pay}
        </div>
      </HirePage>
    );
  const start = data.paidUntil ? new Date(data.paidUntil.getTime() - 365 * DAY) : null;
  const elapsed =
    start && data.paidUntil
      ? Math.max(0, Math.min(365, Math.ceil((now.getTime() - start.getTime()) / DAY)))
      : 0;
  const seats = data.gauges.seats;
  const unlimited = (max: number) => max < 0 || max >= 1_000_000;
  return (
    <HirePage view="formule">
      <HirePageHead title={t("title")} sub={t("sub")} tabs={tabs} />
      <div className="fmtop">
        <div className="fmhero">
          <div className="row" style={{ gap: 8 }}>
            <span className="fmact">
              <i />
              {t(`status.${data.canceled ? "canceled" : data.plan.status}`)}
            </span>
            <span className="fmtag">{t("annual")}</span>
          </div>
          <h2>{data.plan.name}</h2>
          {data.plan.priceCents ? (
            <div className="row" style={{ gap: 10, alignItems: "baseline" }}>
              <b className="num fmprice">{format.number(Math.round(data.plan.priceCents / 100))}</b>
              <span>{t("perYear")}</span>
              <span className="fmsep">{t("dot")}</span>
              <span>
                {t("perMonth", { value: format.number(Math.round(data.plan.priceCents / 1200)) })}
              </span>
            </div>
          ) : null}
          {start && data.paidUntil ? (
            <div className="fmtl">
              <div className="row">
                <span>
                  {format.dateTime(start, { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span style={{ marginLeft: "auto" }}>
                  {format.dateTime(data.paidUntil, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="fmbar">
                <i style={{ width: `${(elapsed / 365) * 100}%` }} />
                <b style={{ left: `${(elapsed / 365) * 100}%` }} />
              </div>
              <div className="row">
                <em>{t("today", { day: elapsed })}</em>
                <em style={{ marginLeft: "auto" }}>{data.canceled ? t("ends") : t("renews")}</em>
              </div>
            </div>
          ) : null}
        </div>
        <div className="tsbox fmuse">
          <div className="tsh">
            <h3>{t("use.title")}</h3>
            <span className="meta">{t("use.month")}</span>
          </div>
          <div className="fmseat">
            <div className="row">
              <span>{t("use.seats")}</span>
              <b className="num" style={{ marginLeft: "auto" }}>
                {unlimited(seats.max)
                  ? seats.used
                  : t("use.of", { used: seats.used, max: seats.max })}
              </b>
            </div>
            <div className="fmseats">
              {Array.from(
                { length: unlimited(seats.max) ? seats.used : Math.max(seats.max, seats.used) },
                (_, i) =>
                  members[i] ? (
                    <i key={i} className={`on ${avatarColor(members[i]!)}`}>
                      {initialsOf(members[i]!)}
                    </i>
                  ) : (
                    <i key={i}>
                      <HireIcon name="plus" size="s" />
                    </i>
                  ),
              )}
            </div>
          </div>
          {(["jobs", "credits"] as const).map((k) => (
            <div className="fmline" key={k}>
              <span>{t(`use.${k}`)}</span>
              <b className="num">{data.gauges[k].used}</b>
              <em>
                {unlimited(data.gauges[k].max)
                  ? t("use.unlimited")
                  : t("use.max", { max: data.gauges[k].max })}
              </em>
            </div>
          ))}
        </div>
      </div>
      <div className="tsgrid" style={{ marginTop: 16 }}>
        <div className="tsbox">
          <div className="tsh">
            <h3>{t("included.title")}</h3>
            <span className="meta">{t("included.sub")}</span>
          </div>
          <div className="fminc">
            {INCLUDED.map(([k, icon]) => (
              <div key={k}>
                <span className="chip-ic">
                  <HireIcon name={icon} size="s" />
                </span>
                <span style={{ minWidth: 0 }}>
                  <b>{t(`included.${k}.title`)}</b>
                  <em>{t(`included.${k}.text`)}</em>
                </span>
              </div>
            ))}
          </div>
        </div>
        {pay}
      </div>
    </HirePage>
  );
}
