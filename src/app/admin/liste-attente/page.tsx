import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader, Tag, adminCard, adminLabel } from "@/components/admin/kit";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatDateTime } from "@/lib/dates";
import { sendPendingWaitlistEmailsAction } from "@/server/actions/admin-waitlist";
import { emailDeliveryAvailable } from "@/server/adapters/email";
import { canWriteArea } from "@/server/auth/roles";
import { requireAdminArea } from "@/server/auth/session";
import { db } from "@/server/db";
import { waitlistCounts, waitlistProfiles } from "@/server/services/waitlist";

const PAGE = 300;

/**
 * Liste d'attente (29/10/2026): the people who joined from the public site while sign-up is closed,
 * newest first, with counts per profile, the CSV export and the e-mails still to send.
 */
export default async function AdminWaitlistPage({
  searchParams,
}: PageProps<"/admin/liste-attente">) {
  const admin = await requireAdminArea("users");
  if (!admin) notFound();
  const query = await searchParams;
  const profile = waitlistProfiles.find((value) => value === query.profil);
  const [t, counts, pending, entries] = await Promise.all([
    getTranslations(),
    waitlistCounts(db),
    db.waitlistEntry.count({ where: { emailSentAt: null } }),
    db.waitlistEntry.findMany({
      where: profile ? { profile } : undefined,
      orderBy: { createdAt: "desc" },
      take: PAGE,
    }),
  ]);
  const canWrite = canWriteArea(admin.platformRole, "users");
  const mailReady = emailDeliveryAvailable();
  const sent = typeof query.envoyes === "string" ? Number(query.envoyes) : null;
  const filters = [undefined, ...waitlistProfiles] as const;
  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title={t("admin.waitlist.title")}
        subtitle={t("admin.waitlist.subtitle")}
        stats={[
          { label: t("admin.waitlist.stats.total"), value: counts.total },
          ...waitlistProfiles.map((value) => ({
            label: t(`waitlist.form.profile.${value}.label`),
            value: counts[value],
          })),
        ]}
        action={
          admin.platformRole === "platform_admin" ? (
            <ButtonLink href="/admin/liste-attente.csv" variant="secondary" size="sm">
              {t("admin.waitlist.export")}
            </ButtonLink>
          ) : undefined
        }
      />
      {sent !== null && Number.isFinite(sent) && (
        <Alert tone="success" title={t("admin.waitlist.sent", { count: sent })} />
      )}
      {!mailReady && <Alert tone="warning" title={t("admin.waitlist.mailOff")} />}
      {mailReady && pending > 0 && canWrite && (
        <form
          action={sendPendingWaitlistEmailsAction}
          className={cx(adminCard, "flex flex-wrap items-center gap-3")}
        >
          <p className="flex-1 text-[14px] leading-5">
            {t("admin.waitlist.pending", { count: pending })}
          </p>
          <Button type="submit" variant="primary" size="sm">
            {t("admin.waitlist.sendPending")}
          </Button>
        </form>
      )}
      <nav aria-label={t("admin.waitlist.filter")} className="flex flex-wrap gap-2">
        {filters.map((value) => {
          const active = value === profile;
          return (
            <a
              key={value ?? "all"}
              href={value ? `/admin/liste-attente?profil=${value}` : "/admin/liste-attente"}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex h-9 items-center rounded-pill px-4 text-[13px] font-semibold ring-1 ring-inset",
                active
                  ? "bg-lime text-[#0f3f37] ring-lime"
                  : "bg-blanc ring-sapin/10 hover:ring-sapin/30",
              )}
            >
              {value ? t(`waitlist.form.profile.${value}.label`) : t("admin.waitlist.all")}
            </a>
          );
        })}
      </nav>
      <section className={cx(adminCard, "overflow-x-auto p-0 lg:p-0")}>
        {entries.length === 0 ? (
          <p className="p-6 text-[14px] text-ardoise">{t("admin.waitlist.empty")}</p>
        ) : (
          <table className="w-full min-w-[860px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-brume">
                {(
                  ["name", "email", "profile", "place", "organization", "date", "mail"] as const
                ).map((key) => (
                  <th key={key} scope="col" className={cx(adminLabel, "px-4 py-3 font-semibold")}>
                    {t(`admin.waitlist.col.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-brume last:border-0">
                  <td className="px-4 py-3 font-semibold">
                    {[entry.firstName, entry.lastName].filter(Boolean).join(" ")}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${entry.email}`} className="hover:underline">
                      {entry.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <Tag tone={entry.profile === "talent" ? "success" : "neon"}>
                      {t(`waitlist.form.profile.${entry.profile}.label`)}
                    </Tag>
                  </td>
                  <td className="px-4 py-3 text-ardoise">
                    {[entry.city, entry.country].filter(Boolean).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-ardoise">{entry.organization ?? ""}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ardoise">
                    {formatDateTime(entry.createdAt)} · {entry.locale.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    {entry.emailSentAt ? (
                      <Tag tone="success">{t("admin.waitlist.mailSent")}</Tag>
                    ) : (
                      <Tag tone="outline">{t("admin.waitlist.mailPending")}</Tag>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {entries.length === PAGE && (
        <p className="text-[12.5px] text-ardoise">{t("admin.waitlist.more", { count: PAGE })}</p>
      )}
    </div>
  );
}
