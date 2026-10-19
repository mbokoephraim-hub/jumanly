import { useTranslations } from "next-intl";
import { dynamic } from "@/i18n/dynamic";
import type { CriterionResult } from "@/server/matching/types";

/** Text keys of each criterion (partie 06 « Libellés des critères »). */
export const criterionText = {
  skills_required: "requiredSkills",
  skills_preferred: "preferredSkills",
  experience: "experience",
  education: "education",
  languages: "languages",
  location: "location",
  contract: "contract",
  semantic: "semantic",
} as const;

export const statusText = {
  met: "met",
  partial: "partial",
  unmet: "unmet",
  unknown: "unknown",
  not_applicable: "notApplicable",
} as const;

/** One sentence per criterion, built only from the facts of the explanation (never invented). */
export function useCriterionDetail() {
  const t = useTranslations();
  return (criterion: CriterionResult): string | null => {
    const facts = criterion.facts ?? {};
    if (criterion.status === "not_applicable") return null;
    if (criterion.status === "unknown") return t("match.detail.unknown");
    switch (criterion.key) {
      case "skills_required":
      case "skills_preferred": {
        const evidence = criterion.evidence ?? [];
        return t("match.detail.skills", {
          met: evidence.filter((item) => item.coverage >= 0.9).length,
          total: evidence.length,
        });
      }
      case "experience":
        return facts.min === 0
          ? t("match.detail.experience.none")
          : t("match.why.talent.met.item.experience", {
              years: Number(facts.years ?? 0),
              min: Number(facts.min ?? 0),
            });
      case "education":
        if (facts.required === null) return t("match.detail.education.none");
        return [
          criterion.status === "met"
            ? t("match.detail.education.met")
            : t("match.detail.education.below"),
          facts.certificate ? t("match.detail.education.certificate") : null,
        ]
          .filter(Boolean)
          .join(" ");
      case "languages": {
        const ranks = Object.values(facts).map(Number);
        return t("match.detail.languages", {
          met: ranks.filter((rank) => rank > 0).length,
          total: ranks.length,
        });
      }
      case "location": {
        const city = String(facts.city ?? "");
        const remote = facts.remote === "remote" ? "full" : String(facts.remote ?? "onsite");
        if (criterion.status === "met")
          return t("match.why.talent.met.item.location", {
            city,
            workMode: dynamic(t)(`jobs.card.remote.${remote}`),
          });
        return criterion.status === "partial"
          ? t("match.detail.location.relocation", { city })
          : t("match.detail.location.far", { city });
      }
      case "contract":
        return [
          facts.contract ? t("match.detail.contract.wanted") : t("match.detail.contract.notWanted"),
          facts.available ? t("match.detail.availability.ok") : t("match.detail.availability.late"),
        ].join(" ");
      case "semantic":
        return t("match.detail.semantic", {
          percent: Math.round(criterion.value * 100),
        });
    }
  };
}
