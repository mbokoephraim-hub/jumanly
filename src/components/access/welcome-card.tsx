import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { WelcomeToast } from "./welcome-toast";

/**
 * « Bienvenue sur Jumanly » on Pour moi (planche talent-4 § 1): three first steps with real
 * figures, shown to a new account until they are done. Right after the sign-up, the toast
 * « Compte créé · formule Free » (the plan named from the base).
 */
export async function WelcomeCard({
  percent,
  hasCv,
  offers,
  place,
  toastPlan,
}: {
  percent: number;
  hasCv: boolean;
  offers: number;
  place: string | null;
  /** Name of the plan, for the toast shown once after the sign-up. */
  toastPlan?: string;
}) {
  const t = await getTranslations("access.welcomeCard");
  const steps = [
    {
      key: "profile",
      href: "/app/profil",
      label: t("profile"),
      value: t("profileValue", { percent }),
      done: percent >= 80,
    },
    { key: "cv", href: "/app/career/cv", label: t("cv"), value: t("cvValue"), done: hasCv },
    {
      key: "offers",
      href: "/app/jobs",
      label: t("offers", { count: offers }),
      value: place,
      done: false,
    },
  ];
  return (
    <section aria-labelledby="bienvenue-titre" className="t-verre t-bienv">
      <span className="t-k">
        <OrbiMark size={28} />
        {t("kicker")}
      </span>
      <h2 id="bienvenue-titre">{t("title")}</h2>
      <ol>
        {steps.map((step, index) => (
          <li key={step.key}>
            <Link href={step.href} className={cx("t-pr-l t-press", step.done && "t-fait")}>
              <span className="t-n1" aria-hidden>
                {step.done ? <TalentIcon name="valider" size="xs" /> : index + 1}
              </span>
              <b>{step.label}</b>
              <span>{step.done ? t("done") : step.value}</span>
            </Link>
          </li>
        ))}
      </ol>
      {toastPlan && <WelcomeToast message={t("toast", { plan: toastPlan })} />}
    </section>
  );
}
