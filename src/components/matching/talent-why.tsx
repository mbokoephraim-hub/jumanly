import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { Badge, ScoreBadge } from "@/components/ui";
import { dynamic } from "@/i18n/dynamic";
import type { CriterionResult, MatchExplanation, MissingSkill } from "@/server/matching/types";

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

const statusTone = {
  met: "success",
  partial: "warning",
  unmet: "neutral",
  unknown: "neutral",
  not_applicable: "neutral",
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

/** Breakdown by criterion: name, status, share of the criterion obtained, weight, sentence. */
export function CriterionList({
  explanation,
  audience = "talent",
}: {
  explanation: MatchExplanation;
  /** The sentences speak to the talent (« vous »); the recruiter sees the evidence instead. */
  audience?: "talent" | "recruiter";
}) {
  const t = useTranslations();
  const detail = useCriterionDetail();
  const d = dynamic(t);
  return (
    <ul className="flex flex-col divide-y divide-brume">
      {explanation.criteria.map((criterion) => {
        const sentence = audience === "talent" ? detail(criterion) : null;
        return (
          <li key={criterion.key} className="flex flex-col gap-1 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">
                {d(`match.criterion.${criterionText[criterion.key]}.text`)}
              </span>
              <span className="flex flex-wrap items-center gap-2 text-sm">
                <Badge tone={statusTone[criterion.status]}>
                  {d(`match.criterion.status.${statusText[criterion.status]}`)}
                </Badge>
                {criterion.status !== "not_applicable" && (
                  <span className="text-ardoise">
                    {[
                      t("match.criterion.percent", { percent: Math.round(criterion.value * 100) }),
                      t("match.criterion.weight", { weight: criterion.weight }),
                    ].join(" · ")}
                  </span>
                )}
              </span>
            </div>
            {sentence && <p className="text-sm text-ardoise">{sentence}</p>}
            {audience === "recruiter" && criterion.evidence && criterion.evidence.length > 0 && (
              <ul className="flex flex-col gap-0.5 text-sm text-ardoise">
                {criterion.evidence.map((item) => (
                  <li key={item.skillId}>
                    {[
                      item.skill,
                      item.talent === null
                        ? t("match.why.recruiter.evidence.absent")
                        : item.verified
                          ? t("match.why.recruiter.evidence.verified")
                          : t("match.why.recruiter.evidence.declared"),
                    ].join(" · ")}
                  </li>
                ))}
              </ul>
            )}
            {audience === "talent" && criterion.tip?.type === "complete_profile" && (
              <Link href="/app/profil" className="text-sm font-medium underline">
                {t("ai.dispute.fixFirst.cta")}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type GapCourse = {
  slug: string;
  title: string;
  durationMinutes: number;
  requiredLevel: string;
};

export type Gap = Omit<MissingSkill, "courses"> & { newScore: number; courses: GapCourse[] };

/**
 * The full « Pourquoi ? » for a talent (§ 8.5, § 8.6): what matches, what is missing with the
 * courses that close the gap (locked when the plan does not open them), the knockout criteria
 * « à vérifier », what is never used, and the way to contest.
 */
export function TalentWhy({
  explanation,
  jobTitle,
  gaps,
  courseAccess,
}: {
  explanation: MatchExplanation;
  jobTitle: string;
  gaps: Gap[];
  /** For each course level: null when open, else the name of the plan that opens it. */
  courseAccess: (requiredLevel: string) => { open: boolean; plan: string | null };
}) {
  const t = useTranslations();
  const d = dynamic(t);
  const met = explanation.criteria.filter((criterion) => criterion.status === "met");
  const partial = explanation.criteria.filter((criterion) => criterion.status === "partial");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-h2">{t("match.why.talent.title", { score: explanation.score })}</h2>
        <ScoreBadge score={explanation.score} band={explanation.band} />
      </div>
      <p className="text-[15px] leading-6">{t("match.why.talent.intro", { jobTitle })}</p>
      {explanation.band === "low" && (
        <p className="font-medium text-feuille-fonce">{t("match.score.lowIsNotNo")}</p>
      )}

      {(met.length > 0 || partial.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["met", met],
              ["partial", partial],
            ] as const
          ).map(([group, items]) =>
            items.length === 0 ? null : (
              <section key={group} className="flex flex-col gap-2">
                <h3 className="font-semibold text-h3">{t(`match.why.talent.${group}.title`)}</h3>
                <ul className="flex flex-col gap-1 text-[15px]">
                  {items.map((criterion) => (
                    <li key={criterion.key} className="flex gap-2">
                      <Icon
                        name={group === "met" ? "valider" : "objectif"}
                        className="mt-1 size-4 shrink-0"
                      />
                      {d(`match.criterion.${criterionText[criterion.key]}.text`)}
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="font-semibold text-h3">{t("match.why.talent.missing.title")}</h3>
        {gaps.length === 0 ? (
          <p>{t("match.why.talent.missing.none")}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {gaps.map((gap) => (
              <li key={gap.skillId} className="flex flex-col gap-2 rounded-card bg-creme p-4">
                <p className="font-semibold">
                  {gap.importance === "required"
                    ? t("match.why.talent.missing.required", { skill: gap.skill })
                    : t("match.why.talent.missing.preferred", { skill: gap.skill })}
                </p>
                {gap.courses.length === 0 ? (
                  <p className="text-sm text-ardoise">{t("match.why.talent.courses.none")}</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {gap.courses.map((course) => {
                      const access = courseAccess(course.requiredLevel);
                      return (
                        <li key={course.slug} className="flex flex-col gap-1 text-sm">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">
                              {t("match.why.talent.courses.item", {
                                courseTitle: course.title,
                                hours: Math.round(course.durationMinutes / 6) / 10,
                              })}
                            </span>
                            {access.open ? (
                              <Badge tone="success">
                                {course.requiredLevel === "free"
                                  ? t("match.why.talent.courses.free")
                                  : t("match.why.talent.courses.included")}
                              </Badge>
                            ) : (
                              <Badge
                                tone="neutral"
                                icon={<Icon name="securite" className="size-3.5" />}
                              >
                                {t("match.why.talent.courses.locked", { plan: access.plan ?? "" })}
                              </Badge>
                            )}
                          </span>
                          <span className="text-feuille-fonce">
                            {t("match.why.talent.courses.impact", { newScore: gap.newScore })}
                          </span>
                          <Link href={`/app/learn/${course.slug}`} className="underline">
                            {t("match.why.talent.courses.cta")}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="text-sm text-ardoise">
                  {t("match.why.talent.missing.maybeHave")}{" "}
                  <Link href="/app/profil" className="font-medium underline">
                    {t("match.why.talent.missing.addToProfile")}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {explanation.knockouts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold text-h3">{t("match.why.talent.knockout.title")}</h3>
          <ul className="flex flex-col gap-1 text-[15px]">
            {explanation.knockouts.map((knockout) => (
              <li key={knockout.label} className="flex flex-wrap items-center gap-2">
                {knockout.label}
                <Badge tone="neutral">{t("match.why.talent.knockout.toVerify")}</Badge>
              </li>
            ))}
          </ul>
          <p className="text-sm text-ardoise">{t("talent.jobs.detail.knockout.hint")}</p>
        </section>
      )}

      <section className="flex flex-col gap-1">
        <h3 className="font-semibold text-h3">{t("match.why.talent.breakdown")}</h3>
        <CriterionList explanation={explanation} />
      </section>

      <p className="text-sm text-ardoise">{t("match.why.talent.neverUsed")}</p>
      <p className="text-sm">{t("match.why.talent.footer")}</p>
      <Link href="/comment-fonctionne-le-matching" className="text-sm font-medium underline">
        {t("match.why.talent.learnMore")}
      </Link>
    </div>
  );
}
