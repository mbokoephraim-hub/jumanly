import { db } from "@/server/db";
import { bannerByToken } from "@/server/services/profile-photo";

/** The banner of a profile by its unguessable address. The address changes with the picture. */
export async function GET(_request: Request, { params }: RouteContext<"/api/banniere/[token]">) {
  const { token } = await params;
  const banner = /^[\w-]{10,64}$/.test(token) ? await bannerByToken(db, token) : null;
  if (!banner) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(banner.bytes), {
    headers: {
      "Content-Type": banner.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
