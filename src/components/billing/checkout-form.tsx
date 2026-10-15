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

/** Neutral initials tiles (no operator logo until the provider supplies one), in turn. */
const tileColors = [
  "bg-sapin text-lime",
  "bg-neon text-sapin",
  "bg-feuille-fonce text-blanc",
  "bg-lime text-sapin",
];

/**
 * Method choice and details (textes, partie 05, `checkout.*`; mockups 05-03 and 05-04): two
 * method tiles, the operators as initials tiles, the number, then the pay button.
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
  const submit = (label: string, busy: string) => (
    <Button
      type="submit"
      size="lg"
      loading={pending}
      fullWidth
      icon={pending ? undefined : lockIcon}
    >
      {pending ? busy : label}
    </Button>
  );
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.error && <Alert tone="error" title={t(`checkout.${state.error}`)} />}
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="context" value={context} />
      <fieldset className="flex flex-col">
        <legend className="mb-3 text-[17px] font-semibold tracking-tight">
          {t("checkout.method.title")}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["mobile_money", "card"] as const).map((value) => {
            const key = value === "card" ? "card" : "mobileMoney";
            return (
              <label
                key={value}
                className="group flex min-h-[76px] cursor-pointer items-center gap-3.5 rounded-[20px] bg-blanc px-4 py-3.5 ring-[1.5px] ring-brume transition-[box-shadow,background-color] ring-inset hover:ring-sapin/40 has-checked:bg-lime-clair has-checked:ring-2 has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_5px_rgb(166_242_107/0.9)]"
              >
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-creme text-sapin transition-colors group-has-checked:bg-sapin group-has-checked:text-lime"
                >
                  <Icon
                    name={value === "card" ? "portefeuille" : "mobile-money"}
                    className="size-5"
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-semibold">
                    {t(`checkout.method.${key}.text`)}
                  </span>
                  <span className="text-xs leading-4 text-ardoise">
                    {t(`checkout.method.${key}.help`)}
                  </span>
                </span>
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
              </label>
            );
          })}
        </div>
      </fieldset>
      {method === "mobile_money" ? (
        <>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-3 flex w-full items-baseline justify-between gap-3">
              <span className="text-[17px] font-semibold tracking-tight">
                {t("checkout.mm.operator.title")}
              </span>
              <span className="text-xs text-ardoise">{t("checkout.mm.operator.label")}</span>
            </legend>
            {operators.length === 0 ? (
              <p className="text-sm text-ardoise">{t("checkout.mm.operator.none")}</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(104px,1fr))] gap-2.5 lg:gap-3">
                {operators.map((code, index) => {
                  const name = t(`checkout.mm.operators.${code}`);
                  return (
                    <label
                      key={code}
                      className="relative flex h-[88px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] bg-blanc px-2 text-center text-[13px] leading-4 font-semibold ring-[1.5px] ring-brume transition-shadow ring-inset hover:ring-sapin/40 has-checked:ring-2 has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)] lg:h-24"
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
                        className="absolute top-2 right-2 hidden size-5 items-center justify-center rounded-full bg-sapin text-lime peer-checked:flex"
                      >
                        <Icon name="check" className="size-3" />
                      </span>
                      <span
                        aria-hidden
                        className={cx(
                          "flex size-10 items-center justify-center rounded-[12px] text-sm font-bold lg:size-11 lg:text-[15px]",
                          tileColors[index % tileColors.length],
                        )}
                      >
                        {initials(name)}
                      </span>
                      {name}
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-xs leading-[17px] text-ardoise">{t("checkout.mm.operator.help")}</p>
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
            <p className="flex items-start gap-3 rounded-[16px] bg-lime-clair px-4 py-3.5 text-[13px] leading-[19px]">
              <Icon name="horloge" className="mt-px size-4 shrink-0" />
              {note}
            </p>
          )}
          {submit(t("checkout.mm.submit", { total }), t("checkout.mm.submitting"))}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="text-[17px] font-semibold tracking-tight">{t("checkout.card.title")}</h3>
            <span className="flex items-center gap-1.5 text-xs text-ardoise">
              <Icon name="lock" className="size-3.5" />
              {t("checkout.card.secureForm")}
            </span>
          </div>
          <p className="flex items-start gap-2.5 rounded-[16px] bg-creme px-4 py-3 text-xs leading-[17px]">
            <Icon name="securite" className="mt-px size-4 shrink-0" />
            {t("checkout.card.3ds")}
          </p>
          {submit(t("checkout.card.submit", { total }), t("checkout.card.submitting"))}
        </>
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

/** Time left before the request expires (`checkout.mm.waiting.timer`), every second. */
export function PaymentCountdown({ expiresAt }: { expiresAt: string }) {
  const t = useTranslations("checkout.mm.waiting");
  const end = new Date(expiresAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  if (now === null) return null;
  const left = Math.max(0, Math.round((end - now) / 1000));
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-lime px-3 text-xs font-semibold text-sapin">
      <Icon name="horloge" className="size-3.5" />
      {t("timer", { minutes: Math.floor(left / 60), seconds: left % 60 })}
    </span>
  );
}
