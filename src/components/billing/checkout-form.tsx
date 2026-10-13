"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { dynamic } from "@/i18n/dynamic";
import { checkPayment, startPayment, type CheckoutFormState } from "@/server/actions/checkout";

/** Method choice and Mobile Money details (textes, partie 05, `checkout.*`). */
export function CheckoutForm({
  plan,
  context,
  total,
  operators,
}: {
  plan: string;
  context: "signup" | "billing";
  total: string;
  operators: string[];
}) {
  const t = dynamic(useTranslations());
  const [state, action, pending] = useActionState<CheckoutFormState, FormData>(startPayment, {
    status: "idle",
  });
  const values = state.values ?? {};
  const [method, setMethod] = useState(values.method ?? "mobile_money");
  const error = (field: string) => {
    const code = state.errors?.[field];
    return code ? t(`checkout.mm.error.${code}`, { operator: values.operator ?? "" }) : undefined;
  };
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.error && <Alert tone="error" title={t(`checkout.${state.error}`)} />}
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="context" value={context} />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">{t("checkout.method.title")}</legend>
        {(["mobile_money", "card"] as const).map((value) => {
          const key = value === "card" ? "card" : "mobileMoney";
          return (
            <Checkbox
              key={value}
              id={`method-${value}`}
              type="radio"
              name="method"
              value={value}
              checked={method === value}
              onChange={() => setMethod(value)}
              label={t(`checkout.method.${key}.text`)}
              hint={t(`checkout.method.${key}.help`)}
            />
          );
        })}
      </fieldset>
      {method === "mobile_money" ? (
        <div className="flex flex-col gap-4">
          <Select
            id="checkout-operator"
            name="operator"
            label={t("checkout.mm.operator.label")}
            placeholder={t("checkout.mm.operator.placeholder")}
            hint={t("checkout.mm.operator.help")}
            required
            defaultValue={values.operator ?? ""}
            options={operators.map((code) => ({
              value: code,
              label: t(`checkout.mm.operators.${code}`),
            }))}
            error={error("operator")}
          />
          <TextField
            id="checkout-number"
            name="number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            label={t("checkout.mm.number.label")}
            placeholder={t("checkout.mm.number.placeholder")}
            required
            defaultValue={values.number}
            error={error("number")}
          />
          <Button type="submit" size="lg" loading={pending} fullWidth>
            {pending ? t("checkout.mm.submitting") : t("checkout.mm.submit", { total })}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ardoise">{t("checkout.card.3ds")}</p>
          <Button type="submit" size="lg" loading={pending} fullWidth>
            {pending ? t("checkout.card.submitting") : t("checkout.card.submit", { total })}
          </Button>
        </div>
      )}
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
