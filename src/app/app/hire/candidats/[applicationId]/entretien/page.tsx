import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { InterviewPlanner, type PlannerMode } from "@/components/recruiter/interview-planner";
import { FlowHead } from "@/components/talent/flow-head";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { initials } from "@/components/ui/avatar";
import { pickMessages } from "@/i18n/client-messages";
import { defaultTimeZone } from "@/lib/dates";
import { addDays, dayLabels, monthLabels, monthOf, zoneLabel } from "@/lib/interview-calendar";
import { rescheduleInterviewAction, scheduleInterviewAction } from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { applicationMatches } from "@/server/matching/service";
import { HireError } from "@/server/services/hire";
import { PLANNER_DAYS, plannerData, readInterview } from "@/server/services/hire-interviews";
import { INTERVIEW_DURATIONS } from "@/server/services/interviews";
import {
  decisionParagraphs,
  highlightSegments,
  strongestSkill,
  tidyText,
} from "@/server/services/message-templates";
import { cheapestPlanWhere, listPublicPlans } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireInterviews.plan");
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const invitationTones = ["chaleureux", "court", "formel"] as const;

/**
 * « Proposer un entretien » (brief recruteur § 4 item 4, planches r2plus PROG, PROG2, INV_AP), or
 * new times for an interview already proposed (`?entretien=`). The calendar shows the team's free
 * days from its interviews in Jumanly; the message is prepared from templates and read before it
 * leaves; nothing is sent before « Envoyer l'invitation ».
 */
export default async function PlanInterviewPage({
  params,
  searchParams,
}: PageProps<"/app/hire/candidats/[applicationId]/entretien">) {
  const [{ applicationId }, query] = await Promise.all([params, searchParams]);
  const fileHref = `/app/hire/candidats/${applicationId}`;
  const { user, space, ctx } = await requireHire(`${fileHref}/entretien`, "manage");
  const t = await getTranslations("hireInterviews");
  const ui = await getTranslations("ui");
  const now = new Date();
  const timeZone = defaultTimeZone();
  const data = await plannerData(db, ctx, applicationId, timeZone, now).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const { application } = data;
  const person = application.profile.user;
  const firstName = person.firstName || person.name.split(/\s+/)[0]!;

  if (!data.enabled) {
    const plans = await listPublicPlans(db);
    const plan = cheapestPlanWhere(
      plans,
      ["rh", "company"],
      (item) => item.entitlements["connect.appointments"] === "true",
    );
    return (
      <div className="t-flux">
        <FlowHead back={fileHref} backLabel={t("plan.back")} title={t("plan.title")} />
        <div className="t-rc-orbi">
          <div className="t-rc-lock">
            <b>
              <OrbiMark size={22} />
              {t("plan.lockedTitle")}
            </b>
            <span>{plan ? t("plan.locked", { plan: plan.name }) : t("plan.lockedNoPlan")}</span>
            <Link href="/app/abonnement/formules" className="t-bt t-sec t-s t-press">
              {t("plan.seePlans")}
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (application.status !== "active") redirect(fileHref);

  const rescheduleId = one(query.entretien);
  const existing = rescheduleId
    ? await readInterview(db, ctx, rescheduleId).catch(() => null)
    : null;
  if (
    rescheduleId &&
    (!existing ||
      existing.application.id !== application.id ||
      ["canceled", "done", "no_show", "declined"].includes(existing.status))
  )
    redirect(`/app/hire/entretiens`);

  const match = (await applicationMatches(db, [application], now)).get(application.id);
  const explanation = match && match !== "disabled" ? match : null;
  const strength = strongestSkill(explanation);
  const company = space.organization.name;
  const values = { firstName, jobTitle: application.job.title, company, signer: user.name };
  const tones = Object.fromEntries(
    invitationTones.map((tone) => {
      const body = tidyText(
        t(`invite.${tone}`, {
          ...values,
          strengthLine: strength ? t(`invite.strength.${tone}`, { strength }) : "",
        }).replaceAll("\\n", "\n"),
      );
      return [
        tone,
        {
          body,
          segments: decisionParagraphs(body).map((paragraph) =>
            highlightSegments(paragraph, [firstName, application.job.title, company, strength]),
          ),
        },
      ];
    }),
  ) as Record<
    (typeof invitationTones)[number],
    { body: string; segments: { text: string; filled: boolean }[][] }
  >;

  const errorKey = one(query.erreur);
  const error =
    errorKey === "past"
      ? t("plan.error.past")
      : errorKey === "invalid"
        ? t("plan.error.invalid")
        : errorKey
          ? t("plan.error.other")
          : null;
  const messages = await getMessages();
  const duration = existing
    ? existing.durationMinutes
    : (INTERVIEW_DURATIONS as readonly number[]).includes(45)
      ? 45
      : 30;

  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["hireInterviews", "hireCandidates"])}>
      <InterviewPlanner
        action={existing ? rescheduleInterviewAction : scheduleInterviewAction}
        reschedule={existing ? { interviewId: existing.id } : null}
        applicationId={application.id}
        back={fileHref}
        candidate={{
          id: application.id,
          name: person.name,
          firstName,
          line: [application.job.title, application.stage.name].join(" · "),
          score: explanation?.score ?? null,
          scoreText: explanation ? ui("percent", { value: explanation.score }) : "",
          scoreLabel: explanation ? t("plan.scoreAria", { score: explanation.score }) : "",
        }}
        jobTitle={application.job.title}
        org={{
          name: company,
          initials: initials(company),
          verified: Boolean(space.organization.verifiedAt),
        }}
        timezone={timeZone}
        zone={zoneLabel(timeZone, now)}
        today={data.today}
        nowMinutes={data.nowMinutes}
        days={dayLabels(data.today, PLANNER_DAYS + 1)}
        months={monthLabels(data.today, 3).filter(
          (item) => item.key <= monthOf(addDays(data.today, PLANNER_DAYS)),
        )}
        busy={data.busy}
        members={data.members.map((member) => ({ ...member, initials: initials(member.name) }))}
        me={ctx.userId}
        collaboration={data.collaboration}
        initial={{
          mode: (existing?.mode ?? "video") as PlannerMode,
          duration,
        }}
        tones={tones}
        error={error}
      />
    </NextIntlClientProvider>
  );
}
