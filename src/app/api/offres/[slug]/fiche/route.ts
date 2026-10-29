import { NextResponse } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { languageName } from "@/lib/dates";
import { siteUrl } from "@/lib/seo";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import {
  drawJobSheet,
  jobSheetFileName,
  jobSheetSelect,
  type JobSheetWords,
} from "@/server/services/job-sheet";
import { fileStorage } from "@/server/storage";

/**
 * « Télécharger la fiche de poste »: the PDF joined by the recruiter when there is one (brief
 * recruteur § 2.6, checked when it was added: type, size, no active content), otherwise the sheet
 * drawn by Jumanly from the offer (publication d'offre étape par étape, 29/10/2026). `?jumanly=1`
 * asks for the drawn one. Anyone can download the sheet of an offer talents can read (published,
 * paused or closed); a draft's sheet only its organization.
 */
export async function GET(request: Request, { params }: RouteContext<"/api/offres/[slug]/fiche">) {
  const { slug } = await params;
  const job = await db.job.findUnique({
    where: { slug: slug.slice(0, 120) },
    select: {
      ...jobSheetSelect,
      status: true,
      organizationId: true,
      jobSheetKey: true,
      jobSheetName: true,
    },
  });
  if (!job) return new NextResponse(null, { status: 404 });
  if (!["published", "paused", "closed"].includes(job.status)) {
    const user = await getCurrentUser();
    const space = user ? await getActiveSpace(user.id) : null;
    if (space?.organizationId !== job.organizationId)
      return new NextResponse(null, { status: 404 });
  }
  const headers = (name: string) => ({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="fiche-de-poste.pdf"; filename*=UTF-8''${encodeURIComponent(name)}`,
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=0, no-store",
  });
  const drawn = new URL(request.url).searchParams.get("jumanly") === "1";
  if (job.jobSheetKey && !drawn) {
    const file = await fileStorage(db).get(job.jobSheetKey);
    if (!file) return new NextResponse(null, { status: 404 });
    const name = (job.jobSheetName ?? "fiche-de-poste.pdf").replace(/[\r\n"]/g, "");
    return new NextResponse(Buffer.from(file.bytes), { headers: headers(name) });
  }
  const pdf = await drawJobSheet(db, job, await jobSheetWords(), siteUrl());
  return new NextResponse(new Uint8Array(pdf), { headers: headers(jobSheetFileName(job.title)) });
}

async function jobSheetWords(): Promise<JobSheetWords> {
  const t = await getTranslations("jobSheet");
  const format = await getFormatter();
  const date = (value: Date) => format.dateTime(value, { dateStyle: "long", timeZone: "UTC" });
  const today = date(new Date());
  const keys = [
    "kind",
    "company",
    "post",
    "responsibilities",
    "hardSkills",
    "softSkills",
    "profile",
    "languages",
    "salary",
    "salaryPeriod",
    "applyTitle",
    "applyText",
    "applyFree",
    "seal",
    "sealCenter",
    "codeLabel",
    "verify",
    "microtext",
    "footer",
  ] as const;
  const facts = [
    "contract",
    "place",
    "remote",
    "openings",
    "experience",
    "education",
    "closesAt",
  ] as const;
  return {
    labels: {
      ...(Object.fromEntries(keys.map((key) => [key, t(key)])) as Record<
        (typeof keys)[number],
        string
      >),
      facts: Object.fromEntries(facts.map((key) => [key, t(`facts.${key}`)])) as Record<
        (typeof facts)[number],
        string
      >,
      page: (page, total) => t("page", { page, total }),
    },
    issued: (org) => t("issued", { date: today, org }),
    contract: (key) => (t.has(`contract.${key}`) ? t(`contract.${key}` as "contract.cdi") : key),
    remote: (key) => (t.has(`remote.${key}`) ? t(`remote.${key}` as "remote.onsite") : key),
    education: (key) =>
      t.has(`education.${key}`) ? t(`education.${key}` as "education.bachelor") : key,
    experience: (years) => t("experience", { years }),
    openings: (count) => t("openings", { count }),
    salary: (min, max) =>
      max === null || max === min
        ? t("salaryFrom", { min: format.number(min) })
        : t("salaryRange", { min: format.number(min), max: format.number(max) }),
    date,
    language: (code) => {
      const name = languageName(code);
      return name.charAt(0).toLocaleUpperCase("fr") + name.slice(1);
    },
  };
}
