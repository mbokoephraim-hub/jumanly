import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Checkbox,
  EmptyState,
  PlanLock,
  Select,
  TextArea,
  TextField,
} from "@/components/ui";
import { defaultTimeZone } from "@/lib/dates";
import {
  cancelInterviewAction,
  closeInterviewAction,
  rescheduleInterviewAction,
  scheduleInterviewAction,
} from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions, jobScope } from "@/server/services/hire";
import {
  INTERVIEW_DURATIONS,
  INTERVIEW_MODES,
  listInterviews,
  SLOTS_MAX,
} from "@/server/services/interviews";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.interviews");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

const statusKey = {
  pending: "pending",
  confirmed: "confirmed",
  reschedule: "reschedule",
  declined: "declined",
  canceled: "canceled",
  done: "done",
  no_show: "noShow",
} as const;

/** Interviews (E8, `connect.appointments`): planning, answers of the candidates, follow-up. */
export default async function InterviewsPage({ searchParams }: PageProps<"/app/hire/entretiens">) {
  const query = await searchParams;
  const { ctx } = await requireHire("/app/hire/entretiens", "readApplications");
  const t = await getTranslations();
  const format = await getFormatter();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [enabled, collaboration, plans] = await Promise.all([
    can(db, subject, "connect.appointments"),
    can(db, subject, "hire.collaboration"),
    listPublicPlans(db),
  ]);
  if (!enabled) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1">{t("hire.interviews.title")}</h1>
        <PlanLock
          plan={orgPlanFor(plans, "connect.appointments")}
          description={t("hire.interviews.locked", {
            plan: orgPlanFor(plans, "connect.appointments"),
          })}
        />
      </div>
    );
  }

  const manage = hirePermissions(ctx.role).manage;
  const filter = one(query.filtre) === "equipe" ? "team" : "mine";
  const candidature = one(query.candidature);
  const now = new Date();
  const [interviews, applications, members] = await Promise.all([
    listInterviews(db, ctx, { filter }),
    manage
      ? db.application.findMany({
          where: { status: "active", job: await jobScope(db, ctx) },
          orderBy: { updatedAt: "desc" },
          take: 100,
          select: {
            id: true,
            job: { select: { title: true } },
            profile: { select: { user: { select: { name: true } } } },
          },
        })
      : [],
    manage && collaboration
      ? db.membership.findMany({
          where: {
            organizationId: ctx.organizationId,
            status: "active",
            userId: { not: ctx.userId },
          },
          select: { userId: true, user: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        })
      : [],
  ]);
  const timeZone = defaultTimeZone();
  const when = (date: Date) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short", timeZone });
  const slotsText = (dates: Date[]) => dates.map(when).join(" · ");

  const upcoming = interviews.filter(
    (item) => item.status === "confirmed" && item.startsAt && item.startsAt >= now,
  );
  const waiting = interviews.filter(
    (item) => item.status === "pending" || item.status === "reschedule",
  );
  const past = interviews.filter((item) => !upcoming.includes(item) && !waiting.includes(item));

  const okText: Record<string, string> = {
    entretien: t("hire.interviews.sent"),
    annule: t("hire.interviews.canceled"),
    maj: t("hire.interviews.updated"),
    reprogramme: t("hire.interviews.rescheduled"),
  };
  const errorText: Record<string, string> = {
    invalid: t("hire.interviews.error.invalid"),
    past: t("hire.interviews.error.past"),
    locked: t("hire.interviews.locked", { plan: orgPlanFor(plans, "connect.appointments") }),
    forbidden: t("hire.pools.error.forbidden"),
    notFound: t("hire.pools.error.notFound"),
  };
  const ok = okText[one(query.ok)];
  const error = errorText[one(query.erreur)];
  const back = candidature
    ? `/app/hire/entretiens?candidature=${candidature}`
    : "/app/hire/entretiens";

  const slotInputs = (prefix: string) =>
    Array.from({ length: SLOTS_MAX }, (_, index) => (
      <TextField
        key={index}
        id={`${prefix}-slot-${index}`}
        name="slot"
        type="datetime-local"
        required={index === 0}
        label={t("hire.interviews.form.slot", { number: index + 1 })}
      />
    ));

  const card = (interview: (typeof interviews)[number]) => {
    const closed = ["canceled", "done", "no_show", "declined"].includes(interview.status);
    const started = interview.startsAt !== null && interview.startsAt <= now;
    const ended =
      interview.startsAt !== null &&
      interview.startsAt.getTime() + interview.durationMinutes * 60_000 < now.getTime();
    return (
      <li key={interview.id} className="flex flex-col gap-2 rounded-card bg-blanc p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-semibold">
              {t("hire.interviews.item", {
                time: interview.startsAt ? when(interview.startsAt) : "…",
                candidateName: interview.application.profile.user.name,
                jobTitle: interview.application.job.title,
              })}
            </p>
            <p className="text-sm text-ardoise">
              {[
                t(`hire.interviews.form.type.${interview.mode}`),
                t("hire.interviews.form.minutes", { minutes: interview.durationMinutes }),
                t("hire.interviews.organizer", { memberName: interview.organizer?.name ?? "—" }),
              ].join(" · ")}
            </p>
            {interview.status === "pending" && (
              <p className="text-sm">
                {t("hire.interviews.slotsPending", { slots: slotsText(interview.slots) })}
              </p>
            )}
            {interview.status === "reschedule" && interview.proposedSlots.length > 0 && (
              <p className="text-sm">
                {t("hire.interviews.proposed", { slots: slotsText(interview.proposedSlots) })}
              </p>
            )}
            {interview.cancelReason && <p className="text-sm">{interview.cancelReason}</p>}
          </div>
          <Badge tone={interview.status === "confirmed" ? "success" : "neutral"}>
            {t(`hire.interviews.status.${statusKey[interview.status]}`)}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/app/hire/candidats/${interview.application.id}`}
            className="text-sm font-medium underline"
          >
            {t("hire.interviews.fillScorecard")}
          </Link>
          {interview.status === "confirmed" && interview.link && !ended && (
            <ButtonLink href={interview.link} size="sm" variant="secondary">
              {t("hire.interviews.join")}
            </ButtonLink>
          )}
          {manage && interview.status === "confirmed" && started && (
            <>
              <form action={closeInterviewAction}>
                <input type="hidden" name="interview" value={interview.id} />
                <input type="hidden" name="outcome" value="done" />
                <Button type="submit" size="sm" variant="secondary">
                  {t("hire.interviews.markDone")}
                </Button>
              </form>
              <form action={closeInterviewAction}>
                <input type="hidden" name="interview" value={interview.id} />
                <input type="hidden" name="outcome" value="no_show" />
                <Button type="submit" size="sm" variant="tertiary">
                  {t("hire.interviews.noShow")}
                </Button>
              </form>
            </>
          )}
        </div>
        {manage && !closed && (
          <div className="flex flex-col gap-2">
            <details>
              <summary className="cursor-pointer text-sm font-medium underline">
                {t("hire.interviews.reschedule")}
              </summary>
              <form
                action={rescheduleInterviewAction}
                className="mt-3 flex flex-col gap-3 rounded-md bg-creme p-4"
              >
                <input type="hidden" name="interview" value={interview.id} />
                <p className="text-sm">
                  {t("hire.interviews.form.timezone", { timezone: interview.timezone })}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">{slotInputs(`re-${interview.id}`)}</div>
                <Button type="submit" size="sm" className="self-start">
                  {t("hire.interviews.form.send")}
                </Button>
              </form>
            </details>
            <details>
              <summary className="cursor-pointer text-sm font-medium underline">
                {t("hire.interviews.cancel.text")}
              </summary>
              <form
                action={cancelInterviewAction}
                className="mt-3 flex flex-col items-start gap-3 rounded-md bg-creme p-4"
              >
                <input type="hidden" name="interview" value={interview.id} />
                <p className="font-semibold">{t("hire.interviews.cancel.confirm.title")}</p>
                <p>{t("hire.interviews.cancel.confirm.body")}</p>
                <TextArea
                  id={`cancel-${interview.id}`}
                  name="reason"
                  maxLength={1000}
                  rows={3}
                  label={t("hire.interviews.cancel.reason")}
                />
                <Button type="submit" variant="danger" size="sm">
                  {t("hire.interviews.cancel.text")}
                </Button>
              </form>
            </details>
          </div>
        )}
      </li>
    );
  };

  const group = (id: string, title: string, items: typeof interviews) =>
    items.length > 0 && (
      <section aria-labelledby={id} className="flex flex-col gap-3">
        <h2 id={id} className="text-h2">
          {title}
        </h2>
        <ul className="flex flex-col gap-3">{items.map(card)}</ul>
      </section>
    );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1">{t("hire.interviews.title")}</h1>
        {manage && !candidature && (
          <ButtonLink href="/app/hire/entretiens?candidature=nouveau#planifier" size="sm">
            {t("hire.interviews.new")}
          </ButtonLink>
        )}
      </header>
      {ok && <Alert tone="success" title={ok} />}
      {error && <Alert tone="error" title={error} />}
      <nav aria-label={t("hire.interviews.title")} className="flex gap-4">
        <Link
          href="/app/hire/entretiens"
          aria-current={filter === "mine" ? "page" : undefined}
          className={filter === "mine" ? "font-semibold" : "underline"}
        >
          {t("hire.interviews.filter.mine")}
        </Link>
        <Link
          href="/app/hire/entretiens?filtre=equipe"
          aria-current={filter === "team" ? "page" : undefined}
          className={filter === "team" ? "font-semibold" : "underline"}
        >
          {t("hire.interviews.filter.team")}
        </Link>
      </nav>

      {manage && candidature && (
        <section
          id="planifier"
          aria-labelledby="planifier-title"
          className="flex flex-col gap-4 rounded-card bg-blanc p-6"
        >
          <h2 id="planifier-title" className="text-h2">
            {t("hire.interviews.new")}
          </h2>
          {applications.length === 0 ? (
            <p className="text-ardoise">{t("hire.interviews.form.noCandidate")}</p>
          ) : (
            <form action={scheduleInterviewAction} className="flex flex-col gap-4">
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="timezone" value={timeZone} />
              <Select
                id="interview-application"
                name="application"
                required
                label={t("hire.interviews.form.candidate")}
                defaultValue={
                  applications.some((item) => item.id === candidature) ? candidature : ""
                }
                placeholder={t("hire.interviews.form.candidate")}
                options={applications.map((item) => ({
                  value: item.id,
                  label: `${item.profile.user.name} · ${item.job.title}`,
                }))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  id="interview-mode"
                  name="mode"
                  required
                  label={t("hire.interviews.form.type.text")}
                  defaultValue="video"
                  options={INTERVIEW_MODES.map((mode) => ({
                    value: mode,
                    label: t(`hire.interviews.form.type.${mode}`),
                  }))}
                />
                <Select
                  id="interview-duration"
                  name="duration"
                  required
                  label={t("hire.interviews.form.duration")}
                  defaultValue="45"
                  options={INTERVIEW_DURATIONS.map((minutes) => ({
                    value: String(minutes),
                    label: t("hire.interviews.form.minutes", { minutes }),
                  }))}
                />
              </div>
              <fieldset className="flex flex-col gap-3">
                <legend className="font-medium">{t("hire.interviews.form.slots.text")}</legend>
                <p className="text-sm text-ardoise">
                  {t("hire.interviews.form.slots.hint")}{" "}
                  {t("hire.interviews.form.timezone", { timezone: timeZone })}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">{slotInputs("new")}</div>
              </fieldset>
              <TextField
                id="interview-link"
                name="link"
                type="url"
                maxLength={300}
                label={t("hire.interviews.form.link.text")}
                placeholder={t("hire.interviews.form.link.placeholder")}
              />
              <TextField
                id="interview-address"
                name="address"
                maxLength={300}
                label={t("hire.interviews.form.address")}
              />
              {collaboration ? (
                members.length > 0 && (
                  <fieldset className="flex flex-col gap-2">
                    <legend className="font-medium">
                      {t("hire.interviews.form.participants.text")}
                    </legend>
                    {members.map((member) => (
                      <Checkbox
                        key={member.userId}
                        id={`participant-${member.userId}`}
                        name="participants"
                        value={member.userId}
                        label={member.user.name}
                      />
                    ))}
                  </fieldset>
                )
              ) : (
                <p className="text-sm text-ardoise">
                  {t("hire.interviews.form.participants.locked", {
                    plan: orgPlanFor(plans, "hire.collaboration"),
                  })}
                </p>
              )}
              <TextArea
                id="interview-message"
                name="message"
                maxLength={2000}
                rows={4}
                label={t("hire.interviews.form.message.text")}
              />
              <Button type="submit" className="self-start">
                {t("hire.interviews.form.send")}
              </Button>
            </form>
          )}
        </section>
      )}

      {interviews.length === 0 ? (
        <EmptyState title={t("hire.interviews.empty.text")} />
      ) : (
        <>
          {group("a-venir", t("hire.interviews.upcoming"), upcoming)}
          {group("en-attente", t("hire.interviews.waiting"), waiting)}
          {group("passes", t("hire.interviews.past"), past)}
        </>
      )}
    </div>
  );
}
