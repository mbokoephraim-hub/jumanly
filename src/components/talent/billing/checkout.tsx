"use client";

import { useActionState, useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CountrySheet, type CountrySheetLabels } from "@/components/access/country-sheet";
import { cx } from "@/lib/cx";
import { checkPayment, startPayment, type CheckoutFormState } from "@/server/actions/checkout";
import { TalentIcon } from "../icon";
import { OperatorTile } from "./operator";

type Operator = { code: string; name: string; last: string | null };

/**
 * Paying a plan (planche talent-4 § 7): Mobile Money services and the card, then, for Mobile
 * Money, the number with its dialling code (flag and « +243 », the country sheet). The request
 * goes to the provider; the person confirms on the phone. Nothing is kept of the number but its
 * masked form.
 */
export function TalentCheckout({
  plan,
  operators,
  cards,
  countries,
  country,
  summary,
  labels,
}: {
  plan: string;
  operators: Operator[];
  cards: boolean;
  countries: { code: string; name: string; dialCode: string | null }[];
  /** The person's country, for the dialling code shown first (RD Congo otherwise). */
  country: string;
  /** The receipt of the order (plan, period, amount), drawn by the page. */
  summary: ReactNode;
  labels: {
    mm: string;
    methods: string;
    card: string;
    cardText: string;
    note: string;
    noteCard: string;
    pay: string;
    paying: string;
    change: string;
    number: string;
    placeholder: string;
    help: string;
    dial: CountrySheetLabels;
    errors: Record<string, string>;
  };
}) {
  const [state, action, pending] = useActionState<CheckoutFormState, FormData>(startPayment, {
    status: "idle",
  });
  const values = state.values ?? {};
  const [method, setMethod] = useState(
    values.method ?? (operators.length > 0 ? "mobile_money" : "card"),
  );
  const [operator, setOperator] = useState(values.operator ?? operators[0]?.code ?? "");
  // Mobile Money: the number is asked on a second screen, after the service (planche PAYN).
  const [step, setStep] = useState<"method" | "number">(
    values.method === "mobile_money" ? "number" : "method",
  );
  const chosen = operators.find((item) => item.code === operator);
  const error = (field: string) => {
    const code = state.errors?.[field];
    return code ? (labels.errors[code] ?? labels.errors.failed) : null;
  };
  const numberStep = method === "mobile_money" && step === "number";

  return (
    <form
      action={action}
      noValidate
      className="t-flux"
      onSubmit={(event) => {
        if (method === "mobile_money" && step === "method") {
          event.preventDefault();
          setStep("number");
        }
      }}
    >
      {state.error && (
        <p role="alert" className="t-gar t-err">
          <TalentIcon name="aide" size="s" />
          <span>{labels.errors[state.error] ?? labels.errors.failed}</span>
        </p>
      )}
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="context" value="billing" />
      <input type="hidden" name="method" value={method} />
      {summary}

      {numberStep && chosen ? (
        <>
          <input type="hidden" name="operator" value={chosen.code} />
          <div className="t-verre t-pj">
            <OperatorTile code={chosen.code} name={chosen.name} className="t-lf-m" />
            <span className="t-t">
              <b>{chosen.name}</b>
              <button type="button" className="t-lien" onClick={() => setStep("method")}>
                {labels.change}
              </button>
            </span>
          </div>
          <div className="t-champ">
            <label className="t-lab-c" htmlFor="paiement-numero">
              {labels.number}
            </label>
            <span
              className={cx("t-verre t-saisie t-tel", error("number") && "t-err")}
              aria-describedby="paiement-numero-aide"
            >
              <CountrySheet
                dial
                name="dial"
                countries={countries}
                initial={countries.some((item) => item.code === country) ? country : "CD"}
                labels={labels.dial}
              />
              <input
                id="paiement-numero"
                name="number"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                required
                autoFocus
                defaultValue={values.number}
                placeholder={labels.placeholder}
                aria-invalid={Boolean(error("number"))}
                aria-describedby="paiement-numero-aide"
              />
            </span>
            {error("number") ? (
              <span role="alert" className="t-aide-c t-erreur">
                {error("number")}
              </span>
            ) : (
              <span id="paiement-numero-aide" className="t-aide-c">
                {labels.help}
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          {operators.length > 0 && (
            <>
              <span className="t-ck-t" id="paiement-mm">
                {labels.mm}
              </span>
              <div role="radiogroup" aria-labelledby="paiement-mm" className="t-verre t-liste t-mm">
                {operators.map((item) => (
                  <label key={item.code} className="t-li t-ch-li t-press">
                    <input
                      type="radio"
                      name="choix"
                      checked={method === "mobile_money" && operator === item.code}
                      onChange={() => {
                        setMethod("mobile_money");
                        setOperator(item.code);
                      }}
                      className="sr-only"
                    />
                    <OperatorTile code={item.code} name={item.name} />
                    <span className="t-t">
                      <b>{item.name}</b>
                      {item.last && <span>{item.last}</span>}
                    </span>
                    <span aria-hidden className="t-radio" />
                  </label>
                ))}
              </div>
              {error("operator") && (
                <span role="alert" className="t-aide-c t-erreur">
                  {error("operator")}
                </span>
              )}
            </>
          )}
          {cards && (
            <div role="radiogroup" aria-label={labels.methods} className="t-verre t-liste t-mm">
              <label className="t-li t-ch-li t-press">
                <input
                  type="radio"
                  name="choix"
                  checked={method === "card"}
                  onChange={() => setMethod("card")}
                  className="sr-only"
                />
                <span className="t-cases" aria-hidden>
                  <TalentIcon name="portefeuille" size="s" />
                </span>
                <span className="t-t">
                  <b>{labels.card}</b>
                  <span>{labels.cardText}</span>
                </span>
                <span aria-hidden className="t-radio" />
              </label>
            </div>
          )}
          <p className="t-gar">
            <TalentIcon name="message" size="s" />
            <span>{method === "card" ? labels.noteCard : labels.note}</span>
          </p>
        </>
      )}

      <div className="t-verre t-fort t-bas-f">
        <button type="submit" disabled={pending} className="t-bt t-p t-pl t-press">
          <TalentIcon name="cadenas" size="s" />
          {pending ? labels.paying : labels.pay}
        </button>
      </div>
    </form>
  );
}

/** While the provider waits for the confirmation on the phone: ask again every 3 seconds. */
export function PaymentWait({
  paymentId,
  expiresAt,
  labels,
}: {
  paymentId: string;
  expiresAt: string;
  labels: { status: string; statusShort: string };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const end = new Date(expiresAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const clock = setInterval(tick, 1000);
    const poll = setInterval(() => {
      startTransition(async () => {
        const status = await checkPayment(paymentId);
        if (status !== "pending") router.refresh();
      });
    }, 3000);
    return () => {
      clearInterval(clock);
      clearInterval(poll);
    };
  }, [paymentId, router]);
  const left = now === null ? null : Math.max(0, Math.round((end - now) / 1000));
  return (
    <p className="t-verre t-attente">
      <span aria-hidden className="t-sp" />
      <span aria-live="off">
        {left === null
          ? labels.statusShort
          : labels.status
              .replace("{minutes}", String(Math.floor(left / 60)))
              .replace("{seconds}", String(left % 60).padStart(2, "0"))}
      </span>
    </p>
  );
}

/** « Vérifier maintenant » of the sheet « Je n'ai rien reçu »: asks the provider again. */
export function CheckNow({ paymentId, label }: { paymentId: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="t-bt t-p t-pl t-press"
      onClick={() =>
        startTransition(async () => {
          await checkPayment(paymentId);
          router.refresh();
        })
      }
    >
      {label}
    </button>
  );
}
