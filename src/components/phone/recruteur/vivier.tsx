import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { rhRemoveFromPoolAction } from "@/server/actions/phone-rh-talents";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { matchesForUser } from "@/server/matching/service";
import { hirePermissions, HireError, type HireContext } from "@/server/services/hire";
import { getPool } from "@/server/services/talent-search";
import { PhoneIcon } from "../icon";
import { RhPoolOptions } from "./talents-client";
import { RhInitials, RhPct } from "./candidatures";

/** The offers a pool's talents are compared with (the newest ones). */
const COMPARED = 5;

/**
 * One list of the vivier on the phone (planche 105): its talents with their best score among the
 * newest offers (the fixed score of part 08), who sees the list, and « Retirer ». The talents are
 * never told which list they are in.
 */
export async function RhPool({
  ctx,
  poolId,
  ok,
}: {
  ctx: HireContext;
  poolId: string;
  ok: string | undefined;
}) {
  const toasts = { retire: "ok.retire", renomme: "ok.renomme" } as const;
  const t = await getTranslations("phoneRhTalents");
  const pool = await getPool(db, ctx, poolId).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const manage = hirePermissions(ctx.role).manage;
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [offers, matching, profiles] = await Promise.all([
    db.job.findMany({
      where: { organizationId: ctx.organizationId, status: "published" },
      orderBy: { publishedAt: "desc" },
      take: COMPARED,
      select: { id: true, title: true },
    }),
    level(db, subject, "hire.matching.level"),
    db.talentProfile.findMany({
      where: { id: { in: pool.entries.map((entry) => entry.profileId) } },
      select: {
        id: true,
        userId: true,
        matchingEnabled: true,
        experiences: { select: { startDate: true, endDate: true } },
      },
    }),
  ]);
  const best = new Map<string, { score: number; job: string }>();
  if (matching !== "none" && offers.length > 0) {
    for (const profile of profiles) {
      if (!profile.matchingEnabled) continue;
      const states = await matchesForUser(
        db,
        profile.userId,
        offers.map((offer) => offer.id),
      );
      for (const offer of offers) {
        const state = states.get(offer.id);
        const current = best.get(profile.id);
        if (state?.state === "ok" && (!current || state.explanation.score > current.score))
          best.set(profile.id, { score: state.explanation.score, job: offer.title });
      }
    }
  }
  return (
    <div className="nb-page nb-rh-detail nb-rh-vivier">
      {ok === "retire" || ok === "renomme" ? (
        <ToastOnLoad message={t(toasts[ok])} tone="success" />
      ) : null}
      <header className="nb-rh-barre">
        <Link href="/app/hire/talents?onglet=vivier" className="nb-rh-retour">
          <PhoneIcon name="retour" size={20} />
          {t("pool.back")}
        </Link>
        {manage ? <RhPoolOptions poolId={pool.id} name={pool.name} /> : null}
      </header>
      <div className="nb-rh-marge">
        <h1 className="nb-rh-titre-l">{pool.name}</h1>
        <p className="nb-meta">
          {t("pools.count", { count: pool.entries.length })} · {t(`pool.${pool.visibility}`)}
        </p>
      </div>
      {pool.entries.length === 0 ? (
        <p className="nb-vide nb-rh-marge">{t("pool.empty")}</p>
      ) : (
        <ul className="nb-rh-liste-l">
          {pool.entries.map((entry) => {
            const name = entry.name ?? t("card.anonymous");
            const score = best.get(entry.profileId);
            return (
              <li key={entry.profileId} className="nb-rh-rang">
                <Link
                  href={`/app/hire/talents/${entry.profileId}?retour=${encodeURIComponent(`/app/hire/viviers/${pool.id}`)}`}
                  className="nb-rh-cl"
                >
                  <RhInitials id={entry.profileId} name={entry.name ?? "?"} />
                  <span className="nb-rh-res-t">
                    <b>{name}</b>
                    {entry.headline ? <span className="nb-meta">{entry.headline}</span> : null}
                    <span className="nb-meta">
                      {[
                        entry.city,
                        score?.job ??
                          (entry.origin.kind === "applied"
                            ? t("pool.origin.applied", { job: entry.origin.jobTitle })
                            : t(`pool.origin.${entry.origin.kind}`)),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {score ? (
                    <RhPct score={score.score} label={t("card.percent", { score: score.score })} />
                  ) : null}
                </Link>
                {manage ? (
                  <form action={rhRemoveFromPoolAction}>
                    <input type="hidden" name="pool" value={pool.id} />
                    <input type="hidden" name="profile" value={entry.profileId} />
                    <button
                      type="submit"
                      className="nb-rond nb-rh-retirer"
                      aria-label={t("pool.remove", { name })}
                    >
                      <PhoneIcon name="fermer" size={16} />
                    </button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
