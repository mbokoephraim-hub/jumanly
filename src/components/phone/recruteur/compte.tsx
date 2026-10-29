import "server-only";
import "@/styles/phone-onglets.css";
import "@/styles/phone-apropos.css";
import "@/styles/phone-entreprise.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { JoinRequestsCard } from "@/components/recruiter/org-join";
import { pickMessages } from "@/i18n/client-messages";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { rhRequestPlanAction, rhSaveProfileAction } from "@/server/actions/phone-rh-compte";
import { db } from "@/server/db";
import { audienceStats } from "@/server/services/audience";
import { authorFeed } from "@/server/services/feed";
import { recruiterBarCounts } from "@/server/services/hire-phone";
import { personProfile } from "@/server/services/person-profile";
import { ensureProfile, parseProfileLanguages } from "@/server/services/profile";
import { profileLanguageCodes } from "@/server/services/profile-view";
import type { HireContext } from "@/server/services/hire";
import {
  rhAccountHub,
  rhCompanyMode,
  rhPlan,
  rhPrivacy,
  rhRecruiterProfile,
  rhSavedPosts,
  rhStats,
  rhTeam,
} from "@/server/services/hire-phone-account";
import { listTemplates, templateKinds } from "@/server/services/message-templates";
import { RECRUITER_SWITCHES } from "@/server/services/notifications";
import { PhoneIcon } from "../icon";
import { feedWords } from "../fil/data";
import { sendTargetViews } from "../fil/server";
import { PersonProfile } from "../profil/profile";
import { AudienceStats } from "../profil/stats";
import { profileView, ProfileTexts } from "../profil/server";
import { languageLabel } from "../career/data";
import { sizeKeyOf } from "@/server/services/admin-signup";
import { RhBell } from "./head";
import { OwnLanguages } from "./own-languages";
import {
  RhCompteFrame,
  RhCompteHub,
  RhCompteRow,
  RhLeaveOrganization,
  RhNotificationSwitches,
  RhProfileEdit,
  RhProposeColleague,
  RhSavedList,
} from "./compte-client";
import { initialsOf } from "./compte-initials";

/** The only contact of Jumanly (CLAUDE.md § 8): by e-mail, never by phone. */
const CONTACT_EMAIL = "assistant@jumanly.io";
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
type Query = Record<string, string | string[] | undefined>;

/** The texts of Compte sent to the browser (only its own namespaces). */
export async function RhCompteTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["phoneRhCompte", "phone"])}>
      {children}
    </NextIntlClientProvider>
  );
}

/** The hub of Compte (planche Recruteur-compte) and the sheets 148, 185 and 186. */
export async function RhCompteScreen({ ctx }: { ctx: HireContext }) {
  const t = await getTranslations("phoneRhCompte");
  const hub = await rhAccountHub(db, ctx);
  const org = hub.org.name;
  const attached = hub.attachment.kind === "attached";
  const pageLine = hub.org.verifiedAt
    ? hub.admin
      ? t("row.pageVerified", { admin: hub.admin })
      : t("row.pageVerifiedNoAdmin")
    : hub.admin
      ? t("row.pageToVerify", { admin: hub.admin })
      : t("row.pageToVerifyNoAdmin");
  return (
    <RhCompteHub
      bell={<RhBell />}
      data={{
        name: hub.user.name,
        image: hub.user.image,
        initials: initialsOf(hub.user.name),
        orgInitials: initialsOf(org),
        orgLogo: hub.org.logo,
        org,
        orgId: ctx.organizationId,
        orgSlug: hub.org.slug,
        attached,
        card:
          hub.attachment.kind === "attached"
            ? t("card.attached", { org })
            : hub.attachment.kind === "pending"
              ? t("card.pending", { org: hub.attachment.org })
              : t("card.independent"),
        jobTitle: hub.jobTitle,
        admin: hub.admin,
        isAdmin: hub.isAdmin,
      }}
    >
      <h2 className="nb-rc-gr">{t("section.activity")}</h2>
      <RhCompteRow
        href="/app/hire/compte/profil"
        icon="lecture"
        title={t("row.profile")}
        line={t("row.profileLine")}
      />
      <RhCompteRow
        href="/app/hire/compte/statistiques"
        icon="echanger"
        title={t("row.stats")}
        line={t("row.statsLine")}
      />
      <RhCompteRow
        href="/app/fil/mes-publications"
        icon="document"
        title={t("row.posts")}
        line={t("row.postsLine")}
      />
      <RhCompteRow
        href="/app/hire/compte/enregistrees"
        icon="signet"
        title={t("row.saved")}
        line={t("row.savedLine", { count: hub.saved })}
      />
      <h2 className="nb-rc-gr">{org}</h2>
      <RhCompteRow
        href={`/app/entreprises/${hub.org.slug}`}
        icon="organisation"
        title={t("row.page")}
        line={pageLine}
      />
      <RhCompteRow
        href="/app/hire/compte/equipe"
        icon="talents"
        title={t("row.team")}
        line={t("row.teamLine", { count: hub.members })}
      />
      <RhCompteRow
        href="/app/hire/compte/formule"
        icon="document"
        title={t("row.plan")}
        line={
          hub.isAdmin
            ? t("row.planLineAdmin", { plan: hub.planName })
            : t("row.planLine", { plan: hub.planName })
        }
      />
      <h2 className="nb-rc-gr">{t("section.settings")}</h2>
      <RhCompteRow
        href="/app/hire/compte/notifications"
        icon="cloche"
        title={t("row.notifications")}
        line={t("row.notificationsLine")}
      />
      <RhCompteRow
        href="/app/hire/modeles"
        icon="messages"
        title={t("row.templates")}
        line={t("row.templatesLine")}
      />
      <RhCompteRow
        href="/app/hire/compte/confidentialite"
        icon="cadenas"
        title={t("row.privacy")}
        line={t("row.privacyLine")}
      />
      <RhCompteRow
        href="/app/hire/compte/langue"
        icon="fil"
        title={t("row.language")}
        line={t("row.languageLine")}
      />
      <RhCompteRow
        href="/app/hire/compte/aide"
        icon="email"
        title={t("row.help")}
        line={t("row.helpLine")}
      />
    </RhCompteHub>
  );
}

/**
 * « Mon profil » of a recruiter on the phone (Ephraïm 27/10/2026): the same profile as a talent's
 * (banner, ringed photo, networks, name, bio, flag, connections), with what a recruiter shows:
 * the post, « Recrute en ce moment », the candidate looked for. « Publications · À propos ·
 * Réalisations · Suivi »: each section has its pencil, « Suivi » is the recruiter's dashboard.
 * No portfolio, CV or applications.
 */
export async function RhProfileScreen({ ctx, query }: { ctx: HireContext; query: Query }) {
  const t = await getTranslations("phoneRhCompte");
  const tj = await getTranslations("jobs.search.remote");
  const now = new Date();
  // A member who never went through the recruiter's steps still has a recruiter profile here.
  await db.recruiterProfile.upsert({
    where: { userId: ctx.userId },
    create: { userId: ctx.userId },
    update: {},
  });
  const [data, person, posts, fil, targets, counts, talent] = await Promise.all([
    rhRecruiterProfile(db, ctx),
    personProfile(db, ctx.userId, ctx.userId, "candidate"),
    authorFeed(db, ctx.userId, { userId: ctx.userId }),
    feedWords(ctx.userId, now),
    sendTargetViews(ctx.userId),
    recruiterBarCounts(db, ctx),
    ensureProfile(db, ctx.userId),
  ]);
  const audience = await audienceStats(db, ctx.userId, now);
  if (!person) notFound();
  const view = await profileView(person, { now });
  const known = parseProfileLanguages(talent.languages);
  const received = data.jobs.reduce((sum, job) => sum + job.applications, 0);
  const tiles = [
    { label: t("follow.offers"), value: data.jobs.length, href: "/app/hire/offres" },
    { label: t("follow.received"), value: received, href: "/app/hire/candidatures" },
    { label: t("follow.new"), value: counts.newApplications, href: "/app/hire/candidatures" },
  ];
  return (
    <ProfileTexts extra={["phoneCareer"]}>
      {one(query.ok) === "1" ? <ToastOnLoad message={t("edit.saved")} tone="success" /> : null}
      <PersonProfile
        person={view}
        posts={posts.map(fil.post)}
        targets={targets}
        title={t("profile.title")}
        back="/app/hire/compte"
        actions={
          <div className="nb-cr-actions nb-rs-actions">
            <Link href="/app/career/profil" className="nb-cr-bt" data-creme="">
              <PhoneIcon name="modifier" size={15} stroke={2.2} />
              {t("profile.editHead")}
            </Link>
            <Link href="/app/hire/compte/profil/modifier" className="nb-cr-bt">
              {t("profile.editHiring")}
            </Link>
            <Link
              href={`/app/personnes/${ctx.userId}?apercu=1`}
              className="nb-cr-bt nb-cr-oeil"
              aria-label={t("profile.seeAsOthers")}
            >
              <PhoneIcon name="profil" size={17} stroke={2} />
            </Link>
          </div>
        }
        own={{
          edits: {
            about: "/app/career/profil/apropos",
            seeking: "/app/hire/compte/profil/modifier#recherche",
            experience: "/app/career/profil/experience/nouvelle",
            education: "/app/career/profil/formation/nouvelle",
            projects: "/app/career/portfolio/nouvelle",
            languages: (
              <OwnLanguages
                label={t("profile.languagesEdit")}
                choices={{
                  skills: [],
                  languages: [
                    ...new Set([
                      ...known.map((item) => item.code),
                      ...profileLanguageCodes.slice(0, 8),
                    ]),
                  ].map((code) => ({
                    code,
                    label: languageLabel(code),
                    on: known.some((item) => item.code === code),
                  })),
                  places: [
                    ...new Set([
                      ...talent.desiredLocations,
                      ...(data.city ? [data.city] : []),
                      ...data.otherCities,
                    ]),
                  ].map((name) => ({ name, on: talent.desiredLocations.includes(name) })),
                }}
              />
            ),
          },
          account: { href: "/app/hire/compte", label: t("profile.account") },
          stats: <AudienceStats figures={audience} />,
          suivi: (
            <>
              <h2 className="nb-pf-h" data-loin="">
                {t("follow.title")}
              </h2>
              <ul className="nb-rs-tuiles">
                {tiles.map((tile) => (
                  <li key={tile.label}>
                    <Link href={tile.href}>
                      <b>{tile.value}</b>
                      <small>{tile.label}</small>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/app/hire/compte/statistiques" className="nb-ca-it nb-rs-stats">
                <span>
                  {t("follow.stats")}
                  <small>{t("follow.statsHint")}</small>
                </span>
                <PhoneIcon name="chevron" size={18} />
              </Link>
              <h2 className="nb-pf-h" data-loin="">
                {t("profile.offers")}
              </h2>
              {data.jobs.length === 0 ? <p className="nb-pf-vide">{t("profile.noOffer")}</p> : null}
              {data.jobs.map((job) => (
                <Link key={job.id} href={`/app/hire/offres/${job.id}`} className="nb-rc-offre">
                  <span className="nb-rc-t">
                    <b>{job.title}</b>
                    <small>
                      {t("profile.offerLine", {
                        city: job.remote === "remote" ? `${job.city} · ${tj("full")}` : job.city,
                        count: job.applications,
                      })}
                    </small>
                  </span>
                  <PhoneIcon name="chevron" size={18} />
                </Link>
              ))}
              <h2 className="nb-pf-h" data-loin="">
                {t("profile.contacts")}
              </h2>
              <p className="nb-rc-mail">{data.workEmail}</p>
              <p className="nb-rc-note">
                {t(`profile.contactsFor.${data.contactsFor}` as "profile.contactsFor.interview")}
              </p>
            </>
          ),
        }}
      />
    </ProfileTexts>
  );
}

/** « Modifier mon profil » (planche Recruteur-compte-modifier). */
export async function RhProfileEditScreen({ ctx, query }: { ctx: HireContext; query: Query }) {
  const t = await getTranslations("phoneRhCompte");
  const data = await rhRecruiterProfile(db, ctx);
  const domains = data.domains.slice(0, 3).map((domain) => domain.toLowerCase());
  const orbi =
    domains.length > 0
      ? t("edit.orbiText", { domains: domains.join(" et "), org: data.org.name })
      : t("edit.orbiTextNoDomain", { org: data.org.name });
  return (
    <RhCompteFrame title={t("edit.title")} back="/app/hire/compte/profil" backText={t("edit.back")}>
      <RhProfileEdit
        action={rhSaveProfileAction}
        error={one(query.erreur) === "1"}
        orbi={orbi}
        initial={{
          headline: data.headline ?? "",
          bioSource: data.bioSource,
          hiringNow: data.hiringNow,
          contactsFor: data.contactsFor,
          seeking: data.seeking,
        }}
        company={
          <>
            <Link href={`/app/entreprises/${data.org.slug}`} className="nb-rc-bloc nb-rc-ent">
              <span className="nb-rc-ini nb-rc-ini-o nb-rc-ini-m" aria-hidden>
                {initialsOf(data.org.name)}
              </span>
              <span className="nb-rc-t">
                <b>{data.org.name}</b>
                <small data-lime="">
                  {data.admin
                    ? t("edit.companyAcceptedBy", { admin: data.admin })
                    : t("edit.companyAccepted")}
                </small>
              </span>
              <PhoneIcon name="chevron" size={18} />
            </Link>
            <p className="nb-rc-note">{t("edit.companyNote", { org: data.org.name })}</p>
          </>
        }
      />
    </RhCompteFrame>
  );
}

/** « Mes statistiques » (planche Recruteur-compte-stats). */
export async function RhStatsScreen({ ctx }: { ctx: HireContext }) {
  const t = await getTranslations("phoneRhCompte.stats");
  const stats = await rhStats(db, ctx);
  const top = Math.max(1, stats.received);
  return (
    <RhCompteFrame title={t("title")} sub={t("line")}>
      <div className="nb-rc-chiffres">
        <p>
          <b>{stats.received}</b>
          <small>{t("received")}</small>
        </p>
        <p>
          <b>
            {stats.delayDays === null ? t("delayNone") : t("delayValue", { days: stats.delayDays })}
          </b>
          <small>{t("delay")}</small>
        </p>
        <p>
          <b>{t("percent", { percent: stats.answeredPercent })}</b>
          <small>{t("answered")}</small>
        </p>
        <p>
          <b>{stats.interviews}</b>
          <small>{t("interviews")}</small>
        </p>
      </div>
      <section className="nb-rc-sec" aria-labelledby="rc-entonnoir">
        <h2 id="rc-entonnoir">{t("funnel")}</h2>
        <ul className="nb-rc-barres">
          {stats.funnel.map((step) => (
            <li key={step.phase}>
              <span>{t(`phase.${step.phase}`)}</span>
              <span className="nb-rc-jauge" aria-hidden>
                <i style={{ width: `${Math.max(3, (step.count / top) * 100)}%` }} />
              </span>
              <b>{step.count}</b>
            </li>
          ))}
        </ul>
      </section>
      {stats.waitingPercent > 0 ? (
        <Link href="/app/hire/candidats?vue=decisions" className="nb-rc-offre nb-rc-filet">
          <span className="nb-rc-t">
            <b>{t("waiting", { percent: stats.waitingPercent })}</b>
            <small>{t("waitingLine")}</small>
          </span>
          <PhoneIcon name="chevron" size={18} />
        </Link>
      ) : null}
      <p className="nb-rc-note">{t("note")}</p>
    </RhCompteFrame>
  );
}

/** « Publications enregistrées » (planche Recruteur-compte-enregistres). */
export async function RhSavedScreen({ ctx }: { ctx: HireContext }) {
  const t = await getTranslations("phoneRhCompte.saved");
  const rows = await rhSavedPosts(db, ctx.userId);
  return (
    <RhCompteFrame title={t("title")}>
      <RhSavedList rows={rows} />
    </RhCompteFrame>
  );
}

const ROLE_KEY = {
  org_owner: "admin",
  org_admin: "admin",
  recruiter: "recruiter",
  hiring_manager: "manager",
  viewer: "viewer",
  partner_manager: "viewer",
} as const;

/** « Équipe de recrutement » (planches Recruteur-equipe et -proposer). */
export async function RhTeamScreen({ ctx, query }: { ctx: HireContext; query: Query }) {
  const t = await getTranslations("phoneRhCompte.team");
  const team = await rhTeam(db, ctx);
  const ok = one(query.ok);
  const error = one(query.erreur);
  const sheetText = team.isAdmin
    ? t("sheetTextAdmin", { seats: team.seatsLeft, plan: team.planName })
    : team.admin
      ? t("sheetText", { admin: team.admin, seats: team.seatsLeft, plan: team.planName })
      : t("sheetTextNoAdmin");
  const roles = [...new Set(team.rows.map((row) => ROLE_KEY[row.role]))];
  return (
    <RhCompteFrame
      title={t("title")}
      sub={
        team.seats.max < 0
          ? t("lineUnlimited", { org: team.org, count: team.rows.length })
          : t("line", { org: team.org, count: team.rows.length, max: team.seats.max })
      }
      footer={
        <RhProposeColleague
          label={team.isAdmin ? t("invite") : t("propose")}
          text={sheetText}
          submit={team.isAdmin ? t("sendInvite") : t("send")}
          placeholder={t("emailPlaceholder")}
        />
      }
    >
      {ok === "proposed" || ok === "invited" ? (
        <ToastOnLoad message={t(`ok.${ok}`)} tone="success" />
      ) : null}
      {error === "email" || error === "seats" || error === "member" || error === "trop" ? (
        <ToastOnLoad message={t(`error.${error}`)} tone="error" />
      ) : null}
      <ul className="nb-rc-liste" aria-label={t("title")}>
        {team.rows.map((row) => {
          const role = ROLE_KEY[row.role];
          const detail =
            role === "admin"
              ? t("adminLine")
              : role === "recruiter"
                ? t("follows", { count: row.files })
                : t("files", { count: row.files });
          return (
            <li key={row.userId} className="nb-rc-membre">
              <span className="nb-rc-ini nb-rc-ini-m" data-role={role} aria-hidden>
                {initialsOf(row.name)}
              </span>
              <span className="nb-rc-t">
                <b>{row.me ? t("you", { name: row.name }) : row.name}</b>
                <small>{[row.jobTitle, detail].filter(Boolean).join(" · ")}</small>
              </span>
              <em data-role={role}>{t(`role.${role}`)}</em>
            </li>
          );
        })}
      </ul>
      <section className="nb-rc-sec" aria-labelledby="rc-qui">
        <h2 id="rc-qui">{t("who")}</h2>
        <dl className="nb-rc-roles">
          {(["admin", "recruiter", "manager", "viewer"] as const)
            .filter((role) => role === "admin" || roles.includes(role))
            .map((role) => (
              <div key={role}>
                <dt>{t(`role.${role}`)}</dt>
                <dd>
                  {t(
                    `who${role === "admin" ? "Admin" : role === "recruiter" ? "Recruiter" : role === "manager" ? "Manager" : "Viewer"}`,
                  )}
                </dd>
              </div>
            ))}
        </dl>
      </section>
      <p className="nb-rc-note">
        {team.isAdmin
          ? t("noteAdmin")
          : team.admin
            ? t("note", { admin: team.admin })
            : t("noteNoAdmin")}
      </p>
    </RhCompteFrame>
  );
}

/** « Formule et usage » (planche Recruteur-formule): read only. */
export async function RhPlanScreen({ ctx, query }: { ctx: HireContext; query: Query }) {
  const t = await getTranslations("phoneRhCompte.plan");
  const plan = await rhPlan(db, ctx);
  const price = (cents: number | null) =>
    cents === null ? t("priceQuote") : cents === 0 ? t("priceFree") : formatUsd(cents);
  const head =
    plan.priceCents === null
      ? t("priceQuote")
      : plan.priceCents === 0
        ? t("priceFree")
        : t("price", { price: formatUsd(plan.priceCents) });
  return (
    <RhCompteFrame
      title={t("title")}
      footer={
        plan.next && !plan.isAdmin ? (
          <form action={rhRequestPlanAction}>
            <input type="hidden" name="plan" value={plan.next.code} />
            <button type="submit" className="nb-bouton" data-large="" data-plein="">
              {plan.admin
                ? t("ask", { plan: plan.next.name, admin: plan.admin.split(" ")[0]! })
                : t("askNoAdmin", { plan: plan.next.name })}
            </button>
          </form>
        ) : null
      }
    >
      {one(query.ok) === "asked" ? <ToastOnLoad message={t("asked")} tone="success" /> : null}
      <div className="nb-rc-formule">
        <small>{t("of", { org: plan.org })}</small>
        <b>{plan.planName}</b>
        <p>
          {plan.paidUntil && plan.priceCents
            ? `${head} · ${t("paidUntil", { date: formatDate(plan.paidUntil) })}`
            : head}
        </p>
        <p>
          {plan.isAdmin
            ? t("managedByYou")
            : plan.admin
              ? t("managedBy", { admin: plan.admin })
              : t("managedByNoAdmin")}
        </p>
      </div>
      <section className="nb-rc-sec" aria-labelledby="rc-usage">
        <h2 id="rc-usage">{t("usage")}</h2>
        <ul className="nb-rc-usages">
          {plan.usage.map((item) => (
            <li key={item.key}>
              <span>{t(item.key)}</span>
              <b>
                {item.limit < 0
                  ? t("valueUnlimited", { used: item.used })
                  : t("value", { used: item.used, limit: item.limit })}
              </b>
              <span className="nb-rc-jauge" aria-hidden>
                <i
                  style={{
                    width: `${item.limit <= 0 ? (item.limit < 0 ? 4 : 0) : Math.min(100, (item.used / item.limit) * 100)}%`,
                  }}
                />
              </span>
            </li>
          ))}
        </ul>
      </section>
      {plan.plans.length > 0 ? (
        <section className="nb-rc-sec" aria-labelledby="rc-comparer">
          <h2 id="rc-comparer">{t("compare")}</h2>
          <ul className="nb-rc-formules">
            {plan.plans.map((item) => (
              <li key={item.code} data-actuelle={item.current ? "" : undefined}>
                <b>{item.name}</b>
                <span>
                  {item.priceCents
                    ? t("perMonth", { price: price(item.priceCents) })
                    : price(item.priceCents)}
                </span>
                <small>
                  {[
                    t("lineSeats", { count: item.seats }),
                    t("lineOffers", { count: item.offers }),
                  ].join(" · ")}
                </small>
                {item.current ? <em>{t("current")}</em> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {plan.isAdmin ? <p className="nb-rc-note">{t("adminNote")}</p> : null}
    </RhCompteFrame>
  );
}

/** « Modèles de messages » (planche Recruteur-parametres): read on the phone, written on a computer. */
export async function RhTemplatesScreen({ ctx }: { ctx: HireContext }) {
  const t = await getTranslations("phoneRhCompte.templates");
  const kinds = await getTranslations("rhThread.templates.kind");
  const lines = await getTranslations("rhThread.templates.line");
  const tt = await getTranslations("hire.templates");
  const [templates, organization] = await Promise.all([
    listTemplates(db, ctx),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true },
    }),
  ]);
  const rows = templateKinds.flatMap((kind) => {
    const own = templates.filter((template) => template.kind === kind);
    if (own.length > 0)
      return own.map((template) => ({
        key: template.id,
        title: template.title,
        line: t("own", { org: organization.name }),
        body: template.body,
      }));
    // Acceptation and refusal are written from the decision's screen, with care.
    if (kind === "acceptation" || kind === "refus")
      return [{ key: kind, title: kinds(kind), line: t("decision"), body: lines(kind) }];
    return [
      {
        key: kind,
        title: kinds(kind),
        line: t("jumanly"),
        body: tt(`default.${kind}.body`, {
          firstName: "{firstName}",
          jobTitle: "{jobTitle}",
          company: organization.name,
          signer: "{signer}",
        }).replaceAll("\\n", "\n"),
      },
    ];
  });
  return (
    <RhCompteFrame title={t("title")} sub={t("sub")}>
      {rows.map((row) => (
        <details key={row.key} className="nb-rc-modele">
          <summary className="nb-rc-offre">
            <span className="nb-rc-t">
              <b>{row.title}</b>
              <small>{row.line}</small>
            </span>
            <PhoneIcon name="chevron" size={18} />
          </summary>
          <p>{row.body}</p>
        </details>
      ))}
      <p className="nb-rc-note">{t("note")}</p>
    </RhCompteFrame>
  );
}

/** « Notifications » of the recruiter (planche Recruteur-compte-notifications). */
export async function RhNotificationsSettingsScreen({ ctx }: { ctx: HireContext }) {
  const t = await getTranslations("phoneRhCompte.notifs");
  const user = await db.user.findUniqueOrThrow({
    where: { id: ctx.userId },
    select: { notificationsMuted: true, notificationEmails: true },
  });
  const muted = new Set(user.notificationsMuted);
  return (
    <RhCompteFrame title={t("title")}>
      <RhNotificationSwitches
        initial={{
          categories: Object.fromEntries(RECRUITER_SWITCHES.map((key) => [key, !muted.has(key)])),
          emails: user.notificationEmails,
        }}
      />
    </RhCompteFrame>
  );
}

/** « Confidentialité et données » (planche Recruteur-compte-confidentialite). */
export async function RhPrivacyScreen({ ctx, query }: { ctx: HireContext; query: Query }) {
  const t = await getTranslations("phoneRhCompte.privacy");
  const data = await rhPrivacy(db, ctx);
  return (
    <RhCompteFrame title={t("title")}>
      {one(query.erreur) === "quitter" ? (
        <ToastOnLoad message={t("leaveError")} tone="error" />
      ) : null}
      <section className="nb-rc-sec" aria-labelledby="rc-journal">
        <h2 id="rc-journal">{t("log")}</h2>
        <p>{t("logText", { org: data.org })}</p>
        <p className="nb-rc-note">{t("logCount", { count: data.views })}</p>
      </section>
      <section className="nb-rc-sec" aria-labelledby="rc-partage">
        <h2 id="rc-partage">{t("share")}</h2>
        <p>{t("shareText")}</p>
        <Link href="/app/hire/compte/profil/modifier" className="nb-rc-lien">
          {t("shareLink")}
        </Link>
      </section>
      <section className="nb-rc-sec" aria-labelledby="rc-donnees">
        <h2 id="rc-donnees">{t("data")}</h2>
        <a
          href="/app/parametres/export"
          download
          className="nb-bouton"
          data-large=""
          data-contour=""
        >
          {t("dataLink")}
        </a>
      </section>
      <section className="nb-rc-sec" aria-labelledby="rc-quitter">
        <h2 id="rc-quitter">{t("leave", { org: data.org })}</h2>
        <p>{data.owner ? t("leaveOwner") : t("leaveText")}</p>
        {data.owner ? null : <RhLeaveOrganization org={data.org} />}
      </section>
    </RhCompteFrame>
  );
}

/** « Langue » (planche Recruteur-compte-langue): French today, English announced. */
export async function RhLanguageScreen() {
  const t = await getTranslations("phoneRhCompte.language");
  return (
    <RhCompteFrame title={t("title")}>
      <div role="radiogroup" aria-label={t("title")}>
        <p role="radio" aria-checked="true" className="nb-rc-bloc nb-rc-langue">
          <span className="nb-rc-t">
            <b>{t("fr")}</b>
            <small>{t("frLine")}</small>
          </span>
          <PhoneIcon name="coche" size={18} stroke={2.4} />
        </p>
        <p
          role="radio"
          aria-checked="false"
          aria-disabled="true"
          className="nb-rc-bloc nb-rc-langue"
        >
          <span className="nb-rc-t">
            <b lang="en">{t("en")}</b>
            <small>{t("enLine")}</small>
          </span>
        </p>
      </div>
    </RhCompteFrame>
  );
}

/** « Aide et contact » (planche Recruteur-aide): the questions, then the e-mail only. */
export async function RhHelpScreen({ ctx }: { ctx: HireContext }) {
  const t = await getTranslations("phoneRhCompte.help");
  const user = await db.user.findUniqueOrThrow({
    where: { id: ctx.userId },
    select: { email: true },
  });
  return (
    <RhCompteFrame title={t("title")}>
      {(["q1", "q2", "q3", "q4"] as const).map((key, index) => (
        <details key={key} className="nb-rc-modele nb-rc-faq">
          <summary className="nb-rc-offre">
            <b>{t(key)}</b>
            <PhoneIcon name="plus" size={16} />
          </summary>
          <p>{t(`a${index + 1}` as "a1")}</p>
        </details>
      ))}
      <section className="nb-rc-sec" aria-labelledby="rc-ecrire">
        <h2 id="rc-ecrire">{t("write")}</h2>
        <p className="nb-rc-note">{t("writeText", { email: user.email })}</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="nb-bouton" data-large="" data-plein="">
          {t("mail", { email: CONTACT_EMAIL })}
        </a>
        <p className="nb-rc-note">{t("direct", { email: CONTACT_EMAIL })}</p>
      </section>
    </RhCompteFrame>
  );
}

/**
 * « Agir au nom de l'entreprise » (planches Recruteur-mode-entreprise et -messages), for an
 * administrator only: the requests to join, the figures, the page's posts, then « Publier au
 * nom de … ». The page itself, the team and the plan change on a computer.
 */
export async function RhCompanyModeScreen({ ctx, query }: { ctx: HireContext; query: Query }) {
  const t = await getTranslations("phoneRhCompte.mode");
  const tc = await getTranslations("phoneRhCompte.company");
  const data = await rhCompanyMode(db, ctx);
  const te = await getTranslations("phoneRhEntreprise.card");
  const ts = await getTranslations("adminSignup.company");
  const org = data.org;
  const sizeKey = sizeKeyOf(org.size);
  const facts = [org.sector, org.city, sizeKey ? ts(`sizesLong.${sizeKey}`) : org.size].filter(
    Boolean,
  );
  const filled = [
    org.logo,
    org.banner,
    org.sector,
    org.size,
    org.city,
    org.website,
    org.description,
  ];
  const percent = Math.round((filled.filter(Boolean).length / filled.length) * 100);
  const tab = one(query.onglet);
  const current = tab === "messages" || tab === "offres" ? tab : "accueil";
  return (
    <div className="nb-page nb-rc nb-rc-mode" data-pied="">
      <header className="nb-rc-mode-h">
        <Link href="/app/hire/compte" className="nb-rc-rond" aria-label={t("back")}>
          <PhoneIcon name="retour" size={22} stroke={2} />
        </Link>
        <span className="nb-rc-ini nb-rc-ini-o nb-rc-ini-m" aria-hidden>
          {data.org.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- a small logo
            <img src={data.org.logo} alt="" />
          ) : (
            initialsOf(data.org.name)
          )}
        </span>
        <span className="nb-rc-t">
          <b>{t("title", { org: data.org.name })}</b>
          <small>{t("line")}</small>
        </span>
        <RhBell />
      </header>
      <nav className="nb-rc-onglets" aria-label={t("tabs.label")}>
        {(["accueil", "messages", "offres"] as const).map((key) => (
          <Link
            key={key}
            href={key === "accueil" ? "/app/hire/entreprise" : `/app/hire/entreprise?onglet=${key}`}
            aria-current={current === key ? "page" : undefined}
            replace
          >
            {t(`tabs.${key}`)}
          </Link>
        ))}
        <Link href={`/app/entreprises/${data.org.slug}`}>{t("tabs.publications")}</Link>
      </nav>
      {current === "accueil" ? (
        <>
          <section className="nb-ep-carte" aria-labelledby="ep-nom">
            <div className="nb-ep-carte-banniere">
              {org.banner ? (
                // eslint-disable-next-line @next/next/no-img-element -- the company's banner
                <img src={org.banner} alt="" />
              ) : null}
            </div>
            <div className="nb-ep-carte-corps">
              <span className="nb-ep-carte-logo" aria-hidden>
                {org.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a small logo
                  <img src={org.logo} alt="" />
                ) : (
                  initialsOf(org.name)
                )}
              </span>
              <h2 id="ep-nom">
                {org.name}
                {org.verifiedAt ? (
                  <span className="nb-ep-verifie" role="img" aria-label={te("verified")}>
                    <PhoneIcon name="coche" size={12} stroke={3} />
                  </span>
                ) : null}
              </h2>
              {facts.length > 0 ? <p className="nb-meta">{facts.join(" · ")}</p> : null}
              {org.hiringNow ? <span className="nb-ep-badge">{te("hiring")}</span> : null}
              <p className="nb-ep-apropos">{org.description || te("noAbout")}</p>
              {org.website ? (
                <a href={org.website} className="nb-ep-site" target="_blank" rel="noreferrer">
                  <PhoneIcon name="lien" size={15} />
                  {org.website.replace(/^https?:\/\//, "")}
                </a>
              ) : null}
              {percent < 100 ? (
                <div className="nb-ep-jauge">
                  <span>{te("complete", { percent })}</span>
                  <i aria-hidden>
                    <b style={{ width: `${percent}%` }} />
                  </i>
                </div>
              ) : null}
              <div className="nb-ep-carte-boutons">
                <Link
                  href="/app/hire/entreprise/profil"
                  className="nb-bouton"
                  data-large=""
                  data-plein=""
                >
                  {te("edit")}
                </Link>
                <Link
                  href={`/app/entreprises/${org.slug}`}
                  className="nb-bouton"
                  data-large=""
                  data-contour=""
                >
                  {te("view")}
                </Link>
              </div>
            </div>
          </section>
          <div className="nb-rc-demandes">
            <JoinRequestsCard ctx={ctx} answer={one(query.demande)} />
          </div>
          <div className="nb-rc-chiffres">
            <p>
              <b>{data.followers}</b>
              <small>{t("followers", { count: data.followers })}</small>
            </p>
            <p>
              <b>{data.activeJobs}</b>
              <small>{t("activeOffers", { count: data.activeJobs })}</small>
            </p>
            <p>
              <b>{data.applications}</b>
              <small>{t("applications")}</small>
            </p>
            <p>
              <b>{data.members}</b>
              <small>{t("members", { count: data.members })}</small>
            </p>
          </div>
          <p className="nb-rc-note">{t("adminNote")}</p>
        </>
      ) : (
        <section className="nb-rc-sec">
          <p>{current === "messages" ? t("messagesText") : t("offersText")}</p>
          <Link
            href={current === "messages" ? "/app/messages" : "/app/hire/offres"}
            className="nb-bouton"
            data-large=""
            data-contour=""
          >
            {current === "messages" ? t("messagesOpen") : t("offersOpen")}
          </Link>
        </section>
      )}
      <div className="nb-rc-pied">
        <Link
          href="/app/fil/publier?nom=entreprise"
          className="nb-bouton"
          data-large=""
          data-plein=""
        >
          {tc("publish", { org: data.org.name })}
        </Link>
      </div>
    </div>
  );
}
