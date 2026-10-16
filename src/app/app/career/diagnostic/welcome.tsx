import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { ScanScene, type ScanCard } from "@/components/motion/scan";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { discardDiagnosticDraftAction } from "@/server/actions/diagnostic";
import { dimensions } from "@/server/services/diagnostic-scoring";

/**
 * Welcome screen of the diagnostic (docs/experience-animee § 5.1): the talent's card floating on
 * a white card (Admin v4 étape 5), the Nuit-orbe scene beside it, with Orbi on its orbit and the six dimensions, unlit; the duration,
 * the option to start from the profile, and « Lancer » (or « Reprendre… » when a diagnostic is in
 * progress). Plain links and forms: it works without JavaScript.
 */
export async function DiagnosticWelcome({
  badge,
  withAi,
  resume,
}: {
  badge: ScanCard;
  withAi: boolean;
  /** Dimension (1 to 6) where the draft in progress stopped. */
  resume: number | null;
}) {
  const t = await getTranslations("career.diagnostic");
  const d = dynamic(t);
  const prefill = (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-sapin">
      <input
        type="checkbox"
        name="profil"
        value="1"
        defaultChecked
        className="mt-0.5 size-5 shrink-0 accent-sapin"
      />
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold">{t("q.useProfile")}</span>
        <span className="text-[13px] text-ardoise">{t("welcome.prefillHint")}</span>
      </span>
    </label>
  );
  return (
    <section
      aria-labelledby="diagnostic-welcome"
      className="grid grid-cols-1 items-center gap-6 overflow-hidden rounded-[22px] border border-sapin/8 bg-blanc p-4 text-sapin sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-8 lg:p-6"
    >
      <div className="flex flex-col gap-4 max-lg:order-2">
        <p className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span
            className={cx(
              "flex items-center gap-1.5 rounded-pill px-3 py-1.5",
              withAi ? "bg-lime text-sapin" : "bg-creme text-sapin",
            )}
          >
            <Icon name="intelligence" className="size-3.5" />
            {withAi ? t("badge.personalized") : t("badge.simple")}
          </span>
          <span className="flex items-center gap-1.5 rounded-pill bg-creme px-3 py-1.5">
            <Icon name="horloge" className="size-3.5" />
            {t("welcome.duration")}
          </span>
        </p>
        <h2
          id="diagnostic-welcome"
          className="text-[22px] leading-tight font-semibold lg:text-[26px]"
        >
          {t("welcome.title")}
        </h2>
        <p className="text-[15px] leading-6 text-sapin/85">{t("welcome.text")}</p>
        <p className="text-sm text-ardoise">
          {withAi ? t("intro.personalized") : t("intro.simple")}
        </p>
        {resume ? (
          <div className="flex flex-col gap-4">
            <Link
              href="/app/career/diagnostic?etape=reprendre"
              className={pillClass("lime", "md", "self-start")}
            >
              {t("welcome.resume", { current: resume, total: dimensions.length })}
              <Icon name="chev-r" className="size-4" />
            </Link>
            <form action={discardDiagnosticDraftAction} className="flex flex-col gap-4">
              {prefill}
              <button type="submit" className={pillClass("outline", "md", "self-start")}>
                {t("welcome.restart")}
              </button>
            </form>
          </div>
        ) : (
          <form action="/app/career/diagnostic" className="flex flex-col gap-4">
            <input type="hidden" name="etape" value="1" />
            {prefill}
            <button type="submit" className={pillClass("lime", "md", "self-start")}>
              {t("welcome.launch")}
              <Icon name="chev-r" className="size-4" />
            </button>
          </form>
        )}
        <p className="flex gap-2 text-xs leading-[17px] text-ardoise">
          <Icon name="lock" className="mt-px size-4 shrink-0" />
          {t("privacy")}
        </p>
      </div>
      <ScanScene
        card={badge}
        nodesLabel={t("welcome.constellation")}
        nodes={dimensions.map((key) => ({ key, label: d(`dimension.${key}.short`), band: null }))}
        className="max-lg:order-1"
      />
    </section>
  );
}
