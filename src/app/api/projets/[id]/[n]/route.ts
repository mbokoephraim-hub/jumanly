import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { projectFileFor } from "@/server/services/portfolio";
import { fileStorage } from "@/server/storage";

/**
 * A photo or a PDF of a project (lot 6): for its owner, or for anyone once the project is visible
 * and the portfolio published. Shown inline, never run: the type was checked on upload.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/projets/[id]/[n]">) {
  const { id, n } = await params;
  const index = Number(n);
  if (!/^[\w-]{1,60}$/.test(id) || !Number.isInteger(index) || index < 0 || index > 5)
    return new Response(null, { status: 404 });
  const session = await getSession();
  const file = await projectFileFor(db, fileStorage(db), session?.user.id ?? null, id, index);
  if (!file) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
