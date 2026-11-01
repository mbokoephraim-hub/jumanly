import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { openPieceFile } from "@/server/services/hire-verification";
import { fileStorage } from "@/server/storage";

/**
 * A piece of a verification file, for the team of the offer only; each opening is logged
 * (golden rule n° 5). Never cached.
 */
export async function GET(_request: Request, context: RouteContext<"/api/hire/pieces/[itemId]">) {
  const { itemId } = await context.params;
  const { ctx } = await requireHire("/app/hire", "readApplications");
  try {
    const { file, name } = await openPieceFile(db, fileStorage(db), ctx, itemId.slice(0, 60));
    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof HireError) return new NextResponse(null, { status: 404 });
    throw error;
  }
}
