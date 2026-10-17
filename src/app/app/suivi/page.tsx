import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Character } from "@/components/brand/character";
import { Icon, type IconName } from "@/components/brand/icon";
import { InterviewItem } from "@/components/suivi/interview-item";
import { Alert, ButtonLink, CompanyLogo, Pressable } from "@/components/ui";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import {
  isClosedStatus,
  listApplications,
  talentStatus,
  type TalentApplicationStatus,
} from "@/server/services/applications";
import { openDrafts } from "@/server/services/application-draft";
import { listConversations } from "@/server/services/connect";
import { pendingDocumentRequests, talentInterviews } from "@/server/services/suivi";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.suivi");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const filters = ["tout", "candidatures", "entretiens", "messages"] as const;
type Filter = (typeof filters)[number];

const statusTone: Record<TalentApplicationStatus, string> = {
  sent: "bg-creme",
  viewed: "bg-menthe-claire",
  shortlisted: "bg-menthe-claire",
  test: "bg-lime-clair",
  interview: "bg-lime",
  offer: "bg-lime",
  hired: "bg-lime",
  notSelected: "bg-brume",
  withdrawn: "bg-brume",
  jobClosed: "bg-brume",
};

function Section({
  id,
  title,
  link,
  children,
}: {
  id: string;
  title: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-[19px] leading-tight font-semibold tracking-tight">
          {title}
        </h2>
        {link && (
          <Link
            href={link.href}
            className="flex min-h-11 items-center gap-1 text-[14px] font-semibold text-feuille-fonce"
          >
            {link.label}
            <Icon name="chev-r" className="size-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <ul className="flex flex-col overflow-hidden rounded-[22px] bg-blanc shadow-douce">
      {children}
    </ul>
  );
}

function IconRow({
  href,
  icon,
  title,
  line,
  action,
}: {
  href: string;
  icon: IconName;
  title: string;
  line: string;
  action?: string;
}) {
  return (
    <li className="border-b border-brume last:border-b-0">
      <Pressable href={href} arrow={!action} className="rounded-none! bg-transparent! shadow-none!">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-creme"
        >
          <Icon name={icon} className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[14.5px] leading-snug font-semibold">{title}</span>
          <span className="truncate text-[12.5px] text-ardoise">{line}</span>
        </span>
        {action && (
          <span className="ml-auto shrink-0 rounded-pill bg-blanc px-3.5 py-2 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset">
            {action}
          </span>
        )}
      </Pressable>
    </li>
  );
}

/**
 * Suivi (docs/ux-mobile-talent, prompts 2 and 5, screens 15, 16, 22 and 23): one place for what
 * follows an application. Filters Tout, Candidatures, Entretiens, Messages; what is urgent comes
 * first (an interview to confirm, a document asked, an unread message); empty states say what to
 * do next. Everything is real data of the talent.
 */
export default async function SuiviPage({ searchParams }: PageProps<"/app/suivi">) {
  const user = await requireUser("/app/suivi");
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  if (await getPartnerSpace(user.id)) redirect("/app/partenaire");
  const query = await searchParams;
  const filter: Filter = filters.includes(query.filtre as Filter)
    ? (query.filtre as Filter)
    : "tout";
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 80) : "";
  const t = await getTranslations("talent.suivi");
  const ts = await getTranslations("talent.jobs.applications.status");
  const tl = await getTranslations("connect.list.item");
  const format = await getFormatter();
  const now = new Date();
  const [interviews, documents, conversations, applications, drafts] = await Promise.all([
    talentInterviews(db, user.id, now),
    pendingDocumentRequests(db, user.id),
    listConversations(db, { userId: user.id }),
    listApplications(db, user.id),
    openDrafts(db, user.id, now),
  ]);
  const unread = conversations.filter((conversation) => conversation.unread);
  const waitingConversations = new Set(documents.map((request) => request.conversationId));
  const toConfirm = interviews.filter((interview) => interview.status === "pending");
  const counted = new Set([
    ...waitingConversations,
    ...toConfirm.flatMap((interview) =>
      interview.application.conversation ? [interview.application.conversation.id] : [],
    ),
  ]);
  const unreadOnly = unread.filter((conversation) => !counted.has(conversation.id));
  const statusOf = (application: (typeof applications)[number]) => talentStatus(application, now);
  // Open applications first, then the closed ones; newest first inside each group.
  const sortedApplications = [...applications].sort(
    (a, b) =>
      Number(isClosedStatus(statusOf(a))) - Number(isClosedStatus(statusOf(b))) ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const short = (date: Date) => format.dateTime(date, { day: "numeric", month: "short" });
  const timeOrDay = (date: Date) =>
    now.getTime() - date.getTime() < 86_400_000 && date.getDate() === now.getDate()
      ? format.dateTime(date, { hour: "2-digit", minute: "2-digit" })
      : short(date);
  const conversationName = (conversation: (typeof conversations)[number]) =>
    conversation.organization?.name ?? "";
  const shownConversations = search
    ? conversations.filter((conversation) =>
        [conversationName(conversation), conversation.application?.job.title ?? ""]
          .join(" ")
          .toLocaleLowerCase("fr")
          .includes(search.toLocaleLowerCase("fr")),
      )
    : conversations;

  const chip = (value: Filter) => {
    const label =
      value === "messages" && unread.length > 0
        ? t("filters.messagesCount", { count: unread.length })
        : t(`filters.${value}`);
    return (
      <li key={value}>
        <Link
          href={value === "tout" ? "/app/suivi" : `/app/suivi?filtre=${value}`}
          aria-current={filter === value ? "page" : undefined}
          className={cx(
            "flex h-11 shrink-0 items-center rounded-pill px-4.5 text-[14.5px] font-medium whitespace-nowrap",
            filter === value ? "bg-sapin text-blanc" : "bg-blanc text-sapin shadow-douce",
          )}
        >
          {label}
        </Link>
      </li>
    );
  };

  const applicationRow = (application: (typeof applications)[number]) => {
    const status = statusOf(application);
    const lastChange = application.events.at(-1)?.createdAt ?? application.createdAt;
    return (
      <li key={application.id} className="border-b border-brume last:border-b-0">
        <Pressable
          href="/app/jobs/candidatures"
          arrow={false}
          className="rounded-none! bg-transparent! shadow-none!"
        >
          <CompanyLogo name={application.job.organization.name} size="md" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[14.5px] leading-snug font-semibold">
              {application.job.title}
            </span>
            <span className="truncate text-[12.5px] text-ardoise">
              {status === "sent"
                ? t("applications.sent", { date: application.createdAt })
                : t("applications.changed", { date: lastChange })}
            </span>
          </span>
          <span
            className={cx(
              "ml-auto shrink-0 rounded-pill px-3 py-1.5 text-[12.5px] font-semibold",
              statusTone[status],
            )}
          >
            {ts(status)}
          </span>
        </Pressable>
      </li>
    );
  };

  const conversationRow = (conversation: (typeof conversations)[number]) => {
    const last = conversation.last;
    const mine = last?.senderId === user.id;
    const preview = !last
      ? ""
      : last.kind === "invitation"
        ? tl("invitation")
        : last.kind === "document_request"
          ? tl("documentRequest")
          : last.kind === "slot"
            ? tl("slot")
            : last.kind === "decision"
              ? tl("decision")
              : last.kind === "file"
                ? tl("attachment")
                : mine
                  ? tl("you", { message: last.body.slice(0, 120) })
                  : last.body.slice(0, 120);
    return (
      <li key={conversation.id} className="border-b border-brume last:border-b-0">
        <Link
          href={`/app/messages/${conversation.id}`}
          className="flex gap-3 px-4 py-3.5 hover:bg-creme/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sapin"
        >
          <CompanyLogo
            name={conversationName(conversation)}
            size="md"
            className="size-12! rounded-full!"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[15px] font-semibold">
                {conversationName(conversation)}
              </span>
              {last && (
                <span className="shrink-0 text-[12.5px] text-ardoise">
                  {timeOrDay(last.createdAt)}
                </span>
              )}
            </span>
            {conversation.application && (
              <span className="truncate text-[13px] text-feuille-fonce">
                {conversation.application.job.title}
              </span>
            )}
            <span
              className={cx(
                "truncate text-[13.5px]",
                conversation.unread ? "font-semibold" : "text-ardoise",
              )}
            >
              {preview}
            </span>
            {waitingConversations.has(conversation.id) && (
              <span className="mt-1 self-start rounded-pill bg-[#FCE9C4] px-2.5 py-0.5 text-[12px] font-semibold text-[#8A5A00]">
                {t("messages.waiting")}
              </span>
            )}
          </span>
          {conversation.unread && (
            <span className="mt-7 size-3 shrink-0 rounded-full bg-sapin">
              <span className="sr-only">{t("messages.unread")}</span>
            </span>
          )}
        </Link>
      </li>
    );
  };

  const empty = (kind: "candidatures" | "entretiens" | "messages") => (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <Character
        name={kind === "candidatures" ? "amani" : kind === "entretiens" ? "kofi" : "nadia"}
        pose={kind === "candidatures" ? "joie" : "repos"}
        height={150}
      />
      <p className="text-[21px] leading-tight font-semibold">{t(`empty.${kind}.title`)}</p>
      <p className="max-w-[340px] text-[14px] text-ardoise">{t(`empty.${kind}.text`)}</p>
      <ButtonLink
        href={
          kind === "candidatures"
            ? "/app/jobs"
            : kind === "entretiens"
              ? "/app/career/entretiens"
              : "/app/jobs"
        }
        variant="principal"
        size="L"
        icon={<Icon name={kind === "entretiens" ? "message" : "jobs"} />}
        className="mt-2"
      >
        {t(`empty.${kind}.cta`)}
      </ButtonLink>
      {kind === "candidatures" && (
        <Link href="/app/career/cv" className="text-[14.5px] font-semibold text-feuille-fonce">
          {t("empty.candidatures.secondary")}
        </Link>
      )}
    </div>
  );

  const confirmedSoon = interviews.find((interview) => interview.status === "confirmed");

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 pb-6">
      {/* On a phone the top bar already shows « Suivi ». */}
      <h1 className="text-[28px] font-semibold tracking-[-0.02em] max-md:sr-only">{t("title")}</h1>

      {query.ok === "confirme" && (
        <Alert
          tone="success"
          title={t("ok.confirmed", {
            company:
              interviews.find((interview) => interview.id === query.entretien)?.organization.name ??
              "",
          })}
        />
      )}
      {query.ok === "propose" && <Alert tone="success" title={t("ok.proposed")} />}
      {query.ok === "decline" && <Alert tone="success" title={t("ok.declined")} />}

      <nav aria-label={t("filters.label")}>
        <ul
          id="suivi-filtres"
          className="-mx-4 flex scroll-mt-4 gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
        >
          {filters.map(chip)}
        </ul>
      </nav>

      {filter === "tout" && (
        <>
          <Section id="suivi-a-traiter" title={t("todo.title")}>
            {toConfirm.length + documents.length + unreadOnly.length === 0 ? (
              <p className="rounded-[20px] bg-blanc p-4 text-[14px] text-ardoise shadow-douce">
                {t("todo.empty")}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {toConfirm.map((interview) => (
                  <InterviewItem key={interview.id} interview={interview} now={now} highlight />
                ))}
                {documents.map((request) => (
                  <Link
                    key={request.id}
                    href={`/app/messages/${request.conversationId}#dernier`}
                    className="flex items-center gap-3.5 rounded-[22px] bg-blanc p-4 ring-2 shadow-douce ring-[#F6D48A]"
                  >
                    <span
                      aria-hidden
                      className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-[#FCE9C4] text-[#8A5A00]"
                    >
                      <Icon name="doc" className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[12px] font-bold tracking-wide text-[#8A5A00] uppercase">
                        {t("todo.document")}
                      </span>
                      <span className="text-[15.5px] leading-snug font-semibold">
                        {request.name}
                      </span>
                      <span className="text-[13px] text-ardoise">
                        {[request.company, request.due && t("todo.due", { date: request.due })]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <Icon name="chev-r" className="size-5 shrink-0" />
                  </Link>
                ))}
                {unreadOnly.length > 0 && <List>{unreadOnly.map(conversationRow)}</List>}
              </div>
            )}
          </Section>

          <Section
            id="suivi-candidatures"
            title={t("applications.title")}
            link={
              applications.length > 0
                ? { href: "/app/suivi?filtre=candidatures", label: t("applications.all") }
                : undefined
            }
          >
            {applications.length === 0 ? (
              <div className="rounded-[22px] bg-blanc shadow-douce">{empty("candidatures")}</div>
            ) : (
              <List>{sortedApplications.slice(0, 3).map(applicationRow)}</List>
            )}
          </Section>

          {drafts.length > 0 && (
            <Section id="suivi-reprendre" title={t("resume.title")}>
              <List>
                {drafts.map((draft) => (
                  <IconRow
                    key={draft.job.slug}
                    href={`/app/jobs/${draft.job.slug}?postuler=1`}
                    icon="jobs"
                    title={t("resume.application", { job: draft.job.title })}
                    line={t("drafts.line", {
                      company: draft.job.organization.name,
                      date: draft.updatedAt,
                    })}
                    action={t("resume.cta")}
                  />
                ))}
              </List>
            </Section>
          )}

          <Section id="suivi-liens" title={t("links.title")}>
            <List>
              <IconRow
                href="/app/jobs/enregistrees"
                icon="favori"
                title={t("links.saved")}
                line={t("links.savedHint")}
              />
            </List>
          </Section>
        </>
      )}

      {filter === "candidatures" &&
        (applications.length === 0 ? (
          empty("candidatures")
        ) : (
          <Section
            id="suivi-candidatures"
            title={t("applications.title")}
            link={{ href: "/app/jobs/candidatures", label: t("applications.details") }}
          >
            <List>{sortedApplications.map(applicationRow)}</List>
          </Section>
        ))}

      {filter === "entretiens" &&
        (interviews.length === 0 ? (
          empty("entretiens")
        ) : (
          <>
            <Section id="suivi-entretiens" title={t("interviews.title")}>
              <div className="flex flex-col gap-3">
                {interviews.map((interview) => (
                  <InterviewItem
                    key={interview.id}
                    interview={interview}
                    now={now}
                    highlight={interview.status === "pending"}
                  />
                ))}
              </div>
            </Section>
            <Section id="suivi-preparer" title={t("prepare.title")}>
              <List>
                <IconRow
                  href="/app/career/entretiens"
                  icon="message"
                  title={t("prepare.simulation")}
                  line={t("prepare.simulationLine")}
                />
                {confirmedSoon && (
                  <IconRow
                    href={`/app/jobs/${confirmedSoon.application.job.slug}`}
                    icon="jobs"
                    title={t("prepare.offer")}
                    line={confirmedSoon.application.job.title}
                  />
                )}
              </List>
            </Section>
          </>
        ))}

      {filter === "messages" && (
        <>
          <form role="search" action="/app/suivi" className="relative">
            <input type="hidden" name="filtre" value="messages" />
            <label htmlFor="suivi-recherche" className="sr-only">
              {t("messages.search")}
            </label>
            <Icon
              name="recherche"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ardoise"
            />
            <input
              id="suivi-recherche"
              name="q"
              type="search"
              defaultValue={search}
              placeholder={t("messages.search")}
              className="h-14 w-full rounded-[20px] bg-blanc pr-4 pl-12 text-[15px] shadow-douce placeholder:text-ardoise focus-visible:outline-2 focus-visible:outline-sapin"
            />
          </form>
          {conversations.length === 0 ? (
            empty("messages")
          ) : shownConversations.length === 0 ? (
            <p className="rounded-[20px] bg-blanc p-4 text-[14px] text-ardoise shadow-douce">
              {t("messages.noResult")}
            </p>
          ) : (
            <List>{shownConversations.map(conversationRow)}</List>
          )}
          <p className="text-[13.5px] text-ardoise">{t("messages.who")}</p>
        </>
      )}
    </div>
  );
}
