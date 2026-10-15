import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { adminCard, adminTitle } from "@/components/admin/kit";
import { formatDateTime } from "@/lib/dates";
import { cx } from "@/lib/cx";
import { getCurrentUser } from "@/server/auth/session";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { db } from "@/server/db";
import { auditHistory, type AuditEntry, type AuditFamily } from "@/server/services/admin-audit";

/**
 * Journal d'audit (docs/admin-v2/PLAN-ADMIN.md, étape 1): one line per action, « who did what, on
 * what, with which reason », shared by `/admin/journal` and the « Historique » box of each card.
 */

const familyIcon: Record<AuditFamily, IconName> = {
  user: "profil",
  org: "entreprise",
  plan: "portefeuille",
  payment: "mobile-money",
  subscription: "mobile-money",
  course: "learn",
  certificate: "certificat",
  job: "jobs",
  report: "securite",
  partner: "certificat",
  license: "certificat",
  matching: "intelligence",
  match: "intelligence",
  content: "edit",
  profile: "eye",
  talent: "recherche",
  security: "securite",
  cost: "portefeuille",
  admin: "doc",
};

type Translate = Awaited<ReturnType<typeof getTranslations<"admin">>>;

export function actionLabel(t: Translate, action: string) {
  const key = `journal.action.${action.replaceAll(".", "_")}`;
  return t.has(key as never) ? t(key as never) : action;
}

export function targetLabel(t: Translate, type: string) {
  const key = `journal.target.${type}`;
  return t.has(key as never) ? t(key as never) : type;
}

/** A reason recorded by the platform itself (« scheduled ») has its own sentence. */
export function reasonText(t: Translate, reason: string) {
  const key = `journal.reason.${reason}`;
  return /^[a-z]+$/.test(reason) && t.has(key as never) ? t(key as never) : reason;
}

/** Rows of the journal (a list of cards: it reads the same at 1440 and 390 px). */
export async function AuditRows({
  entries,
  compact = false,
}: {
  entries: AuditEntry[];
  /** In a card's « Historique »: the target is the card itself, so it is not repeated. */
  compact?: boolean;
}) {
  const t = await getTranslations("admin");
  return (
    <ol className="flex flex-col">
      {entries.map((entry) => {
        const who = entry.actor
          ? entry.actor.name
          : t(entry.actorId ? "journal.deletedActor" : "journal.system");
        return (
          <li
            key={entry.id}
            className="flex gap-3 border-b border-brume py-3 first:pt-0 last:border-b-0 last:pb-0"
          >
            <span
              aria-hidden
              className={cx(
                "mt-0.5 grid shrink-0 place-items-center rounded-[10px] text-sapin",
                compact ? "size-7 bg-creme" : "size-9 bg-creme",
              )}
            >
              <Icon
                name={entry.family ? familyIcon[entry.family] : "doc"}
                className={compact ? "size-3.5" : "size-4"}
              />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[13.5px] leading-5">
                <span className="font-semibold">{who}</span> {actionLabel(t, entry.action)}
                {!compact && (
                  <>
                    {" · "}
                    {entry.href ? (
                      <Link href={entry.href} className="font-medium underline underline-offset-2">
                        {entry.targetLabel ?? targetLabel(t, entry.targetType)}
                      </Link>
                    ) : (
                      <span className="text-ardoise">
                        {entry.targetLabel ?? targetLabel(t, entry.targetType)}
                      </span>
                    )}
                  </>
                )}
              </p>
              {entry.reason && (
                <p className="rounded-[10px] bg-creme px-3 py-1.5 text-[12.5px] leading-[18px] break-words">
                  {t("journal.reasonLabel", { reason: reasonText(t, entry.reason) })}
                </p>
              )}
              <p className="flex flex-wrap gap-x-3 text-[11.5px] leading-4 text-ardoise">
                <time dateTime={entry.createdAt.toISOString()}>
                  {formatDateTime(entry.createdAt)}
                </time>
                {!compact && entry.actor && <span>{entry.actor.email}</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** « Historique » of a card: the last 10 actions on this target, and a link to the journal. */
export async function AuditHistory({
  targetType,
  targetId,
  className,
}: {
  targetType: string;
  targetId: string;
  className?: string;
}) {
  const [t, user, entries] = await Promise.all([
    getTranslations("admin"),
    getCurrentUser(),
    auditHistory(db, targetType, targetId),
  ]);
  const canOpenJournal = !!user && (ADMIN_ROLES as readonly string[]).includes(user.platformRole);
  const titleId = `audit-history-${targetId}`;
  return (
    <section
      aria-labelledby={titleId}
      className={cx(adminCard, "flex flex-col gap-3.5", className)}
    >
      <div className="flex items-center gap-3">
        <h2 id={titleId} className={cx(adminTitle, "flex-1 !text-[16px] !leading-[22px]")}>
          {t("journal.history.title")}
        </h2>
        {canOpenJournal && entries.length > 0 && (
          <Link
            href={`/admin/journal?cible=${targetType}&id=${encodeURIComponent(targetId)}`}
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold underline underline-offset-2"
          >
            {t("journal.history.all")}
            <Icon name="chev-r" className="size-3.5" />
          </Link>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="text-[13px] leading-5 text-ardoise">{t("journal.history.empty")}</p>
      ) : (
        <AuditRows entries={entries} compact />
      )}
    </section>
  );
}
