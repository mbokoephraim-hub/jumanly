import "@/styles/diagnostic-accueil.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiSpark } from "@/components/phone/cv/marks";
import { discardDiagnosticDraftAction } from "@/server/actions/diagnostic";
import { dimensions } from "@/server/services/diagnostic-scoring";

/** Where the diagnostic leads back to: Carrière › Progression (Ephraïm, 31/10/2026). */
export const PROGRESSION_HREF = "/app/career/cv?onglet=progression";

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
  /** The last result (« Retour » now always leads to Progression). */
  latestId?: string | null;
}) {
  const t = await getTranslations();
  const prefill = (
    <label className="dg-a-profil">
      <input type="checkbox" name="profil" value="1" defaultChecked />
      <span className="dg-a-coche" aria-hidden />
      <span>
        <b>{t("career.diagnostic.welcome.useProfileShort")}</b>
        <small>{t("career.diagnostic.welcome.useProfileHint")}</small>
      </span>
    </label>
  );
  return (
    <div className="t-flux dg-a">
      <FlowHead
        back={PROGRESSION_HREF}
        backLabel={t("diag.back")}
        history={false}
        title={t("diag.title")}
      />
      {alerts}
      {/* Orbi says what the person will find here (Ephraïm, 31/10/2026): few words, in bold. */}
      <section aria-labelledby="dg-accueil" className="dg-a-hero">
        <span className="dg-a-orbi" aria-hidden>
          <OrbiSpark size={22} />
        </span>
        <div className="dg-a-bulle">
          <h2 id="dg-accueil">
            {again
              ? t("career.diagnostic.welcome.titleAgain")
              : t("career.diagnostic.welcome.hello")}
          </h2>
          <p className="dg-a-tags">
            <span>
              <TalentIcon name="horloge" size="xs" />
              {t("career.diagnostic.welcome.duration")}
            </span>
            <span>
              <TalentIcon name="cadenas" size="xs" />
              {t("career.diagnostic.welcome.private")}
            </span>
          </p>
        </div>
      </section>
      <section aria-labelledby="dg-hooks" className="dg-a-etapes">
        <h2 id="dg-hooks">{t("career.diagnostic.welcome.howTitle")}</h2>
        <ol>
          {([1, 2, 3] as const).map((n) => (
            <li key={n}>
              <span className="dg-a-n" aria-hidden>
                {n}
              </span>
              <span>
                <b>{t(`career.diagnostic.welcome.how.${n}`)}</b>
                <small>{t(`career.diagnostic.welcome.how.${n}Text`)}</small>
              </span>
            </li>
          ))}
        </ol>
      </section>
      {upsell && (
        <p className="dg-a-note">
          <TalentIcon name="cadenas" size="xs" />
          <span>
            {t("career.diagnostic.upsell", { plan: upsell })}{" "}
            <Link href="/app/abonnement" className="t-lien-d">
              {t("career.diagnostic.welcome.plans")}
            </Link>
          </span>
        </p>
      )}
      {withAi && <p className="dg-a-note">{t("career.diagnostic.welcome.ai.personalized")}</p>}
      {resume ? (
        <form action={discardDiagnosticDraftAction} className="t-flux">
          {prefill}
          <div className="t-verre t-fort t-bas-f">
            <button type="submit" className="t-bt t-sec t-m t-press">
              {t("career.diagnostic.welcome.restart")}
            </button>
            <Link
              href="/app/career/diagnostic?etape=reprendre"
              className="t-bt t-p t-pl t-press dg-a-go"
            >
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
            <button type="submit" className="t-bt t-a t-pl t-press dg-a-go">
              {t("career.diagnostic.welcome.launch")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
