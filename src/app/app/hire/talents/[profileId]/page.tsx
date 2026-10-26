import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { avatarTone, initialsOf, ScoreRing } from "@/components/recruiter/candidates";
import { PoolSheet } from "@/components/recruiter/pool-sheet";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { WhyCriteria } from "@/components/talent/offer-why";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { isPhone } from "@/server/view";
import { RhTalent } from "@/components/phone/recruteur/talent";
import { matchesForUser } from "@/server/matching/service";
import type { MatchExplanation } from "@/server/matching/types";
import { skillProofs } from "@/server/services/cv-analysis";
import { hirePermissions } from "@/server/services/hire";
import { cheapestPlanWhere, levelOf, listPublicPlans } from "@/server/services/plans";
import { listProjects } from "@/server/services/portfolio";
import {
  CONTACT_EXPIRY_DAYS,
  desiredContracts,
  poolChoices,
  viewTalentProfile,
} from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireTalents.profile");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const DAY = 86_400_000;

/**
 * A talent's profile seen by a recruiter (brief recruteur § 4 item 4, planche r2plus TPROF): what
 * the talent made visible, compared with one of the offers, with Orbi's points and the proof of
 * each skill. A summary until the talent applies or accepts a proposal; an anonymous talent's name
 * stays hidden until then. Every opening is logged (« Consultation enregistrée »).
 */
export default async function TalentProfilePage({
  params,
  searchParams,
}: PageProps<"/app/hire/talents/[profileId]">) {
  const [{ profileId }, query] = await Promise.all([params, searchParams]);
  const page = `/app/hire/talents/${profileId}`;
  const { ctx } = await requireHire(page, "readApplications");
  // On the recruiter's phone (Modèle B recruteur M6), the profile of planches 108 to 118.
  if (await isPhone()) return <RhTalent ctx={ctx} profileId={profileId} query={query} />;
  const t = await getTranslations("hireTalents.profile");
  const tc = await getTranslations("hireCandidates");
  const ui = await getTranslations("ui");
  const tp = await getTranslations("talent.profile");
  const tw = await getTranslations("hireWeb.profile");
  const format = await getFormatter();
  const now = new Date();
  const back = "/app/hire/candidats?vue=talents";
  const view = await viewTalentProfile(db, ctx, profileId, now);
  if (view.status === "notFound") notFound();
  if (view.status === "blocked") {
    return (
      <div className="t-flux">
        <FlowHead back={back} backLabel={t("back")} title={t("seo")} />
        <p className="t-gar t-err" role="alert">
          <TalentIcon name="cadenas" size="s" />
          <span>{t("blocked")}</span>
        </p>
      </div>
    );
  }
  const { profile } = view;
  const manage = hirePermissions(ctx.role).manage;
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const asked = one(query.offre);
  const [offers, matchingLevel, projects, certificates, hiddenProofs, pools, plans] =
    await Promise.all([
      db.job.findMany({
        where: { organizationId: ctx.organizationId, status: "published" },
        orderBy: { publishedAt: "desc" },
        take: 30,
        select: {
          id: true,
          title: true,
          skills: {
            select: { skillId: true, importance: true, skill: { select: { name: true } } },
          },
        },
      }),
      level(db, subject, "hire.matching.level") as Promise<"none" | "suggestions" | "explainable">,
      listProjects(db, profile.id),
      db.certificate.findMany({
        where: { onProfile: true, revokedAt: null, enrollment: { userId: profile.userId } },
        orderBy: { issuedAt: "desc" },
        select: { code: true, courseTitle: true, issuedAt: true },
      }),
      // An attestation the talent hid from their profile proves nothing here.
      db.certificate.findMany({
        where: { onProfile: false, enrollment: { userId: profile.userId } },
        select: { code: true },
      }),
      manage ? poolChoices(db, ctx, profile.id) : Promise.resolve(null),
      listPublicPlans(db),
    ]);
  const offer = offers.find((item) => item.id === asked) ?? offers[0] ?? null;
  let explanation: MatchExplanation | null = null;
  if (offer && matchingLevel !== "none" && profile.matchingEnabled) {
    const match = (await matchesForUser(db, profile.userId, [offer.id], now)).get(offer.id);
    if (match?.state === "ok") explanation = match.explanation;
  }
  const hidden = new Set(hiddenProofs.map((item) => `/attestations/${item.code}`));
  const skills = profile.skills.map((item) => ({
    ...item,
    verified: item.verified && !(item.proofUrl && hidden.has(item.proofUrl)),
  }));
  const proofs = offer ? skillProofs({ job: offer, profile: { skills } }) : [];
  const ordered = [...proofs].sort((a, b) => Number(b.required) - Number(a.required));
  const weak = (proof: string) => proof === "missing" || proof === "declared";
  const points = [
    ...ordered
      .filter((item) => !weak(item.proof))
      .slice(0, 2)
      .map((item) => ({ ok: true, text: t(`point.${item.proof}`, { skill: item.name }) })),
    ...ordered
      .filter((item) => weak(item.proof))
      .slice(0, 1)
      .map((item) => ({ ok: false, text: t(`point.${item.proof}`, { skill: item.name }) })),
  ];

  const title = view.anonymous
    ? t("anonymous", { headline: profile.headline || t("noHeadline") })
    : profile.user.name;
  const tpw = await getTranslations("hireWeb.proposals");
  const firstName = view.anonymous
    ? t("anonymousShort")
    : profile.user.firstName || profile.user.name.split(/\s+/)[0]!;
  const months = profile.experiences.reduce(
    (sum, item) =>
      sum +
      Math.max(0, ((item.endDate ?? now).getTime() - item.startDate.getTime()) / (30.44 * DAY)),
    0,
  );
  const years = Math.floor(months / 12);
  const proven = skills.filter((item) => item.verified || item.proof).length;
  // Projects the talent marked visible; none for an anonymous talent (they may say who it is).
  const shownProjects = view.anonymous ? [] : projects.filter((project) => project.visible);
  const contracts = profile.desiredContracts
    .filter((value) => (desiredContracts as readonly string[]).includes(value))
    .slice(0, 2) as (typeof desiredContracts)[number][];
  const conversation = view.contact?.conversationId ?? null;
  const pending = view.contact?.status === "pending";
  const poolPlan = cheapestPlanWhere(
    plans,
    ["rh", "company"],
    (plan) => plan.entitlements["hire.shortlist"] === "true",
  );
  const explainPlan = cheapestPlanWhere(
    plans,
    ["rh", "company"],
    (plan) => levelOf(plan, "hire.matching.level") === "explainable",
  );
  const monthYear = (date: Date) => format.dateTime(date, { month: "short", year: "numeric" });

  const ok = one(query.ok);
  const toast =
    ok === "proposee"
      ? t("ok.proposee", { days: CONTACT_EXPIRY_DAYS })
      : ok === "vivier"
        ? t("ok.vivier")
        : null;
  const erreur = one(query.erreur);
  const errorText =
    one(query.vivier) === "invalide"
      ? t("error.pool")
      : erreur === "forbidden"
        ? t("error.forbidden")
        : erreur
          ? t("error.other")
          : null;

  const actions = manage ? (
    <>
      <SheetButton target="ri-vivier" className="t-bt t-sec t-m t-press">
        <TalentIcon name="favori" size="s" />
        {t("pool")}
      </SheetButton>
      {conversation ? (
        <Link href={`/app/messages/${conversation}`} className="t-bt t-p t-m t-pl t-press">
          <TalentIcon name="message" size="s" />
          {t("write", { firstName })}
        </Link>
      ) : view.applied ? (
        <Link href="/app/hire/candidats" className="t-bt t-p t-m t-pl t-press">
          {t("seeApplication")}
        </Link>
      ) : pending ? (
        <span className="t-bt t-p t-m t-pl t-off" aria-disabled="true">
          {t("pending")}
        </span>
      ) : (
        <Link
          href={`${page}/proposer${offer ? `?offre=${offer.id}` : ""}`}
          className="t-bt t-p t-m t-pl t-press"
        >
          <TalentIcon name="envoyer" size="s" />
          {t("propose")}
        </Link>
      )}
    </>
  ) : null;

  return (
    <div className="t-flux t-ri-prof t-rw-tprof">
      {toast && <ToastOnLoad message={toast} tone="success" />}
      {/* Web recruiter lot 4 (planche « Proposition envoyée »): what follows, on a computer. */}
      {ok === "proposee" && (
        <div className="t-rw-web">
          <Sheet
            id="rw4-envoyee"
            title={tpw("sent.title", { name: firstName })}
            closeLabel={tpw("sent.close")}
            className="t-rw-ok4"
            defaultOpen
            head={
              <div className="t-rw-ok4-h" aria-hidden>
                <span className="t-rw-ok4-ic">
                  <TalentIcon name="envoyer" />
                </span>
                <b>{tpw("sent.title", { name: firstName })}</b>
              </div>
            }
          >
            <div className="t-flux t-serre t-rw-ok4-c">
              <p className="t-rw-ok4-s">{tpw("sent.text", { name: firstName })}</p>
              <ol className="t-rw-ok4-st">
                <li className="t-ok">
                  <b>{tpw("sent.step1")}</b>
                  <span>
                    {tpw("sent.step1Text", {
                      time: format.dateTime(now, { hour: "2-digit", minute: "2-digit" }),
                    })}
                  </span>
                </li>
                <li className="t-en">
                  <b>{tpw("sent.step2", { name: firstName })}</b>
                  <span>{tpw("sent.step2Text", { days: CONTACT_EXPIRY_DAYS })}</span>
                </li>
                <li>
                  <b>{tpw("sent.step3")}</b>
                  <span>{tpw("sent.step3Text")}</span>
                </li>
              </ol>
              <Link
                href="/app/hire/candidats?vue=propositions"
                className="t-bt t-p t-pl t-press t-rw-dk"
              >
                {tpw("sent.cta")}
              </Link>
            </div>
          </Sheet>
        </div>
      )}
      <Link href={back} className="t-rw-crumb t-rw-web">
        <TalentIcon name="suivant" size="xs" />
        {tw("crumb")}
      </Link>
      {/* Web: the cover, who, and the actions in one card (planche `.tpw`). */}
      <div className="t-verre t-rw-tpw">
        <div className="t-ri-cover" aria-hidden />
        <FlowHead
          back={back}
          backLabel={t("back")}
          end={
            manage ? (
              <SheetButton target="ri-plus" label={t("more")} className="t-bi t-press">
                <TalentIcon name="plus-options" size="s" />
              </SheetButton>
            ) : undefined
          }
        >
          <span aria-hidden />
        </FlowHead>

        <section className="t-ri-id" aria-labelledby="ri-nom">
          <span className={cx("t-rc-av t-l", avatarTone(profile.id))} aria-hidden>
            {view.anonymous ? "?" : initialsOf(profile.user.name)}
          </span>
          <h1 id="ri-nom">{title}</h1>
          <p>
            {[view.anonymous ? null : profile.headline, profile.user.city]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <ul className="t-ri-puces">
            {profile.availability !== "not_looking" && (
              <li className="t-ok">
                {t(profile.availability === "open" ? "available" : "listening")}
              </li>
            )}
            {contracts.map((contract) => (
              <li key={contract}>{tp(`preferences.contract.${contract}`)}</li>
            ))}
            <li className="t-log">
              <TalentIcon name="confidentialite" size="xs" />
              {t("logged")}
            </li>
          </ul>
        </section>
        {manage && (
          <nav aria-label={t("actions")} className="t-rw-acts t-rw-web">
            {actions}
            <SheetButton target="ri-plus" label={t("more")} className="t-bi t-press">
              <TalentIcon name="plus-options" size="s" />
            </SheetButton>
          </nav>
        )}
      </div>

      {errorText && (
        <p className="t-gar t-err" role="alert">
          <TalentIcon name="pourquoi" size="s" />
          <span>{errorText}</span>
        </p>
      )}

      <div className="t-rw-g t-rw-tp">
        <div className="t-rw-c">
          {offer && (
            <section aria-labelledby="ri-orbi" className="t-rc-orbi t-ri-orbi t-rw-o3">
              <div className="t-h">
                <OrbiMark size={30} />
                <div className="t-t">
                  <b id="ri-orbi">{t("orbi.title")}</b>
                  <span>
                    {t("orbi.sub", { title: offer.title })}{" "}
                    {offers.length > 1 && (
                      <SheetButton target="ri-offre" className="t-ri-lien t-press">
                        {t("orbi.change")}
                      </SheetButton>
                    )}
                  </span>
                </div>
                {explanation && (
                  <ScoreRing
                    score={explanation.score}
                    size="s"
                    text={ui("percent", { value: explanation.score })}
                    label={t("orbi.scoreAria", { score: explanation.score })}
                  />
                )}
              </div>
              {points.length > 0 ? (
                <ul className="t-rc-pts">
                  {points.map((point, index) => (
                    <li key={index}>
                      <i aria-hidden className={point.ok ? "t-v" : "t-a"}>
                        {point.ok ? "✓" : "!"}
                      </i>
                      <span>{point.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t("orbi.noSkills")}</p>
              )}
              {explanation ? (
                <div className="t-rc-liens">
                  <SheetButton target="ri-pourquoi" className="t-pq t-press">
                    <TalentIcon name="pourquoi" size="xs" />
                    {t("orbi.why")}
                  </SheetButton>
                </div>
              ) : (
                <p className="t-rc-note">
                  {!profile.matchingEnabled
                    ? t("orbi.optedOut")
                    : matchingLevel === "none"
                      ? t("orbi.noScore")
                      : t("orbi.incomplete")}
                </p>
              )}
            </section>
          )}
          {proofs.length > 0 && (
            <section aria-labelledby="ri-cpt" className="t-verre t-rc-cpt t-rw-o4">
              <div className="t-hh">
                <h2 id="ri-cpt">{t("skills.title")}</h2>
                <span>
                  {tc("skills.count", {
                    met: proofs.filter((item) => item.proof !== "missing").length,
                    total: proofs.length,
                  })}
                </span>
              </div>
              <ul>
                {proofs.map((item) => (
                  <li key={item.skillId}>
                    <b>
                      {item.required ? item.name : tc("skills.preferred", { skill: item.name })}
                    </b>
                    <span className={cx("t-pv", `t-${item.proof}`)}>
                      {item.proof === "certificate" && <TalentIcon name="certificat" size="xs" />}
                      {item.proof === "project" && <TalentIcon name="realisation" size="xs" />}
                      {tc(`skills.proof.${item.proof}`)}
                    </span>
                    {item.level > 0 && (
                      <span
                        className="t-lv"
                        role="img"
                        aria-label={tc("skills.level", { level: Math.min(4, item.level) })}
                      >
                        {[1, 2, 3, 4].map((step) => (
                          <i key={step} className={step <= item.level ? "t-on" : undefined} />
                        ))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {skills.length > 0 && (
            <section aria-labelledby="ri-toutes" className="t-ri-bloc t-rw-o5">
              <h2 id="ri-toutes">{t("skills.all")}</h2>
              <ul className="t-ri-tags">
                {skills.map((item) => (
                  <li key={item.skillId} className={cx("t-ri-tag", item.verified && "t-v")}>
                    {item.verified && <TalentIcon name="certificat" size="xs" />}
                    {item.skill.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {view.full && profile.summary && (
            <section aria-labelledby="ri-resume" className="t-ri-bloc t-rw-o6">
              <h2 id="ri-resume">{t("summary")}</h2>
              <p className="t-verre t-ri-texte">{profile.summary}</p>
            </section>
          )}
          {shownProjects.length > 0 && (
            <section aria-labelledby="ri-projets" className="t-ri-bloc t-rw-o7">
              <h2 id="ri-projets">{t("projects")}</h2>
              <ul className="t-ri-projets">
                {shownProjects.slice(0, 8).map((project) => (
                  <li key={project.id} className="t-verre">
                    <span className="t-cases t-g-accomp" aria-hidden>
                      <TalentIcon name="realisation" size="s" />
                    </span>
                    <b>{project.title}</b>
                    {view.full && project.context && <p>{project.context}</p>}
                    {project.skills.length > 0 && (
                      <span className="t-m">{project.skills.slice(0, 3).join(" · ")}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <div className="t-rw-c">
          <ul className="t-ri-stats t-rw-o1" aria-label={t("stats")}>
            <li>
              <b>{years}</b>
              <span>{t("stat.years", { count: years })}</span>
            </li>
            <li>
              <b>{proven}</b>
              <span>{t("stat.proven", { count: proven })}</span>
            </li>
            <li>
              <b>{shownProjects.length}</b>
              <span>{t("stat.projects", { count: shownProjects.length })}</span>
            </li>
            <li>
              <b>{certificates.length}</b>
              <span>{t("stat.certificates", { count: certificates.length })}</span>
            </li>
          </ul>

          {profile.experiences.length > 0 && (
            <section aria-labelledby="ri-exp" className="t-ri-bloc t-rw-o8">
              <h2 id="ri-exp">{t("experience")}</h2>
              <ul className="t-verre t-ri-chrono">
                {profile.experiences.map((item) => (
                  <li key={item.id}>
                    <b>{[item.title, item.company].filter(Boolean).join(" · ")}</b>
                    <span>
                      {[
                        monthYear(item.startDate),
                        item.endDate ? monthYear(item.endDate) : t("now"),
                      ].join(" – ")}
                    </span>
                    {item.description && <p>{item.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(profile.educations.length > 0 || certificates.length > 0) && (
            <section aria-labelledby="ri-form" className="t-ri-bloc t-rw-o9">
              <h2 id="ri-form">{t("education")}</h2>
              <ul className="t-verre t-ri-chrono">
                {certificates.map((item) => (
                  <li key={item.code}>
                    <b>
                      {item.courseTitle}
                      <span className="t-ri-jm">{t("jumanly")}</span>
                    </b>
                    <span>{monthYear(item.issuedAt)}</span>
                  </li>
                ))}
                {profile.educations.map((item) => (
                  <li key={item.id}>
                    <b>
                      {view.full
                        ? [item.degree, item.school].filter(Boolean).join(" · ")
                        : tp(`education.level.${item.level}`)}
                    </b>
                    {item.endYear && <span>{String(item.endYear)}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="t-rc-note t-rw-o2">
            {view.full
              ? view.applied
                ? t("note.applied")
                : t("note.full")
              : view.anonymous
                ? t("note.anonymous")
                : t("note.limited")}
          </p>
        </div>
      </div>

      {manage && (
        <nav aria-label={t("actions")} className="t-verre t-fort t-bas-f t-ri-bas t-rw-tel">
          {actions}
        </nav>
      )}

      {manage && (
        <PoolSheet
          id="ri-vivier"
          profileId={profile.id}
          back={page}
          pools={pools}
          lockedPlan={poolPlan?.name ?? null}
        />
      )}

      {manage && (
        <Sheet id="ri-plus" title={t("moreTitle")} closeLabel={t("close")}>
          <ul className="t-rc-offres">
            <li>
              <Link href="/app/hire/candidats?vue=propositions" className="t-press">
                <span className="t-t">
                  <b>{t("proposals")}</b>
                </span>
              </Link>
            </li>
            <li>
              <Link href="/app/hire/viviers" className="t-press">
                <span className="t-t">
                  <b>{t("pools")}</b>
                </span>
              </Link>
            </li>
          </ul>
          <p className="t-gar">
            <TalentIcon name="confidentialite" size="s" />
            <span>{t("guard")}</span>
          </p>
        </Sheet>
      )}

      {offers.length > 1 && (
        <Sheet id="ri-offre" title={t("orbi.changeTitle")} closeLabel={t("close")}>
          <ul className="t-rc-offres">
            {offers.map((item) => (
              <li key={item.id}>
                <Link
                  href={`${page}?offre=${item.id}`}
                  aria-current={item.id === offer?.id ? "page" : undefined}
                  className="t-press"
                >
                  <span className="t-t">
                    <b>{item.title}</b>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Sheet>
      )}

      {explanation && (
        <Sheet
          id="ri-pourquoi"
          title={tc("why.title", { score: explanation.score })}
          closeLabel={t("close")}
        >
          <WhyCriteria
            recruiter
            explanation={
              matchingLevel === "explainable"
                ? explanation
                : {
                    ...explanation,
                    criteria: explanation.criteria
                      .filter((item) => item.status === "met" || item.status === "partial")
                      .sort((a, b) => b.weight * b.value - a.weight * a.value)
                      .slice(0, 3),
                  }
            }
          />
          {matchingLevel !== "explainable" && explainPlan && (
            <p className="t-rc-note">{tc("why.more", { plan: explainPlan.name })}</p>
          )}
          <p className="t-gar">
            <TalentIcon name="confidentialite" size="s" />
            <span>{tc("why.excluded")}</span>
          </p>
        </Sheet>
      )}
    </div>
  );
}
