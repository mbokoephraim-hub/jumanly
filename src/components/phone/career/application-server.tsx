import "server-only";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { isClosedStatus, type TalentApplicationStatus } from "@/server/services/applications";
import { LINK_VISIBLE_HOURS } from "@/server/services/interviews";
import { suiviApplication } from "@/server/services/suivi";
import { PhoneApplication, type ApplicationView } from "./application";
import { CareerTexts } from "./server";

/** The four steps of « Où en est-elle » (planche Carrière-candidature). */
const stepOf: Record<TalentApplicationStatus, number> = {
  sent: 0,
  viewed: 1,
  shortlisted: 1,
  test: 1,
  interview: 2,
  offer: 2,
  hired: 3,
  notSelected: 3,
  withdrawn: 3,
  jobClosed: 3,
};

/** Initials of the company for its square (« BF »). */
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase("fr"))
    .join("");

/**
 * Whether the phone's screen covers this application: an invitation to answer or a document
 * asked keeps the full screen of Suivi, which has the slots and the upload (until lot B9).
 */
export async function phoneCoversApplication(userId: string, id: string) {
  const application = await suiviApplication(db, userId, id);
  if (!application) return true;
  const answering = application.interviews.some((interview) =>
    ["pending", "reschedule"].includes(interview.status),
  );
  return !answering && application.requests.length === 0;
}

/** « Candidature » on the phone (Modèle B, lot B5), read on the server. */
export async function PhoneApplicationScreen({
  userId,
  userName,
  id,
}: {
  userId: string;
  userName: string;
  id: string;
}) {
  const application = await suiviApplication(db, userId, id);
  if (!application) notFound();
  const t = await getTranslations("phoneCareer.application");
  const tm = await getTranslations("connect.invite");
  const format = await getFormatter();
  const now = new Date();
  const company = application.job.organization.name;
  const status = application.talentStatus;
  const interview =
    application.interviews.find((item) => item.status === "confirmed" && item.startsAt) ?? null;
  // A confirmed interview places the application at « Entretien », whatever its column.
  const current = Math.max(stepOf[status], interview ? 2 : 0);
  const timeZone = interview?.timezone ?? "Africa/Kinshasa";
  const job = await db.job.findUnique({
    where: { slug: application.job.slug },
    select: { city: true },
  });
  const day = (date: Date) =>
    format.dateTime(date, { weekday: "long", day: "numeric", month: "long", timeZone });
  const hour = (date: Date) => {
    const parts = new Intl.DateTimeFormat("fr", {
      hour: "numeric",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone,
    }).formatToParts(date);
    const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
    return t("hour", { h: Number(part("hour")), m: part("minute") });
  };
  const capital = (text: string) => text.charAt(0).toLocaleUpperCase("fr") + text.slice(1);
  const recruiter = interview?.organizer?.name ?? application.lastMessage?.senderName ?? null;
  const first = recruiter?.split(/\s+/)[0] ?? null;

  const decision = isClosedStatus(status)
    ? t(`decision.${status as "hired" | "notSelected" | "withdrawn" | "jobClosed"}`)
    : t("decision.after");
  const steps: ApplicationView["steps"] = [
    { label: t("step.sent"), detail: capital(day(application.createdAt)) },
    {
      label: t("step.viewed", { company }),
      detail: application.viewedAt
        ? capital(day(application.viewedAt))
        : current > 1
          ? t("step.viewedSeen")
          : t("step.notViewed"),
    },
    {
      label: t("step.interview"),
      detail: interview?.startsAt
        ? t("step.interviewOn", {
            day: capital(day(interview.startsAt)),
            hour: hour(interview.startsAt),
          })
        : current > 2
          ? t("step.noInterview")
          : t("step.interviewLater"),
    },
    { label: t("step.decision"), detail: decision },
  ].map((step, index) => ({
    ...step,
    state: index < current ? "done" : index === current ? "current" : "next",
  }));

  const mode = interview ? tm(`mode.${interview.mode === "audio" ? "call" : interview.mode}`) : "";
  const cv = (application.cvSnapshot ?? null) as { title?: string } | null;
  const conversationId = application.conversation?.id ?? null;
  const active = application.status === "active";

  const view: ApplicationView = {
    id: application.id,
    title: application.job.title,
    company,
    initials: initialsOf(company),
    logo: application.job.organization.logo,
    companyHref: `/app/entreprises/${application.job.organization.slug}`,
    step: Math.min(3, current) + 1,
    line: [company, job?.city].filter(Boolean).join(" · "),
    offer: `/app/jobs/${application.job.slug}`,
    steps,
    interview:
      interview?.startsAt && active
        ? {
            when: t("interviewWhen", {
              day: capital(
                format.dateTime(interview.startsAt, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone,
                }),
              ),
              hour: hour(interview.startsAt),
            }),
            where: [
              interview.mode === "onsite" && interview.address ? interview.address : mode,
              recruiter ? t("with", { name: recruiter }) : null,
            ]
              .filter(Boolean)
              .join(" · "),
            calendar: `/app/suivi/entretiens/${interview.id}/agenda`,
            join:
              interview.link &&
              interview.startsAt.getTime() - now.getTime() <= LINK_VISIBLE_HOURS * 3_600_000
                ? interview.link
                : null,
          }
        : null,
    practice: `/app/career/entretiens/nouveau?candidature=${application.id}`,
    cv: cv?.title ? { title: cv.title, href: `/app/jobs/candidatures/${application.id}/cv` } : null,
    write: conversationId
      ? {
          conversationId,
          label: first ? t("writeTo", { name: first }) : t("writeTeam"),
          draft: interview?.startsAt
            ? t("draftInterview", {
                name: first ?? "none",
                day: format.dateTime(interview.startsAt, { weekday: "long", timeZone }),
                hour: hour(interview.startsAt),
                me: userName.split(/\s+/)[0] ?? "",
              })
            : t("draftNews", {
                name: first ?? "none",
                title: application.job.title,
                me: userName.split(/\s+/)[0] ?? "",
              }),
        }
      : null,
    questions: {
      people: first ? t("askPeople", { name: first }) : t("askTeam"),
      company: t("askCompany", { company }),
    },
    context: t("context", { title: application.job.title, company }),
    active,
  };
  return (
    <CareerTexts>
      <PhoneApplication view={view} />
    </CareerTexts>
  );
}
