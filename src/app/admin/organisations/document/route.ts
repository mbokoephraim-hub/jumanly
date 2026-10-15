import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { db } from "@/server/db";
import { openDocument } from "@/server/services/admin-orgs";
import { fileStorage } from "@/server/storage";

/**
 * A supporting document of a verification request, opened from the admin card (Admin v2, étape 4).
 * Administrators and support agents; each opening is recorded in the journal.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !(ADMIN_ROLES as readonly string[]).includes(user.platformRole)) {
    return new NextResponse(null, { status: 404 });
  }
  if (user.platformRole === "platform_admin" && !user.twoFactorEnabled) {
    return new NextResponse(null, { status: 404 });
  }
  const id = (new URL(request.url).searchParams.get("id") ?? "").slice(0, 60);
  const found = id
    ? await openDocument(
        db,
        fileStorage(db),
        {
          actorId: user.id,
          ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        },
        id,
      )
    : null;
  if (!found) return new NextResponse(null, { status: 404 });
  const { document, object } = found;
  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": object.contentType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
