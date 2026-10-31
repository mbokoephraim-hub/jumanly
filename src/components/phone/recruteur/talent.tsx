import "server-only";
import { notFound } from "next/navigation";
import { GoldVerifiedBadge } from "../badge-or";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { matchesForUser } from "@/server/matching/service";
import type { MatchExplanation } from "@/server/matching/types";
import { hirePermissions, type HireContext } from "@/server/services/hire";
import { rhAssignees } from "@/server/services/hire-phone-candidatures";
import { lastActive, rhProposals } from "@/server/services/hire-phone-talents";
import { listProjects } from "@/server/services/portfolio";
import { parseProfileLanguages } from "@/server/services/profile";
import {
  CONTACT_EXPIRY_DAYS,
  CONTACT_MESSAGE_MIN,
  poolChoices,
  viewTalentProfile,
} from "@/server/services/talent-search";
import { initialsOf, tintOf } from "./candidatures";
import { levelOf } from "./level";
import { RhTalentsTexts } from "./talents";
import { RhTalentProfile, type RhTalentData } from "./talents-client";

const DAY = 86_400_000;
/** The offers compared with the talent, newest first (the others are scored when proposed). */
const COMPARED = 5;

type Query = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * A talent's profile seen by a recruiter on the phone (planches 108 to 118). Opening it is logged
 * (`profile.view`, golden rule 5); a summary until the talent applies or accepts a proposal, an
 * anonymous talent's name hidden until then. The score is the fixed one of part 08, with its
 * « Pourquoi ? »; age, photo, nationality and family situation are never used nor shown.
 */
export async function RhTalent({
  ctx,
  profileId,
  query,
}: {
  ctx: HireContext;
  profileId: string;
  query: Query;
}) {
  const t = await getTranslations("phoneRhTalents");
  const tw = await getTranslations("phoneRhCandidatures");
  const tl = await getTranslations("talent.profile.languages");
  const format = await getFormatter();
  const now = new Date();
  const view = await viewTalentProfile(db, ctx, profileId, now);
  if (view.status === "notFound") notFound();
  if (view.status === "blocked") {
    return (
      <div className="nb-page nb-rh-detail">
        <p className="nb-erreur nb-rh-marge" role="alert">
          {t("profile.blocked")}
        </p>
      </div>
    );
  }
  const { profile } = view;
  const manage = hirePermissions(ctx.role).manage;
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [offers, matching, projects, certificates, hiddenProofs, pools, members, active, link] =
    await Promise.all([
      db.job.findMany({
        where: { organizationId: ctx.organizationId, status: "published" },
        orderBy: { publishedAt: "desc" },
        take: 20,
        select: { id: true, title: true },
      }),
      level(db, subject, "hire.matching.level"),
      view.anonymous ? Promise.resolve([]) : listProjects(db, profile.id),
      db.certificate.findMany({
        where: { onProfile: true, revokedAt: null, enrollment: { userId: profile.userId } },
        orderBy: { issuedAt: "desc" },
        select: { code: true, courseTitle: true, issuedAt: true },
      }),
      db.certificate.findMany({
        where: { onProfile: false, enrollment: { userId: profile.userId } },
        select: { code: true },
      }),
      manage ? poolChoices(db, ctx, profile.id) : Promise.resolve(null),
      rhAssignees(db, ctx),
      lastActive(db, ctx.userId, profile.userId),
      db.connection.findFirst({
        where: {
          OR: [
            { requesterId: ctx.userId, addresseeId: profile.userId },
            { requesterId: profile.userId, addresseeId: ctx.userId },
          ],
          status: { in: ["pending", "accepted"] },
        },
        select: { status: true },
      }),
    ]);

  // The score: the best of the newest offers, or the offer asked for (`?offre=`).
  const asked = one(query.offre);
  const compared = [
    ...offers.filter((offer) => offer.id === asked),
    ...offers.filter((offer) => offer.id !== asked).slice(0, COMPARED),
  ];
  const scores = new Map<string, MatchExplanation>();
  if (matching !== "none" && profile.matchingEnabled && compared.length > 0) {
    const states = await matchesForUser(
      db,
      profile.userId,
      compared.map((offer) => offer.id),
      now,
    );
    for (const [id, state] of states) if (state.state === "ok") scores.set(id, state.explanation);
  }
  const best =
    (asked ? compared.find((offer) => offer.id === asked && scores.has(offer.id)) : null) ??
    [...compared]
      .filter((offer) => scores.has(offer.id))
      .sort((a, b) => scores.get(b.id)!.score - scores.get(a.id)!.score)[0] ??
    null;
  const explanation = best ? scores.get(best.id)! : null;
  const explainable = matching === "explainable";

  const firstName = view.anonymous
    ? t("card.anonymous")
    : profile.user.firstName || profile.user.name.split(/\s+/)[0]!;
  const name = view.anonymous ? t("card.anonymous") : profile.user.name;
  const months = profile.experiences.reduce(
    (sum, item) =>
      sum +
      Math.max(0, ((item.endDate ?? now).getTime() - item.startDate.getTime()) / (30.44 * DAY)),
    0,
  );
  const years = Math.floor(months / 12);
  const city = profile.user.city;
  const elsewhere = profile.desiredLocations.find(
    (place) => !city || place.toLowerCase() !== city.toLowerCase(),
  );

  // Proposals of the organization to this talent: the last one, in words.
  const proposals = manage
    ? (await rhProposals(db, ctx, now)).filter((item) => item.profileId === profile.id)
    : [];
  const last = proposals[0] ?? null;
  const company = await db.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { name: true },
  });
  const sender = await db.user.findUnique({ where: { id: ctx.userId }, select: { name: true } });

  const hidden = new Set(hiddenProofs.map((item) => `/attestations/${item.code}`));
  const skills = profile.skills.map((item) => ({
    name: item.skill.name,
    verified: item.verified && !(item.proofUrl && hidden.has(item.proofUrl)),
  }));
  const interests = [...profile.sectors, ...profile.desiredJobTitles].slice(0, 6);
  const languageNames = new Intl.DisplayNames(["fr"], { type: "language" });
  const languages = parseProfileLanguages(profile.languages).map((item) => {
    let label = item.code;
    try {
      label = languageNames.of(item.code) ?? item.code;
    } catch {
      // An unknown code stays as written.
    }
    return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${item.cefr || tl(`level.${item.level}`)}`;
  });

  const duration = (start: Date, end: Date | null) => {
    const total = Math.max(
      0,
      Math.round(((end ?? now).getTime() - start.getTime()) / (30.44 * DAY)),
    );
    return t("profile.duration", { months: total, years: Math.floor(total / 12) });
  };

  const panels = {
    profil: (
      <>
        <section className="nb-rh-f-s">
          <h2>{t("profile.skills")}</h2>
          {skills.length === 0 ? (
            <p className="nb-meta">{t("profile.noSkills")}</p>
          ) : (
            <ul className="nb-rh-t-comp">
              {skills.map((skill) => (
                <li key={skill.name}>
                  <span>{skill.name}</span>
                  {skill.verified ? (
                    <GoldVerifiedBadge label={t("profile.verified")} small />
                  ) : (
                    <span className="nb-rh-t-preuve">{t("profile.declared")}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        {interests.length > 0 ? (
          <section className="nb-rh-f-s">
            <h2>{t("profile.interests")}</h2>
            <div className="nb-rh-etiq">
              {interests.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </section>
        ) : null}
        {languages.length > 0 ? (
          <section className="nb-rh-f-s">
            <h2>{t("profile.languages")}</h2>
            <p className="nb-meta">{languages.join(" · ")}</p>
          </section>
        ) : null}
        {view.full ? null : <p className="nb-meta nb-rh-f-s">{t("profile.summaryOnly")}</p>}
        <p className="nb-meta nb-rh-f-s">{t("profile.logged")}</p>
      </>
    ),
    parcours: (
      <>
        <section className="nb-rh-f-s">
          <h2>{t("profile.experience")}</h2>
          {profile.experiences.length === 0 ? (
            <p className="nb-meta">{t("profile.noExperience")}</p>
          ) : (
            <ul className="nb-rh-t-parcours">
              {profile.experiences.map((item) => (
                <li key={item.id}>
                  <b>{item.title}</b>
                  <span className="nb-meta">
                    {item.company
                      ? t("profile.expLine", {
                          company: item.company,
                          duration: duration(item.startDate, item.endDate),
                        })
                      : t("profile.expNoCompany", {
                          duration: duration(item.startDate, item.endDate),
                        })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="nb-rh-f-s">
          <h2>{t("profile.education")}</h2>
          {profile.educations.length === 0 ? (
            <p className="nb-meta">{t("profile.noEducation")}</p>
          ) : (
            <ul className="nb-rh-t-parcours">
              {profile.educations.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.endYear
                      ? t("profile.eduYear", {
                          degree: item.degree,
                          school: item.school,
                          year: item.endYear,
                        })
                      : t("profile.eduLine", { degree: item.degree, school: item.school })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <p className="nb-meta nb-rh-f-s">{t("profile.logged")}</p>
      </>
    ),
    realisations: (
      <>
        {projects.filter((project) => project.visible).length === 0 && certificates.length === 0 ? (
          <p className="nb-meta nb-rh-f-s">{t("profile.noWorks")}</p>
        ) : null}
        {projects.some((project) => project.visible) ? (
          <section className="nb-rh-f-s">
            <h2>{t("profile.projects")}</h2>
            <ul className="nb-rh-t-parcours">
              {projects
                .filter((project) => project.visible)
                .map((project) => (
                  <li key={project.id}>
                    <b>{project.title}</b>
                    {project.context ? (
                      <span className="nb-meta">
                        {project.context.length > 160
                          ? `${project.context.slice(0, 159)}…`
                          : project.context}
                      </span>
                    ) : null}
                  </li>
                ))}
            </ul>
          </section>
        ) : null}
        {certificates.length > 0 ? (
          <section className="nb-rh-f-s">
            <h2>{t("profile.certificates")}</h2>
            <ul className="nb-rh-t-parcours">
              {certificates.map((item) => (
                <li key={item.code}>
                  <a href={`/attestations/${item.code}`}>
                    {t("profile.certificate", {
                      course: item.courseTitle,
                      date: format.dateTime(item.issuedAt, { month: "short", year: "numeric" }),
                    })}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </>
    ),
  };

  const ok = one(query.ok);
  const toastKeys = ["vivier", "partage", "signale", "invitation"] as const;
  const toast =
    ok === "proposee"
      ? t("ok.proposee", { days: CONTACT_EXPIRY_DAYS })
      : (toastKeys.find((key) => key === ok) && t(`ok.${toastKeys.find((key) => key === ok)!}`)) ||
        null;
  const erreur = one(query.erreur);
  const errorKeys = ["quota", "locked", "pending", "cooldown", "blocked", "connected"] as const;
  const error = erreur
    ? erreur === "invalid"
      ? t("error.invalid", { min: CONTACT_MESSAGE_MIN })
      : t(`error.${errorKeys.find((key) => key === erreur) ?? "other"}`)
    : null;

  const conversation = view.contact?.conversationId ?? null;
  const pending = view.contact?.status === "pending";
  const scoreOf = (id: string) => scores.get(id)?.score ?? null;
  const messageFor = Object.fromEntries(
    offers.map((offer) => [
      offer.id,
      t("propose.default", {
        firstName,
        job: offer.title,
        sender: sender?.name ?? "",
        company: company?.name ?? "",
      }),
    ]),
  );

  const data: RhTalentData = {
    profileId: profile.id,
    userId: profile.userId,
    name,
    initials: view.anonymous ? "?" : initialsOf(profile.user.name),
    tint: tintOf(profile.id),
    line1: [profile.headline, t("card.years", { years })].filter(Boolean).join(" · "),
    line2: [city, active ? t("profile.active", { when: format.relativeTime(active, now) }) : null]
      .filter(Boolean)
      .join(" · "),
    mobility: elsewhere ? t("profile.mobility", { city: elsewhere }) : null,
    back: one(query.retour)?.startsWith("/app/hire/") ? one(query.retour)! : "/app/hire/talents",
    connect:
      profile.userId === ctx.userId
        ? "self"
        : link?.status === "accepted"
          ? "connected"
          : link
            ? "sent"
            : "none",
    score:
      explanation && best
        ? {
            label: tw("percent", { score: explanation.score }),
            value: explanation.score,
            band: t(`profile.match.${levelOf(explanation.score)}`),
            job: best.title,
          }
        : null,
    noOffer: offers.length === 0 ? t("profile.match.none") : null,
    why: explanation
      ? {
          title: tw("why.title", { score: explanation.score }),
          line: tw(`why.band.${explanation.band}`),
          rows: explainable
            ? explanation.criteria
                .filter((item) => item.status !== "not_applicable" && item.weight > 0)
                .map((item) => ({
                  label: tw(`why.criteria.${item.key}`),
                  value: tw("why.points", {
                    points: format.number(Math.round(item.value * item.weight * 10) / 10),
                    weight: item.weight,
                  }),
                  share: Math.max(0, Math.min(1, item.value)),
                }))
            : [],
          locked: explainable ? null : tw("why.locked"),
          notUsed: tw("why.notUsed"),
        }
      : null,
    proposalLine:
      last && last.state !== "accepted"
        ? t("profile.proposal", {
            job: last.jobTitle ?? t("proposals.noJob"),
            state: t(`proposals.state.${last.state}`).toLowerCase(),
          })
        : null,
    manage,
    primary: !manage
      ? null
      : conversation
        ? {
            kind: "link",
            label: t("profile.write", { name: firstName }),
            href: `/app/messages/${conversation}`,
          }
        : view.applied
          ? {
              kind: "link",
              label: t("profile.seeApplication"),
              href: "/app/hire/candidats?vue=toutes",
            }
          : pending
            ? { kind: "off", label: t("profile.pending") }
            : { kind: "propose" },
    offers: offers.map((offer) => ({ id: offer.id, title: offer.title, score: scoreOf(offer.id) })),
    offerDefault: best?.id ?? offers[0]?.id ?? null,
    messageFor,
    pools,
    members: members
      .filter((member) => member.id !== ctx.userId)
      .map((member) => ({
        id: member.id,
        name: member.name,
        initials: initialsOf(member.name),
        sub: member.title ?? "",
      })),
    pdfHref: `/app/hire/talents/${profile.id}/pdf`,
    error,
  };

  return (
    <RhTalentsTexts>
      {toast ? <ToastOnLoad message={toast} tone="success" /> : null}
      <RhTalentProfile data={data} panels={panels} />
    </RhTalentsTexts>
  );
}
