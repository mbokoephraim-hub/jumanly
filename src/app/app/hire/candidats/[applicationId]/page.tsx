import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ScorecardPanel } from "@/components/hire/scorecard-panel";
import { RecruiterWhy } from "@/components/matching/recruiter-why";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  RadioGroup,
  Select,
  TextArea,
  TextField,
} from "@/components/ui";
import {
  addNoteAction,
  moveApplicationAction,
  rejectApplicationAction,
  requestDocumentAction,
} from "@/server/actions/hire";
import { addToPoolAction, deleteNoteAction, editNoteAction } from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { can, level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { applicationMatches } from "@/server/matching/service";
import { ensureApplicationConversation } from "@/server/services/connect";
import { scorecardCriteria, scorecardView, visibleNotes } from "@/server/services/evaluation";
import { HireError, hirePermissions, recordView, rejectReasons } from "@/server/services/hire";
import { parseCriteria } from "@/server/services/jobs";
import { cheapestPlanWhere, levelOf, listPublicPlans, orgPlanFor } from "@/server/services/plans";
import { listPools } from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.application");
  return { title: { absolute: t("tab.profile") }, robots: { index: false } };
}

import { describeEvent, payloadText as text } from "@/server/hire-history";
import { AppPageHeader } from "@/components/app/page-header";

/**
 * A candidate's application, seen by the recruiting team (partie 07 § 4). Opening it is logged
 * (golden rule n° 5). Every decision is a human action with its own form.
 */
export default async function CandidatePage({
  params,
  searchParams,
}: PageProps<"/app/hire/candidats/[applicationId]">) {
  const [{ applicationId }, query] = await Promise.all([params, searchParams]);
  const { user, space, ctx } = await requireHire(
    `/app/hire/candidats/${applicationId}`,
    "readApplications",
  );
  const t = await getTranslations("hire");
  const tp = await getTranslations("talent.profile");
  const format = await getFormatter();
  const application = await recordView(db, ctx, applicationId).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const permissions = hirePermissions(ctx.role);
  const conversation =
    application.conversation ?? (await ensureApplicationConversation(db, application.id));
  const { profile, job } = application;
  const person = profile.user;
  const actorIds = [
    ...new Set(
      application.events.map((event) => event.actorId).filter((id): id is string => Boolean(id)),
    ),
  ];
  const actors = new Map(
    (
      await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
    ).map((actor) => [actor.id, actor.name]),
  );
  const memberName = (id: string | null) => (id ? (actors.get(id) ?? "") : "");
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const notes = await visibleNotes(db, ctx, application.events);
  const criteria = parseCriteria(job.knockoutCriteria);
  const [matchingLevel, collaboration, scorecards, history, appointments, shortlist] =
    await Promise.all([
      level(db, subject, "hire.matching.level"),
      can(db, subject, "hire.collaboration"),
      can(db, subject, "hire.scorecards"),
      can(db, subject, "hire.decision_history"),
      can(db, subject, "connect.appointments"),
      can(db, subject, "hire.shortlist"),
    ]);
  const [scoreView, pools] = await Promise.all([
    scorecards ? scorecardView(db, ctx, application) : null,
    shortlist && permissions.manage ? listPools(db, ctx) : [],
  ]);
  const [match, plans, dispute] = await Promise.all([
    matchingLevel === "none"
      ? null
      : applicationMatches(db, [application]).then((map) => map.get(application.id) ?? null),
    listPublicPlans(db),
    db.matchDispute.findFirst({
      where: {
        applicationId: application.id,
        notifyRecruiter: true,
        status: { in: ["open", "in_review"] },
      },
      select: { id: true },
    }),
  ]);
  const planWithMatching = (levels: string[]) =>
    cheapestPlanWhere(plans, ["rh", "company"], (plan) =>
      levels.includes(levelOf(plan, "hire.matching.level")),
    )?.name ?? null;
  const stamp = (date: Date) =>
    t("history.timestamp", {
      date,
      time: format.dateTime(date, { hour: "2-digit", minute: "2-digit" }),
    });
  const describe = (event: (typeof application.events)[number]) =>
    describeEvent(t, memberName(event.actorId), event);

  const defaultRejection = (
    job.rejectionTemplate ??
    t("reject.message.default", {
      firstName: person.firstName ?? person.name,
      org: space.organization.name,
      jobTitle: job.title,
      recruiterName: user.name,
    })
  ).replaceAll("\\n", "\n");
  const decided = application.stage.kind === "rejected" || application.stage.kind === "hired";

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/app/hire/offres/${job.id}`} className="text-sm underline">
        {t("application.back")}
      </Link>
      <AppPageHeader
        title={person.name}
        subtitle={
          <>
            {profile.headline && <p className="text-lg">{profile.headline}</p>}
            <p>
              {[
                t("application.appliedFor", { jobTitle: job.title }),
                t("application.appliedOn", { date: application.createdAt }),
              ].join(" · ")}
            </p>
          </>
        }
        actions={
          <>
            <Badge tone="hire">
              {[t("application.stage"), application.stage.name].join(" : ")}
            </Badge>
            {application.status === "withdrawn" && <Badge>{t("pipeline.card.withdrawn")}</Badge>}
          </>
        }
      />

      {query.ok === "decision" && <Alert tone="success" title={t("reject.done")} />}
      {query.ok === "deplacee" && <Alert tone="success" title={t("pipeline.moved.notified")} />}
      {query.ok === "note" && Number(query.mentions) > 0 && (
        <Alert
          tone="success"
          title={t("application.notes.mentioned", { count: Number(query.mentions) })}
        />
      )}
      {query.ok === "vivier" && <Alert tone="success" title={t("pools.addedDone")} />}
      {query.ok === "entretien" && <Alert tone="success" title={t("interviews.sent")} />}
      {query.ok === "document" && (
        <Alert tone="success" title={t("application.requestDocument.sent")} />
      )}
      <p className="text-sm text-ardoise">
        {[t("application.privacy"), t("application.planLabel.hidden")].join(" ")}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {profile.summary && (
            <section
              aria-labelledby="resume"
              className="flex flex-col gap-2 rounded-card bg-blanc p-6"
            >
              <h2 id="resume" className="text-h2">
                {tp("summary.title")}
              </h2>
              <p className="whitespace-pre-line">{profile.summary}</p>
            </section>
          )}
          <section aria-labelledby="cv" className="flex flex-col gap-3 rounded-card bg-blanc p-6">
            <h2 id="cv" className="text-h2">
              {t("application.tab.cv")}
            </h2>
            {application.cvSnapshot !== null && (
              <a
                href={`/app/hire/candidats/${application.id}/cv`}
                className="self-start font-medium underline"
              >
                {t("application.cv.download")}
              </a>
            )}
            <h3 className="font-semibold text-h3">{t("application.letter.text")}</h3>
            {application.coverLetter ? (
              <p className="whitespace-pre-line">{application.coverLetter}</p>
            ) : (
              <p className="text-ardoise">{t("application.letter.none")}</p>
            )}
          </section>
          <section
            aria-labelledby="experiences"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="experiences" className="text-h2">
              {tp("experience.title")}
            </h2>
            {profile.experiences.length === 0 ? (
              <p className="text-ardoise">{tp("sectionEmpty")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {profile.experiences.map((experience) => (
                  <li key={experience.id} className="flex flex-col gap-1">
                    <p className="font-semibold">
                      {[experience.title, experience.company].join(" · ")}
                    </p>
                    <p className="text-sm text-ardoise">
                      {[
                        format.dateTime(experience.startDate, { month: "short", year: "numeric" }),
                        experience.endDate
                          ? format.dateTime(experience.endDate, { month: "short", year: "numeric" })
                          : "…",
                      ].join(" – ")}
                    </p>
                    {experience.description && (
                      <p className="text-sm whitespace-pre-line">{experience.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section
            aria-labelledby="formations"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="formations" className="text-h2">
              {tp("education.title")}
            </h2>
            {profile.educations.length === 0 ? (
              <p className="text-ardoise">{tp("sectionEmpty")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {profile.educations.map((education) => (
                  <li key={education.id}>
                    <p className="font-semibold">
                      {[education.degree, education.school].join(" · ")}
                    </p>
                    {education.endYear && (
                      <p className="text-sm text-ardoise">{String(education.endYear)}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section
            aria-labelledby="competences"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="competences" className="text-h2">
              {tp("skills.title")}
            </h2>
            {profile.skills.length === 0 ? (
              <p className="text-ardoise">{tp("sectionEmpty")}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {profile.skills.map((item) => (
                  <li key={item.skillId}>
                    <Badge tone="jobs">{item.skill.name}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {criteria.length > 0 && (
            <section
              aria-labelledby="criteres"
              className="flex flex-col gap-3 rounded-card bg-blanc p-6"
            >
              <h2 id="criteres" className="text-h2">
                {t("application.knockout.text")}
              </h2>
              <ul className="flex flex-col gap-2">
                {criteria.map((criterion) => (
                  <li key={criterion} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{criterion}</span>
                    <Badge>{t("application.knockout.unknown")}</Badge>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ardoise">{t("application.knockout.note")}</p>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {match === "disabled" ? (
            <p className="rounded-card bg-blanc p-6 text-[15px]">
              {t("application.score.disabled")}
            </p>
          ) : match && (matchingLevel === "suggestions" || matchingLevel === "explainable") ? (
            <RecruiterWhy
              explanation={match}
              candidateName={person.name}
              matchingLevel={matchingLevel}
              explainPlan={planWithMatching(["explainable"])}
              disputed={Boolean(dispute)}
            />
          ) : matchingLevel === "none" && planWithMatching(["suggestions", "explainable"]) ? (
            <p className="rounded-card bg-blanc p-6 text-sm text-ardoise">
              {t("pipeline.matching.locked", {
                plan: planWithMatching(["suggestions", "explainable"]) ?? "",
              })}
            </p>
          ) : null}
          {permissions.manage && application.status !== "withdrawn" && (
            <section
              aria-labelledby="actions"
              className="flex flex-col gap-4 rounded-card bg-blanc p-6"
            >
              <h2 id="actions" className="text-h2">
                {t("pipeline.card.menu")}
              </h2>
              <form action={moveApplicationAction} className="flex flex-col gap-3">
                <input type="hidden" name="application" value={application.id} />
                <Select
                  id="move-stage"
                  name="stage"
                  required
                  label={t("pipeline.action.moveTo")}
                  placeholder={application.stage.name}
                  defaultValue=""
                  options={job.stages
                    .filter(
                      (stage) => stage.id !== application.stageId && stage.kind !== "rejected",
                    )
                    .map((stage) => ({ value: stage.id, label: stage.name }))}
                />
                <Button type="submit" variant="tertiary" size="sm" className="self-start">
                  {t("pipeline.action.moveSubmit")}
                </Button>
              </form>
              <ButtonLink
                href={`/app/messages/${conversation.id}`}
                variant="secondary"
                size="sm"
                className="self-start"
              >
                {t("application.message")}
              </ButtonLink>
              {application.status === "active" &&
                (appointments ? (
                  <ButtonLink
                    href={`/app/hire/entretiens?candidature=${application.id}#planifier`}
                    variant="tertiary"
                    size="sm"
                    className="self-start"
                  >
                    {t("application.schedule.text")}
                  </ButtonLink>
                ) : (
                  <p className="text-sm text-ardoise">
                    {t("application.schedule.locked", {
                      plan: orgPlanFor(plans, "connect.appointments"),
                    })}
                  </p>
                ))}
              {shortlist && (
                <details className="rounded-md bg-creme p-4">
                  <summary className="cursor-pointer font-medium">
                    {t("application.addToPool")}
                  </summary>
                  {pools.length === 0 ? (
                    <p className="mt-3 text-sm">{t("application.pool.none")}</p>
                  ) : (
                    <form action={addToPoolAction} className="mt-4 flex flex-col gap-3">
                      <input type="hidden" name="profile" value={profile.id} />
                      <input
                        type="hidden"
                        name="back"
                        value={`/app/hire/candidats/${application.id}`}
                      />
                      <Select
                        id="candidate-pool"
                        name="pool"
                        required
                        label={t("pools.choose")}
                        options={pools.map((pool) => ({ value: pool.id, label: pool.name }))}
                      />
                      <TextField
                        id="candidate-pool-note"
                        name="note"
                        maxLength={300}
                        label={t("pools.note")}
                      />
                      <Button type="submit" variant="tertiary" size="sm" className="self-start">
                        {t("pools.add")}
                      </Button>
                    </form>
                  )}
                </details>
              )}

              {!decided && (
                <details
                  id="decision"
                  open={query.decision === "refus"}
                  className="rounded-md bg-creme p-4"
                >
                  <summary className="cursor-pointer font-medium">
                    {t("pipeline.action.reject")}
                  </summary>
                  <form action={rejectApplicationAction} className="mt-4 flex flex-col gap-4">
                    <input type="hidden" name="application" value={application.id} />
                    <p className="font-semibold">
                      {t("reject.title", { candidateName: person.name })}
                    </p>
                    {query.erreur === "1" && (
                      <Alert tone="error" title={t("jobForm.error.invalid")} />
                    )}
                    <Select
                      id="reject-reason"
                      name="reason"
                      required
                      label={t("reject.reason.text")}
                      hint={t("reject.reason.hint")}
                      placeholder={t("reject.reason.text")}
                      defaultValue=""
                      options={rejectReasons.map((reason) => ({
                        value: reason,
                        label: t(`reject.reason.${reason}`),
                      }))}
                    />
                    <TextArea
                      id="reject-message"
                      name="message"
                      rows={10}
                      maxLength={4000}
                      label={t("reject.message.text")}
                      hint={t("reject.message.hint")}
                      defaultValue={defaultRejection}
                    />
                    <RadioGroup
                      legend={t("reject.message.text")}
                      name="send"
                      defaultValue="now"
                      options={[
                        { value: "now", label: t("reject.send.now") },
                        {
                          value: "none",
                          label: t("reject.send.none.text"),
                          hint: t("reject.send.none.warning"),
                        },
                      ]}
                    />
                    <p className="text-sm text-ardoise">{t("reject.aiRule")}</p>
                    <Button type="submit" variant="danger" className="self-start">
                      {t("reject.confirm")}
                    </Button>
                  </form>
                </details>
              )}

              <details
                id="document"
                open={query.erreur === "document"}
                className="rounded-md bg-creme p-4"
              >
                <summary className="cursor-pointer font-medium">
                  {t("application.requestDocument.text")}
                </summary>
                <form action={requestDocumentAction} className="mt-4 flex flex-col gap-4">
                  <input type="hidden" name="application" value={application.id} />
                  {query.erreur === "document" && (
                    <Alert tone="error" title={t("jobForm.error.invalid")} />
                  )}
                  <TextField
                    id="document-name"
                    name="name"
                    required
                    minLength={2}
                    maxLength={120}
                    label={t("application.requestDocument.name.text")}
                    placeholder={t("application.requestDocument.name.placeholder")}
                  />
                  <TextField
                    id="document-due"
                    name="due"
                    type="date"
                    required
                    label={t("application.requestDocument.due")}
                  />
                  <TextArea
                    id="document-note"
                    name="note"
                    rows={3}
                    maxLength={1000}
                    label={t("application.requestDocument.note")}
                  />
                  <p className="text-sm text-ardoise">
                    {t("application.requestDocument.forbidden")}
                  </p>
                  <Button type="submit" variant="tertiary" className="self-start">
                    {t("application.requestDocument.send")}
                  </Button>
                </form>
              </details>
            </section>
          )}

          <ScorecardPanel
            applicationId={application.id}
            criteria={scorecardCriteria(job)}
            view={scoreView}
            canEvaluate={permissions.evaluate}
            lockedPlan={scorecards ? null : orgPlanFor(plans, "hire.scorecards")}
            ok={query.ok === "evaluation"}
            error={query.erreur === "invalid" && query.ok === undefined}
          />

          <section
            aria-labelledby="notes-title"
            id="notes"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="notes-title" className="text-h2">
              {t("application.notes.title")}
            </h2>
            <p className="text-sm text-ardoise">{t("application.notes.private")}</p>
            {!collaboration && (
              <p className="text-sm text-ardoise">
                {t("application.notes.collab.locked", {
                  plan: orgPlanFor(plans, "hire.collaboration"),
                })}
              </p>
            )}
            {notes.length === 0 ? (
              <p className="text-ardoise">{t("application.notes.empty")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notes.map((note) => (
                  <li key={note.id} className="flex flex-col gap-1 rounded-md bg-creme p-3">
                    <p className="whitespace-pre-line">{text(note.payload, "body")}</p>
                    <p className="text-ardoise text-caption">
                      {[
                        memberName(note.actorId),
                        stamp(note.createdAt),
                        text(note.payload, "editedAt") ? t("application.notes.edited") : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {note.actorId === user.id && (
                      <div className="flex flex-col gap-2">
                        <details>
                          <summary className="cursor-pointer text-sm underline">
                            {t("application.notes.edit")}
                          </summary>
                          <form action={editNoteAction} className="mt-2 flex flex-col gap-2">
                            <input type="hidden" name="application" value={application.id} />
                            <input type="hidden" name="note" value={note.id} />
                            <TextArea
                              id={`note-edit-${note.id}`}
                              name="body"
                              required
                              rows={3}
                              maxLength={2000}
                              label={t("application.notes.edit")}
                              defaultValue={text(note.payload, "body")}
                            />
                            <Button
                              type="submit"
                              size="sm"
                              variant="tertiary"
                              className="self-start"
                            >
                              {t("application.notes.save")}
                            </Button>
                          </form>
                        </details>
                        <details>
                          <summary className="cursor-pointer text-sm underline">
                            {t("application.notes.delete.text")}
                          </summary>
                          <form
                            action={deleteNoteAction}
                            className="mt-2 flex flex-col items-start gap-2"
                          >
                            <input type="hidden" name="application" value={application.id} />
                            <input type="hidden" name="note" value={note.id} />
                            <p className="text-sm">{t("application.notes.delete.confirm")}</p>
                            <Button type="submit" size="sm" variant="danger">
                              {t("application.notes.delete.text")}
                            </Button>
                          </form>
                        </details>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {permissions.evaluate && (
              <form action={addNoteAction} className="flex flex-col gap-3">
                <input type="hidden" name="application" value={application.id} />
                <TextArea
                  id="note-body"
                  name="body"
                  required
                  rows={3}
                  maxLength={2000}
                  label={t("application.notes.add")}
                  placeholder={t("application.notes.placeholder")}
                  hint={t("application.notes.reminder")}
                />
                <Button type="submit" variant="tertiary" size="sm" className="self-start">
                  {t("application.notes.add")}
                </Button>
              </form>
            )}
          </section>

          <section
            aria-labelledby="historique"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <div className="flex flex-col gap-1">
              <h2 id="historique" className="text-h2">
                {t("history.title")}
              </h2>
              <p className="text-sm text-ardoise">{t("history.subtitle")}</p>
            </div>
            {history ? (
              <a
                href={`/app/hire/candidats/${application.id}/historique`}
                className="self-start text-sm font-medium underline"
              >
                {t("history.export")}
              </a>
            ) : (
              <p className="text-sm text-ardoise">
                {t("history.locked", { plan: orgPlanFor(plans, "hire.decision_history") })}
              </p>
            )}
            <ol className="flex flex-col gap-2 border-l-2 border-brume pl-4 text-sm">
              {application.events.map((event) => {
                const line = describe(event);
                return line ? (
                  <li key={event.id} className="flex flex-col">
                    <span>{line}</span>
                    <span className="text-ardoise text-caption">{stamp(event.createdAt)}</span>
                  </li>
                ) : null;
              })}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
