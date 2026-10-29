import "server-only";
import { randomInt } from "node:crypto";
import QRCode from "qrcode";
import sharp from "sharp";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  JOB_SHEET_BRAND_LOGO,
  renderJobSheet,
  type JobSheetData,
  type JobSheetLabels,
} from "@/server/pdf/job-sheet";
import { fileStorage, PUBLIC_PREFIX } from "@/server/storage";
import { parseLanguages } from "./jobs";

/**
 * The job sheet drawn by Jumanly (publication d'offre étape par étape, 29/10/2026): read from the
 * offer, with its authentication number (given once, kept on the offer) that anyone can check on
 * /fiches/<number>. The recruiter may join their own PDF instead (`jobSheetKey`): talents then
 * download that one.
 */

/** Letters and digits that cannot be confused when read aloud or typed (no 0/O, 1/I/L). */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function newCode() {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `JMLY-${part()}-${part()}`;
}

/** The authentication number of an offer's sheet, created the first time the sheet is drawn. */
export async function sheetCodeOf(db: PrismaClient, jobId: string) {
  const job = await db.job.findUniqueOrThrow({ where: { id: jobId }, select: { sheetCode: true } });
  if (job.sheetCode) return job.sheetCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    const taken = await db.job.findUnique({ where: { sheetCode: code }, select: { id: true } });
    if (taken) continue;
    await db.job.update({ where: { id: jobId }, data: { sheetCode: code } });
    return code;
  }
  throw new Error("sheet code");
}

/** « jmly-7k3q-9xa2 », « JMLY7K3Q9XA2 »: the number as it is stored. */
export function normalizeSheetCode(raw: string) {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^JMLY[A-Z0-9]{8}$/.test(compact)) return null;
  return `JMLY-${compact.slice(4, 8)}-${compact.slice(8)}`;
}

/** What the public check shows: the offer, the company, the state, the dates. */
export async function verifySheet(db: PrismaClient, raw: string) {
  const code = normalizeSheetCode(raw);
  if (!code) return null;
  return db.job.findUnique({
    where: { sheetCode: code },
    select: {
      sheetCode: true,
      slug: true,
      title: true,
      status: true,
      city: true,
      country: true,
      publishedAt: true,
      closesAt: true,
      organization: { select: { name: true, verifiedAt: true } },
    },
  });
}

export const jobSheetSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  responsibilities: true,
  requirements: true,
  contractType: true,
  remote: true,
  city: true,
  country: true,
  openings: true,
  experienceMin: true,
  educationLevelMin: true,
  languagesRequired: true,
  salaryMin: true,
  salaryMax: true,
  closesAt: true,
  companyAbout: true,
  organization: {
    select: { name: true, logo: true, description: true, sector: true, city: true },
  },
  skills: {
    select: { kind: true, importance: true, skill: { select: { name: true } } },
    orderBy: { weight: "desc" as const },
  },
} as const;

/** A logo saved as WebP (`/medias/orgs/…`), in PNG for the PDF; none when it cannot be read. */
async function logoPng(db: PrismaClient, url: string | null) {
  if (!url?.startsWith("/medias/")) return null;
  try {
    const file = await fileStorage(db).get(`${PUBLIC_PREFIX}${url.slice("/medias/".length)}`);
    if (!file) return null;
    return await sharp(Buffer.from(file.bytes)).png().toBuffer();
  } catch {
    return null;
  }
}

let brandLogo: Promise<Buffer> | null = null;

/** Texts the caller translates: the labels, and how to write the content of an offer. */
export type JobSheetWords = {
  labels: Omit<JobSheetLabels, "issued">;
  issued: (org: string) => string;
  contract: (key: string) => string;
  remote: (key: string) => string;
  education: (key: string) => string;
  experience: (years: number) => string;
  openings: (count: number) => string;
  salary: (min: number, max: number | null) => string;
  date: (date: Date) => string;
  language: (code: string) => string;
};

export function initialsOfName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** Draws the sheet of an offer, read with `jobSheetSelect`. */
export async function drawJobSheet(
  db: PrismaClient,
  job: {
    id: string;
    slug: string;
    title: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    contractType: string;
    remote: string;
    city: string;
    country: string;
    openings: number;
    experienceMin: number;
    educationLevelMin: string | null;
    languagesRequired: Parameters<typeof parseLanguages>[0];
    salaryMin: number | null;
    salaryMax: number | null;
    closesAt: Date | null;
    companyAbout: string | null;
    organization: {
      name: string;
      logo: string | null;
      description: string | null;
      sector: string | null;
      city: string | null;
    };
    skills: { kind: string; importance: string; skill: { name: string } }[];
  },
  words: JobSheetWords,
  site: string,
) {
  const code = await sheetCodeOf(db, job.id);
  const applyUrl = `${site}/offres/${job.slug}`;
  brandLogo ??= sharp(JOB_SHEET_BRAND_LOGO).resize({ width: 760 }).png().toBuffer();
  const [logo, brand, qr] = await Promise.all([
    logoPng(db, job.organization.logo),
    brandLogo,
    QRCode.toDataURL(applyUrl, { margin: 0, width: 320, color: { dark: "#0F3F37" } }),
  ]);
  const salary =
    job.salaryMin !== null
      ? words.salary(
          Math.round(job.salaryMin / 100),
          job.salaryMax === null ? null : Math.round(job.salaryMax / 100),
        )
      : null;
  const data: JobSheetData = {
    org: {
      name: job.organization.name,
      logo,
      initials: initialsOfName(job.organization.name),
      line: [job.organization.sector, job.organization.city].filter(Boolean).join(" · "),
    },
    brandLogo: brand,
    title: job.title,
    place: [job.city, job.country].filter(Boolean).join(", "),
    contract: words.contract(job.contractType),
    remote: words.remote(job.remote),
    openings: words.openings(job.openings),
    experience: words.experience(job.experienceMin),
    education: job.educationLevelMin ? words.education(job.educationLevelMin) : null,
    closesAt: job.closesAt ? words.date(job.closesAt) : null,
    about: (job.companyAbout ?? job.organization.description ?? "").trim(),
    description: job.description.trim(),
    responsibilities: job.responsibilities,
    hardSkills: job.skills.filter((item) => item.kind !== "soft").map((item) => item.skill.name),
    softSkills: job.skills.filter((item) => item.kind === "soft").map((item) => item.skill.name),
    requirements: job.requirements,
    languages: parseLanguages(job.languagesRequired).map((item) => ({
      name: words.language(item.code),
      level: item.level,
    })),
    salary,
    applyUrl,
    qr,
    code,
    verifyUrl: `${site.replace(/^https?:\/\//, "")}/fiches/${code}`,
  };
  const labels: JobSheetLabels = { ...words.labels, issued: words.issued(job.organization.name) };
  return renderJobSheet({ labels, data });
}

/** « Fiche-de-poste-Analyste-credit-junior.pdf ». */
export function jobSheetFileName(title: string) {
  const slug = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `Fiche-de-poste-${slug || "offre"}.pdf`;
}
