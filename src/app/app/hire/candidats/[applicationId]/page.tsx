import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { Initials, stageTone, type StageTone } from "@/components/hire/kit";
import { ScorecardPanel } from "@/components/hire/scorecard-panel";
import { tag } from "@/components/jobs/talent-kit";
import { RecruiterWhy } from "@/components/matching/recruiter-why";
import { TabRail } from "@/components/motion/tab-rail";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { Alert, Button, RadioGroup, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
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

import { describeEvent, payloadText as text } from "@/server/hire-history";
import { AppPageHeader } from "@/components/app/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.application");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

const card = "rounded-[24px] bg-blanc p-5 lg:p-6";
const cardTitle = "text-[18px] leading-6 font-semibold tracking-[-0.015em] lg:text-[20px]";
const lab = "text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase";
const softChip =
  "inline-flex h-8 items-center gap-1.5 rounded-pill bg-gris-clair px-3 text-[12px] font-semibold";
const actionPill =
  "flex h-11 cursor-pointer list-none items-center justify-center gap-1.5 rounded-pill bg-blanc px-3 text-[12.5px] whitespace-nowrap font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme [&::-webkit-details-marker]:hidden";

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
  // Neighbours in the pipeline order (newest first), for « Candidat précédent / suivant ».
  const siblings = await db.application.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const at = siblings.findIndex((item) => item.id === application.id);
  const previous = at > 0 ? siblings[at - 1]!.id : null;
  const next = at >= 0 && at < siblings.length - 1 ? siblings[at + 1]!.id : null;
  const wanted = new Set(job.skills.map((item) => item.skillId));
  const matched = profile.skills.filter((item) => wanted.has(item.skillId));
  const others = profile.skills.filter((item) => !wanted.has(item.skillId));
  const certified = profile.skills.filter((item) => item.verified);
  const ordered = [...job.stages].sort((a, b) => a.order - b.order);
  const nextStage = ordered.find(
    (stage) =>
      stage.order > application.stage.order && stage.kind !== "rejected" && stage.kind !== "hired",
  );
  const live = permissions.manage && application.status !== "withdrawn";
  const tabs = [
    { href: "#profil", label: t("application.tab.profile") },
    { href: "#cv", label: t("application.tab.cv") },
    { href: "#score", label: t("application.tab.analysis") },
    { href: "#reponses", label: t("application.tab.answers") },
    { href: "#evaluation", label: t("application.tab.scorecard") },
    { href: "#notes", label: t("application.tab.notes") },
    { href: "#historique", label: t("application.tab.history") },
    { href: `/app/messages/${conversation.id}`, label: t("application.tab.messages") },
  ];
  const month = (date: Date) => format.dateTime(date, { month: "short", year: "numeric" });

  return (
    <div className="jm-page flex flex-col gap-4 lg:gap-5">
      {query.ok === "note" && Number(query.mentions) > 0 && (
        <ToastOnLoad
          message={t("application.notes.mentioned", { count: Number(query.mentions) })}
        />
      )}
      {query.ok === "vivier" && <ToastOnLoad message={t("pools.addedDone")} />}
      {query.ok === "entretien" && <ToastOnLoad message={t("interviews.sent")} />}
      {query.ok === "document" && <ToastOnLoad message={t("application.requestDocument.sent")} />}
      <AppPageHeader
        eyebrow={
          <Link
            href={`/app/hire/offres/${job.id}`}
            className="flex w-fit items-center gap-1.5 text-[12px] font-medium text-blanc/80 hover:text-blanc"
          >
            <Icon name="chev-l" className="size-3.5" />
            {t("application.back")}
          </Link>
        }
        title={t("application.title")}
      />
      {query.ok === "decision" && <Alert tone="success" title={t("reject.done")} />}
      {query.ok === "deplacee" && <Alert tone="success" title={t("pipeline.moved.notified")} />}

      <section
        aria-labelledby="candidat"
        className="flex flex-col gap-4 rounded-[24px] bg-blanc p-5 lg:flex-row lg:items-center lg:gap-6 lg:px-6"
      >
        <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:items-center lg:gap-5 lg:text-left">
          <Initials name={person.name} size={76} className="text-[26px]" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="flex flex-wrap justify-center gap-1.5 lg:justify-start">
              <span
                className={cx(
                  tag,
                  stageTone[application.stage.kind as StageTone] ?? "bg-brume",
                  application.stage.kind === "rejected" && "text-blanc",
                )}
              >
                {application.stage.name}
              </span>
              <span className={cx(tag, "bg-gris-clair")}>
                {t(`application.source.${application.source === "direct" ? "direct" : "contact"}`)}
              </span>
              {certified.length > 0 && (
                <span className={cx(tag, "bg-menthe-claire text-menthe-texte")}>
                  <Icon name="certificat" className="size-3" />
                  {t("pipeline.card.certificate")}
                </span>
              )}
              {application.status === "withdrawn" && (
                <span className={cx(tag, "bg-gris-clair")}>{t("pipeline.card.withdrawn")}</span>
              )}
            </p>
            <h2
              id="candidat"
              className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] lg:text-[28px] lg:leading-[34px]"
            >
              {person.name}
            </h2>
            {profile.headline && <p className="text-[13px] text-ardoise">{profile.headline}</p>}
            <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] lg:justify-start lg:text-[13px]">
              <span className="font-semibold">
                {t("application.appliedFor", { jobTitle: job.title })}
              </span>
              {(person.city || person.country) && (
                <span className="flex items-center gap-1 text-ardoise">
                  <Icon name="localisation" className="size-3.5" />
                  {[person.city, person.country].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="flex items-center gap-1 text-ardoise">
                <Icon name="horloge" className="size-3.5" />
                {t("application.appliedOn", { date: application.createdAt })}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 lg:ml-auto lg:items-end">
          <nav
            aria-label={t("application.title")}
            className="flex justify-center gap-2 max-lg:hidden"
          >
            {previous && (
              <Link
                href={`/app/hire/candidats/${previous}`}
                className="flex h-9 items-center gap-1.5 rounded-pill px-3.5 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme"
              >
                <Icon name="chev-l" className="size-4" />
                {t("application.previous")}
              </Link>
            )}
            {next && (
              <Link
                href={`/app/hire/candidats/${next}`}
                className="flex h-9 items-center gap-1.5 rounded-pill px-3.5 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme"
              >
                {t("application.next")}
                <Icon name="chev-r" className="size-4" />
              </Link>
            )}
          </nav>
          <div className="flex gap-2">
            <Link
              href={`/app/messages/${conversation.id}`}
              className={pillClass("outline", "md", "flex-1 max-lg:bg-sapin max-lg:text-blanc")}
            >
              <Icon name="message" className="size-4" />
              {t("application.message")}
            </Link>
            {live && application.status === "active" && appointments && (
              <Link
                href={`/app/hire/entretiens?candidature=${application.id}#planifier`}
                aria-label={t("application.schedule.text")}
                className={pillClass("dark", "md", "max-lg:w-11 max-lg:px-0")}
              >
                <Icon name="calendrier" className="size-4" />
                <span className="max-lg:hidden">{t("application.schedule.text")}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <TabRail name="hire-candidate">
        <div className="flex w-max gap-1 lg:gap-6">
          {tabs.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex h-10 shrink-0 items-center rounded-pill px-3 text-[14px] font-medium text-ardoise hover:text-sapin lg:px-1 lg:text-[15px]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </TabRail>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-5">
        <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
          <section
            id="profil"
            aria-labelledby="profil-title"
            className={cx(card, "flex flex-col gap-5")}
          >
            <h2 id="profil-title" className={cardTitle}>
              {t("application.tab.profile")}
            </h2>
            {profile.summary && (
              <div className="flex flex-col gap-2 rounded-[18px] bg-sapin p-4 text-blanc">
                <h3
                  id="resume"
                  className="text-[11px] font-semibold tracking-[0.12em] text-neon uppercase"
                >
                  {tp("summary.title")}
                </h3>
                <p className="text-[14px] leading-[21px] whitespace-pre-line">{profile.summary}</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <h3 id="experiences" className={lab}>
                {tp("experience.title")}
              </h3>
              {profile.experiences.length === 0 ? (
                <p className="text-[13px] text-ardoise">{tp("sectionEmpty")}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {profile.experiences.map((experience) => (
                    <li key={experience.id} className="flex gap-3">
                      <span
                        aria-hidden
                        className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-creme"
                      >
                        <Icon name="jobs" className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <p className="text-[14px] font-semibold">
                          {[experience.title, experience.company].join(" · ")}
                        </p>
                        <p className="text-[12px] text-ardoise">
                          {[
                            month(experience.startDate),
                            experience.endDate ? month(experience.endDate) : "…",
                          ].join(" – ")}
                        </p>
                        {experience.description && (
                          <p className="mt-1 text-[13px] whitespace-pre-line">
                            {experience.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col gap-3 border-t border-gris-clair pt-4">
              <h3 id="formations" className={lab}>
                {tp("education.title")}
              </h3>
              {profile.educations.length === 0 ? (
                <p className="text-[13px] text-ardoise">{tp("sectionEmpty")}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {profile.educations.map((education) => (
                    <li key={education.id} className="flex gap-3">
                      <span
                        aria-hidden
                        className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-creme"
                      >
                        <Icon name="diplome" className="size-4" />
                      </span>
                      <div className="flex flex-col">
                        <p className="text-[14px] font-semibold">
                          {[education.degree, education.school].join(" · ")}
                        </p>
                        {education.endYear && (
                          <p className="text-[12px] text-ardoise">{String(education.endYear)}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col gap-3 border-t border-gris-clair pt-4">
              <h3 id="competences" className={lab}>
                {tp("skills.title")}
              </h3>
              {profile.skills.length === 0 ? (
                <p className="text-[13px] text-ardoise">{tp("sectionEmpty")}</p>
              ) : (
                <>
                  {matched.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[12px] font-semibold">{t("application.skills.matched")}</p>
                      <ul className="flex flex-wrap gap-1.5">
                        {matched.map((item) => (
                          <li key={item.skillId} className={cx(softChip, "bg-lime-clair")}>
                            <Icon name="check" className="size-3.5 text-feuille-fonce" />
                            {item.skill.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {others.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[12px] font-semibold">{t("application.skills.other")}</p>
                      <ul className="flex flex-wrap gap-1.5">
                        {others.map((item) => (
                          <li key={item.skillId} className={softChip}>
                            {item.skill.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
            {certified.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-gris-clair pt-4">
                <h3 className={lab}>{t("application.certificates")}</h3>
                <ul className="flex flex-col gap-2">
                  {certified.map((item) => (
                    <li
                      key={item.skillId}
                      className="flex items-center gap-3 rounded-[16px] bg-lime-clair px-4 py-3"
                    >
                      <span className="grid size-8 place-items-center rounded-[10px] bg-blanc">
                        <Icon name="certificat" className="size-4 text-feuille-fonce" />
                      </span>
                      <span className="text-[13.5px] font-semibold">{item.skill.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="flex items-start gap-2 border-t border-gris-clair pt-4 text-[11.5px] text-ardoise">
              <Icon name="confidentialite" className="mt-px size-3.5 shrink-0" />
              {[t("application.privacy"), t("application.planLabel.hidden")].join(" ")}
            </p>
          </section>

          <section id="cv" aria-labelledby="cv-title" className={cx(card, "flex flex-col gap-3")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="cv-title" className={cardTitle}>
                {t("application.tab.cv")}
              </h2>
              {application.cvSnapshot !== null && (
                <a
                  href={`/app/hire/candidats/${application.id}/cv`}
                  className={pillClass("outline", "sm")}
                >
                  <Icon name="telecharger" className="size-4" />
                  {t("application.cv.download")}
                </a>
              )}
            </div>
          </section>

          <section
            id="reponses"
            aria-labelledby="reponses-title"
            className={cx(card, "flex flex-col gap-3")}
          >
            <h2 id="reponses-title" className={cardTitle}>
              {t("application.tab.answers")}
            </h2>
            <h3 className={lab}>{t("application.letter.text")}</h3>
            {application.coverLetter ? (
              <p className="text-[14px] leading-[21px] whitespace-pre-line">
                {application.coverLetter}
              </p>
            ) : (
              <p className="text-[13px] text-ardoise">{t("application.letter.none")}</p>
            )}
            <p className="text-[13px] text-ardoise">{t("application.answers.empty")}</p>
          </section>

          <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-5">
            {criteria.length > 0 && (
              <section aria-labelledby="criteres" className={cx(card, "flex flex-col gap-3")}>
                <h2 id="criteres" className="text-[17px] font-semibold">
                  {t("application.knockout.text")}
                </h2>
                <ul className="flex flex-col gap-2.5">
                  {criteria.map((criterion) => (
                    <li key={criterion} className="flex items-start gap-2.5 text-[13.5px]">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ambre/20">
                        <Icon name="horloge" className="size-3.5 text-ambre-fonce" />
                      </span>
                      <span className="flex-1">{criterion}</span>
                      <span className={cx(tag, "bg-ambre/20 text-ambre-fonce")}>
                        {t("application.knockout.unknown")}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-[12px] text-ardoise">{t("application.knockout.note")}</p>
              </section>
            )}
            <section
              aria-labelledby="notes-title"
              id="notes"
              className={cx(card, "flex flex-col gap-3", criteria.length === 0 && "lg:col-span-2")}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="notes-title" className="text-[17px] font-semibold">
                  {t("application.notes.title")}
                </h2>
                <span className="text-[12px] text-ardoise">{notes.length}</span>
              </div>
              {!collaboration && (
                <p className="text-[12px] text-ardoise">
                  {t("application.notes.collab.locked", {
                    plan: orgPlanFor(plans, "hire.collaboration"),
                  })}
                </p>
              )}
              {notes.length === 0 ? (
                <p className="text-[13px] text-ardoise">{t("application.notes.empty")}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {notes.map((note) => (
                    <li key={note.id} className="flex gap-2.5">
                      <Initials name={memberName(note.actorId) || "?"} size={30} />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="text-[11.5px] text-ardoise">
                          {[
                            memberName(note.actorId),
                            stamp(note.createdAt),
                            text(note.payload, "editedAt") ? t("application.notes.edited") : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="text-[14px] leading-5 whitespace-pre-line">
                          {text(note.payload, "body")}
                        </p>
                        {note.actorId === user.id && (
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <details>
                              <summary className="cursor-pointer text-[12px] underline">
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
                              <summary className="cursor-pointer text-[12px] underline">
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
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {permissions.evaluate && (
                <form
                  action={addNoteAction}
                  className="flex flex-col gap-2 rounded-[18px] bg-creme p-3"
                >
                  <input type="hidden" name="application" value={application.id} />
                  <TextArea
                    id="note-body"
                    name="body"
                    required
                    rows={2}
                    maxLength={2000}
                    label={t("application.notes.add")}
                    placeholder={t("application.notes.placeholder")}
                    hint={t("application.notes.reminder")}
                  />
                  <button type="submit" className={pillClass("dark", "sm", "self-end")}>
                    {t("application.notes.add")}
                  </button>
                </form>
              )}
              <p className="text-[11.5px] text-ardoise">{t("application.notes.private")}</p>
            </section>
          </div>

          <ScorecardPanel
            applicationId={application.id}
            criteria={scorecardCriteria(job)}
            view={scoreView}
            canEvaluate={permissions.evaluate}
            lockedPlan={scorecards ? null : orgPlanFor(plans, "hire.scorecards")}
            ok={query.ok === "evaluation"}
            error={query.erreur === "invalid" && query.ok === undefined}
          />

          <section aria-labelledby="historique" className={cx(card, "flex flex-col gap-3")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h2 id="historique" className={cardTitle}>
                  {t("history.title")}
                </h2>
                <p className="text-[12.5px] text-ardoise">{t("history.subtitle")}</p>
              </div>
              {history && (
                <a
                  href={`/app/hire/candidats/${application.id}/historique`}
                  className={pillClass("outline", "sm")}
                >
                  <Icon name="telecharger" className="size-4" />
                  {t("history.export")}
                </a>
              )}
            </div>
            {!history && (
              <p className="text-[12px] text-ardoise">
                {t("history.locked", { plan: orgPlanFor(plans, "hire.decision_history") })}
              </p>
            )}
            <ol className="flex flex-col gap-3 border-l-2 border-brume pl-4 text-[13px]">
              {application.events.map((event) => {
                const line = describe(event);
                return line ? (
                  <li key={event.id} className="relative flex flex-col">
                    <span
                      aria-hidden
                      className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-feuille"
                    />
                    <span>{line}</span>
                    <span className="text-[11.5px] text-ardoise">{stamp(event.createdAt)}</span>
                  </li>
                ) : null;
              })}
            </ol>
          </section>
        </div>

        <div className="flex flex-col gap-4 max-lg:order-first lg:gap-5">
          {match === "disabled" ? (
            <p className={cx(card, "text-[14px]")}>{t("application.score.disabled")}</p>
          ) : match && (matchingLevel === "suggestions" || matchingLevel === "explainable") ? (
            <RecruiterWhy
              explanation={match}
              candidateName={person.name}
              matchingLevel={matchingLevel}
              explainPlan={planWithMatching(["explainable"])}
              disputed={Boolean(dispute)}
            />
          ) : matchingLevel === "none" && planWithMatching(["suggestions", "explainable"]) ? (
            <p className={cx(card, "flex gap-2 text-[13px] text-ardoise")}>
              <Icon name="lock" className="mt-px size-4 shrink-0" />
              {t("pipeline.matching.locked", {
                plan: planWithMatching(["suggestions", "explainable"]) ?? "",
              })}
            </p>
          ) : null}

          {live && (
            <section
              aria-labelledby="actions"
              className={cx(card, "flex flex-col gap-3.5 lg:sticky lg:top-6")}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 id="actions" className={cardTitle}>
                  {t("application.decision.title")}
                </h2>
                <span
                  className={cx(
                    tag,
                    stageTone[application.stage.kind as StageTone] ?? "bg-brume",
                    application.stage.kind === "rejected" && "text-blanc",
                  )}
                >
                  {application.stage.name}
                </span>
              </div>
              <form action={moveApplicationAction} className="flex flex-col gap-2.5">
                <input type="hidden" name="application" value={application.id} />
                <Select
                  id="move-stage"
                  name="stage"
                  required
                  label={t("application.stage")}
                  placeholder={application.stage.name}
                  defaultValue=""
                  options={job.stages
                    .filter(
                      (stage) => stage.id !== application.stageId && stage.kind !== "rejected",
                    )
                    .map((stage) => ({ value: stage.id, label: stage.name }))}
                />
                <button type="submit" className={pillClass("outline", "sm", "self-start")}>
                  {t("pipeline.action.moveSubmit")}
                </button>
              </form>
              {nextStage && (
                <form action={moveApplicationAction}>
                  <input type="hidden" name="application" value={application.id} />
                  <input type="hidden" name="stage" value={nextStage.id} />
                  <button type="submit" className={pillClass("lime", "md", "w-full")}>
                    {t("application.decision.advance", { stage: nextStage.name })}
                    <Icon name="chev-r" className="size-4" />
                  </button>
                </form>
              )}
              <div className="grid grid-cols-2 gap-2">
                {application.status === "active" &&
                  (appointments ? (
                    <Link
                      href={`/app/hire/entretiens?candidature=${application.id}#planifier`}
                      className={pillClass("dark", "md", "text-[13px]")}
                    >
                      <Icon name="calendrier" className="size-4" />
                      {t("pipeline.action.schedule")}
                    </Link>
                  ) : (
                    <p className="col-span-2 text-[12px] text-ardoise">
                      {t("application.schedule.locked", {
                        plan: orgPlanFor(plans, "connect.appointments"),
                      })}
                    </p>
                  ))}
                <details
                  id="document"
                  open={query.erreur === "document"}
                  className="group/doc open:col-span-2"
                >
                  <summary className={actionPill}>
                    <Icon name="doc" className="size-4" />
                    {t("application.requestDocument.text")}
                  </summary>
                  <form
                    action={requestDocumentAction}
                    className="mt-3 flex flex-col gap-3 rounded-[18px] bg-creme p-4"
                  >
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
                    <p className="text-[12px] text-ardoise">
                      {t("application.requestDocument.forbidden")}
                    </p>
                    <button type="submit" className={pillClass("dark", "sm", "self-start")}>
                      {t("application.requestDocument.send")}
                    </button>
                  </form>
                </details>
                {shortlist && (
                  <details className="open:col-span-2">
                    <summary className={actionPill}>
                      <Icon name="favori" className="size-4" />
                      {t("application.addToPool")}
                    </summary>
                    {pools.length === 0 ? (
                      <p className="mt-3 rounded-[18px] bg-creme p-4 text-[13px]">
                        {t("application.pool.none")}
                      </p>
                    ) : (
                      <form
                        action={addToPoolAction}
                        className="mt-3 flex flex-col gap-3 rounded-[18px] bg-creme p-4"
                      >
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
                        <button type="submit" className={pillClass("dark", "sm", "self-start")}>
                          {t("pools.add")}
                        </button>
                      </form>
                    )}
                  </details>
                )}
                {!decided && (
                  <details
                    id="decision"
                    open={query.decision === "refus"}
                    className="open:col-span-2"
                  >
                    <summary className={actionPill}>{t("pipeline.action.reject")}</summary>
                    <form
                      action={rejectApplicationAction}
                      className="mt-3 flex flex-col gap-4 rounded-[18px] bg-creme p-4"
                    >
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
                      <Button type="submit" variant="danger" className="self-start">
                        {t("reject.confirm")}
                      </Button>
                    </form>
                  </details>
                )}
              </div>
              <p className="flex gap-2 rounded-[16px] bg-creme px-4 py-3 text-[12px] leading-[17px]">
                <Icon name="eye" className="mt-px size-4 shrink-0" />
                {t("reject.aiRule")}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
