import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { MenuArt } from "@/components/site/menu-art";
import { saveJobWeightsAction } from "@/server/actions/hire-weights";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { criterionKeys } from "@/server/matching/types";
import { HireError, hirePermissions } from "@/server/services/hire";
import { jobWeights, WEIGHTS_ENTITLEMENT } from "@/server/services/hire-weights";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhTri.weights");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * « Poids du score » (évaluation recruteur, 06/11/2026): what counts more for this offer. Each
 * criterion of partie 08 gets a weight from 0 to 100; the score is the weighted share of what was
 * found, so the weights are read as proportions. With the entitlement `hire.matching.weights`
 * only; without it, the weights are shown and the plan that opens them.
 */
export default async function WeightsPage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/poids">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx } = await requireHire(`/app/hire/offres/${id}/poids`, "readApplications");
  const t = await getTranslations("phoneRhTri.weights");
  const tc = await getTranslations("phoneRhCandidatures.why.criteria");
  const data = await jobWeights(db, ctx, id.slice(0, 60)).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const total = criterionKeys.reduce((sum, key) => sum + data.values[key], 0) || 1;
  const plan = data.allowed
    ? null
    : orgPlanFor(await listPublicPlans(db), WEIGHTS_ENTITLEMENT, ["true"]);

  return (
    <div className="nb-page jm-pieces jm-poids">
      {one(query.ok) ? <ToastOnLoad message={t("saved")} tone="success" /> : null}
      <header className="jm-pieces-h">
        <Link href={`/app/hire/offres/${data.job.id}/resultats`} className="jm-pieces-retour">
          {t("back")}
        </Link>
        <h1>
          <MenuArt name="why" size="sm" />
          {t("title")}
        </h1>
        <p>{data.job.title}</p>
        <p className="jm-pieces-compte">{data.own ? t("own") : t("defaults")}</p>
      </header>
      {one(query.erreur) ? (
        <p className="jm-pieces-erreur" role="alert">
          {t("error")}
        </p>
      ) : null}
      <section className="jm-pieces-s">
        <p className="jm-pieces-meta">{t("lead")}</p>
      </section>
      {data.allowed && hirePermissions(ctx.role).manage ? (
        <form
          action={saveJobWeightsAction}
          className="jm-pieces-s jm-pieces-form"
          id={`poids-${data.job.id}`}
        >
          <input type="hidden" name="job" value={data.job.id} />
          {criterionKeys.map((key) => (
            <label key={key} className="jm-pieces-champ">
              {tc(key)}
              <span className="jm-poids-ligne">
                <input
                  type="number"
                  name={key}
                  min={0}
                  max={100}
                  inputMode="numeric"
                  defaultValue={data.values[key]}
                  required
                />
                <span className="jm-pieces-meta">
                  {t("share", { value: Math.round((100 * data.values[key]) / total) })}
                </span>
              </span>
            </label>
          ))}
          <p className="jm-pieces-meta">{t("rule")}</p>
          <button type="submit" className="jm-pieces-envoyer">
            {t("save")}
          </button>
          {data.own ? (
            <button type="submit" name="reset" value="1" className="jm-pieces-retour">
              {t("reset")}
            </button>
          ) : null}
        </form>
      ) : (
        <>
          <ul className="jm-pieces-s jm-resultats-liste">
            {criterionKeys.map((key) => (
              <li key={key}>
                {tc(key)}
                <span className="jm-resultats-score">
                  {t("share", { value: Math.round((100 * data.values[key]) / total) })}
                </span>
              </li>
            ))}
          </ul>
          {data.allowed ? null : (
            <section className="jm-pieces-s jm-pieces-lock" aria-labelledby="poids-formule">
              <h2 id="poids-formule">
                <MenuArt name="pricing" size="xs" />
                {t("lockTitle")}
              </h2>
              <p className="jm-pieces-meta">{plan ? t("lockPlan", { plan }) : t("lockNoPlan")}</p>
              <Link href="/app/abonnement/formules" className="jm-pieces-envoyer">
                {t("lockSee")}
              </Link>
            </section>
          )}
        </>
      )}
      <p className="jm-pieces-meta">{t("never")}</p>
    </div>
  );
}
