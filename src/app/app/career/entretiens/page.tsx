import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { Logo, toneOf } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getContentOverrides } from "@/server/queries/public";
import { publishedTips } from "@/server/services/contents";
import {
  interviewModes,
  interviewQuota,
  listInterviews,
  quotaKey,
} from "@/server/services/interview-sim";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("entrain");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const errors = ["consent", "entitlement", "quota", "invalid"] as const;

const tiles: { key: "offer" | "job" | "classic" | "voice"; icon: TalentIconName; href: string }[] =
  [
    { key: "offer", icon: "opportunites", href: "/app/career/entretiens/nouveau?source=offre" },
    { key: "job", icon: "cap", href: "/app/career/entretiens/nouveau" },
    { key: "classic", icon: "message", href: "/app/career/entretiens/nouveau?type=hr" },
    { key: "voice", icon: "micro", href: "/app/career/entretiens/nouveau?mode=voice" },
  ];

/**
 * « S'entraîner aux entretiens » (planche talent-4 § 5 bis): the monthly quotas of
 * `career.interview.text.monthly` and `.voice.monthly`, the next confirmed interview to prepare,
 * free practice and the last sessions. Without any simulation in the plan: the free tips and
 * « Voir les formules ». Always private: the recruiter never sees a practice session.
 */
export default async function InterviewsPage({
  searchParams,
}: PageProps<"/app/career/entretiens">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/entretiens");
  const t = await getTranslations();
  const format = await getFormatter();
  const now = new Date();
  const [text, voice, plans] = await Promise.all([
    interviewQuota(db, user.id, "text"),
    interviewQuota(db, user.id, "voice"),
    listPublicPlans(db),
  ]);
  const quotas = { text, voice };
  const head = (
    <FlowHead back="/app/suivi" backLabel={t("entrain.back")} title={t("entrain.title")} />
  );
  const error = errors.find((code) => code === query.erreur);
  const errorNotice = error && (
    <Notice tone="err">
      {t(`entrain.error.${error}`)}{" "}
      {(error === "entitlement" || error === "quota") && (
        <Link href="/app/abonnement" className="t-lien-d">
          {t("entrain.plans")}
        </Link>
      )}
    </Notice>
  );

  // ─── Without simulations in the plan: the free tips. ─────────────────────────────────────
  if (text.limit === 0 && voice.limit === 0) {
    const tips = publishedTips(await getMessages(), await getContentOverrides()).slice(0, 3);
    const tipIcons: TalentIconName[] = ["lecon", "entretien", "document"];
    return (
      <div className="t-flux">
        {head}
        {errorNotice}
        <h2 className="t-ck-t">{t("entrain.gratuit")}</h2>
        {tips.length === 0 ? (
          <p className="t-vide-t">{t("career.tips.empty")}</p>
        ) : (
          <div className="t-verre t-liste t-lignes">
            {tips.map((tip, index) => (
              <Link
                key={tip.id}
                href={`/app/career/conseils#conseil-${tip.id}`}
                className="t-li t-press"
              >
                <span className="t-cases t-c1">
                  <TalentIcon name={tipIcons[index] ?? "lecon"} size="s" />
                </span>
                <span className="t-t">
                  <b>{tip.title}</b>
                  <span>{t("entrain.tipLine", { minutes: tip.minutes })}</span>
                </span>
                <TalentIcon name="suivant" />
              </Link>
            ))}
          </div>
        )}
        <div className="t-verrou">
          <TalentIcon name="cadenas" size="s" />
          <div className="t-t">
            <b>{t("entrain.locked.title", { plan: talentPlanFor(plans, quotaKey("text")) })}</b>
            {t("entrain.locked.text", {
              text: talentPlanFor(plans, quotaKey("text")),
              voice: talentPlanFor(plans, quotaKey("voice")),
            })}
          </div>
        </div>
        <p className="t-gar">
          <TalentIcon name="valider" size="s" />
          <span>{t("entrain.applyFree")}</span>
        </p>
        <div className="t-verre t-fort t-bas-f">
          <Link href="/app/abonnement" className="t-bt t-p t-pl t-press">
            {t("entrain.plans")}
          </Link>
        </div>
      </div>
    );
  }

  const [sessions, planned] = await Promise.all([
    listInterviews(db, user.id, 5),
    db.interview.findFirst({
      where: {
        status: "confirmed",
        startsAt: { gt: now },
        application: { profile: { userId: user.id } },
      },
      orderBy: { startsAt: "asc" },
      select: {
        startsAt: true,
        timezone: true,
        application: {
          select: {
            id: true,
            job: {
              select: { title: true, organization: { select: { name: true, logo: true } } },
            },
          },
        },
      },
    }),
  ]);
  const company = planned?.application.job.organization.name ?? "";

  return (
    <div className="t-flux">
      {head}
      {errorNotice}
      <section aria-label={t("entrain.quotas")} className="t-verre t-quotas">
        {interviewModes.map((mode) => {
          const quota = quotas[mode];
          const reached = quota.limit > 0 && quota.used >= quota.limit;
          return (
            <div key={mode} className="t-quota">
              <div className="t-l">
                <b>{t(`entrain.quota.${mode}`)}</b>
                <span>
                  {quota.limit === 0
                    ? t("entrain.quota.locked", { plan: talentPlanFor(plans, quotaKey(mode)) })
                    : quota.limit < 0
                      ? t("entrain.quota.unlimited")
                      : reached
                        ? t("entrain.quota.reached", {
                            date: format.dateTime(quota.resetsAt, {
                              day: "numeric",
                              month: "long",
                            }),
                          })
                        : t("entrain.quota.used", { used: quota.used, limit: quota.limit })}
                </span>
              </div>
              {quota.limit > 0 && (
                <span className="t-barre" aria-hidden>
                  <i style={{ width: `${Math.min(100, (100 * quota.used) / quota.limit)}%` }} />
                </span>
              )}
            </div>
          );
        })}
      </section>

      {planned?.startsAt && (
        <section aria-labelledby="en-prevu" className="t-flux t-serre">
          <h2 id="en-prevu" className="t-ck-t">
            {t("entrain.planned")}
          </h2>
          <div className="t-verre t-cd">
            <div className="t-haut">
              <Logo
                name={company}
                src={planned.application.job.organization.logo}
                tone={toneOf(company)}
              />
              <div className="t-t">
                <b>{t("entrain.plannedTitle", { company, job: planned.application.job.title })}</b>
                <span>
                  {[
                    format.dateTime(planned.startsAt, {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                      timeZone: planned.timezone,
                    }),
                    format.dateTime(planned.startsAt, {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: planned.timezone,
                    }),
                  ].join(" · ")}
                </span>
              </div>
            </div>
            <Link
              href={`/app/career/entretiens/nouveau?candidature=${planned.application.id}`}
              className="t-bt t-a t-s t-press"
            >
              <TalentIcon name="entretien" size="xs" />
              {t("entrain.prepare")}
            </Link>
          </div>
        </section>
      )}

      <section aria-labelledby="en-libre" className="t-flux t-serre">
        <h2 id="en-libre" className="t-ck-t">
          {t("entrain.free.title")}
        </h2>
        <div className="t-ent-g">
          {tiles.map((tile, index) => (
            <Link key={tile.key} href={tile.href} className={cx("t-eg t-press", `t-e${index + 1}`)}>
              <span className="t-cases">
                <TalentIcon name={tile.icon} size="s" />
              </span>
              <b>{t(`entrain.free.${tile.key}`)}</b>
              {t(`entrain.free.${tile.key}Text`)}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="en-derniers" className="t-flux t-serre">
        <h2 id="en-derniers" className="t-ck-t">
          {t("entrain.recent")}
        </h2>
        {sessions.length === 0 ? (
          <p className="t-vide-t">{t("entrain.empty")}</p>
        ) : (
          <div className="t-verre t-liste t-lignes">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/app/career/entretiens/${session.id}${
                  session.status === "completed" ? "#retour" : ""
                }`}
                className="t-li t-press"
              >
                <span className={cx("t-cases", session.mode === "voice" ? "t-c2" : "t-c1")}>
                  <TalentIcon name={session.mode === "voice" ? "micro" : "entretien"} size="s" />
                </span>
                <span className="t-t">
                  <b>
                    {t("entrain.recentTitle", {
                      job: session.jobTitle,
                      mode: t(`entrain.mode.${session.mode}`),
                    })}
                  </b>
                  <span>
                    {[
                      t("entrain.recentLine", {
                        date: format.dateTime(session.createdAt, {
                          day: "numeric",
                          month: "short",
                        }),
                        count: session.questionCount,
                      }),
                      session.status === "completed"
                        ? t("entrain.feedbackReady")
                        : t("entrain.inProgress"),
                    ].join(" · ")}
                  </span>
                </span>
                <TalentIcon name="suivant" />
              </Link>
            ))}
          </div>
        )}
      </section>
      <p className="t-gar">
        <TalentIcon name="cadenas" size="s" />
        <span>{t("entrain.private")}</span>
      </p>
    </div>
  );
}
