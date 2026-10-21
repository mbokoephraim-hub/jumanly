import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { ADMIN_SHELL_ROLES } from "@/server/auth/roles";
import { PHONE_AGENT } from "@/lib/view";

/**
 * Quick check before the signed-in space: without a session cookie, go to sign-in and come back
 * afterwards (`suite`). The real session check is done by each page on the server.
 * Jumanly Admin answers a true 404 to anyone without an admin role (administrator, support, content
 * editor), so it is not revealed.
 * On a phone, the space itself (`/app`) opens on « Bienvenue » for a signed-out person (Modèle B).
 */
export async function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const agent = request.headers.get("user-agent") ?? "";
    if (request.nextUrl.pathname === "/app" && PHONE_AGENT.test(agent)) {
      return NextResponse.redirect(new URL("/decouvrir", request.url));
    }
    const url = new URL("/connexion", request.url);
    url.searchParams.set("suite", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const session = await auth.api.getSession({ headers: request.headers });
    const role = (session?.user as { platformRole?: string } | undefined)?.platformRole ?? "";
    if (!(ADMIN_SHELL_ROLES as readonly string[]).includes(role)) {
      return NextResponse.rewrite(new URL("/introuvable", request.url), { status: 404 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*", "/admin/:path*"] };
