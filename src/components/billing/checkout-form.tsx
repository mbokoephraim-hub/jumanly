"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { checkPayment, startPayment, type CheckoutFormState } from "@/server/actions/checkout";

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/**
 * Method choice and Mobile Money details (textes, partie 05, `checkout.*`; mockup 02-08): two
 * method cards, operators as pills, the number, then the pay button.
 */
export function CheckoutForm({
  plan,
  context,
  total,
  operators,
  note,
}: {
  plan: string;
  context: "signup" | "billing";
  total: string;
  operators: string[];
  /** Band shown above the pay button (prepaid reminder). */
  note?: string;
}) {
  const t = dynamic(useTranslations());
  const [state, action, pending] = useActionState<CheckoutFormState, FormData>(startPayment, {
    status: "idle",
  });
  const values = state.values ?? {};
  const [method, setMethod] = useState(values.method ?? "mobile_money");
  const [operator, setOperator] = useState(values.operator ?? operators[0] ?? "");
  const operatorName = operator ? t(`checkout.mm.operators.${operator}`) : "";
  const error = (field: string) => {
    const code = state.errors?.[field];
    return code ? t(`checkout.mm.error.${code}`, { operator: operatorName }) : undefined;
  };
  const lockIcon = <Icon name="lock" className="size-[18px]" />;
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.error && <Alert tone="error" title={t(`checkout.${state.error}`)} />}
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="context" value={context} />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
          {t("checkout.method.title")}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["mobile_money", "card"] as const).map((value) => {
            const key = value === "card" ? "card" : "mobileMoney";
            return (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-3 rounded-[20px] bg-blanc p-3.5 ring-[1.5px] ring-brume transition-shadow ring-inset hover:ring-sapin/40 has-checked:shadow-[0_0_0_5px_rgb(166_242_107/0.55)] has-checked:ring-2 has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_5px_rgb(166_242_107/0.9)]"
              >
                <span className="relative flex size-[22px] shrink-0">
                  <input
                    type="radio"
                    name="method"
                    value={value}
                    checked={method === value}
                    onChange={() => setMethod(value)}
                    className="peer size-[22px] cursor-pointer appearance-none rounded-full bg-blanc ring-[1.5px] ring-[#8a9794] ring-inset checked:bg-sapin checked:ring-sapin"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-[7px] left-[7px] hidden size-2 rounded-full bg-lime peer-checked:block"
                  />
                </span>
                <span
                  aria-hidden
                  className={cx(
                    "flex size-10 shrink-0 items-center justify-center rounded-[12px] text-sapin",
                    value === "card" ? "bg-creme" : "bg-lime",
                  )}
                >
                  <Icon
                    name={value === "card" ? "portefeuille" : "mobile-money"}
                    className="size-5"
                  />
                </span>
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold">
                    {t(`checkout.method.${key}.text`)}
                  </span>
                  <span className="text-xs leading-4 text-ardoise">
                    {t(`checkout.method.${key}.help`)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-col gap-4 rounded-[24px] bg-blanc p-5 lg:p-[22px]">
        {method === "mobile_money" ? (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2.5 text-[13px] font-semibold">
                {t("checkout.mm.operator.label")}
              </legend>
              {operators.length === 0 ? (
                <p className="text-sm text-ardoise">{t("checkout.mm.operator.none")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {operators.map((code) => {
                    const name = t(`checkout.mm.operators.${code}`);
                    return (
                      <label
                        key={code}
                        className="flex h-10 cursor-pointer items-center gap-2 rounded-pill bg-blanc pr-4 pl-1.5 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset has-checked:bg-sapin has-checked:text-blanc has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]"
                      >
                        <input
                          type="radio"
                          name="operator"
                          value={code}
                          checked={operator === code}
                          onChange={() => setOperator(code)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          className="flex size-7 items-center justify-center rounded-full bg-lime-clair text-[9px] font-bold text-sapin peer-checked:bg-lime"
                        >
                          {initials(name)}
                        </span>
                        {name}
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-xs leading-[17px] text-ardoise">
                {t("checkout.mm.operator.help")}
              </p>
              {error("operator") && (
                <p className="text-xs font-medium text-down-texte">{error("operator")}</p>
              )}
            </fieldset>
            <TextField
              id="checkout-number"
              name="number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              icon="mobile-money"
              label={t("checkout.mm.number.label")}
              placeholder={t("checkout.mm.number.placeholder")}
              hint={
                operatorName ? t("checkout.mm.number.help", { operator: operatorName }) : undefined
              }
              required
              defaultValue={values.number}
              error={error("number")}
            />
            {note && (
              <p className="flex items-start gap-3 rounded-[16px] bg-[#E4FAD0] px-4 py-3.5 text-[13px] leading-[19px]">
                <Icon name="horloge" className="mt-px size-4 shrink-0" />
                {note}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              loading={pending}
              fullWidth
              iconAfter={pending ? undefined : lockIcon}
            >
              {pending ? t("checkout.mm.submitting") : t("checkout.mm.submit", { total })}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-ardoise">{t("checkout.card.3ds")}</p>
            <Button
              type="submit"
              size="lg"
              loading={pending}
              fullWidth
              iconAfter={pending ? undefined : lockIcon}
            >
              {pending ? t("checkout.card.submitting") : t("checkout.card.submit", { total })}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

/** While the operator waits for the customer's confirmation: ask again every 3 seconds. */
export function PaymentPoller({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  useEffect(() => {
    const timer = setInterval(() => {
      startTransition(async () => {
        const status = await checkPayment(paymentId);
        if (status !== "pending") router.refresh();
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [paymentId, router]);
  return null;
}
