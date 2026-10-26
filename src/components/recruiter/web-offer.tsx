import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { JobSettings } from "@/components/hire/job-settings";
import { ModerationChanges } from "@/components/hire/moderation-changes";
import { PhoneIcon } from "@/components/phone/icon";
import { cx } from "@/lib/cx";
import { reopenJobAction } from "@/server/actions/hire";
import { pauseJobAction, resumeJobAction } from "@/server/actions/hire-offers";
import { db } from "@/server/db";
import { getOrgJob, hirePermissions, type HireContext } from "@/server/services/hire";
import { screeningQuestionsOf } from "@/server/services/hire-offers";
import { webOfferOverview } from "@/server/services/hire-web-offers";
import { contractFilterOf } from "@/server/services/jobs";
import { publicJobUrl } from "./offers";
import { CloseOfferButton, ShareOfferButton } from "./web-offer-actions";
import { STATUS_TONE } from "./web-offers";

export const OFFER_TABS = ["apercu", "annonce", "equipe"] as const;
export type OfferTab = (typeof OFFER_TABS)[number];

/**
 * An offer of the recruiter on a computer (Modèle B, lot N2, captures 035 to 037): its head with
 * « Voir les candidatures » and its actions, then three tabs. « Aperçu »: the figures, where the
 * applications stand and where they come from; « Annonce »: what talents read, with the
 * conditions; « Équipe et réglages »: who follows it and the documents asked.
 */
export async function RecruiterWebOffer({
  ctx,
  jobId,
  tab,
  ok,
  error,
  now = new Date(),
}: {
  ctx: HireContext;
  jobId: string;
  tab: OfferTab;
  /** `?ok=` and `?erreur=` after a change of the team (JobSettings). */
  ok?: string;
  error?: string;
  now?: Date;
}) {
  const t = await getTranslations("rhWeb.offer");
  const ts = await getTranslations("rhWeb.home.offers.status");
  const tc = await getTranslations("jobs.search.contract");
  const tr = await getTranslations("rhWeb.publish.remote");
  const td = await getTranslations("rhWeb.publish.documents");
  const format = await getFormatter();
  const job = await getOrgJob(db, ctx, jobId);
  const permissions = hirePermissions(ctx.role);
  const manage = permissions.manage && job.status !== "archived";
  const [overview, people] = await Promise.all([
    webOfferOverview(db, ctx, job.id, now),
    db.user.findMany({
      where: {
        id: {
          in: [job.assignedToId, ...job.assignments.map((row) => row.userId)].filter(
            (id): id is string => Boolean(id),
          ),
        },
        memberships: { some: { organizationId: ctx.organizationId } },
      },
      select: { id: true, name: true },
    }),
  ]);
  const nameOf = (id: string | null) => people.find((person) => person.id === id)?.name ?? null;
  const base = `/app/hire/offres/${job.id}`;
  const day = (date: Date) =>
    format.dateTime(date, { day: "numeric", month: "short", timeZone: "UTC" });
  const line = [
    job.city,
    tc(contractFilterOf(job.contractType)),
    job.publishedAt ? t("published", { date: day(job.publishedAt) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const live = job.status === "published";
  const url = publicJobUrl(job.slug);
  const required = job.skills.filter((item) => item.importance === "required");
  const preferred = job.skills.filter((item) => item.importance === "preferred");
  const questions = screeningQuestionsOf(job.screeningQuestions);
  const salary =
    job.salaryMin !== null || job.salaryMax !== null
      ? t("salary", {
          min: format.number((job.salaryMin ?? job.salaryMax ?? 0) / 100),
          max: format.number((job.salaryMax ?? job.salaryMin ?? 0) / 100),
        })
      : t("salaryHidden");
  const most = Math.max(1, ...overview.stages.map((stage) => stage.count));

  return (
    <div className="rb-page">
      <Link href="/app/hire/offres" className="rb-retour">
        <PhoneIcon name="retour" size={18} stroke={2} />
        {t("back")}
      </Link>
      <div className="rb-off-h">
        <div>
          <h1>{job.title}</h1>
          <p className="rb-meta">
            {line}
            {" · "}
            <b className={STATUS_TONE[job.status]}>{ts(job.status)}</b>
          </p>
        </div>
        <div className="rb-off-act">
          {job.status !== "draft" && (
            <Link href={`/app/hire/candidats?offre=${job.id}`} className="rb-btn t-press">
              {t("applications", { count: overview.applications })}
            </Link>
          )}
          {live && (
            <ShareOfferButton
              url={url}
              title={job.title}
              labels={{
                share: t("share.label"),
                title: t("share.title"),
                copy: t("share.copy"),
                copied: t("share.copied"),
                whatsapp: t("share.whatsapp"),
                fil: t("share.fil"),
                filHint: t("share.filHint"),
                cancel: t("cancel"),
              }}
            />
          )}
          {manage && live && (
            <form action={pauseJobAction}>
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="back" value={base} />
              <button type="submit" className="rb-btn2 t-press">
                {t("pause")}
              </button>
            </form>
          )}
          {manage && job.status === "paused" && (
            <form action={resumeJobAction}>
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="back" value={base} />
              <button type="submit" className="rb-btn2 t-press">
                {t("resume")}
              </button>
            </form>
          )}
          {manage && job.status !== "closed" && (
            <Link href={`${base}/modifier`} className="rb-btn2 t-press">
              {job.status === "draft" ? t("continue") : t("edit")}
            </Link>
          )}
          {manage && job.status === "closed" && (
            <form action={reopenJobAction}>
              <input type="hidden" name="id" value={job.id} />
              <button type="submit" className="rb-btn2 t-press">
                {t("reopen")}
              </button>
            </form>
          )}
          {manage && job.status !== "closed" && job.status !== "draft" && (
            <CloseOfferButton
              jobId={job.id}
              labels={{
                close: t("close.label"),
                title: t("close.title", { title: job.title }),
                text: t("close.text", { count: overview.applications }),
                confirm: t("close.confirm"),
                cancel: t("cancel"),
              }}
            />
          )}
        </div>
      </div>

      {job.status === "changes_requested" && (
        <ModerationChanges job={job} fixHref={manage ? `${base}/modifier?etape=4` : undefined} />
      )}
      {job.status === "rejected" && job.moderationReason && (
        <p className="rb-err" role="alert">
          {t("rejected")}
        </p>
      )}

      <nav className="rb-onglets" aria-label={t("tabs.aria")}>
        {OFFER_TABS.map((key) => (
          <Link
            key={key}
            href={key === "apercu" ? base : `${base}?onglet=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={cx("rb-onglet", tab === key && "rb-on")}
            scroll={false}
          >
            {t(`tabs.${key}`)}
          </Link>
        ))}
      </nav>

      {tab === "apercu" && (
        <>
          <div className="rb-g4" role="list" aria-label={t("tiles.aria")}>
            {[
              [String(overview.views), t("tiles.views")],
              [
                String(overview.applications),
                t("tiles.applications", { count: overview.applications }),
              ],
              [overview.week > 0 ? t("plus", { count: overview.week }) : "0", t("tiles.week")],
              [
                overview.answeredShare === null
                  ? t("none")
                  : format.number(overview.answeredShare, { style: "percent" }),
                t("tiles.answered"),
              ],
            ].map(([value, label]) => (
              <div key={label} className="rb-tuile" role="listitem">
                <b>{value}</b>
                {label}
              </div>
            ))}
          </div>
          <div className="rb-off-g">
            <section className="rb-carte" aria-labelledby="rb-off-etapes">
              <h2 id="rb-off-etapes">{t("stages.title")}</h2>
              {overview.stages.length === 0 ? (
                <p className="rb-vide">{t("stages.empty")}</p>
              ) : (
                <dl className="rb-barres">
                  {overview.stages.map((stage) => (
                    <div key={stage.id}>
                      <dt>{stage.name}</dt>
                      <dd>
                        <span aria-hidden className="rb-barre">
                          <i style={{ width: `${Math.max(2, (stage.count / most) * 100)}%` }} />
                        </span>
                        <b>{stage.count}</b>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {job.status !== "draft" && (
                <Link href={`${base}/ats`} className="rb-btn2 t-press">
                  {t("stages.ats")}
                </Link>
              )}
            </section>
            <section className="rb-carte" aria-labelledby="rb-off-sources">
              <h2 id="rb-off-sources">{t("sources.title")}</h2>
              <dl className="rb-dl">
                {overview.sources.map((row) => (
                  <div key={row.source}>
                    <dt>{t(`sources.${row.source}`)}</dt>
                    <dd>{row.count}</dd>
                  </div>
                ))}
              </dl>
              <p className="rb-meta">{t("sources.free")}</p>
            </section>
          </div>
        </>
      )}

      {tab === "annonce" && (
        <div className="rb-off-g rb-off-g2">
          <section className="rb-carte rb-annonce" aria-label={t("tabs.annonce")}>
            {job.description ? <p>{job.description}</p> : <p className="rb-vide">{t("noText")}</p>}
            {job.responsibilities.length > 0 && (
              <>
                <h2>{t("ad.missions")}</h2>
                <ul className="rb-puces">
                  {job.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}
            {required.length > 0 && (
              <>
                <h2>{t("ad.required")}</h2>
                <ul className="rb-chips" aria-label={t("ad.required")}>
                  {required.map((item) => (
                    <li key={item.skillId} className="rb-chip rb-chip-v">
                      {item.skill.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {preferred.length > 0 && (
              <>
                <h2>{t("ad.preferred")}</h2>
                <ul className="rb-chips" aria-label={t("ad.preferred")}>
                  {preferred.map((item) => (
                    <li key={item.skillId} className="rb-chip">
                      {item.skill.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {questions.length > 0 && (
              <>
                <h2>{t("ad.questions")}</h2>
                <ul className="rb-puces">
                  {questions.map((question) => (
                    <li key={question.id}>{question.text}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
          <div className="rb-colonne">
            <section className="rb-carte" aria-labelledby="rb-off-cond">
              <h2 id="rb-off-cond">{t("ad.conditions")}</h2>
              <dl className="rb-dl">
                <div>
                  <dt>{t("ad.contract")}</dt>
                  <dd>{tc(contractFilterOf(job.contractType))}</dd>
                </div>
                <div>
                  <dt>{t("ad.place")}</dt>
                  <dd>{[job.city, tr(job.remote)].filter(Boolean).join(" · ")}</dd>
                </div>
                <div>
                  <dt>{t("ad.salary")}</dt>
                  <dd>{salary}</dd>
                </div>
                <div>
                  <dt>{t("ad.deadline")}</dt>
                  <dd>
                    {job.closesAt
                      ? format.dateTime(job.closesAt, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        })
                      : t("ad.noDeadline")}
                  </dd>
                </div>
              </dl>
            </section>
            {job.jobSheetName && (
              <section className="rb-carte" aria-labelledby="rb-off-fiche">
                <h2 id="rb-off-fiche">{t("ad.sheet")}</h2>
                <Link href={`${base}/fiche`} className="rb-lien">
                  {job.jobSheetName}
                </Link>
              </section>
            )}
            <section className="rb-carte" aria-labelledby="rb-off-voient">
              <h2 id="rb-off-voient">{t("ad.seen")}</h2>
              <p className="rb-meta">{t("ad.seenText")}</p>
            </section>
          </div>
        </div>
      )}

      {tab === "equipe" && (
        <section className="rb-carte rb-off-eq" aria-label={t("tabs.equipe")}>
          <dl className="rb-dl">
            <div>
              <dt>{t("team.owner")}</dt>
              <dd>{nameOf(job.assignedToId) ?? t("team.nobody")}</dd>
            </div>
            <div>
              <dt>{t("team.evaluators")}</dt>
              <dd>
                {job.assignments
                  .map((row) => nameOf(row.userId))
                  .filter(Boolean)
                  .join(", ") || t("team.nobody")}
              </dd>
            </div>
            <div>
              <dt>{t("team.documents")}</dt>
              <dd>
                {job.requestedDocuments.length
                  ? job.requestedDocuments
                      .map((kind) => (td.has(kind as "cv") ? td(kind as "cv") : kind))
                      .join(", ")
                  : t("team.noDocuments")}
              </dd>
            </div>
            <div>
              <dt>{t("team.free")}</dt>
              <dd>{t("team.freeValue")}</dd>
            </div>
          </dl>
          {manage && job.status !== "closed" && (
            <Link href={`${base}/modifier?etape=5`} className="rb-btn2 t-press">
              {t("team.edit")}
            </Link>
          )}
        </section>
      )}
      {/* Who is in charge, the team, the department and the evaluation grid, entitlement by entitlement. */}
      {tab === "equipe" && manage && job.status !== "draft" && (
        <div className="rb-reglages">
          <JobSettings ctx={ctx} job={job} ok={ok} error={error} />
        </div>
      )}
    </div>
  );
}
