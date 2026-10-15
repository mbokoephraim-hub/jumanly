import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { fileStorage, PUBLIC_PREFIX } from "@/server/storage";

/**
 * Public media of the catalog (Admin v2, étape 6): course covers and lesson videos sent from the
 * admin. Only keys under `public/` are served; each key holds a random part, so a new file gets a
 * new address and can be cached for a year.
 */
export async function GET(_request: Request, { params }: RouteContext<"/medias/[...key]">) {
  const { key: parts } = await params;
  const key = `${PUBLIC_PREFIX}${parts.map(decodeURIComponent).join("/")}`;
  if (key.includes("..") || key.length > 300) return new NextResponse(null, { status: 404 });
  const object = await fileStorage(db).get(key);
  if (!object) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
