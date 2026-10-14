import { getTranslations } from "next-intl/server";
import { Alert, Button, Checkbox, PlanLock, Select, TextArea } from "@/components/ui";
import type { Prisma } from "@/generated/prisma/client";
import { assignJobAction, saveScorecardTemplateAction } from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { can, level } from "@/server/entitlements";
import { scorecardCriteria, SCORECARD_CRITERIA_MAX } from "@/server/services/evaluation";
import type { HireContext } from "@/server/services/hire";
import { orgStructure } from "@/server/services/org-structure";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";

type Job = {
  id: string;
  assignedToId: string | null;
  teamId: string | null;
  departmentId: string | null;
  entityId: string | null;
  scorecardTemplate: Prisma.JsonValue;
  skills: { importance: string; skill: { name: string } }[];
  assignments: { userId: string }[];
};

/**
 * Below the pipeline, for those who manage the job: who is in charge of it (`org.teams`,
 * `org.entities`, `hire.collaboration`) and the scorecard template (`hire.scorecards`).
 */
export async function JobSettings({
  ctx,
  job,
  ok,
  error,
}: {
  ctx: HireContext;
  job: Job;
  ok?: string;
  error?: string;
}) {
  const t = await getTranslations("hire");
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [teams, entities, collaboration, scorecards, permissionsLevel, plans] = await Promise.all([
    can(db, subject, "org.teams"),
    can(db, subject, "org.entities"),
    can(db, subject, "hire.collaboration"),
    can(db, subject, "hire.scorecards"),
    level(db, subject, "org.permissions.level"),
    listPublicPlans(db),
  ]);
  const showAssign = teams || entities || collaboration;
  const [structure, members] = await Promise.all([
    showAssign ? orgStructure(db, ctx.organizationId) : null,
    showAssign
      ? db.membership.findMany({
          where: { organizationId: ctx.organizationId, status: "active" },
          orderBy: { createdAt: "asc" },
          select: { userId: true, role: true, user: { select: { name: true } } },
        })
      : [],
  ]);
  const none = t("assign.none");
  const criteria = scorecardCriteria(job);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section
        id="attribution"
        aria-labelledby="attribution-title"
        className="flex flex-col gap-4 rounded-card bg-blanc p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 id="attribution-title" className="text-h2">
            {t("assign.title")}
          </h2>
          <p className="text-sm text-ardoise">{t("assign.subtitle")}</p>
        </div>
        {ok === "attribution" && <Alert tone="success" title={t("assign.saved")} />}
        {error && <Alert tone="error" title={t("assign.error")} />}
        {!showAssign || !structure ? (
          <PlanLock plan={orgPlanFor(plans, "org.teams")} />
        ) : (
          <form action={assignJobAction} className="flex flex-col gap-4">
            <input type="hidden" name="job" value={job.id} />
            {teams && (
              <>
                <Select
                  id="assign-owner"
                  name="assignedTo"
                  label={t("jobs.filter.owner")}
                  placeholder={none}
                  defaultValue={job.assignedToId ?? ""}
                  options={members
                    .filter((member) => member.role !== "viewer")
                    .map((member) => ({ value: member.userId, label: member.user.name }))}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    id="assign-team"
                    name="team"
                    label={t("jobs.filter.team")}
                    placeholder={none}
                    defaultValue={job.teamId ?? ""}
                    options={structure.teams.map((team) => ({ value: team.id, label: team.name }))}
                  />
                  <Select
                    id="assign-department"
                    name="department"
                    label={t("jobs.filter.department")}
                    placeholder={none}
                    defaultValue={job.departmentId ?? ""}
                    options={structure.departments.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />
                </div>
              </>
            )}
            {entities ? (
              <Select
                id="assign-entity"
                name="entity"
                label={t("jobs.filter.entity")}
                placeholder={none}
                defaultValue={job.entityId ?? ""}
                options={structure.entities.map((entity) => ({
                  value: entity.id,
                  label: entity.name,
                }))}
              />
            ) : (
              <p className="text-sm text-ardoise">
                {t("assign.entities.locked", { plan: orgPlanFor(plans, "org.entities") })}
              </p>
            )}
            {collaboration && permissionsLevel !== "basic" && (
              <fieldset className="flex flex-col gap-2">
                <legend className="font-medium">{t("assign.members.text")}</legend>
                <p className="text-sm text-ardoise">{t("assign.members.hint")}</p>
                {members
                  .filter(
                    (member) => member.role === "hiring_manager" || member.role === "recruiter",
                  )
                  .map((member) => (
                    <Checkbox
                      key={member.userId}
                      id={`assign-member-${member.userId}`}
                      name="members"
                      value={member.userId}
                      defaultChecked={job.assignments.some((item) => item.userId === member.userId)}
                      label={member.user.name}
                    />
                  ))}
              </fieldset>
            )}
            <Button type="submit" variant="secondary" className="self-start">
              {t("assign.save")}
            </Button>
          </form>
        )}
      </section>

      <section
        id="grille"
        aria-labelledby="grille-title"
        className="flex flex-col gap-4 rounded-card bg-blanc p-6"
      >
        <h2 id="grille-title" className="text-h2">
          {t("scorecard.template.text")}
        </h2>
        {ok === "grille" && <Alert tone="success" title={t("scorecard.template.saved")} />}
        {scorecards ? (
          <form action={saveScorecardTemplateAction} className="flex flex-col gap-4">
            <input type="hidden" name="job" value={job.id} />
            <TextArea
              id="scorecard-template"
              name="criteria"
              rows={6}
              maxLength={3000}
              required
              label={t("scorecard.template.edit")}
              hint={t("scorecard.template.hint")}
              defaultValue={criteria
                .map((item) =>
                  item.description ? `${item.name} : ${item.description}` : item.name,
                )
                .join("\n")}
            />
            <p className="text-sm text-ardoise">
              {t("scorecard.template.invalid", { max: SCORECARD_CRITERIA_MAX })}
            </p>
            <Button type="submit" variant="secondary" className="self-start">
              {t("scorecard.template.save")}
            </Button>
          </form>
        ) : (
          <PlanLock
            plan={orgPlanFor(plans, "hire.scorecards")}
            description={t("scorecard.locked", { plan: orgPlanFor(plans, "hire.scorecards") })}
          />
        )}
      </section>
    </div>
  );
}
