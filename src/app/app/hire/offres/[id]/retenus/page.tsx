import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { CandidateAvatar } from "@/components/recruiter/candidates";
import { OrbiLine } from "@/components/recruiter/offers";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { unshortlistAction } from "@/server/actions/hire-ats";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError, hirePermissions } from "@/server/services/hire";
import { atsBoard } from "@/server/services/hire-ats";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireAts.shortlist");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * « Liste des retenus » (brief recruteur § 2.17, planche RETENUS): the files a member kept for the
 * next stage, who kept them, what is left to check; from here the grouped replies (« Informer les
 * N », « Préparer » for the others) and the interviews. Orbi never adds anyone to it.
 */
export default async function ShortlistPage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/retenus">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx } = await requireHire(`/app/hire/offres/${id}/retenus`, "readApplications");
  const t = await getTranslations("hireAts.shortlist");
  const board = await atsBoard(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const permissions = hirePermissions(ctx.role);
  const { job } = board;
  const kept = board.shortlisted.filter((row) => row.status === "active");
  const others = board.rows.filter((row) => row.status === "active" && !row.shortlisted);
  const interview =
    (
      await db.pipelineStage.findFirst({
        where: { jobId: job.id, kind: "interview" },
        orderBy: { order: "asc" },
        select: { name: true },
      })
    )?.name ?? null;
  const members = new Map(
    (
      await db.user.findMany({
        where: { id: { in: kept.map((row) => row.shortlistedById ?? "").filter(Boolean) } },
        select: { id: true, firstName: true, name: true },
      })
    ).map((user) => [user.id, (user.firstName || user.name).split(/\s+/)[0] ?? ""]),
  );
  const added = Number(one(query.ajout) ?? "");
  const ats = `/app/hire/offres/${job.id}/ats`;

  return (
    <div className="t-flux t-r6">
      {Number.isFinite(added) && added > 0 && (
        <ToastOnLoad message={t("added", { count: added })} />
      )}
      {one(query.ok) === "retiree" && <ToastOnLoad message={t("removed")} />}
      <FlowHead
        back={ats}
        backLabel={t("back")}
        title={t("title")}
        end={
          permissions.manage ? (
            <Link
              href={`${ats}?vue=tous&selection=1`}
              className="t-bi t-press"
              aria-label={t("add")}
            >
              <TalentIcon name="plus" size="s" />
            </Link>
          ) : undefined
        }
      />
      <div className="t-verre t-r6-mini">
        <span className="t-cases t-g-former" aria-hidden>
          <TalentIcon name="offre" size="s" />
        </span>
        <div className="t-t">
          <b>{job.title}</b>
          <span>
            {interview
              ? t("for", { stage: interview, count: kept.length })
              : t("count", { count: kept.length })}
          </span>
        </div>
      </div>

      {kept.length === 0 ? (
        <div className="t-verre t-rc-vide">
          <span className="t-rc-rond" aria-hidden>
            <TalentIcon name="valider" />
          </span>
          <b>{t("empty.title")}</b>
          <span>{t("empty.text")}</span>
          <Link href={`${ats}?vue=recommandes`} className="t-bt t-p t-s t-press">
            {t("empty.cta")}
          </Link>
        </div>
      ) : (
        <ul className="t-verre t-r6-ret-l" aria-label={t("aria")}>
          {kept.map((row) => {
            const by =
              row.shortlistedById === ctx.userId
                ? t("byYou")
                : t("by", { name: members.get(row.shortlistedById ?? "") ?? t("team") });
            const check = row.toCheck[0];
            return (
              <li key={row.id}>
                <CandidateAvatar id={row.id} name={row.name} />
                <div className="t-t">
                  <Link href={`${ats}/${row.id}`}>{row.name}</Link>
                  <span>
                    {[
                      row.score !== null ? t("score", { score: row.score }) : null,
                      check ? t("toCheck", { skill: check }) : by,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <span className="t-r6-ret">{t("badge")}</span>
                {permissions.manage && (
                  <form action={unshortlistAction}>
                    <input type="hidden" name="job" value={job.id} />
                    <input type="hidden" name="application" value={row.id} />
                    <button
                      type="submit"
                      className="t-bi t-press"
                      aria-label={t("remove", { name: row.name })}
                    >
                      <TalentIcon name="fermer" size="xs" />
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {permissions.manage && others.length > 0 && (
        <OrbiLine
          action={
            <Link
              href={`/app/hire/offres/${job.id}/reponses?groupe=non-retenus`}
              className="t-bt t-sec t-s t-press"
            >
              {t("prepare")}
            </Link>
          }
        >
          {t("others", { count: others.length })}
        </OrbiLine>
      )}

      {permissions.manage && kept.length > 0 && (
        <div className="t-verre t-fort t-bas-f">
          <Link
            href={
              kept.length === 1
                ? `/app/hire/candidats/${kept[0]!.id}/entretien`
                : "/app/hire/entretiens"
            }
            className="t-bt t-sec t-m t-press"
          >
            <TalentIcon name="agenda" size="s" />
            {t("slots")}
          </Link>
          <Link
            href={`/app/hire/offres/${job.id}/reponses?groupe=retenus`}
            className="t-bt t-p t-pl t-press"
          >
            <TalentIcon name="message" size="s" />
            {t("inform", { count: kept.length })}
          </Link>
        </div>
      )}
    </div>
  );
}
