/**
 * Builds the PDFs of a course (Admin v3, étape 6) for the routes: reads the data, translates the
 * texts, renders on the common template and keeps the result while the content is unchanged.
 */
import { getTranslations } from "next-intl/server";
import { siteUrl } from "@/lib/seo";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  cachedPdf,
  courseReport,
  programmeOf,
  quizKeyOf,
  supportOf,
  type CoursePdfKind,
  type PdfCourse,
} from "@/server/services/course-pdf";
import { renderCertificatePdf } from "./certificate-document";
import {
  CourseKitDocument,
  ProgrammeBody,
  QuizKeyBody,
  ReportBody,
  SupportBody,
  renderCourseKit,
  type PdfT,
} from "./course-kit";

async function translator(): Promise<PdfT> {
  const t = await getTranslations("learn.pdf.doc");
  return (key, values) => t(key as never, values as never);
}

/**
 * One PDF of a course. `documents` are the titles of the documents the reader may download (for
 * the support); `days` is the report period (`null` = since the course began).
 */
export async function buildCoursePdf(
  db: PrismaClient,
  kind: CoursePdfKind,
  course: PdfCourse,
  options: { documents?: string[]; days?: number | null; now?: Date } = {},
) {
  const t = await translator();
  const common = await getTranslations("common");
  const brand = common("brand");
  const now = options.now ?? new Date();
  const day = now.toISOString().slice(0, 10);
  const kit = (eyebrow: string, body: React.ReactNode, subtitle?: string) =>
    renderCourseKit(
      <CourseKitDocument
        t={t}
        brand={brand}
        eyebrow={eyebrow}
        title={course.title}
        subtitle={subtitle}
        generatedAt={now}
      >
        {body}
      </CourseKitDocument>,
    );

  if (kind === "programme") {
    const data = programmeOf(course);
    const url = `${siteUrl()}/formations/${course.slug}`;
    return cachedPdf(kind, { data, url, day }, () =>
      kit(t("program.eyebrow"), <ProgrammeBody t={t} data={data} url={url} />, data.summary),
    );
  }
  if (kind === "support") {
    const data = supportOf(course);
    const documents = options.documents ?? [];
    return cachedPdf(kind, { data, documents, day }, () =>
      kit(
        t("support.eyebrow"),
        <SupportBody t={t} data={data} documents={documents} />,
        data.summary,
      ),
    );
  }
  if (kind === "quiz") {
    const data = quizKeyOf(course);
    return cachedPdf(kind, { data, day }, () =>
      kit(t("quiz.eyebrow"), <QuizKeyBody t={t} data={data} />),
    );
  }
  if (kind === "attestation") {
    const certificate = await getTranslations("learn.certificates.pdf");
    const holder = (await getTranslations("admin.courses.v3.editor.attestation"))("learner");
    const code = t("certificate.code");
    const hours = Math.max(1, Math.round(course.durationMinutes / 60));
    const labels = {
      brand,
      title: certificate("title"),
      body: certificate("body", { fullName: holder, courseTitle: course.title, hours }),
      date: certificate("date", { date: now }),
      code,
      verify: certificate("verify", { verifyUrl: `${siteUrl()}/attestations/${code}` }),
      footer: certificate("footer"),
    };
    return cachedPdf(kind, { labels, holder }, () =>
      renderCertificatePdf({ holder, labels, watermark: t("certificate.watermark") }),
    );
  }
  // The report changes with every enrollment: always made fresh.
  const data = await courseReport(db, course, options.days ?? null, now);
  const period = t("report.period", {
    period: data.days ? t("report.periodDays", { days: data.days }) : t("report.periodAll"),
  });
  return kit(t("report.eyebrow"), <ReportBody t={t} data={data} />, period);
}
