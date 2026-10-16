import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { db } from "@/server/db";
import { duplicateJobAction } from "@/server/actions/hire";
import { aiFeatures, AI_CREDITS_KEY } from "@/server/ai";
import type { HireContext } from "@/server/services/hire";
import { jobWriterReadiness } from "@/server/services/job-writer";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";
import type { JobFormAi } from "./job-form";
import { MenuChip, menuItem } from "./kit";

/** What the job wizard needs around the form: organization, help to write, earlier jobs. */
export async function jobFormContext(ctx: HireContext, exceptId?: string) {
  const t = await getTranslations("hire.jobForm");
  const [organization, readiness, plans, jobs] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true, verificationStatus: true },
    }),
    jobWriterReadiness(db, ctx),
    listPublicPlans(db),
    db.job.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: { in: ["published", "closed"] },
        id: exceptId ? { not: exceptId } : undefined,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, title: true },
    }),
  ]);
  const ai: JobFormAi = {
    readiness,
    credits: aiFeatures.job_writer.credits,
    lockText:
      readiness === "quota"
        ? t("ai.quota")
        : t("ai.locked", { plan: orgPlanFor(plans, AI_CREDITS_KEY) }),
  };
  const templates = (
    <MenuChip
      group="job-templates"
      align="right"
      summaryClassName={pillClass("outline", "sm")}
      summary={
        <>
          <Icon name="doc" className="size-4" />
          {t("fromTemplate")}
        </>
      }
    >
      {jobs.length === 0 ? (
        <p className="px-3 py-2 text-ardoise">{t("templates.empty")}</p>
      ) : (
        jobs.map((job) => (
          <form key={job.id} action={duplicateJobAction}>
            <input type="hidden" name="id" value={job.id} />
            <button type="submit" className={menuItem}>
              <Icon name="doc" />
              <span className="truncate">{job.title}</span>
            </button>
          </form>
        ))
      )}
    </MenuChip>
  );
  return {
    org: organization.name,
    verified: organization.verificationStatus === "verified",
    ai,
    templates,
  };
}

export async function JobFormBack() {
  const t = await getTranslations("hire.jobs");
  return (
    <Link
      href="/app/hire/offres"
      className="flex w-fit items-center gap-1.5 text-[12px] font-medium text-ardoise hover:text-sapin"
    >
      <Icon name="chev-l" className="size-3.5" />
      {t("title")}
    </Link>
  );
}
