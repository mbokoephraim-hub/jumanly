import { db } from "@/server/db";
import { feedImageByToken } from "@/server/services/feed";

/**
 * A photo of the Fil by its unguessable address (Modèle B, lot B3). A post taken down by
 * moderation takes its photo with it.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/fil/image/[token]">) {
  const { token } = await params;
  const image = /^[\w-]{10,64}$/.test(token) ? await feedImageByToken(db, token) : null;
  if (!image || image.post?.hiddenAt) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
