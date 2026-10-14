import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { toCsv } from "@/lib/csv";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { partnerMemberships } from "@/server/services/organization";
import { listCodes, PartnerError } from "@/server/services/partners";

/** « Télécharger les codes (CSV) »: the codes of one batch, without who used them. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const batchId = new URL(request.url).searchParams.get("lot")?.slice(0, 60) ?? "";
  const batch = await db.licenseBatch.findUnique({
    where: { id: batchId },
    select: { partnerOrgId: true },
  });
  const memberships = await partnerMemberships(db, user.id);
  const membership = memberships.find((item) => item.organizationId === batch?.partnerOrgId);
  if (!membership) return new NextResponse(null, { status: 404 });
  const ctx = { userId: user.id, organizationId: membership.organizationId };
  const codes = await listCodes(db, ctx, batchId).catch((error: Error) => {
    if (error instanceof PartnerError) return null;
    throw error;
  });
  if (!codes) return new NextResponse(null, { status: 404 });
  const t = await getTranslations("partner.licenses.codes");
  const csv = toCsv(
    [t("col.code"), t("col.label"), t("col.status"), t("col.created")],
    codes.map((code) => [
      code.code,
      code.label ?? "",
      t(`status.${code.status}`),
      code.createdAt.toISOString().slice(0, 10),
    ]),
  );
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="codes-jumanly.csv"`,
    },
  });
}
