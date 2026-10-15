import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { personalData, personalDataResponseInit } from "@/server/services/personal-data";

/**
 * « Exporter ses données » from a user card (Admin v2, étape 3; partie 10, droit d'accès): the same
 * JSON as the person's own export, for an administrator answering a request. Audited.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.platformRole !== "platform_admin" || !user.twoFactorEnabled) {
    return new NextResponse(null, { status: 404 });
  }
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const target = id ? await db.user.findUnique({ where: { id }, select: { status: true } }) : null;
  if (!target || target.status === "deleted") return new NextResponse(null, { status: 404 });
  const data = await personalData(db, id);
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "user.export",
      targetType: "user",
      targetId: id,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  });
  return new NextResponse(
    JSON.stringify(data, null, 2),
    personalDataResponseInit(`jumanly-donnees-${id}.json`),
  );
}
