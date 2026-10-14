import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

/** Heading block of an authentication screen, with an optional icon tile above it. */
export function AuthHeading({
  title,
  subtitle,
  icon,
  tone = "lime",
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: IconName;
  tone?: "lime" | "menthe";
}) {
  return (
    <header className="flex flex-col gap-2.5">
      {icon && (
        <span
          aria-hidden
          className={cx(
            "jm-pop mb-3 flex size-14 items-center justify-center rounded-[16px] text-sapin lg:size-[60px]",
            tone === "lime" ? "bg-lime-clair" : "bg-menthe-claire",
          )}
        >
          <Icon name={icon} className="size-6" />
        </span>
      )}
      <h1 className="text-[30px] leading-[1.1] font-bold tracking-tight lg:text-[36px]">{title}</h1>
      {subtitle && (
        <p className="text-[15px] leading-6 text-ardoise lg:text-base lg:leading-[23px]">
          {subtitle}
        </p>
      )}
    </header>
  );
}

const widths = {
  md: "max-w-[520px]",
  lg: "max-w-[560px]",
  xl: "max-w-[600px]",
  wide: "max-w-[760px]",
};

/** Column of an authentication screen: no card, the content sits on Crème (mockups 02-*). */
export function AuthCard({
  children,
  className,
  width = "md",
}: {
  children: ReactNode;
  className?: string;
  width?: keyof typeof widths;
}) {
  return (
    <div className={cx("flex w-full flex-col gap-5", widths[width], className)}>{children}</div>
  );
}

/** « Étape précédente » on the left, « Déjà un compte ? Se connecter » on the right. */
export function SignupFooter({ back }: { back?: string }) {
  const t = useTranslations("signup");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
      {back ? (
        <Link href={back} className="flex items-center gap-1.5 font-semibold text-sapin">
          <Icon name="chev-l" className="size-4" />
          {t("back")}
        </Link>
      ) : (
        <span />
      )}
      <p className="text-ardoise">
        {t("hasAccount")}{" "}
        <Link href="/connexion" className="font-semibold text-sapin hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}

/** Thin « ou » separator between Google and the form. */
export function OrSeparator() {
  const t = useTranslations("auth");
  return (
    <p className="flex items-center gap-3 text-xs text-ardoise before:h-px before:flex-1 before:bg-brume after:h-px after:flex-1 after:bg-brume">
      {t("or")}
    </p>
  );
}

export type SignupStep = "profile" | "plan" | "account" | "verify" | "payment" | "welcome";

/** « Étape 2 sur 6 » with numbered discs; on phones, thin bars and the step name. */
export function SignupStepper({ current, paid }: { current: SignupStep; paid: boolean }) {
  const t = useTranslations("signup.stepper");
  const steps: SignupStep[] = paid
    ? ["profile", "plan", "account", "verify", "payment", "welcome"]
    : ["profile", "plan", "account", "verify", "welcome"];
  const index = Math.max(0, steps.indexOf(current));
  const label = t("label", { current: index + 1, total: steps.length });
  return (
    <nav aria-label={label} className="flex flex-col gap-3">
      <p className="flex items-center justify-between text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
        {label}
        <span className="text-xs font-semibold tracking-normal text-sapin normal-case lg:hidden">
          {t(current)}
        </span>
      </p>
      <ol className="flex gap-1.5 lg:hidden" aria-hidden>
        {steps.map((step, position) => (
          <li
            key={step}
            className={cx("h-1.5 flex-1 rounded-pill", position <= index ? "bg-sapin" : "bg-brume")}
          />
        ))}
      </ol>
      <ol className="flex max-lg:hidden">
        {steps.map((step, position) => {
          const done = position < index;
          const active = position === index;
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className={cx(
                "relative flex flex-1 flex-col items-center gap-2 text-xs",
                position > 0 &&
                  "before:absolute before:top-[15px] before:right-1/2 before:h-0.5 before:w-full before:bg-brume",
                position > 0 && position <= index && "before:bg-lime",
              )}
            >
              <span
                className={cx(
                  "relative z-[1] flex size-[30px] items-center justify-center rounded-full text-[13px] font-semibold",
                  done && "bg-lime text-sapin",
                  active && "bg-sapin text-lime shadow-[0_0_0_5px_rgb(166_242_107/0.45)]",
                  !done && !active && "bg-blanc text-sapin ring-[1.5px] ring-brume ring-inset",
                )}
              >
                {done ? <Icon name="check" className="size-4" /> : position + 1}
              </span>
              <span className={cx(active ? "font-semibold text-sapin" : "text-ardoise")}>
                {t(step)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** « Continuer avec Google » as a white pill with the G badge. */
export function GoogleButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-pill bg-blanc text-[15px] font-semibold text-sapin ring-[1.5px] ring-brume transition-colors ring-inset hover:ring-sapin/40"
    >
      <span
        aria-hidden
        className="flex size-[22px] items-center justify-center rounded-full text-[11px] font-bold ring-[1.5px] ring-brume ring-inset before:content-['G']"
      />
      {label}
    </button>
  );
}

/** Information band of the auth screens (Menthe or Blanc, with its icon). */
export function AuthNote({
  icon,
  children,
  tone = "blanc",
}: {
  icon: IconName;
  children: ReactNode;
  tone?: "blanc" | "menthe" | "lime";
}) {
  return (
    <p
      className={cx(
        "flex items-start gap-3 rounded-[16px] px-4 py-3.5 text-[13px] leading-[19px]",
        tone === "blanc" && "bg-blanc",
        tone === "menthe" && "bg-menthe-claire",
        tone === "lime" && "bg-[#E4FAD0]",
      )}
    >
      <Icon name={icon} className="mt-px size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Selectable card of the sign-up steps (profile, payment method): radio on the right. */
export const choiceCard = cx(
  "relative flex cursor-pointer gap-4 rounded-[20px] bg-blanc p-4 ring-[1.5px] ring-brume ring-inset transition-shadow lg:p-[18px]",
  "hover:ring-sapin/40 has-checked:shadow-[0_0_0_5px_rgb(166_242_107/0.55)] has-checked:ring-2 has-checked:ring-sapin",
  "has-focus-visible:shadow-[0_0_0_5px_rgb(166_242_107/0.9)]",
);

/** Radio disc drawn on the right of a `choiceCard` (the input itself stays for keyboards). */
export const choiceRadio =
  "peer size-[22px] shrink-0 cursor-pointer appearance-none rounded-full bg-blanc ring-[1.5px] ring-[#8a9794] ring-inset checked:bg-sapin checked:ring-sapin";

export function ChoiceDot() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-[7px] left-[7px] hidden size-2 rounded-full bg-lime peer-checked:block"
    />
  );
}
