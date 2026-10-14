import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { siteUrl } from "@/lib/seo";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { renderCertificatePdf } from "@/server/pdf/certificate-document";

/** The attestation as a PDF, for its holder only; a revoked one is no longer delivered. */
export async function GET(
  _: Request,
  { params }: RouteContext<"/app/learn/attestations/[id]/pdf">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const certificate = await db.certificate.findFirst({
    where: { id, revokedAt: null, enrollment: { userId: user.id } },
  });
  if (!certificate) return new NextResponse(null, { status: 404 });
  const t = await getTranslations("learn.certificates.pdf");
  const common = await getTranslations("common");
  const verifyUrl = `${siteUrl()}/attestations/${certificate.code}`;
  const pdf = await renderCertificatePdf({
    holder: certificate.holderName,
    labels: {
      brand: common("brand"),
      title: t("title"),
      body: t("body", {
        fullName: certificate.holderName,
        courseTitle: certificate.courseTitle,
        hours: certificate.hours,
      }),
      date: t("date", { date: certificate.issuedAt }),
      code: certificate.code,
      verify: t("verify", { verifyUrl }),
      footer: t("footer"),
    },
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="attestation-${certificate.code}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
