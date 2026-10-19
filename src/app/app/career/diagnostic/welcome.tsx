import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { dynamic } from "@/i18n/dynamic";
import { discardDiagnosticDraftAction } from "@/server/actions/diagnostic";
import { dimensions } from "@/server/services/diagnostic-scoring";

const hooks: { key: "dimensions" | "steps" | "explained"; icon: TalentIconName }[] = [
  { key: "dimensions", icon: "progression" },
  { key: "steps", icon: "suivant" },
  { key: "explained", icon: "pourquoi" },
];

/**
 * Start of the diagnostic, in the talent design (planche talent-4 § 5): what the talent gets, the
 * option to start from the profile, and one button at the bottom (« Lancer », or « Reprendre… »
 * with a draft). Plain links and forms: it works without JavaScript.
 */
export async function DiagnosticWelcome({
  withAi,
  resume,
  again,
  upsell,
  latestId,
  alerts,
}: {
  /** Consent or credit notices, under the head. */
  alerts?: ReactNode;
  withAi: boolean;
  /** Dimension (1 to 6) where the draft in progress stopped. */
  resume: number | null;
  /** The talent already has a result: « Refaites le point ». */
  again: boolean;
  /** Plan that opens the personalized diagnostic, when the talent does not have it. */
  upsell: string | null;
  /** The last result, where « Retour » leads. */
  latestId: string | null;
}) {
  const t = await getTranslations();
  const d = dynamic(t);
  const prefill = (
    <label className="t-verre t-coche-l">
      <input type="checkbox" name="profil" value="1" defaultChecked />
      <span>
        <b>{t("career.diagnostic.q.useProfile")}</b>
        <span>{t("career.diagnostic.welcome.prefillHint")}</span>
      </span>
    </label>
  );
  return (
    <div className="t-flux">
      <FlowHead
        back={latestId ? `/app/career/diagnostic?bilan=${latestId}` : "/app/profil/point"}
        backLabel={t("diag.back")}
        title={t("diag.title")}
      />
      {alerts}
      <section aria-labelledby="dg-accueil" className="t-diag-a">
        <h2 id="dg-accueil">
          {again ? t("career.diagnostic.welcome.titleAgain") : t("career.diagnostic.welcome.title")}
        </h2>
        <p>
          {t("career.diagnostic.welcome.tagline", {
            duration: t("career.diagnostic.welcome.duration"),
          })}
        </p>
      </section>
      <section aria-labelledby="dg-hooks" className="t-verre t-liste t-lignes">
        <h2 id="dg-hooks" className="sr-only">
          {t("diag.welcome.hooks")}
        </h2>
        {hooks.map((hook) => (
          <div key={hook.key} className="t-li">
            <span className="t-cases t-c1">
              <TalentIcon name={hook.icon} size="s" />
            </span>
            <div className="t-t">
              <b>{d(`career.diagnostic.welcome.hook.${hook.key}`)}</b>
              <span>{d(`career.diagnostic.welcome.hook.${hook.key}Text`)}</span>
            </div>
          </div>
        ))}
      </section>
      <div className="t-bulle-o">
        <OrbiMark size={32} />
        <div className="t-verre t-corps">
          <span>
            {withAi
              ? t("career.diagnostic.welcome.ai.personalized")
              : t("career.diagnostic.welcome.ai.simple")}
          </span>
        </div>
      </div>
      {upsell && (
        <p className="t-gar">
          <TalentIcon name="cadenas" size="s" />
          <span>
            {t("career.diagnostic.upsell", { plan: upsell })}{" "}
            <Link href="/app/abonnement" className="t-lien-d">
              {t("career.diagnostic.welcome.plans")}
            </Link>
          </span>
        </p>
      )}
      <p className="t-gar">
        <TalentIcon name="cadenas" size="s" />
        <span>{t("career.diagnostic.privacy")}</span>
      </p>
      {resume ? (
        <form action={discardDiagnosticDraftAction} className="t-flux">
          {prefill}
          <div className="t-verre t-fort t-bas-f">
            <button type="submit" className="t-bt t-sec t-m t-press">
              {t("career.diagnostic.welcome.restart")}
            </button>
            <Link href="/app/career/diagnostic?etape=reprendre" className="t-bt t-p t-pl t-press">
              {t("career.diagnostic.welcome.resume", {
                current: resume,
                total: dimensions.length,
              })}
            </Link>
          </div>
        </form>
      ) : (
        <form action="/app/career/diagnostic" className="t-flux">
          <input type="hidden" name="etape" value="1" />
          {prefill}
          <div className="t-verre t-fort t-bas-f">
            <button type="submit" className="t-bt t-a t-pl t-press">
              {t("career.diagnostic.welcome.launch")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
