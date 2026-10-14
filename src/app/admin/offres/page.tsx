import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Alert, Badge, Button, TextField } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { cx } from "@/lib/cx";
import { moderateJob } from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { jobFlags, liveJobs, moderationQueue } from "@/server/services/moderation";

const flagKeys = ["payment", "discrimination", "contactOutside", "newOrg"] as const;

/** Job moderation (partie 10 § 10.7): jobs flagged at publication, and live jobs to take down. */
export default async function AdminJobs({ searchParams }: PageProps<"/admin/offres">) {
  const params = await searchParams;
  const admin = await requireAdmin();
  // Content editors see the admin shell, but only the courses.
  if (!admin) notFound();
  const t = await getTranslations("admin.jobs");
  const writable = canWriteAdmin(admin);
  const tab = params.onglet === "toutes" ? "toutes" : "a-verifier";
  const [queue, live] = await Promise.all([
    moderationQueue(db),
    tab === "toutes" ? liveJobs(db) : Promise.resolve([]),
  ]);
  const jobs = tab === "toutes" ? live : queue;

  return (
    <>
      <h1 className="text-h1">{t("title")}</h1>
      {params.ok === "approuvee" && <Alert tone="success" title={t("approved")} />}
      {params.ok === "refusee" && <Alert tone="success" title={t("rejected")} />}
      <nav aria-label={t("title")} className="flex flex-wrap gap-2">
        {[
          { id: "a-verifier", label: t("tab.pending", { count: queue.length }) },
          { id: "toutes", label: t("tab.all") },
        ].map((item) => (
          <Link
            key={item.id}
            href={`/admin/offres?onglet=${item.id}`}
            aria-current={tab === item.id ? "page" : undefined}
            className={cx(
              "rounded-pill px-4 py-2 text-[15px] font-medium",
              tab === item.id ? "bg-sapin text-blanc" : "bg-blanc",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <ul className="flex flex-col gap-4">
        {jobs.map((job) => {
          const flags = jobFlags(job).filter((flag): flag is (typeof flagKeys)[number] =>
            (flagKeys as readonly string[]).includes(flag),
          );
          return (
            <li key={job.id} className="flex flex-col gap-3 rounded-card bg-blanc p-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-h3 font-semibold">{job.title}</h2>
                <p className="text-sm text-ardoise">
                  {[job.organization.name, job.city, formatDate(job.updatedAt)].join(" · ")}
                </p>
              </div>
              {flags.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {flags.map((flag) => (
                    <li key={flag}>
                      <Badge tone="warning">
                        {t("autoFlag.text", { reason: t(`autoFlag.${flag}`) })}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
              <details>
                <summary className="cursor-pointer text-sm font-medium underline">
                  {t("checklist")}
                </summary>
                <div className="mt-3 flex flex-col gap-3 text-sm">
                  <ul className="flex list-disc flex-col gap-1 pl-5">
                    <li>{t("check.real")}</li>
                    <li>{t("check.noPayment")}</li>
                    <li>{t("check.noDiscrimination")}</li>
                    <li>{t("check.knockout")}</li>
                  </ul>
                  <p className="rounded-md bg-creme p-4 whitespace-pre-line">
                    {[
                      job.description,
                      ...job.responsibilities,
                      ...job.requirements,
                      ...job.benefits,
                    ].join("\n")}
                  </p>
                </div>
              </details>
              {writable && (
                <div className="flex flex-col gap-3">
                  {job.status === "pending_review" && (
                    <form action={moderateJob}>
                      <input type="hidden" name="job" value={job.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <Button type="submit" size="sm">
                        {t("approve")}
                      </Button>
                    </form>
                  )}
                  <form
                    action={moderateJob}
                    className="flex flex-col gap-2 sm:flex-row sm:items-end"
                  >
                    <input type="hidden" name="job" value={job.id} />
                    <input type="hidden" name="decision" value="refuse" />
                    <div className="flex-1">
                      <TextField
                        id={`reason-${job.id}`}
                        name="reason"
                        required
                        maxLength={500}
                        label={t("reject.reason")}
                      />
                    </div>
                    <Button type="submit" size="sm" variant="danger">
                      {job.status === "pending_review" ? t("reject.text") : t("unpublish.text")}
                    </Button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
