import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { toCsv } from "@/lib/csv";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { atsBoard } from "@/server/services/hire-ats";

/**
 * « Exporter la liste » of the retained candidates (évaluation recruteur, 06/11/2026): a sheet
 * for Excel, one line per retained candidate (name, city, score, stage, date of application).
 * No e-mail or phone: the contact stays in Jumanly's messages. Filtered by the organization
 * (`atsBoard` reads only its own offer) and audited.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/app/hire/offres/[id]/retenus.csv">,
) {
  const { id } = await params;
  const { ctx } = await requireHire(`/app/hire/offres/${id}/retenus`, "readApplications");
  const board = await atsBoard(db, ctx, id).catch((error) => {
    if (error instanceof HireError) return null;
    throw error;
  });
  if (!board) return new NextResponse(null, { status: 404 });
  const kept = board.shortlisted.filter((row) => row.status === "active");
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "hire.shortlist.export",
      targetType: "job",
      targetId: board.job.id,
      metadata: { organizationId: ctx.organizationId, rows: kept.length },
    },
  });
  const t = await getTranslations("hireAts.shortlist.csv");
  const csv = toCsv(
    [t("name"), t("city"), t("score"), t("stage"), t("applied"), t("file")],
    kept.map((row) => [
      row.name,
      row.city ?? "",
      row.score ?? "",
      row.stage.name,
      row.createdAt.toISOString().slice(0, 10),
      new URL(
        `/app/hire/candidats/${row.id}`,
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://jumanly.io",
      ).toString(),
    ]),
  );
  // The BOM lets Excel read the accents.
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${t("fileName")}-${board.job.slug.slice(0, 60)}.csv"`,
    },
  });
}
