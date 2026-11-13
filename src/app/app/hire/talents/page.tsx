import { isModelB } from "@/server/phone-routes";
import { redirect } from "next/navigation";
import { isHireScope } from "@/lib/product-scope";
import { getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { RhBell, RhTab } from "@/components/phone/recruteur/head";
import {
  RhTalentFilters,
  RhTalentFiltersColumn,
  RhTalents,
  RhTalentsTexts,
} from "@/components/phone/recruteur/talents";
import { isPhone } from "@/server/view";
import { requireHire } from "@/server/hire-context";

const TOASTS = [
  "masque",
  "liste",
  "relation",
  "ignoree",
  "invitation",
  "relance",
  "supprime",
] as const;

/**
 * The talent search lives in Candidats › Rechercher des talents since the recruiter redesign
 * (lot 4). Old addresses (bookmarks, e-mails) keep working: their filters are carried over. On a
 * phone (Modèle B) it is the first screen of the Talents tab.
 */
export default async function TalentsRedirect({ searchParams }: PageProps<"/app/hire/talents">) {
  const query = await searchParams;
  // On a phone, Talents is a tab of its own (Modèle B recruteur, lots M1 and M6).
  if (await isModelB()) {
    // Mode MVP (docs/mvp-web-recruteur lot M0): only the Vivier, while the base of talents is small.
    if (isHireScope() && query.onglet !== "vivier") {
      const next = new URLSearchParams();
      for (const [key, value] of Object.entries(query))
        if (typeof value === "string" && key !== "onglet") next.set(key, value);
      next.set("onglet", "vivier");
      redirect(`/app/hire/talents?${next}`);
    }
    const { ctx } = await requireHire("/app/hire/talents", "readApplications");
    const t = await getTranslations("phoneRhTalents");
    const ok = TOASTS.find((key) => key === query.ok);
    // On a computer the filters stay open in a column on the left (not for « Réseau »).
    const column = !(await isPhone()) && query.onglet !== "reseau";
    return (
      <RhTab
        tab="talents"
        legacy={false}
        actions={<RhBell />}
        searchExtra={
          column ? null : (
            <RhTalentsTexts>
              <RhTalentFilters query={query} />
            </RhTalentsTexts>
          )
        }
      >
        {ok ? <ToastOnLoad message={t(`ok.${ok}`)} tone="success" /> : null}
        {typeof query.erreur === "string" ? (
          <p className="nb-erreur nb-rh-marge" role="alert">
            {t("error.other")}
          </p>
        ) : null}
        <RhTalentsTexts>
          {column ? (
            <div className="nb-rh-t-deux">
              <RhTalentFiltersColumn query={query} />
              <div className="nb-rh-t-liste">
                <RhTalents ctx={ctx} query={query} />
              </div>
            </div>
          ) : (
            <RhTalents ctx={ctx} query={query} />
          )}
        </RhTalentsTexts>
      </RhTab>
    );
  }
  const next = new URLSearchParams({ vue: "talents" });
  const carry: Record<string, string> = {
    q: "q",
    location: "lieu",
    lieu: "lieu",
    job: "offre",
    offre: "offre",
    competences: "competences",
  };
  for (const [from, to] of Object.entries(carry)) {
    const value = query[from];
    if (typeof value === "string" && value) next.set(to, value.slice(0, 320));
  }
  redirect(`/app/hire/candidats?${next}`);
}
