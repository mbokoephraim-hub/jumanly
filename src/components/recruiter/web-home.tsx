import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { PhoneIcon } from "@/components/phone/icon";
import { initialsOf } from "@/components/phone/recruteur/compte-initials";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { hirePermissions, type HireContext } from "@/server/services/hire";
import { webHome, webHomeAdmin } from "@/server/services/hire-web-home";
import { OrbiOpenLink } from "./web-home-orbi";
import { RemindButton, RequestButtons, TaskStepButton, WelcomeDialog } from "./web-home-actions";

const NEXT = { assigned: "accept", accepted: "start", in_progress: "finish" } as const;
const STATUS_TONE = {
  assigned: "rb-ambre-t",
  accepted: "rb-menthe-t",
  in_progress: "rb-menthe-t",
  done: "rb-lime-t",
} as const;

const Chevron = () => <PhoneIcon name="chevron" size={18} stroke={1.8} />;

/**
 * The recruiter's home on a computer (Modèle B, lot N1, captures 031, 032, 074, 075): the
 * greeting, four figures, then « Aujourd'hui », « À traiter », « Mes tâches », the offers and
 * « Orbi résume »; an administrator gets « À valider », the team's tasks and the month in figures.
 * Every row opens its page; the figures are the real ones.
 */
export async function RecruiterWebHome({
  ctx,
  firstName,
  org,
  welcome,
  now = new Date(),
}: {
  ctx: HireContext;
  firstName: string;
  org: { name: string; logo: string | null };
  welcome: boolean;
  now?: Date;
}) {
  const t = await getTranslations("rhWeb.home");
  const tt = await getTranslations("orgTeam");
  const tm = await getTranslations("myTasks");
  const format = await getFormatter();
  const permissions = hirePermissions(ctx.role);
  const admin = permissions.administer;
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [home, team, pdf] = await Promise.all([
    webHome(db, ctx, now),
    admin ? webHomeAdmin(db, ctx, now) : null,
    admin ? can(db, subject, "reports.export") : false,
  ]);
  const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  const date = capital(
    format.dateTime(now, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  );
  const short = (value: Date) =>
    capital(
      format.dateTime(value, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
    );
  const time = (value: Date) => format.dateTime(value, { hour: "numeric", minute: "2-digit" });

  const tiles = team
    ? [
        {
          value:
            team.seats.max < 0
              ? t("tiles.seatsUnlimited", { used: team.seats.used })
              : t("tiles.seats", { used: team.seats.used, max: team.seats.max }),
          label: t("tiles.seatsLine"),
          href: "/app/organisation/equipe",
        },
        {
          value: String(team.late),
          label: t("tiles.late", { count: team.late }),
          href: "/app/organisation/equipe?onglet=taches",
        },
        {
          value: String(team.requests.count),
          label: t("tiles.requests", { count: team.requests.count }),
          href: "/app/organisation/equipe?onglet=invitations",
        },
        team.renewal
          ? {
              value: format.dateTime(team.renewal, {
                day: "numeric",
                month: "short",
                timeZone: "UTC",
              }),
              label: t("tiles.renewal"),
              href: "/app/organisation/facturation",
            }
          : {
              value: t("tiles.free"),
              label: t("tiles.freeLine"),
              href: "/app/organisation/facturation",
            },
      ]
    : [
        {
          value: String(home.today.counts.unseen),
          label: t("tiles.applications", { count: home.today.counts.unseen }),
          href: "/app/hire/candidats",
        },
        {
          value: String(home.interviews.length),
          label: t("tiles.interviews", { count: home.interviews.length }),
          href: "/app/hire/entretiens?vue=jour",
        },
        {
          value: String(home.tasks.length),
          label: t("tiles.tasks", { count: home.tasks.length }),
          href: "/app/hire/taches",
        },
        {
          value: String(home.today.counts.unread),
          label: t("tiles.unread", { count: home.today.counts.unread }),
          href: "/app/messages",
        },
      ];

  const todo = [
    ...home.today.unseen.map((item) => ({
      key: item.id,
      title: t("todo.applied", { name: item.profile.user.name }),
      line: t("todo.appliedLine", {
        job: item.job.title,
        when: format.relativeTime(item.createdAt, now),
      }),
      href: `/app/hire/candidats/${item.id}`,
    })),
    ...(home.today.counts.unseen > home.today.unseen.length
      ? [
          {
            key: "more",
            title: t("todo.more", { count: home.today.counts.unseen - home.today.unseen.length }),
            line: t("todo.moreLine"),
            href: "/app/hire/candidats",
          },
        ]
      : []),
    ...(home.today.counts.invitations > 0
      ? [
          {
            key: "invitations",
            title: t("todo.invitations", { count: home.today.counts.invitations }),
            line: t("todo.invitationsLine"),
            href: "/app/hire/entretiens",
          },
        ]
      : []),
    ...(home.today.counts.scorecards > 0
      ? [
          {
            key: "scorecards",
            title: t("todo.scorecards", { count: home.today.counts.scorecards }),
            line: t("todo.scorecardsLine"),
            href: "/app/hire/entretiens",
          },
        ]
      : []),
    ...(home.today.counts.unread > 0
      ? [
          {
            key: "unread",
            title: t("todo.unread", { count: home.today.counts.unread }),
            line: t("todo.unreadLine"),
            href: "/app/messages",
          },
        ]
      : []),
  ];

  const orbi = team
    ? [
        team.late > 0 ? t("orbi.late", { count: team.late }) : null,
        t("orbi.team", { done: team.doneThisMonth }),
        t("orbi.decide"),
      ]
    : [
        t("orbi.interviews", { count: home.interviews.length }),
        home.best?.matchScore != null
          ? t("orbi.best", { name: home.best.profile.user.name, score: home.best.matchScore })
          : t("orbi.calm"),
        t("orbi.decide"),
      ];

  const offers = (
    <section className="rb-carte" aria-labelledby="rb-acc-offres">
      <div className="rb-carte-h">
        <h2 id="rb-acc-offres">{t("offers.title")}</h2>
        <Link href="/app/hire/offres" className="rb-lien">
          {t("offers.all")}
        </Link>
      </div>
      {home.offers.length === 0 ? (
        <p className="rb-vide">{t("offers.empty")}</p>
      ) : (
        home.offers.map((offer) => (
          <Link key={offer.id} href={`/app/hire/offres/${offer.id}`} className="rb-rowl">
            <span className="rb-rowl-t">
              <b>{offer.title}</b>
              <span className="rb-meta">
                {t("offers.line", {
                  count: offer.figures.applications,
                  fresh: offer.figures.unseen,
                })}
              </span>
            </span>
            <span
              className={cx("rb-etat", offer.status === "published" ? "rb-lime-t" : "rb-ambre-t")}
            >
              {t(`offers.status.${offer.status}`)}
            </span>
          </Link>
        ))
      )}
    </section>
  );

  const orbiCard = (
    <section className="rb-carte" aria-labelledby="rb-acc-orbi">
      <h2 id="rb-acc-orbi">{t("orbi.title")}</h2>
      <p className="rb-orbi-txt">{orbi.filter(Boolean).join(" ")}</p>
      <OrbiOpenLink label={t("orbi.open")} />
    </section>
  );

  return (
    <div className="rb-page">
      <div className="rb-acc-h">
        <div>
          <h1>{firstName ? t("hello", { name: firstName }) : t("helloNoName")}</h1>
          <p className="rb-meta">{t("line", { date, org: org.name })}</p>
        </div>
        <div className="rb-acc-act">
          {admin ? (
            <>
              <Link href="/app/organisation/equipe?inviter=1" className="rb-btn2 t-press">
                {t("invite")}
              </Link>
              <Link href="/app/organisation/equipe?attribuer=1" className="rb-btn t-press">
                <PhoneIcon name="plus" size={18} stroke={2.4} />
                {t("assign")}
              </Link>
            </>
          ) : (
            <Link href="/app/hire/entretiens" className="rb-btn2 t-press">
              <PhoneIcon name="agenda" size={18} stroke={1.8} />
              {t("agenda")}
            </Link>
          )}
        </div>
      </div>

      <div className="rb-g4" role="list" aria-label={t("tiles.aria")}>
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="rb-tuile" role="listitem">
            <b>{tile.value}</b>
            {tile.label}
          </Link>
        ))}
      </div>

      <div className="rb-acc">
        <div>
          {team ? (
            <>
              <section className="rb-carte" aria-labelledby="rb-acc-valider">
                <h2 id="rb-acc-valider">{t("validate.title")}</h2>
                {team.requests.count === 0 ? (
                  <p className="rb-vide">{t("validate.empty")}</p>
                ) : (
                  <>
                    {team.requests.joins.map((request) => (
                      <div key={request.id} className="rb-rowl">
                        <span aria-hidden className="rb-av-s">
                          {initialsOf(request.name)}
                        </span>
                        <span className="rb-rowl-t">
                          <b>{request.name}</b>
                          <span className="rb-meta">
                            {tt("requests.join", { domain: request.domain })}
                          </span>
                        </span>
                        <RequestButtons
                          kind="join"
                          id={request.id}
                          labels={{
                            no: tt("requests.refuse"),
                            yes: tt("requests.accept"),
                            noAria: tt("requests.refuseAria", { name: request.name }),
                            yesAria: tt("requests.acceptAria", { name: request.name }),
                          }}
                        />
                      </div>
                    ))}
                    {team.requests.declared.map((person) => (
                      <div key={person.experienceId} className="rb-rowl">
                        <span aria-hidden className="rb-av-s">
                          {initialsOf(person.name)}
                        </span>
                        <span className="rb-rowl-t">
                          <b>{person.name}</b>
                          <span className="rb-meta">
                            {tt("requests.declared", { org: org.name, title: person.title })}
                          </span>
                        </span>
                        <RequestButtons
                          kind="declared"
                          id={person.experienceId}
                          labels={{
                            no: tt("requests.notHere"),
                            yes: tt("requests.confirm"),
                            noAria: tt("requests.notHereAria", {
                              name: person.name,
                              org: org.name,
                            }),
                            yesAria: tt("requests.confirmAria", {
                              name: person.name,
                              org: org.name,
                            }),
                          }}
                        />
                      </div>
                    ))}
                  </>
                )}
              </section>
              <section className="rb-carte" aria-labelledby="rb-acc-equipe">
                <div className="rb-carte-h">
                  <h2 id="rb-acc-equipe">{t("teamTasks.title")}</h2>
                  <Link
                    href="/app/organisation/equipe?onglet=taches"
                    className="rb-btn2 rb-s t-press"
                  >
                    {t("teamTasks.all")}
                  </Link>
                </div>
                {team.teamTasks.length === 0 ? (
                  <p className="rb-vide">{t("teamTasks.empty")}</p>
                ) : (
                  team.teamTasks.map((task) => (
                    <div key={task.id} className="rb-rowl">
                      <span aria-hidden className="rb-av-s">
                        {initialsOf(task.assignee)}
                      </span>
                      <span className="rb-rowl-t">
                        <b>
                          {tt("task.line", {
                            kind: tt(`task.kind.${task.kind}`),
                            candidate: task.candidate,
                          })}
                        </b>
                        <span className="rb-meta">
                          {t("teamTasks.line", {
                            who: task.assignee.split(" ")[0] ?? task.assignee,
                            date: short(task.dueAt),
                          })}
                        </span>
                      </span>
                      <span
                        className={cx(
                          "rb-etat",
                          task.late ? "rb-ambre-t" : STATUS_TONE[task.status],
                        )}
                      >
                        {task.late ? tt("task.late") : tt(`task.status.${task.status}`)}
                      </span>
                      <RemindButton
                        taskId={task.id}
                        label={tt("task.remind")}
                        aria={tt("task.remindAria", { name: task.assignee })}
                      />
                    </div>
                  ))
                )}
              </section>
            </>
          ) : (
            <>
              <section className="rb-carte" aria-labelledby="rb-acc-jour">
                <h2 id="rb-acc-jour">{t("today.title")}</h2>
                {home.interviews.length === 0 ? (
                  <p className="rb-vide">{t("today.empty")}</p>
                ) : (
                  home.interviews.map((interview) => (
                    <Link
                      key={interview.id}
                      href={`/app/hire/entretiens/${interview.id}`}
                      className="rb-rowl"
                    >
                      <b className="rb-heure">
                        {interview.startsAt ? time(interview.startsAt) : ""}
                      </b>
                      <span
                        aria-hidden
                        className={cx("rb-barre-v", interview.mode === "audio" && "rb-ambre")}
                      />
                      <span className="rb-rowl-t">
                        <b>
                          {t("today.interview", { name: interview.application.profile.user.name })}
                        </b>
                        <span className="rb-meta">
                          {t("today.line", {
                            job: interview.application.job.title,
                            mode: t(`today.mode.${interview.mode}`),
                          })}
                        </span>
                      </span>
                      <Chevron />
                    </Link>
                  ))
                )}
              </section>
              <section className="rb-carte" aria-labelledby="rb-acc-traiter">
                <h2 id="rb-acc-traiter">{t("todo.title")}</h2>
                {todo.length === 0 ? (
                  <p className="rb-vide">{t("todo.empty")}</p>
                ) : (
                  todo.map((item) => (
                    <Link key={item.key} href={item.href} className="rb-rowl">
                      <span aria-hidden className="rb-puce" />
                      <span className="rb-rowl-t">
                        <b>{item.title}</b>
                        <span className="rb-meta">{item.line}</span>
                      </span>
                      <Chevron />
                    </Link>
                  ))
                )}
              </section>
            </>
          )}
        </div>
        <div>
          {team ? (
            <section className="rb-carte" aria-labelledby="rb-acc-mois">
              <div className="rb-carte-h">
                <h2 id="rb-acc-mois">
                  {t("month.title", {
                    month: capital(
                      format.dateTime(team.month.start, { month: "long", timeZone: "UTC" }),
                    ),
                  })}
                </h2>
                {pdf && (
                  <a
                    href="/app/hire/rapports/export?periode=30d"
                    className="rb-btn rb-s t-press"
                    aria-label={t("month.pdfAria")}
                  >
                    <PhoneIcon name="document" size={16} stroke={1.8} />
                    {t("month.pdf")}
                  </a>
                )}
              </div>
              <div className="rb-g2">
                <span className="rb-tuile">
                  <b>{team.month.applications}</b>
                  {t("month.applications", { count: team.month.applications })}
                </span>
                <span className="rb-tuile">
                  <b>{team.month.interviews}</b>
                  {t("month.interviews", { count: team.month.interviews })}
                </span>
                <span className="rb-tuile">
                  <b>{team.month.hires}</b>
                  {t("month.hires", { count: team.month.hires })}
                </span>
                <span className="rb-tuile">
                  <b>
                    {team.month.responseDays === null
                      ? t("month.delayNone")
                      : t("month.delayValue", { days: Math.round(team.month.responseDays) })}
                  </b>
                  {t("month.delay")}
                </span>
              </div>
            </section>
          ) : (
            <section className="rb-carte" aria-labelledby="rb-acc-taches">
              <div className="rb-carte-h">
                <h2 id="rb-acc-taches">{t("tasks.title")}</h2>
                <Link href="/app/hire/taches" className="rb-lien">
                  {t("tasks.all")}
                </Link>
              </div>
              {home.tasks.length === 0 ? (
                <p className="rb-vide">{t("tasks.empty")}</p>
              ) : (
                home.tasks.slice(0, 4).map((task) => {
                  const next = task.status === "done" ? null : NEXT[task.status];
                  const line = tt("task.line", {
                    kind: tt(`task.kind.${task.kind}`),
                    candidate: task.candidate,
                  });
                  return (
                    <div key={task.id} className="rb-rowl">
                      <span className="rb-rowl-t">
                        <b>{line}</b>
                        <span className="rb-meta">
                          {t("tasks.line", {
                            date: short(task.dueAt),
                            status: tt(`task.status.${task.status}`),
                          })}
                        </span>
                      </span>
                      {next && (
                        <TaskStepButton
                          taskId={task.id}
                          label={tm(next)}
                          aria={`${tm(next)} · ${line}`}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </section>
          )}
          {offers}
          {orbiCard}
        </div>
      </div>

      {welcome && (
        <WelcomeDialog
          title={firstName ? t("welcome.title", { name: firstName }) : t("welcome.titleNoName")}
          start={t("welcome.start")}
        >
          <span aria-hidden className="rb-mini">
            {org.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- a 64 px logo, already small
              <img src={org.logo} alt="" />
            ) : (
              initialsOf(org.name)
            )}
          </span>
          <h2>{firstName ? t("welcome.title", { name: firstName }) : t("welcome.titleNoName")}</h2>
          <p className="rb-meta">{t("welcome.line", { org: org.name })}</p>
          <div className="rb-g3">
            {(admin
              ? (["invite", "assign", "follow"] as const).map((key) => [
                  t(`welcome.admin.${key}`),
                  t(`welcome.admin.${key}Text`),
                ])
              : (["applications", "agenda", "mine"] as const).map((key) => [
                  t(`welcome.recruiter.${key}`),
                  t(`welcome.recruiter.${key}Text`),
                ])
            ).map(([title, text]) => (
              <div key={title}>
                <b>{title}</b>
                <span className="rb-meta">{text}</span>
              </div>
            ))}
          </div>
        </WelcomeDialog>
      )}
    </div>
  );
}
