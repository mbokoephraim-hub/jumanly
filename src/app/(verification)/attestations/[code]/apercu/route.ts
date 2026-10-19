import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { attestationDrawing } from "@/server/pdf/attestation-labels";
import { checkAttestation } from "@/server/services/attestations";

/**
 * The light drawing of an attestation, beside the public check on a large screen (planche web
 * talent-3 § 8). Only an authentic, signed attestation is drawn: a revoked or modified one is not.
 */
export async function GET(_: Request, { params }: RouteContext<"/attestations/[code]/apercu">) {
  const { code } = await params;
  const { check, certificate } = await checkAttestation(db, decodeURIComponent(code));
  if (!certificate?.signature || check.state !== "authentic")
    return new NextResponse(null, { status: 404 });
  const svg = await attestationDrawing(
    { ...certificate, signature: certificate.signature },
    { light: true },
  );
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
