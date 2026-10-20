import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { CandidateAvatar } from "@/components/recruiter/candidates";
import { SortSheet } from "@/components/recruiter/candidates-client";
import { OrbiLine, statusOf } from "@/components/recruiter/offers";
import { ProposalsView, TalentSearchView } from "@/components/recruiter/talent-search";
import { TalentIcon } from "@/components/talent/icon";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { pickMessages } from "@/i18n/client-messages";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import { deliverDueDecisionMails } from "@/server/application-events";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import { HireError, hirePermissions } from "@/server/services/hire";
import { candidateList, type CandidateRow } from "@/server/services/hire-candidates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireCandidates");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : Array.isArray(value) ? value.join(",") : undefined;

const DAY = 86_400_000;

/**
 * Candidats › Candidatures (brief recruteur § 4 item 3, planches recruteur-2 § 1 and r2plus): the
 * offer chosen, its stages with their counts, the applications sorted by correspondence (or date,
 * or stage), « Nouveau » on those not opened yet. « Trier » hides, never rejects: the page says how
 * many are hidden and shows them again in one tap. « Rechercher des talents » (`?vue=talents`, managers
 * only) and its « Mes propositions » (`?vue=propositions`) are drawn by talent-search.tsx (lot 4).
 */
export default async function CandidatesPage({ searchParams }: PageProps<"/app/hire/candidats">) {
  const query = await searchParams;
  const { ctx } = await requireHire("/app/hire/candidats", "readApplications");
  const t = await getTranslations("hireCandidates");
  const to = await getTranslations("hireOffers");
  const ui = await getTranslations("ui");
  const format = await getFormatter();
  const now = new Date();
  const permissions = hirePermissions(ctx.role);
  const view =
    permissions.manage && (query.vue === "talents" || query.vue === "propositions")
      ? query.vue
      : null;

  const segments = (
    <nav className="t-seg" aria-label={t("seg.aria")}>
      <Link href="/app/hire/candidats" aria-current={view ? undefined : "page"} className="t-press">
        {t("seg.applications")}
      </Link>
      {permissions.manage && (
        <Link
          href="/app/hire/candidats?vue=talents"
          aria-current={view ? "page" : undefined}
          className="t-press"
        >
          {t("seg.talents")}
        </Link>
      )}
    </nav>
  );
  if (view === "talents") return <TalentSearchView ctx={ctx} query={query} segments={segments} />;
  if (view === "propositions") return <ProposalsView ctx={ctx} query={query} segments={segments} />;

  const params = {
    offre: one(query.offre),
    etape: one(query.etape),
    tri: one(query.tri),
    min: one(query.min),
    dossier: one(query.dossier),
  };
  const list = await candidateList(db, ctx, params, now).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  after(() => deliverDueDecisionMails().catch((error) => reportError(error)));

  if (!list.job) {
    return (
      <div className="t-flux">
        <h1 className="sr-only">{t("title")}</h1>
        {segments}
        <div className="t-verre t-rc-vide">
          <span className="t-rc-rond" aria-hidden>
            <TalentIcon name="offre" />
          </span>
          <b>{t("noOffer.title")}</b>
          <span>{t("noOffer.text")}</span>
          {permissions.manage && (
            <Link href="/app/hire/offres/nouvelle" className="t-bt t-p t-s t-press">
              {t("noOffer.cta")}
            </Link>
          )}
        </div>
      </div>
    );
  }

  const messages = await getMessages();
  const job = list.job;
  const base = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams({ offre: job.id });
    const current: Record<string, string | null | undefined> = {
      etape: list.stage?.id,
      tri: params.tri,
      min: params.min,
      dossier: params.dossier,
      ...changes,
    };
    for (const [key, value] of Object.entries(current)) if (value) next.set(key, value);
    return `/app/hire/candidats?${next}`;
  };
  const clearHref = base({ tri: null, min: null, dossier: null });
  const active = (list.floor ? 1 : 0) + (list.filters?.length ?? 0);
  const unseen = list.rows.filter((row) => row.unseen);
  const firstUnseen = [...unseen].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  const shownStages = list.stages.filter(
    (stage) => !(stage.kind === "hired" || stage.kind === "rejected") || stage.count > 0,
  );
  const inStage = list.stage
    ? list.rows.filter((row) => row.stage.id === list.stage!.id)
    : list.rows;
  const status = statusOf(job, now);
  const when = (date: Date) =>
    now.getTime() - date.getTime() < 2 * DAY
      ? format.relativeTime(date, now)
      : formatDayMonth(date);
  const docsOf = (row: CandidateRow) => {
    const docs = [
      row.cv ? t("row.cv") : null,
      row.letter ? t("row.letter") : null,
      row.certificate ? t("row.certificate") : null,
    ].filter(Boolean);
    return docs.length ? docs.join(", ") : t("row.profile");
  };
  const scoreTone = (score: number) => (score >= 85 ? undefined : score >= 70 ? "t-m" : "t-f");
  const emptyKey =
    job.status === "pending_review"
      ? "pending_review"
      : job.status === "paused"
        ? "paused"
        : job.status === "closed" || status.key === "expired"
          ? "closed"
          : "published";

  return (
    <div className="t-flux">
      <h1 className="sr-only">{t("title")}</h1>
      {segments}

      <SheetButton
        target="rc-offres"
        label={t("offer.aria", { title: job.title })}
        className="t-verre t-rc-off t-press"
      >
        <TalentIcon name="offre" size="s" />
        <span className="t-t">
          <small>{t("offer.label")}</small>
          <b>{job.title}</b>
        </span>
        <TalentIcon name="suivant" size="s" className="t-rc-bas" />
      </SheetButton>

      {firstUnseen && (
        <OrbiLine
          action={
            <Link href={`/app/hire/candidats/${firstUnseen.id}`} className="t-bt t-p t-s t-press">
              {t("orbi.examine")}
            </Link>
          }
        >
          {t.rich("orbi.unseen", { count: unseen.length, b: (chunks) => <b>{chunks}</b> })}
        </OrbiLine>
      )}

      {list.rows.length === 0 ? (
        <>
          <div className="t-verre t-rc-vide">
            <span className="t-rc-rond" aria-hidden>
              <TalentIcon name="candidats" />
            </span>
            <b>{t("empty.title")}</b>
            <span>{t(`empty.${emptyKey}`)}</span>
          </div>
          <Link href="/app/hire/candidats?vue=talents" className="t-verre t-rc-sugg t-press">
            <TalentIcon name="recherche" size="s" />
            <span className="t-t">
              <b>{t("empty.search")}</b>
              <span>{t("empty.searchText")}</span>
            </span>
            <TalentIcon name="suivant" size="s" />
          </Link>
        </>
      ) : (
        <>
          <nav className="t-rx-onglets" aria-label={t("stages.aria")}>
            <Link
              href={base({ etape: null })}
              aria-current={list.stage ? undefined : "page"}
              className="t-puce t-press"
            >
              {t("stages.all")}
              <small>{list.rows.length}</small>
            </Link>
            {shownStages.map((stage) => (
              <Link
                key={stage.id}
                href={base({ etape: stage.id })}
                aria-current={list.stage?.id === stage.id ? "page" : undefined}
                aria-label={t("stages.count", { stage: stage.name, count: stage.count })}
                className="t-puce t-press"
              >
                {stage.name}
                <small>{stage.count}</small>
              </Link>
            ))}
          </nav>

          <div className="t-rc-tri-h">
            <h2>{t(`sorted.${list.sort ?? "date"}`)}</h2>
            <SheetButton target="rc-tri" className="t-rc-trier t-press">
              <TalentIcon name="filtres" size="xs" />
              {active ? t("sort.openActive", { count: active }) : t("sort.open")}
            </SheetButton>
          </div>

          {list.hidden > 0 && (
            <p className="t-rc-masque">
              <span>{t("hidden", { count: list.hidden })}</span>
              <Link href={clearHref}>{t("showAll")}</Link>
            </p>
          )}

          {list.visible.length === 0 ? (
            <p className="t-verre t-rc-rien">{t("none")}</p>
          ) : (
            <ul className="t-rc-liste">
              {list.visible.map((row) => (
                <li key={row.id}>
                  <Link href={`/app/hire/candidats/${row.id}`} className="t-verre t-rc-cl t-press">
                    <CandidateAvatar id={row.id} name={row.name} />
                    <span className="t-t">
                      <b>
                        <span className="t-rc-nom">{row.name}</span>
                        {row.unseen && <span className="t-rx-nv">{t("row.new")}</span>}
                      </b>
                      <span className="t-l">{[when(row.createdAt), docsOf(row)].join(" · ")}</span>
                      <span className={cx("t-rc-etq", row.status === "withdrawn" && "t-ret")}>
                        {row.status === "withdrawn" ? t("row.withdrawn") : row.stage.name}
                      </span>
                    </span>
                    {row.score !== null && (
                      <span className={cx("t-rc-sc", scoreTone(row.score))}>
                        <b aria-hidden>{ui("percent", { value: row.score })}</b>
                        <span aria-hidden>{t("row.score")}</span>
                        <span className="sr-only">{t("row.scoreAria", { score: row.score })}</span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <NextIntlClientProvider messages={pickMessages(messages, ["hireCandidates"])}>
            <SortSheet
              id="rc-tri"
              offre={job.id}
              etape={list.stage?.id ?? null}
              rows={inStage.map((row) => ({
                score: row.score,
                complete: row.complete,
                letter: row.letter,
                unseen: row.unseen,
              }))}
              sort={list.sort ?? "date"}
              floor={list.floor ?? 0}
              filters={list.filters ?? []}
              withScores={list.matchingLevel !== "none"}
              clearHref={clearHref}
            />
          </NextIntlClientProvider>
        </>
      )}

      <Sheet id="rc-offres" title={t("offer.choose")} closeLabel={t("offer.close")}>
        <ul className="t-rc-offres">
          {list.offers.map((offer) => {
            const state = statusOf(offer, now);
            return (
              <li key={offer.id}>
                <Link
                  href={`/app/hire/candidats?offre=${offer.id}`}
                  aria-current={offer.id === job.id ? "page" : undefined}
                  className="t-press"
                >
                  <span className="t-t">
                    <b>{offer.title}</b>
                    <span>
                      {[
                        t("offer.count", { count: offer._count.applications }),
                        offer.applications.length
                          ? t("offer.unseen", { count: offer.applications.length })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className={cx("t-rx-stp", state.tone)}>{to(`status.${state.key}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </div>
  );
}
