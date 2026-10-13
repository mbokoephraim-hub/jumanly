import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

/** Heading block of an authentication screen. */
export function AuthHeading({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-h1">{title}</h1>
      {subtitle && <p className="text-[15px] leading-6 text-ardoise">{subtitle}</p>}
    </header>
  );
}

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-col gap-6 rounded-card bg-blanc p-6 md:p-8", className)}>
      {children}
    </div>
  );
}

export type SignupStep = "profile" | "plan" | "account" | "verify" | "payment" | "welcome";

/** « Étape 2 sur 6 » indicator; the payment step only counts when a paid plan is chosen. */
export function SignupStepper({ current, paid }: { current: SignupStep; paid: boolean }) {
  const t = useTranslations("signup.stepper");
  const steps: SignupStep[] = paid
    ? ["profile", "plan", "account", "verify", "payment", "welcome"]
    : ["profile", "plan", "account", "verify", "welcome"];
  const index = Math.max(0, steps.indexOf(current));
  return (
    <nav aria-label={t("label", { current: index + 1, total: steps.length })}>
      <p className="text-eyebrow text-feuille-fonce">
        {t("label", { current: index + 1, total: steps.length })}
        <span aria-hidden>{" · "}</span>
        {t(current)}
      </p>
      <ol className="mt-3 flex gap-1.5" aria-hidden>
        {steps.map((step, position) => (
          <li
            key={step}
            className={cx("h-1.5 flex-1 rounded-pill", position <= index ? "bg-sapin" : "bg-brume")}
          />
        ))}
      </ol>
    </nav>
  );
}
