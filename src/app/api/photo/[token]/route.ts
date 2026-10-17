import { db } from "@/server/db";
import { photoByToken } from "@/server/services/profile-photo";

/** A profile photo by its unguessable address (prompt 6). The address changes with the photo. */
export async function GET(_request: Request, { params }: RouteContext<"/api/photo/[token]">) {
  const { token } = await params;
  const photo = /^[\w-]{10,64}$/.test(token) ? await photoByToken(db, token) : null;
  if (!photo) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
