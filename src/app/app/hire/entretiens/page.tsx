import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon, type IconName } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { pillClass } from "@/components/career/kit";
import { Initials, MenuChip, menuItem, moreButton } from "@/components/hire/kit";
import { criterionText } from "@/components/matching/talent-why";
import { SuccessBurst } from "@/components/motion/success-burst";
import {
  Alert,
  EmptyState,
  PlanLock,
  Select,
  TextArea,
  TextField,
  segmentedItem,
  segmentedList,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import { defaultTimeZone } from "@/lib/dates";
import { dynamic } from "@/i18n/dynamic";
import {
  cancelInterviewAction,
  closeInterviewAction,
  rescheduleInterviewAction,
  scheduleInterviewAction,
} from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { can, level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { applicationMatches } from "@/server/matching/service";
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
  return { title: t("title"), robots: { index: false } };
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
type Status = keyof typeof statusKey;

/** Block and tag colours of each status (legend of mockup 04-08). */
const tone: Record<Status, { block: string; tag: string; bar: string }> = {
  confirmed: {
    block: "bg-lime-clair border-feuille",
    tag: "bg-lime-clair text-up-texte",
    bar: "bg-feuille",
  },
  pending: { block: "bg-creme border-ambre", tag: "bg-lime text-sapin", bar: "bg-ambre" },
  reschedule: {
    block: "bg-ambre-fond border-ambre-fonce",
    tag: "bg-ambre-fond text-ambre-texte",
    bar: "bg-ambre-fonce",
  },
  done: { block: "bg-gris-clair border-ardoise/50", tag: "bg-gris-clair", bar: "bg-ardoise/50" },
  no_show: { block: "bg-gris-clair border-ardoise", tag: "bg-gris-clair", bar: "bg-ardoise" },
  canceled: {
    block: "bg-down-fond border-corail line-through",
    tag: "bg-down-fond text-down-texte",
    bar: "bg-corail",
  },
  declined: {
    block: "bg-down-fond border-corail line-through",
    tag: "bg-down-fond text-down-texte",
    bar: "bg-corail",
  },
};
const legend: Status[] = ["confirmed", "pending", "reschedule", "done", "no_show", "canceled"];
const modeIcon: Record<string, IconName> = {
  video: "play",
  onsite: "localisation",
  audio: "message",
};

const HOUR = 76;
const DAY = 86_400_000;
/** A calendar day as « YYYY-MM-DD » in UTC arithmetic (no time zone shift). */
const keyOf = (date: Date) => date.toISOString().slice(0, 10);
const dayOf = (key: string) => new Date(`${key}T12:00:00Z`);
const addDays = (key: string, days: number) => keyOf(new Date(dayOf(key).getTime() + days * DAY));
const mondayOf = (key: string) => addDays(key, -((dayOf(key).getUTCDay() + 6) % 7));

/**
 * Interviews (E8, `connect.appointments`), mockup 04-08: a week agenda (or day, month, list) with
 * the selected interview beside it, the points to clarify from the score, and the interviews
 * waiting for an answer. Planning sends one to three slots; the candidate chooses.
 */
export default async function InterviewsPage({ searchParams }: PageProps<"/app/hire/entretiens">) {
  const query = await searchParams;
  const { ctx, space } = await requireHire("/app/hire/entretiens", "readApplications");
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [enabled, collaboration, matchingLevel, plans] = await Promise.all([
    can(db, subject, "connect.appointments"),
    can(db, subject, "hire.collaboration"),
    level(db, subject, "hire.matching.level"),
    listPublicPlans(db),
  ]);
  const eyebrow = t("hire.pipeline.eyebrow", { org: space.organization.name });
  if (!enabled) {
    return (
      <div className="jm-page flex flex-col gap-5">
        <AppPageHeader eyebrow={eyebrow} title={t("hire.interviews.title")} />
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
  const view = (["jour", "mois", "liste"] as const).find((item) => item === query.vue) ?? "semaine";
  const jobId = one(query.offre);
  const candidature = one(query.candidature);
  const timeZone = defaultTimeZone();
  const now = new Date();
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const at = (date: Date) => {
    const parts = Object.fromEntries(
      local.formatToParts(date).map((part) => [part.type, part.value]),
    );
    return {
      key: `${parts.year}-${parts.month}-${parts.day}`,
      minutes: Number(parts.hour) * 60 + Number(parts.minute),
    };
  };
  const today = at(now).key;
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(one(query.date)) ? one(query.date) : today;

  const [interviews, applications, members, jobs] = await Promise.all([
    listInterviews(db, ctx, { filter, jobId: jobId || undefined }),
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
    db.membership.findMany({
      where: { organizationId: ctx.organizationId, status: "active" },
      select: { userId: true, user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.job.findMany({
      where: { organizationId: ctx.organizationId, status: { in: ["published", "closed"] } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true },
    }),
  ]);
  const memberName = new Map(members.map((member) => [member.userId, member.user.name]));
  const others = members.filter((member) => member.userId !== ctx.userId);

  // ─── Calendar ───────────────────────────────────────────────────────────────
  type Block = {
    interview: (typeof interviews)[number];
    key: string;
    start: number;
    end: number;
    proposed: boolean;
    lane: number;
    lanes: number;
  };
  const blocks: Block[] = interviews.flatMap((interview) => {
    const starts =
      interview.status === "pending"
        ? interview.slots
        : interview.status === "reschedule"
          ? interview.proposedSlots.length > 0
            ? interview.proposedSlots
            : interview.slots
          : interview.startsAt
            ? [interview.startsAt]
            : [];
    return starts.map((date) => {
      const { key, minutes } = at(date);
      return {
        interview,
        key,
        start: minutes,
        end: minutes + interview.durationMinutes,
        proposed: interview.status === "pending" || interview.status === "reschedule",
        lane: 0,
        lanes: 1,
      };
    });
  });
  // Side by side when two blocks of a day overlap.
  const byDay = new Map<string, Block[]>();
  for (const block of blocks.sort((a, b) => a.start - b.start)) {
    byDay.set(block.key, [...(byDay.get(block.key) ?? []), block]);
  }
  for (const list of byDay.values()) {
    const ends: number[] = [];
    for (const block of list) {
      const free = ends.findIndex((end) => end <= block.start);
      block.lane = free === -1 ? ends.length : free;
      ends[block.lane] = block.end;
    }
    for (const block of list) block.lanes = ends.length;
  }

  const monday = mondayOf(anchor);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(monday, index)).filter(
    (key, index) => index < 5 || (byDay.get(key)?.length ?? 0) > 0,
  );
  const days = view === "jour" ? [anchor] : weekDays;
  const shown = days.flatMap((key) => byDay.get(key) ?? []);
  const firstHour = Math.min(8, ...shown.map((block) => Math.floor(block.start / 60)));
  const lastHour = Math.max(18, ...shown.map((block) => Math.ceil(block.end / 60)));
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, index) => firstHour + index);
  const nowAt = at(now);

  const monthStart = `${anchor.slice(0, 8)}01`;
  const monthEnd = addDays(
    keyOf(new Date(Date.UTC(Number(anchor.slice(0, 4)), Number(anchor.slice(5, 7)), 1, 12))),
    -1,
  );
  const monthDays: string[] = [];
  for (let key = mondayOf(monthStart); key <= monthEnd || monthDays.length % 7 !== 0;) {
    monthDays.push(key);
    key = addDays(key, 1);
  }
  const shift = (direction: 1 | -1) => {
    if (view === "jour") return addDays(anchor, direction);
    if (view === "mois") {
      const date = dayOf(monthStart);
      date.setUTCMonth(date.getUTCMonth() + direction);
      return keyOf(date);
    }
    return addDays(anchor, 7 * direction);
  };
  const range =
    view === "jour"
      ? format.dateTime(dayOf(anchor), {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })
      : view === "mois"
        ? format.dateTime(dayOf(anchor), { month: "long", year: "numeric", timeZone: "UTC" })
        : format.dateTimeRange(dayOf(weekDays[0]!), dayOf(weekDays.at(-1)!), {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          });

  const hrefWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams();
    for (const key of ["vue", "date", "filtre", "offre", "entretien"] as const) {
      const value = one(query[key]);
      if (value) next.set(key, value);
    }
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const text = next.toString();
    return text ? `/app/hire/entretiens?${text}` : "/app/hire/entretiens";
  };

  // ─── Selection ──────────────────────────────────────────────────────────────
  const upcoming = interviews.filter(
    (item) => item.status === "confirmed" && item.startsAt && item.startsAt >= now,
  );
  const waiting = interviews.filter(
    (item) => item.status === "pending" || item.status === "reschedule",
  );
  const past = interviews.filter((item) => !upcoming.includes(item) && !waiting.includes(item));
  const selected =
    interviews.find((item) => item.id === one(query.entretien)) ??
    upcoming[0] ??
    waiting[0] ??
    null;
  const match =
    selected && matchingLevel !== "none"
      ? await db.application
          .findUnique({
            where: { id: selected.application.id },
            select: {
              id: true,
              matchScore: true,
              matchExplanation: true,
              profile: { select: { matchingEnabled: true } },
            },
          })
          .then(async (application) => {
            if (!application) return null;
            const result = (await applicationMatches(db, [application])).get(application.id);
            return result && result !== "disabled" ? result : null;
          })
      : null;
  const toVerify = match
    ? [
        ...match.knockouts.map((knockout) => knockout.label),
        ...match.criteria
          .filter((criterion) => criterion.status === "unknown")
          .map((criterion) =>
            t("match.why.recruiter.verify.unknown", {
              criterion: d(`match.criterion.${criterionText[criterion.key]}.text`),
            }),
          ),
        ...match.missingSkills.map((missing) =>
          t("match.why.recruiter.missing.item", {
            skill: missing.skill,
            kind: t(`match.why.recruiter.missing.kind.${missing.importance}`),
          }),
        ),
      ]
    : [];

  const okText: Record<string, string> = {
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

  const time = (date: Date) => format.dateTime(date, { timeStyle: "short", timeZone });
  const when = (date: Date) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short", timeZone });
  const slotsText = (dates: Date[]) => dates.map(when).join(" · ");
  const short = (date: Date) =>
    [format.dateTime(date, { weekday: "short", day: "numeric", timeZone }), time(date)].join(" · ");
  const clock = (minutes: number) =>
    [String(Math.floor(minutes / 60)).padStart(2, "0"), String(minutes % 60).padStart(2, "0")].join(
      ":",
    );
  const statusTag = (status: Status, className?: string) => (
    <span
      className={cx(
        "inline-flex h-6 items-center gap-1 rounded-pill px-2.5 text-[11.5px] font-semibold",
        tone[status].tag,
        className,
      )}
    >
      {status === "confirmed" && <Icon name="check" className="size-3" />}
      {t(`hire.interviews.status.${statusKey[status]}`)}
    </span>
  );

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

  const blockLink = (block: Block, className?: string) => {
    const interview = block.interview;
    const current = interview.id === selected?.id;
    return (
      <Link
        key={`${interview.id}-${block.start}-${block.key}`}
        href={`${hrefWith({ entretien: interview.id })}#detail`}
        aria-current={current ? "true" : undefined}
        className={cx(
          "flex min-w-0 flex-col overflow-hidden rounded-[10px] border-l-[3px] px-2.5 py-1.5 text-left hover:brightness-[0.98]",
          tone[interview.status].block,
          block.proposed && "border-dashed",
          current && "ring-2 ring-sapin",
          className,
        )}
      >
        <span className="flex items-center gap-1 truncate text-[11px] leading-4 whitespace-nowrap text-ardoise">
          <Icon name={modeIcon[interview.mode] ?? "calendrier"} className="size-3 shrink-0" />
          {[clock(block.start), clock(block.end)].join(" – ")}
        </span>
        <span className="truncate text-[12.5px] leading-4 font-semibold">
          {interview.application.profile.user.name}
        </span>
        <span className="truncate text-[11px] leading-4 text-ardoise">
          {block.proposed ? t("hire.interviews.slotProposed") : interview.application.job.title}
        </span>
      </Link>
    );
  };

  const weekGrid = (
    <div
      tabIndex={0}
      role="region"
      aria-label={t("hire.interviews.calendar")}
      className="overflow-x-auto rounded-[24px] bg-blanc max-lg:hidden"
    >
      <div className="min-w-[640px] p-4 pt-3">
        <div
          className="grid border-b border-gris-clair pb-3"
          style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <span />
          {days.map((key) => (
            <Link
              key={key}
              href={hrefWith({ vue: "jour", date: key })}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[12px] text-ardoise">
                {format.dateTime(dayOf(key), { weekday: "short", timeZone: "UTC" })}
              </span>
              <span
                className={cx(
                  "grid size-9 place-items-center rounded-full text-[19px] font-semibold",
                  key === today && "bg-sapin text-neon",
                )}
              >
                {Number(key.slice(8))}
              </span>
            </Link>
          ))}
        </div>
        <div
          className="relative grid"
          style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div className="relative" style={{ height: (hours.length - 1) * HOUR + 12 }}>
            {hours.map((hour, index) => (
              <span
                key={hour}
                className="absolute left-0 -translate-y-1/2 text-[12px] text-ardoise"
                style={{ top: index * HOUR + 6 }}
              >
                {clock(hour * 60)}
              </span>
            ))}
          </div>
          {days.map((key) => (
            <div
              key={key}
              className={cx(
                "relative border-l border-gris-clair",
                key === today && "bg-lime-clair/45",
              )}
              style={{ height: (hours.length - 1) * HOUR + 12 }}
            >
              {hours.map((hour, index) => (
                <span
                  key={hour}
                  aria-hidden
                  className="absolute inset-x-0 border-t border-gris-clair"
                  style={{ top: index * HOUR + 6 }}
                />
              ))}
              {key === today &&
                nowAt.minutes >= firstHour * 60 &&
                nowAt.minutes <= lastHour * 60 && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 z-10 border-t-2 border-sapin"
                    style={{ top: ((nowAt.minutes - firstHour * 60) / 60) * HOUR + 6 }}
                  >
                    <span className="absolute -top-[5px] -left-1 size-2 rounded-full bg-sapin" />
                  </span>
                )}
              {(byDay.get(key) ?? []).map((block) => {
                const top = ((block.start - firstHour * 60) / 60) * HOUR + 6;
                const height = Math.max(46, ((block.end - block.start) / 60) * HOUR - 4);
                return (
                  <div
                    key={`${block.interview.id}-${block.start}`}
                    className="absolute flex px-1"
                    style={{
                      top,
                      height,
                      left: `${(block.lane / block.lanes) * 100}%`,
                      width: `${100 / block.lanes}%`,
                    }}
                  >
                    {blockLink(block, "h-full w-full")}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const monthGrid = (
    <div className="rounded-[24px] bg-blanc p-3 max-lg:hidden">
      <div className="grid grid-cols-7 gap-1">
        {monthDays.slice(0, 7).map((key) => (
          <span key={key} className="px-2 py-1 text-[12px] text-ardoise">
            {format.dateTime(dayOf(key), { weekday: "short", timeZone: "UTC" })}
          </span>
        ))}
        {monthDays.map((key) => {
          const list = byDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cx(
                "flex min-h-28 min-w-0 flex-col gap-1 rounded-[12px] p-1.5",
                key.slice(0, 7) === anchor.slice(0, 7) ? "bg-creme/60" : "opacity-50",
                key === today && "ring-2 ring-sapin",
              )}
            >
              <Link
                href={hrefWith({ vue: "jour", date: key })}
                className="px-1 text-[12.5px] font-semibold"
              >
                {Number(key.slice(8))}
              </Link>
              {list.slice(0, 3).map((block) => blockLink(block, "py-1"))}
              {list.length > 3 && (
                <Link
                  href={hrefWith({ vue: "jour", date: key })}
                  className="px-1 text-[11px] font-semibold text-ardoise"
                >
                  {t("hire.pipeline.card.more", { count: list.length - 3 })}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Phone: the days of the week, then the interviews of the chosen day.
  const dayList = (
    <div className="flex flex-col gap-3 lg:hidden">
      <nav
        aria-label={t("hire.interviews.calendar")}
        className="grid gap-1 rounded-[24px] bg-blanc p-2"
        style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))` }}
      >
        {weekDays.map((key) => (
          <Link
            key={key}
            href={hrefWith({ date: key, vue: view === "liste" ? "liste" : null })}
            aria-current={key === anchor ? "date" : undefined}
            className={cx(
              "flex flex-col items-center gap-0.5 rounded-[16px] py-2.5",
              key === anchor ? "bg-sapin text-blanc" : "hover:bg-creme",
            )}
          >
            <span className={cx("text-[12px]", key === anchor ? "text-blanc/75" : "text-ardoise")}>
              {format.dateTime(dayOf(key), { weekday: "short", timeZone: "UTC" })}
            </span>
            <span className="text-[19px] font-semibold">{Number(key.slice(8))}</span>
            <span
              aria-hidden
              className={cx(
                "size-1.5 rounded-full",
                (byDay.get(key)?.length ?? 0) > 0 ? "bg-lime" : "bg-transparent",
              )}
            />
          </Link>
        ))}
      </nav>
      <h2 className="mt-1 text-[12px] font-semibold tracking-[0.12em] text-ardoise uppercase">
        {format.dateTime(dayOf(anchor), {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        })}
      </h2>
      {(byDay.get(anchor) ?? []).length === 0 ? (
        <p className="rounded-[22px] bg-blanc p-5 text-[14px] text-ardoise">
          {t("hire.interviews.dayEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {(byDay.get(anchor) ?? []).map((block) => (
            <li key={`${block.interview.id}-${block.start}`}>
              <Link
                href={`${hrefWith({ entretien: block.interview.id })}#detail`}
                className="relative flex gap-4 overflow-hidden rounded-[22px] bg-blanc py-4 pr-4 pl-5"
              >
                <span
                  aria-hidden
                  className={cx("absolute inset-y-0 left-0 w-1", tone[block.interview.status].bar)}
                />
                <span className="flex w-14 shrink-0 flex-col justify-center">
                  <span className="text-[16px] font-semibold">{clock(block.start)}</span>
                  <span className="text-[12px] text-ardoise">
                    {t("hire.interviews.form.minutes", {
                      minutes: block.interview.durationMinutes,
                    })}
                  </span>
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-[15px] font-semibold">
                    {block.interview.application.profile.user.name}
                  </span>
                  <span className="truncate text-[13px] text-ardoise">
                    {block.interview.application.job.title}
                  </span>
                  {statusTag(block.interview.status, "self-start")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const listRow = (interview: (typeof interviews)[number]) => (
    <li key={interview.id}>
      <Link
        href={`${hrefWith({ entretien: interview.id })}#detail`}
        aria-current={interview.id === selected?.id ? "true" : undefined}
        className="flex items-center gap-3 rounded-[20px] bg-blanc px-4 py-3.5 hover:bg-blanc/80 aria-[current=true]:ring-2 aria-[current=true]:ring-sapin"
      >
        <Initials name={interview.application.profile.user.name} size={40} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[14px] font-semibold">
            {interview.application.profile.user.name}
          </span>
          <span className="truncate text-[12px] text-ardoise">
            {[
              interview.application.job.title,
              interview.startsAt
                ? when(interview.startsAt)
                : interview.slots[0]
                  ? when(interview.slots[0])
                  : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        {statusTag(interview.status, "shrink-0")}
      </Link>
    </li>
  );
  const listGroup = (id: string, title: string, items: typeof interviews) =>
    items.length > 0 && (
      <section aria-labelledby={id} className="flex flex-col gap-2.5">
        <h2 id={id} className="text-[18px] font-semibold">
          {title}
        </h2>
        <ul className="flex flex-col gap-2">{items.map(listRow)}</ul>
      </section>
    );

  const detail =
    selected &&
    (() => {
      const interview = selected;
      const closed = ["canceled", "done", "no_show", "declined"].includes(interview.status);
      const started = interview.startsAt !== null && interview.startsAt <= now;
      const ended =
        interview.startsAt !== null &&
        interview.startsAt.getTime() + interview.durationMinutes * 60_000 < now.getTime();
      const team = [interview.organizerId, ...interview.participantIds]
        .filter((id, index, list): id is string => Boolean(id) && list.indexOf(id) === index)
        .map((id) => memberName.get(id))
        .filter((name): name is string => Boolean(name));
      const end = interview.startsAt
        ? new Date(interview.startsAt.getTime() + interview.durationMinutes * 60_000)
        : null;
      const lines: { icon: IconName; text: string }[] = [
        interview.startsAt && end
          ? {
              icon: "calendrier" as const,
              text: [
                format.dateTime(interview.startsAt, { dateStyle: "full", timeZone }),
                [time(interview.startsAt), time(end)].join(" – "),
              ].join(" · "),
            }
          : null,
        interview.status === "pending"
          ? {
              icon: "calendrier" as const,
              text: t("hire.interviews.slotsPending", { slots: slotsText(interview.slots) }),
            }
          : null,
        interview.status === "reschedule" && interview.proposedSlots.length > 0
          ? {
              icon: "calendrier" as const,
              text: t("hire.interviews.proposed", { slots: slotsText(interview.proposedSlots) }),
            }
          : null,
        {
          icon: modeIcon[interview.mode] ?? "calendrier",
          text: [
            t(`hire.interviews.form.type.${interview.mode}`),
            t("hire.interviews.form.minutes", { minutes: interview.durationMinutes }),
            interview.link ? t("hire.interviews.linkSent") : null,
          ]
            .filter(Boolean)
            .join(" · "),
        },
        interview.address ? { icon: "localisation" as const, text: interview.address } : null,
        {
          icon: "horloge" as const,
          text: t("hire.interviews.form.timezone", { timezone: interview.timezone }),
        },
        team.length > 0 ? { icon: "equipe" as const, text: team.join(", ") } : null,
        interview.cancelReason ? { icon: "message" as const, text: interview.cancelReason } : null,
      ].filter((line): line is { icon: IconName; text: string } => line !== null);
      return (
        <section
          id="detail"
          aria-labelledby="detail-name"
          className="flex scroll-mt-24 flex-col gap-4 rounded-[24px] bg-blanc p-5 ring-2 ring-sapin lg:p-6"
        >
          <div className="flex items-center justify-between gap-2">
            {statusTag(interview.status)}
            {manage && (
              <MenuChip
                group="interview-more"
                align="right"
                label={t("hire.interviews.actions")}
                summaryClassName={moreButton}
                summary={<Icon name="more" className="size-4" />}
              >
                <Link href={`/app/hire/candidats/${interview.application.id}`} className={menuItem}>
                  <Icon name="profil" />
                  {t("hire.pipeline.action.view")}
                </Link>
                {interview.application.conversation && (
                  <Link
                    href={`/app/messages/${interview.application.conversation.id}`}
                    className={menuItem}
                  >
                    <Icon name="message" />
                    {t("hire.application.message")}
                  </Link>
                )}
                {interview.status === "confirmed" && started && (
                  <>
                    <form action={closeInterviewAction}>
                      <input type="hidden" name="interview" value={interview.id} />
                      <input type="hidden" name="outcome" value="done" />
                      <button type="submit" className={menuItem}>
                        <Icon name="check" />
                        {t("hire.interviews.markDone")}
                      </button>
                    </form>
                    <form action={closeInterviewAction}>
                      <input type="hidden" name="interview" value={interview.id} />
                      <input type="hidden" name="outcome" value="no_show" />
                      <button type="submit" className={menuItem}>
                        <Icon name="alerte" />
                        {t("hire.interviews.noShow")}
                      </button>
                    </form>
                  </>
                )}
              </MenuChip>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Initials name={interview.application.profile.user.name} size={48} />
            <div className="flex min-w-0 flex-1 flex-col">
              <h2 id="detail-name" className="text-[17px] leading-[22px] font-semibold">
                {interview.application.profile.user.name}
              </h2>
              <p className="truncate text-[12.5px] text-ardoise">
                {interview.application.job.title}
              </p>
            </div>
            {match && (
              <Link
                href={`/app/hire/candidats/${interview.application.id}#score`}
                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-pill bg-gradient-ai px-2.5 text-[12px] font-bold text-blanc"
              >
                <Icon name="intelligence" className="size-3.5 text-neon" />
                {t("ui.percent", { value: match.score })}
              </Link>
            )}
          </div>
          <ul className="flex flex-col gap-2.5 text-[13.5px] leading-[19px]">
            {lines.map((line) => (
              <li key={line.text} className="flex gap-2.5">
                <Icon name={line.icon} className="mt-0.5 size-4 shrink-0" />
                {line.text}
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-2">
            {interview.status === "confirmed" && interview.link && !ended && (
              <a
                href={interview.link}
                target="_blank"
                rel="noreferrer"
                className={pillClass("lime", "md", "w-full")}
              >
                <Icon name="play" className="size-4" />
                {t("hire.interviews.join")}
              </a>
            )}
            {manage && !closed && (
              <MenuChip
                group="interview-reschedule"
                align="right"
                className={
                  interview.status === "confirmed" && interview.link && !ended ? "" : "col-span-2"
                }
                summaryClassName={pillClass("outline", "md", "w-full")}
                summary={t("hire.interviews.reschedule")}
              >
                <form
                  action={rescheduleInterviewAction}
                  className="flex w-[min(320px,calc(100vw-48px))] flex-col gap-3 p-2"
                >
                  <input type="hidden" name="interview" value={interview.id} />
                  <p className="text-[12.5px] text-ardoise">
                    {t("hire.interviews.form.timezone", { timezone: interview.timezone })}
                  </p>
                  {slotInputs(`re-${interview.id}`)}
                  <button type="submit" className={pillClass("dark", "sm", "self-start")}>
                    {t("hire.interviews.form.send")}
                  </button>
                </form>
              </MenuChip>
            )}
            <Link
              href={`/app/hire/candidats/${interview.application.id}#evaluation`}
              className={pillClass("outline", "sm", "col-span-2 w-full")}
            >
              <Icon name="doc" className="size-4" />
              {t("hire.interviews.fillScorecard")}
            </Link>
          </div>
          {manage && !closed && (
            <details className="group">
              <summary className="cursor-pointer list-none text-[13px] font-semibold text-down-texte [&::-webkit-details-marker]:hidden">
                {t("hire.interviews.cancel.text")}
              </summary>
              <form
                action={cancelInterviewAction}
                className="mt-3 flex flex-col items-start gap-3 rounded-[16px] bg-creme p-4"
              >
                <input type="hidden" name="interview" value={interview.id} />
                <p className="text-[14px] font-semibold">
                  {t("hire.interviews.cancel.confirm.title")}
                </p>
                <p className="text-[13px] leading-[18px]">
                  {t("hire.interviews.cancel.confirm.body")}
                </p>
                <TextArea
                  id={`cancel-${interview.id}`}
                  name="reason"
                  maxLength={1000}
                  rows={3}
                  label={t("hire.interviews.cancel.reason")}
                />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center rounded-pill bg-down-texte px-4 text-[13px] font-semibold text-blanc"
                >
                  {t("hire.interviews.cancel.text")}
                </button>
              </form>
            </details>
          )}
        </section>
      );
    })();

  const prep = selected && match && (
    <section
      aria-labelledby="prep-title"
      className="relative flex flex-col gap-3 overflow-hidden rounded-[24px] bg-gradient-ai p-5 text-blanc lg:p-6"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-14 size-48 rounded-full ring-1 ring-blanc/15"
      />
      <p className="relative flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.12em] text-neon uppercase">
        <AiOrb size={26} />
        {t("ai.brand")}
      </p>
      <h2 id="prep-title" className="relative text-[19px] font-semibold">
        {t("hire.interviews.prep")}
      </h2>
      {toVerify.length > 0 ? (
        <div className="relative flex flex-col gap-1.5 text-[13px] leading-[19px] text-blanc/90">
          <p>
            {t("hire.interviews.prepIntro", {
              candidateName: selected.application.profile.user.name,
            })}
          </p>
          <ul className="flex flex-col gap-1">
            {toVerify.slice(0, 5).map((item) => (
              <li key={item} className="flex gap-2">
                <Icon name="message" className="mt-0.5 size-3.5 shrink-0 text-lime" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="relative text-[13px] leading-[19px] text-blanc/90">
          {t("hire.interviews.prepEmpty")}
        </p>
      )}
      <p className="relative flex gap-2 text-[12px] leading-[17px] text-blanc/80">
        <Icon name="eye" className="mt-0.5 size-3.5 shrink-0 text-lime" />
        <span>
          <strong className="text-blanc">{t("ai.card.why")}</strong> {t("hire.interviews.prepWhy")}
        </span>
      </p>
      <Link
        href={`/app/hire/candidats/${selected.application.id}#score`}
        className={pillClass("lime", "sm", "relative self-start")}
      >
        {t("hire.interviews.prepOpen")}
      </Link>
    </section>
  );

  const toConfirm = waiting.length > 0 && (
    <section
      aria-labelledby="to-confirm"
      className="flex flex-col gap-1 rounded-[24px] bg-blanc p-5 lg:p-6"
    >
      <h2 id="to-confirm" className="mb-2 text-[18px] font-semibold">
        {t("hire.interviews.toConfirm")}
      </h2>
      <ul className="flex flex-col divide-y divide-gris-clair">
        {waiting.slice(0, 6).map((interview) => {
          const first = interview.proposedSlots[0] ?? interview.slots[0];
          return (
            <li key={interview.id}>
              <Link
                href={`${hrefWith({ entretien: interview.id })}#detail`}
                className="flex items-center gap-3 py-2.5"
              >
                <Initials name={interview.application.profile.user.name} size={36} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] font-semibold">
                    {interview.application.profile.user.name}
                  </span>
                  {first && <span className="text-[12px] text-ardoise">{short(first)}</span>}
                </span>
                {statusTag(interview.status, "shrink-0")}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );

  const planner = manage && candidature && (
    <section
      id="planifier"
      aria-labelledby="planifier-title"
      className="flex scroll-mt-24 flex-col gap-4 rounded-[24px] bg-blanc p-5 ring-2 ring-sapin lg:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="planifier-title" className="text-[20px] font-semibold">
          {t("hire.interviews.new")}
        </h2>
        <Link
          href={hrefWith({})}
          aria-label={t("common.close")}
          className="grid size-8 place-items-center rounded-full hover:bg-creme"
        >
          <Icon name="fermer" className="size-4" />
        </Link>
      </div>
      {applications.length === 0 ? (
        <p className="text-[14px] text-ardoise">{t("hire.interviews.form.noCandidate")}</p>
      ) : (
        <form action={scheduleInterviewAction} className="flex flex-col gap-4">
          <input type="hidden" name="back" value={back} />
          <input type="hidden" name="timezone" value={timeZone} />
          <Select
            id="interview-application"
            name="application"
            required
            label={t("hire.interviews.form.candidate")}
            defaultValue={applications.some((item) => item.id === candidature) ? candidature : ""}
            placeholder={t("hire.interviews.form.candidate")}
            options={applications.map((item) => ({
              value: item.id,
              label: [item.profile.user.name, item.job.title].join(" · "),
            }))}
          />
          <div className="grid grid-cols-2 gap-3">
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
            <legend className="text-[14px] font-semibold">
              {t("hire.interviews.form.slots.text")}
            </legend>
            <p className="text-[12.5px] leading-[18px] text-ardoise">
              {[
                t("hire.interviews.form.slots.hint"),
                t("hire.interviews.form.timezone", { timezone: timeZone }),
              ].join(" ")}
            </p>
            {slotInputs("new")}
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
            others.length > 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-[14px] font-semibold">
                  {t("hire.interviews.form.participants.text")}
                </legend>
                {others.map((member) => (
                  <label
                    key={member.userId}
                    className="flex h-11 cursor-pointer items-center gap-3 rounded-[14px] px-3.5 ring-[1.5px] ring-brume ring-inset has-checked:bg-lime-clair has-checked:ring-lime"
                  >
                    <input
                      id={`participant-${member.userId}`}
                      type="checkbox"
                      name="participants"
                      value={member.userId}
                      className="size-4 accent-sapin"
                    />
                    <Initials name={member.user.name} size={26} />
                    <span className="text-[13.5px] font-medium">{member.user.name}</span>
                  </label>
                ))}
              </fieldset>
            )
          ) : (
            <p className="flex items-center gap-2 text-[12.5px] text-ardoise">
              <Icon name="lock" className="size-3.5" />
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
          <button type="submit" className={pillClass("lime", "md", "w-full")}>
            {t("hire.interviews.form.send")}
            <Icon name="send" className="size-4" />
          </button>
        </form>
      )}
    </section>
  );

  const toggle = (active: boolean) => segmentedItem(active);
  const agenda = view !== "liste";

  return (
    <div className="jm-page flex flex-col gap-4 lg:gap-5">
      <AppPageHeader
        eyebrow={eyebrow}
        title={t("hire.interviews.title")}
        actions={
          manage && !candidature ? (
            <Link
              href={`${hrefWith({ candidature: "nouveau" })}#planifier`}
              className={pillClass("lime", "md")}
            >
              <Icon name="ajouter" className="size-4" />
              {t("hire.interviews.new")}
            </Link>
          ) : undefined
        }
      />
      {one(query.ok) === "entretien" && (
        <SuccessBurst
          title={t("hire.interviews.sent")}
          action={
            <Link href={hrefWith({ ok: null })} className={pillClass("dark", "sm")}>
              {t("hire.interviews.calendar")}
            </Link>
          }
        />
      )}
      {ok && <Alert tone="success" title={ok} />}
      {error && <Alert tone="error" title={error} />}

      <div className="flex flex-wrap items-center gap-2">
        <nav aria-label={t("hire.interviews.calendar")} className={segmentedList}>
          <Link
            href={hrefWith({ vue: null })}
            aria-current={agenda ? "page" : undefined}
            className={toggle(agenda)}
          >
            {t("hire.interviews.view.agenda")}
          </Link>
          <Link
            href={hrefWith({ vue: "liste" })}
            aria-current={!agenda ? "page" : undefined}
            className={toggle(!agenda)}
          >
            {t("hire.interviews.view.list")}
          </Link>
        </nav>
        {agenda && (
          <div className={cx(segmentedList, "max-lg:hidden")}>
            {(
              [
                ["jour", "day"],
                ["semaine", "week"],
                ["mois", "month"],
              ] as const
            ).map(([value, label]) => (
              <Link
                key={value}
                href={hrefWith({ vue: value === "semaine" ? null : value })}
                aria-current={view === value ? "page" : undefined}
                className={toggle(view === value)}
              >
                {t(`hire.interviews.view.${label}`)}
              </Link>
            ))}
          </div>
        )}
        {agenda && (
          <div className="flex items-center gap-2 max-lg:hidden">
            <Link
              href={hrefWith({ date: null })}
              className="inline-flex h-9 items-center rounded-pill bg-blanc px-4 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset"
            >
              {t("hire.interviews.today")}
            </Link>
            <Link
              href={hrefWith({ date: shift(-1) })}
              aria-label={t("hire.interviews.previous")}
              className="grid size-9 place-items-center rounded-full bg-blanc"
            >
              <Icon name="chev-l" className="size-4" />
            </Link>
            <Link
              href={hrefWith({ date: shift(1) })}
              aria-label={t("hire.interviews.next")}
              className="grid size-9 place-items-center rounded-full bg-blanc"
            >
              <Icon name="chev-r" className="size-4" />
            </Link>
            <p className="ml-1 text-[17px] font-semibold first-letter:uppercase">{range}</p>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <MenuChip
            group="interview-filter"
            align="right"
            summaryClassName={pillClass("dark", "sm")}
            summary={
              <>
                {t(`hire.interviews.filter.${filter}`)}
                <Icon name="chev-d" className="size-3.5" />
              </>
            }
          >
            {(["mine", "team"] as const).map((value) => (
              <Link
                key={value}
                href={hrefWith({ filtre: value === "team" ? "equipe" : null, entretien: null })}
                aria-current={filter === value ? "true" : undefined}
                className={cx(menuItem, "aria-[current=true]:font-semibold")}
              >
                {filter === value && <Icon name="check" />}
                {t(`hire.interviews.filter.${value}`)}
              </Link>
            ))}
          </MenuChip>
          {jobs.length > 0 && (
            <MenuChip
              group="interview-filter"
              align="right"
              className="max-sm:hidden"
              summaryClassName={pillClass(jobId ? "dark" : "outline", "sm")}
              summary={
                <>
                  <span className="max-w-40 truncate">
                    {jobs.find((job) => job.id === jobId)?.title ?? t("hire.interviews.filter.job")}
                  </span>
                  <Icon name="chev-d" className="size-3.5" />
                </>
              }
            >
              {jobId && (
                <Link href={hrefWith({ offre: null, entretien: null })} className={menuItem}>
                  {t("hire.talents.filter.job.none")}
                </Link>
              )}
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={hrefWith({ offre: job.id, entretien: null })}
                  aria-current={job.id === jobId ? "true" : undefined}
                  className={cx(menuItem, "aria-[current=true]:font-semibold")}
                >
                  {job.id === jobId && <Icon name="check" />}
                  <span className="truncate">{job.title}</span>
                </Link>
              ))}
            </MenuChip>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-5">
        <div className="flex min-w-0 flex-col gap-3">
          {interviews.length === 0 && !agenda ? (
            <EmptyState title={t("hire.interviews.empty.text")} />
          ) : agenda ? (
            <>
              {view === "mois" ? monthGrid : weekGrid}
              {dayList}
              <ul
                aria-label={t("hire.interviews.legend")}
                className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] max-lg:hidden"
              >
                {legend.map((status) => (
                  <li key={status} className="flex items-center gap-2">
                    <span aria-hidden className={cx("h-3.5 w-1 rounded-pill", tone[status].bar)} />
                    {t(`hire.interviews.status.${statusKey[status]}`)}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              {listGroup("a-venir", t("hire.interviews.upcoming"), upcoming)}
              {listGroup("en-attente", t("hire.interviews.waiting"), waiting)}
              {listGroup("passes", t("hire.interviews.past"), past)}
            </>
          )}
        </div>
        <aside className="flex flex-col gap-4">
          {planner}
          {detail ??
            (!candidature && (
              <p className="rounded-[24px] bg-blanc p-5 text-[14px] text-ardoise">
                {interviews.length === 0
                  ? t("hire.interviews.empty.text")
                  : t("hire.interviews.selectHint")}
              </p>
            ))}
          {prep}
          {toConfirm}
        </aside>
      </div>
    </div>
  );
}
