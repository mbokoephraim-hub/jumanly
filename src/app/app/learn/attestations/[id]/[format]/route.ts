import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { attestationPage } from "@/server/pdf/attestation-sheet";
import { attestationDrawing } from "@/server/pdf/attestation-labels";
import { launch } from "@/server/pdf/chromium";
import { talentAttestation } from "@/server/services/attestations";

/**
 * An attestation of the signed-in talent (planche talent-3 § 6-7): `apercu` is the light drawing
 * for the thumbnails, `pdf` the A4 landscape document, `image` a PNG to share. A revoked one is no
 * longer delivered.
 */
export async function GET(
  _: Request,
  { params }: RouteContext<"/app/learn/attestations/[id]/[format]">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id, format } = await params;
  if (!["apercu", "pdf", "image"].includes(format)) return new NextResponse(null, { status: 404 });
  const certificate = await talentAttestation(db, user.id, id);
  if (!certificate) return new NextResponse(null, { status: 404 });

  if (format === "apercu") {
    const svg = await attestationDrawing(certificate, { light: true });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "private, max-age=86400",
      },
    });
  }

  const svg = await attestationDrawing(certificate);
  const title = `Attestation ${certificate.code}`;
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1123,
      height: 794,
      deviceScaleFactor: format === "image" ? 2 : 1,
    });
    await page.setContent(attestationPage(svg, title), { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    if (format === "image") {
      const png = await page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width: 1123, height: 794 },
      });
      return new NextResponse(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="attestation-${certificate.code}.png"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    const raw = await page.pdf({ width: "297mm", height: "210mm", printBackground: true });
    // Metadata carry the number and the signature; the proof stays the check online.
    const sheet = await PDFDocument.load(raw, { updateMetadata: false });
    sheet.setTitle(title);
    sheet.setAuthor("Jumanly");
    sheet.setSubject(certificate.holderName);
    sheet.setKeywords([certificate.code, `signature:${certificate.signature}`]);
    sheet.setCreator("Jumanly");
    sheet.setProducer("Jumanly");
    const pdf = await sheet.save();
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="attestation-${certificate.code}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } finally {
    await browser.close();
  }
}
