"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState, useTransition } from "react";
import { checkPayment, startPayment, type CheckoutFormState } from "@/server/actions/checkout";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { SettingsFrame } from "./settings";

export type PlanCard = {
  code: string;
  name: string;
  price: string;
  text: string;
  current: boolean;
  /** Where « Choisir » goes: paying now (a dearer plan) or the plans' page (a cheaper one). */
  href: string | null;
};

/** « Ma formule » (planche Carrière-abonnement): the talent plans, the current one outlined. */
export function PhonePlans({ intro, plans }: { intro: string; plans: PlanCard[] }) {
  const t = useTranslations("phoneCareer.billing");
  return (
    <SettingsFrame title={t("title")} back="/app/parametres">
      <p className="nb-meta nb-ca-intro">{intro}</p>
      <div className="nb-ca-formules">
        {plans.map((plan) => (
          <section
            key={plan.code}
            className="nb-ca-formule"
            data-actuelle={plan.current ? "" : undefined}
            aria-label={plan.name}
          >
            <div>
              <b>{plan.name}</b>
              <span className="nb-ca-prix">{plan.price}</span>
            </div>
            <p className="nb-meta">{plan.text}</p>
            {plan.current ? (
              <span className="nb-bouton" data-large="" data-contour="" aria-disabled>
                {t("current")}
              </span>
            ) : plan.href ? (
              <Link href={plan.href} className="nb-bouton" data-large="" data-plein="">
                {t("choose", { plan: plan.name })}
              </Link>
            ) : null}
          </section>
        ))}
      </div>
      <p className="nb-meta nb-ca-intro">{t("applyFree")}</p>
    </SettingsFrame>
  );
}

type Operator = { code: string; name: string; initials: string; last: string | null };

/**
 * « Paiement » (planche Carrière-paiement): the plan chosen, the Mobile Money service and the
 * number. The provider asks the person to confirm on the phone; nothing is kept of the number but
 * its masked form.
 */
export function PhonePay({
  plan,
  planName,
  total,
  period,
  operators,
  fake,
}: {
  plan: string;
  planName: string;
  total: string;
  period: string;
  operators: Operator[];
  fake: boolean;
}) {
  const t = useTranslations("phoneCareer.billing");
  const [state, action, pending] = useActionState<CheckoutFormState, FormData>(startPayment, {
    status: "idle",
  });
  const [operator, setOperator] = useState(state.values?.operator ?? operators[0]?.code ?? "");
  const errors = state.errors ?? {};
  const error = (key: string | undefined) =>
    key && t.has(`errors.${key}` as "errors.numberInvalid")
      ? t(`errors.${key}` as "errors.numberInvalid")
      : key
        ? t("errors.failed")
        : null;
  return (
    <SettingsFrame title={t("payTitle")} back="/app/abonnement">
      <div className="nb-ca-commande">
        <span>
          <small className="nb-meta">{t("chosen")}</small>
          <b>{planName}</b>
          <small className="nb-meta">{period}</small>
        </span>
        <b>{total}</b>
      </div>
      {fake ? <p className="nb-meta nb-ca-intro">{t("fake")}</p> : null}
      <form action={action}>
        <input type="hidden" name="plan" value={plan} />
        <input type="hidden" name="context" value="billing" />
        <input type="hidden" name="method" value="mobile_money" />
        <p className="nb-ca-gr" id="ca-payer">
          {t("payWith")}
        </p>
        <div role="radiogroup" aria-labelledby="ca-payer">
          {operators.map((item, index) => (
            <label key={item.code} className="nb-ca-it nb-ca-op" data-ligne="">
              <span className="nb-ca-op-i" data-ton={index % 3} aria-hidden>
                {item.initials}
              </span>
              <span>
                {item.name}
                {item.last ? <small className="nb-meta">{item.last}</small> : null}
              </span>
              <input
                type="radio"
                name="operator"
                value={item.code}
                checked={operator === item.code}
                onChange={() => setOperator(item.code)}
              />
              <i className="nb-ca-radio" aria-hidden />
            </label>
          ))}
        </div>
        {error(errors.operator) ? (
          <p className="nb-ca-erreur nb-ca-intro" role="alert">
            {error(errors.operator)}
          </p>
        ) : null}
        <div className="nb-ca-ch">
          <label htmlFor="ca-numero">{t("number")}</label>
          <input
            id="ca-numero"
            name="number"
            className="nb-ca-in"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={state.values?.number ?? ""}
            placeholder={t("numberPlaceholder")}
            aria-invalid={errors.number ? true : undefined}
            required
          />
          {error(errors.number) ? (
            <p className="nb-ca-erreur" role="alert">
              {error(errors.number)}
            </p>
          ) : null}
          <p className="nb-meta nb-ca-aide">{t("numberHelp")}</p>
        </div>
        {state.status === "error" ? (
          <p className="nb-ca-erreur nb-ca-intro" role="alert">
            {error(state.error === "duplicate" ? "duplicate" : "failed")}
          </p>
        ) : null}
        <div className="nb-ca-suppr">
          <button
            type="submit"
            className="nb-bouton"
            data-large=""
            data-plein=""
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? t("paying") : t("pay", { total })}
          </button>
        </div>
      </form>
    </SettingsFrame>
  );
}

/**
 * « Validez sur votre téléphone » (planche Carrière-paiement-valider): the provider waits for the
 * secret code. The page asks the provider every few seconds; « J'ai validé » asks at once.
 */
export function PhonePayWait({
  paymentId,
  text,
  back,
}: {
  paymentId: string;
  text: string;
  back: string;
}) {
  const t = useTranslations("phoneCareer.billing");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = setInterval(async () => {
      const status = await checkPayment(paymentId).catch(() => null);
      if (status && status !== "pending") router.refresh();
    }, 4000);
    return () => clearInterval(timer);
  }, [paymentId, router]);

  const check = () =>
    start(async () => {
      const status = await checkPayment(paymentId).catch(() => null);
      router.refresh();
      if (status === "pending") setOpen(true);
    });

  return (
    <SettingsFrame title={t("payTitle")} back={back}>
      <div className="nb-ca-attente">
        <span className="nb-ca-rond-att" aria-hidden>
          <PhoneIcon name="horloge" size={28} />
        </span>
        <p className="nb-meta">{text}</p>
        <button
          type="button"
          className="nb-bouton"
          data-large=""
          data-contour=""
          onClick={() => setOpen(true)}
        >
          {t("howTo")}
        </button>
      </div>
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t("validateTitle")}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">{t("validateTitle")}</b>
        <p className="nb-meta nb-ca-feuille-d">{text}</p>
        <div className="nb-ca-feuille-b">
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-plein=""
            disabled={pending}
            aria-busy={pending}
            onClick={check}
          >
            {t("validated")}
          </button>
        </div>
      </PhoneSheet>
    </SettingsFrame>
  );
}

/** The end of a payment (planche Carrière-paiement-ok): received, or refused / expired. */
export function PhonePayEnd({
  ok,
  title,
  text,
  primary,
  secondary,
}: {
  ok: boolean;
  title: string;
  text: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="nb-page nb-ca-fin">
      <span className="nb-ca-rond-ok" data-echec={ok ? undefined : ""} aria-hidden>
        <PhoneIcon name={ok ? "coche" : "fermer"} size={34} stroke={2.4} />
      </span>
      <h1>{title}</h1>
      <p className="nb-meta">{text}</p>
      <Link href={primary.href} className="nb-bouton" data-large="" data-plein="">
        {primary.label}
      </Link>
      {secondary ? (
        <Link href={secondary.href} className="nb-bouton" data-large="" data-contour="">
          {secondary.label}
        </Link>
      ) : null}
    </div>
  );
}
